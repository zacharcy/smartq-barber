import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../lib/db.js';
import { signToken, authMiddleware } from '../lib/auth.js';
import { sendAppointmentSMS } from '../lib/sms.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new company
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, category, address, city, country, description } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Check if email already exists
        const [existing] = await pool.execute(
            'SELECT id FROM companies WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'A company with this email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Insert company
        const [result] = await pool.execute(
            'INSERT INTO companies (name, email, password_hash, phone, category, address, city, country, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, passwordHash, phone || null, category || null, address || null, city || null, country || 'Sri Lanka', description || null]
        );

        const companyId = result.insertId;

        // Create a default staff member (owner)
        await pool.execute(
            'INSERT INTO staff (company_id, name, email, role) VALUES (?, ?, ?, ?)',
            [companyId, name, email, 'Owner']
        );

        // Seed default roles
        await pool.execute(
            'INSERT IGNORE INTO roles (company_id, name) VALUES (?, ?), (?, ?)',
            [companyId, 'Owner', companyId, 'Staff']
        );

        // Generate token
        const token = signToken(companyId);

        return res.status(201).json({
            token,
            company: { id: companyId, name, email, phone, category, address, city, country, description },
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find company
        const [rows] = await pool.execute(
            'SELECT id, name, email, password_hash, phone, category, address, city, country, timezone, currency, description, is_locked FROM companies WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const company = rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, company.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = signToken(company.id);

        // Check if account is locked
        if (company.is_locked) {
            return res.status(403).json({ error: 'Your account has been locked by the administrator. Please contact support.' });
        }

        const { password_hash, is_locked, ...companyData } = company;
        return res.json({ token, company: companyData });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * GET /api/auth/me
 * Get current company profile (protected)
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, email, phone, category, address, city, country, timezone, currency, description, image_url, keywords, created_at FROM companies WHERE id = ?',
            [req.companyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        return res.json({ company: rows[0] });
    } catch (error) {
        console.error('Me error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * PUT /api/auth/profile
 * Update company profile (protected)
 */
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, category, address, city, country, description, image_url, keywords } = req.body;
        await pool.execute(
            'UPDATE companies SET name=?, phone=?, category=?, address=?, city=?, country=?, description=?, image_url=?, keywords=? WHERE id=?',
            [name, phone || null, category || null, address || null, city || null, country || null, description || null, image_url || null, keywords || null, req.companyId]
        );
        const [rows] = await pool.execute(
            'SELECT id, name, email, phone, category, address, city, country, timezone, currency, description, image_url, keywords, created_at FROM companies WHERE id = ?',
            [req.companyId]
        );
        return res.json({ company: rows[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * GET /api/auth/listings
 * Public — list all businesses for landing page
 */
router.get('/listings', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT c.id, c.name, c.category, c.address, c.city, c.country, c.phone, c.description, c.image_url, c.keywords,
                   ROUND(AVG(r.rating), 1) as avg_rating,
                   COUNT(DISTINCT r.id) as review_count,
                   COUNT(DISTINCT cl.id) as client_count
            FROM companies c
            LEFT JOIN reviews r ON c.id = r.company_id
            LEFT JOIN clients cl ON c.id = cl.company_id
            GROUP BY c.id
            ORDER BY c.created_at DESC LIMIT 20
        `);
        return res.json({ businesses: rows });
    } catch (error) {
        console.error('Listings error:', error);
        return res.status(500).json({ error: 'Failed to fetch listings' });
    }
});

/**
 * GET /api/auth/search/meta
 * Public — returns available categories, cities, popular keywords for search filters
 * NOTE: Must be defined BEFORE /search to avoid route conflict
 */
router.get('/search/meta', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            `SELECT DISTINCT category FROM companies WHERE category IS NOT NULL ORDER BY category`
        );
        const [cities] = await pool.execute(
            `SELECT DISTINCT city FROM companies WHERE city IS NOT NULL ORDER BY city`
        );
        const [kw] = await pool.execute(
            `SELECT keywords FROM companies WHERE keywords IS NOT NULL AND keywords != ''`
        );

        // Extract unique keywords
        const keywordSet = new Set();
        kw.forEach(row => {
            row.keywords.split(',').forEach(k => {
                const trimmed = k.trim();
                if (trimmed) keywordSet.add(trimmed);
            });
        });

        return res.json({
            categories: categories.map(r => r.category),
            cities: cities.map(r => r.city),
            popularKeywords: [...keywordSet].slice(0, 30),
        });
    } catch (error) {
        console.error('Search meta error:', error);
        return res.status(500).json({ error: 'Failed to fetch search metadata' });
    }
});

/**
 * GET /api/auth/business/:id/services
 * Public — list services offered by a specific company
 */
router.get('/business/:id/services', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, duration_min, price, category FROM services WHERE company_id = ? ORDER BY category, name',
            [req.params.id]
        );
        return res.json({ services: rows });
    } catch (error) {
        console.error('Public services error:', error);
        return res.status(500).json({ error: 'Failed to fetch services' });
    }
});

/**
 * GET /api/auth/business/:id/staff
 * Public — list staff members of a specific company
 */
router.get('/business/:id/staff', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, role, color FROM staff WHERE company_id = ? ORDER BY name',
            [req.params.id]
        );
        return res.json({ staff: rows });
    } catch (error) {
        console.error('Public staff error:', error);
        return res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

/**
 * GET /api/auth/business/:id/availability
 * Public — check staff availability on a given date
 * Query: ?staff_id=1&date=2026-02-23&duration=60
 * Returns booked time slots for the staff member on that date
 */
router.get('/business/:id/availability', async (req, res) => {
    try {
        const { staff_id, date, duration } = req.query;
        if (!staff_id || !date) {
            return res.status(400).json({ error: 'staff_id and date are required' });
        }

        // Get all booked appointments for this staff on this date
        const [booked] = await pool.execute(
            `SELECT start_time, end_time FROM appointments 
             WHERE company_id = ? AND staff_id = ? AND DATE(start_time) = ? AND status != 'cancelled' AND is_deleted = FALSE
             ORDER BY start_time ASC`,
            [req.params.id, staff_id, date]
        );

        // Generate available time slots (9 AM to 6 PM, every 30 min)
        const dur = parseInt(duration) || 30;
        const slots = [];
        const dayStart = 9 * 60; // 9:00 AM in minutes
        const dayEnd = 18 * 60;  // 6:00 PM in minutes

        for (let t = dayStart; t + dur <= dayEnd; t += 30) {
            const slotStart = `${date} ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}:00`;
            const slotEnd = `${date} ${String(Math.floor((t + dur) / 60)).padStart(2, '0')}:${String((t + dur) % 60).padStart(2, '0')}:00`;
            const slotStartMs = new Date(slotStart).getTime();
            const slotEndMs = new Date(slotEnd).getTime();

            // Check overlap with any booked appointment
            const isBooked = booked.some(b => {
                const bStart = new Date(b.start_time).getTime();
                const bEnd = new Date(b.end_time).getTime();
                return slotStartMs < bEnd && slotEndMs > bStart;
            });

            slots.push({
                start: slotStart,
                end: slotEnd,
                time: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`,
                available: !isBooked,
            });
        }

        return res.json({ slots, booked });
    } catch (error) {
        console.error('Availability error:', error);
        return res.status(500).json({ error: 'Failed to check availability' });
    }
});

/**
 * POST /api/auth/book
 * Public — create an appointment from the consumer landing page
 * Body: { company_id, service_id, staff_id, start_time, end_time, client_name, client_email, client_phone, notes }
 */
router.post('/book', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { company_id, service_id, staff_id, start_time, end_time, client_name, client_email, client_phone, notes } = req.body;

        if (!company_id || !service_id || !staff_id || !start_time || !end_time || !client_name) {
            return res.status(400).json({ error: 'company_id, service_id, staff_id, start_time, end_time, and client_name are required' });
        }

        await conn.beginTransaction();

        // Double-check staff availability (prevent race conditions)
        const [conflicts] = await conn.execute(
            `SELECT id FROM appointments 
             WHERE company_id = ? AND staff_id = ? AND status != 'cancelled' AND is_deleted = FALSE
             AND start_time < ? AND end_time > ?`,
            [company_id, staff_id, end_time, start_time]
        );

        if (conflicts.length > 0) {
            await conn.rollback();
            return res.status(409).json({ error: 'This time slot is no longer available. Please choose another.' });
        }

        // Find or create client
        let clientId;
        if (client_email) {
            const [existingClient] = await conn.execute(
                'SELECT id FROM clients WHERE company_id = ? AND email = ?',
                [company_id, client_email]
            );
            if (existingClient.length > 0) {
                clientId = existingClient[0].id;
            }
        }

        if (!clientId) {
            const [clientResult] = await conn.execute(
                'INSERT INTO clients (company_id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?)',
                [company_id, client_name, client_email || null, client_phone || null, 'Booked via website']
            );
            clientId = clientResult.insertId;
        }

        // Create appointment
        const [appointmentResult] = await conn.execute(
            'INSERT INTO appointments (company_id, client_id, staff_id, service_id, start_time, end_time, status, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [company_id, clientId, staff_id, service_id, start_time, end_time, 'confirmed', 'website', notes || null]
        );

        await conn.commit();

        // Send SMS confirmation (fire-and-forget)
        if (client_phone) {
            try {
                const [[svc]] = await pool.execute('SELECT name FROM services WHERE id = ?', [service_id]);
                const [[stf]] = await pool.execute('SELECT name FROM staff WHERE id = ?', [staff_id]);
                const [[biz]] = await pool.execute('SELECT name FROM companies WHERE id = ?', [company_id]);
                sendAppointmentSMS(client_phone, {
                    clientName: client_name,
                    bookingId: appointmentResult.insertId,
                    businessName: biz?.name,
                    serviceName: svc?.name,
                    staffName: stf?.name,
                    startTime: start_time,
                });
            } catch (smsErr) {
                console.warn('SMS lookup failed (booking still succeeded):', smsErr.message);
            }
        }

        return res.status(201).json({
            message: 'Appointment booked successfully!',
            appointment: {
                id: appointmentResult.insertId,
                company_id, client_id: clientId, staff_id, service_id,
                start_time, end_time, status: 'confirmed',
            },
        });
    } catch (error) {
        await conn.rollback();
        console.error('Public booking error:', error);
        return res.status(500).json({ error: 'Failed to book appointment' });
    } finally {
        conn.release();
    }
});

