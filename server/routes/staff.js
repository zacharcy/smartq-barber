import { Router } from 'express';
import pool from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/staff
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM staff WHERE company_id = ? ORDER BY name',
            [req.companyId]
        );
        return res.json({ staff: rows });
    } catch (error) {
        console.error('List staff error:', error);
        return res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

/**
 * POST /api/staff
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, role, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Staff name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO staff (company_id, name, email, role, color) VALUES (?, ?, ?, ?, ?)',
            [req.companyId, name, email || null, role || 'Staff', color || '#D4AF37']
        );

        return res.status(201).json({
            staff: { id: result.insertId, company_id: req.companyId, name, email, role, color },
        });
    } catch (error) {
        console.error('Create staff error:', error);
        return res.status(500).json({ error: 'Failed to create staff' });
    }
});

/**
 * PUT /api/staff/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, email, role, color } = req.body;

        const [result] = await pool.execute(
            'UPDATE staff SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role), color = COALESCE(?, color) WHERE id = ? AND company_id = ?',
            [name, email, role, color, req.params.id, req.companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        return res.json({ message: 'Staff updated' });
    } catch (error) {
        console.error('Update staff error:', error);
        return res.status(500).json({ error: 'Failed to update staff' });
    }
});

/**
 * DELETE /api/staff/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM staff WHERE id = ? AND company_id = ?',
            [req.params.id, req.companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        return res.json({ message: 'Staff deleted' });
    } catch (error) {
        console.error('Delete staff error:', error);
        return res.status(500).json({ error: 'Failed to delete staff' });
    }
});

export default router;
