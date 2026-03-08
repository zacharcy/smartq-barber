import { Router } from 'express';
import pool from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/promotions
 * Get all promotions for the logged-in business
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM promotions WHERE company_id = ? ORDER BY created_at DESC',
            [req.companyId]
        );
        return res.json({ promotions: rows });
    } catch (error) {
        console.error('Fetch promotions error:', error);
        return res.status(500).json({ error: 'Failed to fetch promotions' });
    }
});

/**
 * POST /api/promotions
 * Create a new promotion
 * Body: { title, description, image_url, start_date, end_date }
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, image_url, start_date, end_date } = req.body;

        if (!title || !start_date || !end_date) {
            return res.status(400).json({ error: 'Title, start date, and end date are required' });
        }

        const [result] = await pool.execute(
            `INSERT INTO promotions (company_id, title, description, image_url, start_date, end_date, is_active)
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [req.companyId, title, description || null, image_url || null, start_date, end_date]
        );

        return res.status(201).json({ success: true, promotionId: result.insertId });
    } catch (error) {
        console.error('Create promotion error:', error);
        return res.status(500).json({ error: 'Failed to create promotion' });
    }
});

/**
 * PUT /api/promotions/:id
 * Update an existing promotion
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image_url, start_date, end_date, is_active } = req.body;

        if (!title || !start_date || !end_date) {
            return res.status(400).json({ error: 'Title, start date, and end date are required' });
        }

        const [result] = await pool.execute(
            `UPDATE promotions SET title = ?, description = ?, image_url = ?, start_date = ?, end_date = ?, is_active = ?
             WHERE id = ? AND company_id = ?`,
            [title, description || null, image_url || null, start_date, end_date, is_active ? 1 : 0, id, req.companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotion not found or unauthorized' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Update promotion error:', error);
        return res.status(500).json({ error: 'Failed to update promotion' });
    }
});

/**
 * DELETE /api/promotions/:id
 * Delete a promotion
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute(
            'DELETE FROM promotions WHERE id = ? AND company_id = ?',
            [id, req.companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotion not found or unauthorized' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Delete promotion error:', error);
        return res.status(500).json({ error: 'Failed to delete promotion' });
    }
});

/**
 * POST /api/promotions/:id/request-sms
 * Request admin approval to promote (telecast) this promotion
 */
router.post('/:id/request-sms', async (req, res) => {
    try {
        const { id } = req.params;

        // Only allow requesting if not already pending or approved
        const [rows] = await pool.execute(
            'SELECT sms_status FROM promotions WHERE id = ? AND company_id = ?',
            [id, req.companyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        const current = rows[0].sms_status;
        if (current === 'pending') {
            return res.status(400).json({ error: 'Promotion is already pending approval' });
        }
        if (current === 'approved') {
            return res.status(400).json({ error: 'Promotion is already approved' });
        }

        await pool.execute(
            'UPDATE promotions SET sms_status = ? WHERE id = ? AND company_id = ?',
            ['pending', id, req.companyId]
        );

        return res.json({ success: true, message: 'Promotion request submitted for admin approval' });
    } catch (error) {
        console.error('Request SMS error:', error);
        return res.status(500).json({ error: 'Failed to submit request' });
    }
});

export default router;
