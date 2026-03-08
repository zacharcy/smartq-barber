import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import pool from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';
import { sendAppointmentSMS } from '../lib/sms.js';

const router = Router();

// Initialize Gemini (uses GEMINI_API_KEY from .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const GEMINI_MODEL = 'gemini-3-flash-preview';

/**
 * Check if a staff member already has an overlapping appointment.
 * Returns the conflicting appointment if found, or null if the slot is free.
 */
async function checkStaffConflict(companyId, staffId, startTime, endTime, excludeAppointmentId = null) {
    if (!staffId || !startTime || !endTime) return null;

    let query = `
        SELECT a.id, a.start_time, a.end_time, c.name AS client_name, sv.name AS service_name
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN services sv ON a.service_id = sv.id
        WHERE a.company_id = ?
          AND a.staff_id = ?
          AND a.status != 'cancelled'
          AND a.is_deleted = FALSE
          AND a.start_time < ?
          AND a.end_time > ?
    `;
    const params = [companyId, staffId, endTime, startTime];

    if (excludeAppointmentId) {
        query += ' AND a.id != ?';
        params.push(excludeAppointmentId);
    }

    query += ' LIMIT 1';

    const [rows] = await pool.execute(query, params);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Build a system prompt with business context so the AI understands
 * the company's services, staff, clients and upcoming appointments.
 */
async function buildSystemPrompt(companyId) {
    // Fetch company info
    const [[company]] = await pool.execute(
        'SELECT name, category, city, address, phone FROM companies WHERE id = ?',
        [companyId]
    );

    // Fetch services
    const [services] = await pool.execute(
        'SELECT id, name, duration_min, price, category FROM services WHERE company_id = ? ORDER BY category, name',
        [companyId]
    );

    // Fetch staff
    const [staff] = await pool.execute(
        'SELECT id, name, role FROM staff WHERE company_id = ? ORDER BY name',
        [companyId]
    );

    // Fetch clients
    const [clients] = await pool.execute(
        'SELECT id, name, email, phone FROM clients WHERE company_id = ? ORDER BY name',
        [companyId]
    );

    // Fetch upcoming appointments (next 7 days)
    const [appointments] = await pool.execute(
        `SELECT a.id, a.start_time, a.end_time, a.status, a.notes,
                c.name AS client_name, s.name AS staff_name, sv.name AS service_name
         FROM appointments a
         LEFT JOIN clients c ON a.client_id = c.id
         LEFT JOIN staff s  ON a.staff_id  = s.id
         LEFT JOIN services sv ON a.service_id = sv.id
         WHERE a.company_id = ?
           AND a.is_deleted = FALSE
           AND a.start_time >= NOW()
           AND a.start_time <= DATE_ADD(NOW(), INTERVAL 7 DAY)
         ORDER BY a.start_time ASC
         LIMIT 50`,
        [companyId]
    );

    return `You are SmartQ AI, an intelligent assistant for "${company?.name || 'this business'}".
Business: ${company?.name || 'Unknown'} (${company?.category || 'General'})
Location: ${company?.city || ''} ${company?.address || ''}
Phone: ${company?.phone || 'N/A'}

SERVICES OFFERED (id | name | duration | price | category):
${services.length ? services.map(s => `  - [${s.id}] ${s.name} | ${s.duration_min}min | $${s.price} | ${s.category}`).join('\n') : '  No services set up yet.'}

STAFF MEMBERS (id | name | role):
${staff.length ? staff.map(s => `  - [${s.id}] ${s.name} | ${s.role}`).join('\n') : '  No staff set up yet.'}

CLIENTS (id | name | email | phone):
${clients.length ? clients.map(c => `  - [${c.id}] ${c.name} | ${c.email || '-'} | ${c.phone || '-'}`).join('\n') : '  No clients yet.'}

UPCOMING APPOINTMENTS (next 7 days):
${appointments.length ? appointments.map(a => `  - [#${a.id}] ${a.start_time} → ${a.end_time} | ${a.service_name || 'No service'} | Client: ${a.client_name || 'Walk-in'} | Staff: ${a.staff_name || 'Unassigned'} | Status: ${a.status}`).join('\n') : '  No upcoming appointments.'}

INSTRUCTIONS:
1. You are a helpful, multilingual assistant. Respond in the same language the user writes in.
2. You can help manage appointments: create, update, cancel, and reschedule.
3. When the user wants to perform an action on appointments, respond with a JSON action block wrapped in \`\`\`json ... \`\`\` so the system can execute it automatically.

ACTION FORMAT (use ONLY when the user confirms an action):
For creating an appointment:
\`\`\`json
{"action":"create_appointment","data":{"client_id":1,"staff_id":2,"service_id":3,"start_time":"2026-02-24 10:00:00","end_time":"2026-02-24 10:30:00","status":"confirmed","notes":"Requested via AI chat"}}
\`\`\`

For updating an appointment:
\`\`\`json
{"action":"update_appointment","data":{"appointment_id":5,"status":"cancelled","notes":"Cancelled by client via chat"}}
\`\`\`

For rescheduling (update with new times):
\`\`\`json
{"action":"update_appointment","data":{"appointment_id":5,"start_time":"2026-02-25 14:00:00","end_time":"2026-02-25 14:30:00"}}
\`\`\`

RULES:
- Always confirm details with the user BEFORE outputting the JSON action block.
- Use the IDs from the data above (services, staff, clients) when building JSON.
- If a client doesn't exist yet, ask for their name and include it in your response — the system will create the client automatically.
- Keep responses conversational and concise.
- For price queries, use the service prices listed above.
- IMPORTANT: The system will automatically check for scheduling conflicts. If a staff member already has an appointment at the requested time, the booking will be rejected. Always check the upcoming appointments list above to avoid suggesting conflicting times.
- Current date/time context: ${new Date().toISOString()}
`;
}

/**
 * POST /api/chat  (Authenticated — business dashboard)
 * Body: { message: string, history: [{ role, text }] }
 * Returns: { reply: string, action?: object }
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file.' });
        }

        // Build context-rich system prompt
        const systemPrompt = await buildSystemPrompt(req.companyId);

        // Build chat history for multi-turn conversation
        const chatHistory = history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.text }],
        }));

        // Use ai.chats.create() for multi-turn conversation
        const chat = ai.chats.create({
            model: GEMINI_MODEL,
            history: chatHistory,
            config: { systemInstruction: systemPrompt },
        });

        const response = await chat.sendMessage({ message });
        const reply = response.text;

        // Parse any JSON action from the reply
        let action = null;
        const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                action = JSON.parse(jsonMatch[1]);
            } catch (e) {
                // JSON parse failed — ignore, just return text
            }
        }

        // Auto-execute the action if present
        if (action) {
            try {
                const actionResult = await executeAction(action, req.companyId);

                // If action was rejected (conflict), ask the AI to give a friendly response
                if (!actionResult.success) {
                    const conflictChat = ai.chats.create({
                        model: GEMINI_MODEL,
                        history: [
                            ...chatHistory,
                            { role: 'user', parts: [{ text: message }] },
                            { role: 'model', parts: [{ text: reply }] },
                        ],
                        config: { systemInstruction: systemPrompt },
                    });
                    const conflictResponse = await conflictChat.sendMessage({
                        message: `[SYSTEM: The action was REJECTED because: ${actionResult.message}. Please inform the user about the conflict, suggest alternative available time slots, and ask what they'd prefer. Do NOT output any JSON action block in this response.]`,
                    });
                    return res.json({ reply: conflictResponse.text, action, actionResult });
                }

                return res.json({ reply, action, actionResult });
            } catch (actionErr) {
                console.error('Action execution error:', actionErr);
                return res.json({ reply, action, actionError: actionErr.message });
            }
        }

        return res.json({ reply });
    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: 'Chat failed: ' + error.message });
    }
});

/**
 * Execute an AI-suggested action (create/update appointment)
 */
async function executeAction(action, companyId) {
    const { data } = action;

    switch (action.action) {
        case 'create_appointment': {
            // Check for staff conflicts before booking
            const conflict = await checkStaffConflict(companyId, data.staff_id, data.start_time, data.end_time);
            if (conflict) {
                return {
                    success: false,
                    message: `Cannot book: ${conflict.service_name || 'An appointment'} is already scheduled for this staff member from ${conflict.start_time} to ${conflict.end_time} (Client: ${conflict.client_name || 'Walk-in'}). Please choose a different time or staff member.`
                };
            }

            const [result] = await pool.execute(
                'INSERT INTO appointments (company_id, client_id, staff_id, service_id, start_time, end_time, status, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    companyId,
                    data.client_id || null,
                    data.staff_id || null,
                    data.service_id || null,
                    data.start_time,
                    data.end_time,
                    data.status || 'confirmed',
                    data.notes || 'Booked via AI Chat',
                    'ai_chat',
                ]
            );
            return { success: true, appointmentId: result.insertId, message: 'Appointment created' };
        }

        case 'update_appointment': {
            const fields = [];
            const values = [];

            if (data.status) { fields.push('status = ?'); values.push(data.status); }
            if (data.start_time) { fields.push('start_time = ?'); values.push(data.start_time); }
            if (data.end_time) { fields.push('end_time = ?'); values.push(data.end_time); }
            if (data.notes) { fields.push('notes = ?'); values.push(data.notes); }
            if (data.staff_id) { fields.push('staff_id = ?'); values.push(data.staff_id); }
            if (data.service_id) { fields.push('service_id = ?'); values.push(data.service_id); }

            if (fields.length === 0) {
                return { success: false, message: 'No fields to update' };
            }

            // Check for conflicts when rescheduling (changing time or staff)
            if (data.start_time || data.end_time || data.staff_id) {
                // Get current appointment to fill in missing fields
                const [[current]] = await pool.execute(
                    'SELECT staff_id, start_time, end_time FROM appointments WHERE id = ? AND company_id = ?',
                    [data.appointment_id, companyId]
                );
                if (current) {
                    const checkStaff = data.staff_id || current.staff_id;
                    const checkStart = data.start_time || current.start_time;
                    const checkEnd = data.end_time || current.end_time;
                    const conflict = await checkStaffConflict(companyId, checkStaff, checkStart, checkEnd, data.appointment_id);
                    if (conflict) {
                        return {
                            success: false,
                            message: `Cannot reschedule: ${conflict.service_name || 'An appointment'} is already scheduled for this staff member from ${conflict.start_time} to ${conflict.end_time}. Please choose a different time or staff member.`
                        };
                    }
                }
            }

            values.push(data.appointment_id, companyId);

            const [result] = await pool.execute(
                `UPDATE appointments SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return { success: false, message: 'Appointment not found' };
            }

            return { success: true, message: 'Appointment updated' };
        }

        default:
            return { success: false, message: `Unknown action: ${action.action}` };
    }
}

/* =============================================
   PUBLIC CONSUMER CHAT (no auth required)
   ============================================= */

// Cache the consumer system prompt (rebuild every 5 minutes)
let _cachedConsumerPrompt = null;
let _cachedConsumerPromptAt = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds — keep appointment data fresh for accurate availability

/**
 * Build a system prompt for the consumer-facing chatbot
 * that knows about ALL businesses on the platform.
 * Uses caching + batch queries to avoid N+1 problem.
 */
async function buildConsumerSystemPrompt() {
    // Return cached prompt if still fresh
    if (_cachedConsumerPrompt && Date.now() - _cachedConsumerPromptAt < CACHE_TTL) {
        return _cachedConsumerPrompt;
    }

    // Fetch all businesses, services, staff, and appointments in 4 queries (not N+1)
    const [companies] = await pool.execute(
        'SELECT id, name, category, city, address, phone FROM companies ORDER BY name'
    );
    const [allServices] = await pool.execute(
        'SELECT id, company_id, name, duration_min, price, category FROM services ORDER BY name'
    );
    const [allStaff] = await pool.execute(
        'SELECT id, company_id, name, role FROM staff ORDER BY name'
    );
    // Fetch upcoming appointments for all companies (next 7 days)
    const [allAppointments] = await pool.execute(
        `SELECT a.id, a.company_id, a.staff_id, a.start_time, a.end_time, a.status,
                s.name AS staff_name, sv.name AS service_name, c.name AS client_name
         FROM appointments a
         LEFT JOIN staff s ON a.staff_id = s.id
         LEFT JOIN services sv ON a.service_id = sv.id
         LEFT JOIN clients c ON a.client_id = c.id
         WHERE a.status != 'cancelled'
           AND a.start_time >= NOW()
           AND a.start_time <= DATE_ADD(NOW(), INTERVAL 7 DAY)
         ORDER BY a.start_time ASC`
    );

    // Group by company_id
    const servicesByCompany = {};
    for (const s of allServices) {
        if (!servicesByCompany[s.company_id]) servicesByCompany[s.company_id] = [];
        servicesByCompany[s.company_id].push(s);
    }
    const staffByCompany = {};
    for (const s of allStaff) {
        if (!staffByCompany[s.company_id]) staffByCompany[s.company_id] = [];
        staffByCompany[s.company_id].push(s);
    }
    // Group appointments by staff_id for easy per-staff lookup
    const appointmentsByStaff = {};
    for (const a of allAppointments) {
        if (!a.staff_id) continue;
        if (!appointmentsByStaff[a.staff_id]) appointmentsByStaff[a.staff_id] = [];
        appointmentsByStaff[a.staff_id].push(a);
    }

    let businessContext = '';
    for (const co of companies) {
        const services = servicesByCompany[co.id] || [];
        const staff = staffByCompany[co.id] || [];

        let staffSchedule = '';
        for (const s of staff) {
            const bookings = appointmentsByStaff[s.id] || [];
            if (bookings.length > 0) {
                const slots = bookings.map(b => `${b.start_time} → ${b.end_time} (${b.service_name || 'N/A'})`).join('; ');
                staffSchedule += `\n    - ${s.name} (staff_id:${s.id}): BUSY at [${slots}]`;
            } else {
                staffSchedule += `\n    - ${s.name} (staff_id:${s.id}): FULLY AVAILABLE (no bookings)`;
            }
        }

        businessContext += `
BUSINESS: "${co.name}" (ID: ${co.id})
  Category: ${co.category || 'General'}
  Location: ${co.city || 'N/A'} ${co.address || ''}
  Phone: ${co.phone || 'N/A'}
  Services: ${services.length ? services.map(s => `${s.name} ($${s.price}, ${s.duration_min}min, svc_id:${s.id})`).join(', ') : 'None listed'}
  Staff Schedules (next 7 days):${staffSchedule || '\n    No staff listed'}
`;
    }

    const prompt = `You are SmartQ — a friendly, multilingual AI assistant for a beauty & wellness booking platform in Sri Lanka.

PLATFORM BUSINESSES:
${businessContext}

YOUR ROLE:
- Help customers find the right business, service, and time slot.
- You can recommend businesses based on city, category, or specific services.
- When a customer wants to book, collect: their name, phone, preferred business, service, staff (optional), and date/time.
- Once all details are confirmed by the user AND the slot is verified as available, output a JSON action block so the system can create the appointment automatically.

ACTION FORMAT (ONLY after the user confirms all details AND slot is verified available):
\\\`\\\`\\\`json
{"action":"create_appointment","data":{"company_id":1,"service_id":3,"staff_id":2,"client_name":"John","client_phone":"0771234567","start_time":"2026-02-24 10:00:00","end_time":"2026-02-24 10:30:00","notes":"Booked via consumer chat"}}
\\\`\\\`\\\`

AVAILABILITY CHECKING (THIS IS YOUR #1 PRIORITY):
When a customer requests a specific staff member and time:
1. FIRST check that staff member's "Staff Schedules" above.
2. A staff member is BUSY if the requested time overlaps with ANY of their booked slots (the requested start_time to end_time overlaps with any existing booking's start → end range).
3. If the staff member is BUSY at that time:
   a. Politely tell the customer: "Sorry, [staff name] is not available at [time] because they already have a booking from [start] to [end]."
   b. FIRST suggest the nearest available time slots for the SAME staff member (look at their schedule and suggest times before or after their busy slots). Say something like: "[Staff name] is available at [time A], [time B], etc. Would any of these work for you?"
   c. THEN offer: "If you strictly need the [requested time] slot, I can also check which other staff members are available at that time — just let me know!"
   d. Wait for the customer to choose before proceeding.
4. If the customer then asks for other staff at the same time, check all other staff schedules and list who is FREE at that time.
5. If the staff member is AVAILABLE (no overlapping bookings), proceed normally.
6. NEVER say "confirmed" or output a JSON action block for a time slot that overlaps with an existing booking.

RULES:
1. Always respond in the language the user writes in (Sinhala, Tamil, English, etc.).
2. Be warm, helpful, and conversational.
3. Always confirm ALL booking details before outputting the JSON.
4. Calculate end_time = start_time + service duration_min.
5. If the user is unsure, suggest popular services or nearby businesses.
6. For pricing questions, use the actual service prices listed above.
7. Current date/time: ${new Date().toISOString()}
`;

    // Cache it
    _cachedConsumerPrompt = prompt;
    _cachedConsumerPromptAt = Date.now();

    return prompt;
}

/**
 * POST /api/chat/consumer  (Public — no auth)
 * Body: { message: string, history: [{ role, text }] }
 */
router.post('/consumer', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured.' });
        }

        const systemPrompt = await buildConsumerSystemPrompt();

        // Build chat history for multi-turn conversation
        const chatHistory = history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.text }],
        }));

        // Use ai.chats.create() for multi-turn conversation
        const chat = ai.chats.create({
            model: GEMINI_MODEL,
            history: chatHistory,
            config: { systemInstruction: systemPrompt },
        });

        const response = await chat.sendMessage({ message });
        const reply = response.text;

        // Parse any JSON action from the reply
        let action = null;
        const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                action = JSON.parse(jsonMatch[1]);
            } catch (e) { /* ignore */ }
        }

        // Auto-execute booking action
        if (action && action.action === 'create_appointment') {
            try {
                const actionResult = await executeConsumerBooking(action.data);

                // If booking was rejected (conflict), ask the AI to give a friendly response
                if (!actionResult.success) {
                    const conflictChat = ai.chats.create({
                        model: GEMINI_MODEL,
                        history: [
                            ...chatHistory,
                            { role: 'user', parts: [{ text: message }] },
                            { role: 'model', parts: [{ text: reply }] },
                        ],
                        config: { systemInstruction: systemPrompt },
                    });
                    const conflictResponse = await conflictChat.sendMessage({
                        message: `[SYSTEM: The booking was REJECTED because: ${actionResult.message}. Please apologize to the customer, explain the conflict, suggest alternative available time slots for this staff member or other available staff members, and ask what they'd prefer. Do NOT output any JSON action block in this response.]`,
                    });
                    return res.json({ reply: conflictResponse.text, actionResult });
                }

                return res.json({ reply, action, actionResult });
            } catch (actionErr) {
                console.error('Consumer booking error:', actionErr);
                return res.json({ reply, action, actionError: actionErr.message });
            }
        }

        return res.json({ reply });
    } catch (error) {
        console.error('Consumer chat error:', error);
        return res.status(500).json({ error: 'Chat failed: ' + error.message });
    }
});

