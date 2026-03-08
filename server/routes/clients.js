import { Router } from 'express';
import pool from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/clients
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM clients WHERE company_id = ? ORDER BY name',
            [req.companyId]
        );
        return res.json({ clients: rows });
    } catch (error) {
        console.error('List clients error:', error);
        return res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

/**
 * POST /api/clients
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, notes } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO clients (company_id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?)',
            [req.companyId, name, email || null, phone || null, notes || null]
        );

        return res.status(201).json({
            client: { id: result.insertId, company_id: req.companyId, name, email, phone, notes },
        });
    } catch (error) {
        console.error('Create client error:', error);
        return res.status(500).json({ error: 'Failed to create client' });
    }
});

/**
 * PUT /api/clients/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, notes } = req.body;

        const [result] = await pool.execute(
            'UPDATE clients SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), notes = COALESCE(?, notes) WHERE id = ? AND company_id = ?',
            [name, email, phone, notes, req.params.id, req.companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        return res.json({ message: 'Client updated' });
    } catch (error) {
        console.error('Update client error:', error);
        return res.status(500).json({ error: 'Failed to update client' });
    }
});

/**
 * DELETE /api/clients/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM clients WHERE id = ? AND company_id = ?',
            [req.params.id, req.companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        return res.json({ message: 'Client deleted' });
    } catch (error) {
        console.error('Delete client error:', error);
        return res.status(500).json({ error: 'Failed to delete client' });
    }
});

export default router;
