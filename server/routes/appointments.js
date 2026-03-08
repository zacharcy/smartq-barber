import { Router } from 'express';
import pool from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';
import { sendAppointmentSMS } from '../lib/sms.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/appointments
 * Query params: ?date=2026-02-23 or ?start=...&end=...
 */
router.get('/', async (req, res) => {
    try {
        const { date, start, end, include_deleted } = req.query;
        let query = 'SELECT a.*, a.source, c.name AS client_name, s.name AS staff_name, sv.name AS service_name FROM appointments a LEFT JOIN clients c ON a.client_id = c.id LEFT JOIN staff s ON a.staff_id = s.id LEFT JOIN services sv ON a.service_id = sv.id WHERE a.company_id = ?';

        if (include_deleted !== 'true') {
            query += ' AND a.is_deleted = FALSE';
        }

        const params = [req.companyId];

        if (date) {
            query += ' AND DATE(a.start_time) = ?';
            params.push(date);
        } else if (start && end) {
            query += ' AND a.start_time >= ? AND a.end_time <= ?';
            params.push(start, end);
        }

        query += ' ORDER BY a.start_time ASC';

        const [rows] = await pool.execute(query, params);
        return res.json({ appointments: rows });
    } catch (error) {
        console.error('List appointments error:', error);
        return res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

/**
 * POST /api/appointments
 */
router.post('/', async (req, res) => {
    try {
        const { client_id, staff_id, service_id, start_time, end_time, status, notes } = req.body;

        if (!start_time || !end_time) {
            return res.status(400).json({ error: 'start_time and end_time are required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO appointments (company_id, client_id, staff_id, service_id, start_time, end_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.companyId, client_id || null, staff_id || null, service_id || null, start_time, end_time, status || 'confirmed', notes || null]
        );

        await pool.execute(
            'INSERT INTO appointment_logs (appointment_id, company_id, action, new_status) VALUES (?, ?, ?, ?)',
            [result.insertId, req.companyId, 'created', status || 'confirmed']
        );

        // Send SMS confirmation (fire-and-forget)
        if (client_id) {
            try {
                const [[client]] = await pool.execute('SELECT name, phone FROM clients WHERE id = ?', [client_id]);
                if (client?.phone) {
                    const [[biz]] = await pool.execute('SELECT name FROM companies WHERE id = ?', [req.companyId]);
                    const [[svc]] = service_id ? await pool.execute('SELECT name FROM services WHERE id = ?', [service_id]) : [[]];
                    const [[stf]] = staff_id ? await pool.execute('SELECT name FROM staff WHERE id = ?', [staff_id]) : [[]];
                    sendAppointmentSMS(client.phone, {
                        clientName: client.name,
                        bookingId: result.insertId,
                        businessName: biz?.name,
                        serviceName: svc?.name,
                        staffName: stf?.name,
                        startTime: start_time,
                    });
                }
            } catch (smsErr) {
                console.warn('SMS lookup failed (appointment still created):', smsErr.message);
            }
        }

        return res.status(201).json({
            appointment: { id: result.insertId, company_id: req.companyId, client_id, staff_id, service_id, start_time, end_time, status, notes },
        });
    } catch (error) {
        console.error('Create appointment error:', error);
        return res.status(500).json({ error: 'Failed to create appointment' });
    }
});

/**
 * PUT /api/appointments/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { client_id, staff_id, service_id, start_time, end_time, status, notes } = req.body;

        const [existing] = await pool.execute('SELECT status FROM appointments WHERE id = ? AND company_id = ?', [req.params.id, req.companyId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        const oldStatus = existing[0].status;

        const [result] = await pool.execute(
            'UPDATE appointments SET client_id = COALESCE(?, client_id), staff_id = COALESCE(?, staff_id), service_id = COALESCE(?, service_id), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ? AND company_id = ? AND is_deleted = FALSE',
            [client_id ?? null, staff_id ?? null, service_id ?? null, start_time ?? null, end_time ?? null, status ?? null, notes ?? null, req.params.id, req.companyId]
        );

        if (result.affectedRows > 0 && status && status !== oldStatus) {
            await pool.execute(
                'INSERT INTO appointment_logs (appointment_id, company_id, action, previous_status, new_status) VALUES (?, ?, ?, ?, ?)',
                [req.params.id, req.companyId, 'status_change', oldStatus, status]
            );
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        return res.json({ message: 'Appointment updated' });
    } catch (error) {
        console.error('Update appointment error:', error);
        return res.status(500).json({ error: 'Failed to update appointment' });
    }
});

/**
 * DELETE /api/appointments/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'UPDATE appointments SET is_deleted = TRUE WHERE id = ? AND company_id = ?',
            [req.params.id, req.companyId]
        );

        if (result.affectedRows > 0) {
            await pool.execute(
                'INSERT INTO appointment_logs (appointment_id, company_id, action) VALUES (?, ?, ?)',
                [req.params.id, req.companyId, 'deleted']
            );
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        return res.json({ message: 'Appointment deleted' });
    } catch (error) {
        console.error('Delete appointment error:', error);
        return res.status(500).json({ error: 'Failed to delete appointment' });
    }
});

/**
 * GET /api/appointments/:id/logs
 */
router.get('/:id/logs', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM appointment_logs WHERE appointment_id = ? AND company_id = ? ORDER BY created_at ASC',
            [req.params.id, req.companyId]
        );
        return res.json({ logs: rows });
    } catch (error) {
        console.error('Fetch appointment logs error:', error);
        return res.status(500).json({ error: 'Failed to fetch appointment logs' });
    }
});

export default router;