/**
 * GET /api/auth/search
 * Public — advanced search: ?q=text&category=Salon&city=Colombo&date=2026-02-23
 * Searches company name, keywords, description, address, city
 */
router.get('/search', async (req, res) => {
    try {
        const { q, category, city } = req.query;

        let sql = `SELECT c.id, c.name, c.category, c.address, c.city, c.country, c.phone, c.description, c.image_url, c.keywords,
                          ROUND(AVG(r.rating), 1) as avg_rating,
                          COUNT(DISTINCT r.id) as review_count,
                          COUNT(DISTINCT cl.id) as client_count
                   FROM companies c
                   LEFT JOIN reviews r ON c.id = r.company_id
                   LEFT JOIN clients cl ON c.id = cl.company_id
                   WHERE 1=1`;
        const params = [];

        if (q && q.trim()) {
            sql += ` AND (
                name LIKE ? OR
                keywords LIKE ? OR
                description LIKE ? OR
                address LIKE ? OR
                city LIKE ? OR
                category LIKE ?
            )`;
            const like = `%${q.trim()}%`;
            params.push(like, like, like, like, like, like);
        }

        if (category && category.trim() && category !== 'All') {
            sql += ` AND category = ?`;
            params.push(category.trim());
        }

        if (city && city.trim()) {
            sql += ` AND c.city LIKE ?`;
            params.push(`%${city.trim()}%`);
        }

        sql += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT 30`;

        const [rows] = await pool.execute(sql, params);
        return res.json({ businesses: rows });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ error: 'Search failed' });
    }
});

/**
 * GET /api/auth/reviews
 * Public — fetch recent high-quality reviews across all businesses for landing page
 */
router.get('/reviews', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.id, r.rating, r.comment, r.created_at,
                   c.name AS client_name, co.name AS company_name
            FROM reviews r
            LEFT JOIN clients c ON r.client_id = c.id
            LEFT JOIN companies co ON r.company_id = co.id
            WHERE r.comment IS NOT NULL AND r.comment != ''
            ORDER BY r.created_at DESC
            LIMIT 10
        `);
        return res.json({ reviews: rows });
    } catch (error) {
        console.error('Fetch public reviews error:', error);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

/**
 * GET /api/auth/promotions/active
 * Public — fetch all currently active promotions across all businesses
 */
router.get('/promotions/active', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.id, p.title, p.description, p.image_url, p.start_date, p.end_date,
                   c.id AS company_id, c.name AS company_name, c.city AS company_city
            FROM promotions p
            JOIN companies c ON p.company_id = c.id
            WHERE p.is_active = TRUE AND p.end_date >= CURRENT_DATE() AND p.sms_status = 'approved'
            ORDER BY p.created_at DESC
        `);
        return res.json({ promotions: rows });
    } catch (error) {
        console.error('Fetch public promotions error:', error);
        return res.status(500).json({ error: 'Failed to fetch active promotions' });
    }
});

export default router;