/**
 * Execute a consumer booking — create client if needed, then create appointment
 */
async function executeConsumerBooking(data) {
    const { company_id, service_id, staff_id, client_name, client_phone, start_time, end_time, notes } = data;

    if (!company_id || !start_time || !end_time) {
        return { success: false, message: 'Missing required booking details' };
    }

    // Find or create client
    let clientId = null;
    if (client_name) {
        const [existing] = await pool.execute(
            'SELECT id FROM clients WHERE company_id = ? AND (name = ? OR phone = ?)',
            [company_id, client_name, client_phone || '']
        );

        if (existing.length > 0) {
            clientId = existing[0].id;
        } else {
            const [created] = await pool.execute(
                'INSERT INTO clients (company_id, name, phone, notes) VALUES (?, ?, ?, ?)',
                [company_id, client_name, client_phone || null, 'Added via AI chat booking']
            );
            clientId = created.insertId;
        }
    }

    // Check for staff conflicts before booking
    if (staff_id) {
        const conflict = await checkStaffConflict(company_id, staff_id, start_time, end_time);
        if (conflict) {
            return {
                success: false,
                message: `Cannot book: ${conflict.service_name || 'An appointment'} is already scheduled for this staff member from ${conflict.start_time} to ${conflict.end_time} (Client: ${conflict.client_name || 'Walk-in'}). Please choose a different time or staff member.`
            };
        }
    }

    // Create appointment
    const [result] = await pool.execute(
        'INSERT INTO appointments (company_id, client_id, staff_id, service_id, start_time, end_time, status, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            company_id,
            clientId,
            staff_id || null,
            service_id || null,
            start_time,
            end_time,
            'confirmed',
            notes || 'Booked via SmartQ AI Chat',
            'ai_chat',
        ]
    );

    // Send SMS confirmation (fire-and-forget)
    if (client_phone) {
        try {
            const [[biz]] = await pool.execute('SELECT name FROM companies WHERE id = ?', [company_id]);
            const [[svc]] = service_id ? await pool.execute('SELECT name FROM services WHERE id = ?', [service_id]) : [[]];
            const [[stf]] = staff_id ? await pool.execute('SELECT name FROM staff WHERE id = ?', [staff_id]) : [[]];
            sendAppointmentSMS(client_phone, {
                clientName: client_name,
                bookingId: result.insertId,
                businessName: biz?.name,
                serviceName: svc?.name,
                staffName: stf?.name,
                startTime: start_time,
            });
        } catch (smsErr) {
            console.warn('SMS lookup failed (booking still succeeded):', smsErr.message);
        }
    }

    return { success: true, appointmentId: result.insertId, message: 'Appointment booked successfully!' };
}

export default router;
