import { Router } from 'express';
import pool from '../lib/db.js';

const router = Router();

/**
 * POST /api/bookings/lookup
 * Public endpoint — no auth required.
 * Body: { phone: string }
 * Returns all appointments linked to that phone number across all businesses.
 */
router.post('/lookup', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || phone.trim().length < 4) {
            return res.status(400).json({ error: 'Please enter a valid phone number' });
        }

        const cleanPhone = phone.trim();

        // Find all clients matching this phone across all companies
        const [clients] = await pool.execute(
            'SELECT id, company_id, name FROM clients WHERE phone = ? OR phone = ?',
            [cleanPhone, cleanPhone.replace(/^0/, '+94')]
        );

        if (clients.length === 0) {
            return res.json({ bookings: [], message: 'No bookings found for this phone number.' });
        }

        const clientIds = clients.map(c => c.id);
        const placeholders = clientIds.map(() => '?').join(',');

        const [bookings] = await pool.execute(
            `SELECT 
                a.id,
                a.start_time,
                a.end_time,
                a.status,
                a.notes,
                a.source,
                a.created_at,
                sv.name AS service_name,
                sv.price AS service_price,
                sv.duration_min,
                s.name AS staff_name,
                c.name AS client_name,
                co.name AS business_name,
                co.city AS business_city,
                co.address AS business_address,
                co.phone AS business_phone,
                co.category AS business_category
            FROM appointments a
            LEFT JOIN services sv ON a.service_id = sv.id
            LEFT JOIN staff s ON a.staff_id = s.id
            LEFT JOIN clients c ON a.client_id = c.id
            LEFT JOIN companies co ON a.company_id = co.id
            WHERE a.client_id IN (${placeholders})
            ORDER BY a.start_time DESC`,
            clientIds
        );

        return res.json({ bookings });
    } catch (error) {
        console.error('Booking lookup error:', error);
        return res.status(500).json({ error: 'Failed to look up bookings' });
    }
});

/**
 * PATCH /api/bookings/:id/status
 * Public endpoint — verifies phone ownership before updating.
 * Body: { phone: string, status: 'completed' | 'paid' | 'cancelled' }
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { phone, status } = req.body;

        const ALLOWED_STATUSES = ['completed', 'paid', 'cancelled'];
        if (!phone || !status || !ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Invalid phone or status. Allowed: completed, paid, cancelled.' });
        }

        const cleanPhone = phone.trim();

        // Verify this appointment belongs to a client with this phone number
        const [rows] = await pool.execute(
            `SELECT a.id, a.status AS current_status
             FROM appointments a
             JOIN clients c ON a.client_id = c.id
             WHERE a.id = ? AND (c.phone = ? OR c.phone = ?)`,
            [id, cleanPhone, cleanPhone.replace(/^0/, '+94')]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or phone does not match.' });
        }

        await pool.execute(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [status, id]
        );

        return res.json({ success: true, message: `Appointment marked as ${status}.` });
    } catch (error) {
        console.error('Status update error:', error);
        return res.status(500).json({ error: 'Failed to update appointment status' });
    }
});

/**
 * POST /api/bookings/:id/review
 * Public — verifies phone ownership. Body: { phone, rating (1-5), comment }
 */
router.post('/:id/review', async (req, res) => {
    try {
        const { id } = req.params;
        const { phone, rating, comment } = req.body;

        if (!phone || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Phone and rating (1-5) are required.' });
        }

        // Verify appointment belongs to this phone + get IDs
        const [rows] = await pool.execute(
            `SELECT a.id, a.company_id, a.client_id, a.staff_id
             FROM appointments a
             JOIN clients c ON a.client_id = c.id
             WHERE a.id = ? AND (c.phone = ? OR c.phone = ?)`,
            [id, phone.trim(), phone.trim().replace(/^0/, '+94')]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found or phone does not match.' });
        }

        const appt = rows[0];

        // Check if already reviewed
        const [existing] = await pool.execute(
            'SELECT id FROM reviews WHERE appointment_id = ?',
            [id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'You have already reviewed this appointment.' });
        }

        await pool.execute(
            'INSERT INTO reviews (appointment_id, company_id, client_id, staff_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [id, appt.company_id, appt.client_id, appt.staff_id, rating, comment || null]
        );

        return res.json({ success: true, message: 'Review submitted. Thank you!' });
    } catch (error) {
        console.error('Review error:', error);
        return res.status(500).json({ error: 'Failed to submit review' });
    }
});

/**
 * GET /api/bookings/:id/review
 * Public — get review for an appointment
 */
router.get('/:id/review', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, rating, comment, created_at FROM reviews WHERE appointment_id = ?',
            [req.params.id]
        );
        return res.json({ review: rows[0] || null });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch review' });
    }
});

export default router;
