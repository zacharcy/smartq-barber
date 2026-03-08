import { Router } from 'express';
import pool from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = Router();

// All role routes require authentication
router.use(authMiddleware);

/**
 * GET /api/roles — Get all roles for the company
 */
router.get('/', async (req, res) => {
    try {
        const [roles] = await pool.execute(
            'SELECT id, name, created_at FROM roles WHERE company_id = ? ORDER BY created_at ASC',
            [req.companyId]
        );
        return res.json({ roles });
    } catch (error) {
        console.error('Get roles error:', error);
        return res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

/**
 * POST /api/roles — Create a new role
 */
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Role name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO roles (company_id, name) VALUES (?, ?)',
            [req.companyId, name.trim()]
        );

        return res.status(201).json({
            role: { id: result.insertId, name: name.trim(), company_id: req.companyId },
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'A role with this name already exists' });
        }
        console.error('Create role error:', error);
        return res.status(500).json({ error: 'Failed to create role' });
    }
});

/**
 * DELETE /api/roles/:id — Delete a role
 */
router.delete('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT name FROM roles WHERE id = ? AND company_id = ?',
            [req.params.id, req.companyId]
        );
        if (rows.length > 0 && (rows[0].name === 'Owner' || rows[0].name === 'Staff')) {
            return res.status(400).json({ error: 'Cannot delete default roles' });
        }

        await pool.execute(
            'DELETE FROM roles WHERE id = ? AND company_id = ?',
            [req.params.id, req.companyId]
        );
        return res.json({ success: true });
    } catch (error) {
        console.error('Delete role error:', error);
        return res.status(500).json({ error: 'Failed to delete role' });
    }
});

export default router;
