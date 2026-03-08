import { Router } from 'express';
import pool from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = Router();

// All routes require auth
router.use(authMiddleware);

/**
 * GET /api/services
 * List all services for the company
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM services WHERE company_id = ? ORDER BY category, name',
            [req.companyId]
        );
        return res.json({ services: rows });
    } catch (error) {
        console.error('List services error:', error);
        return res.status(500).json({ error: 'Failed to fetch services' });
    }
});

/**
 * POST /api/services
 * Create a new service
 */
router.post('/', async (req, res) => {
    try {
        const { name, duration_min, price, category } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Service name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO services (company_id, name, duration_min, price, category) VALUES (?, ?, ?, ?, ?)',
            [req.companyId, name, duration_min || 30, price || 0, category || 'General']
        );

        return res.status(201).json({
            service: { id: result.insertId, company_id: req.companyId, name, duration_min, price, category },
        });
    } catch (error) {
        console.error('Create service error:', error);
        return res.status(500).json({ error: 'Failed to create service' });
    }
});

/**
 * PUT /api/services/:id
 * Update a service
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, duration_min, price, category } = req.body;

        const [result] = await pool.execute(
            'UPDATE services SET name = COALESCE(?, name), duration_min = COALESCE(?, duration_min), price = COALESCE(?, price), category = COALESCE(?, category) WHERE id = ? AND company_id = ?',
            [name, duration_min, price, category, req.params.id, req.companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        return res.json({ message: 'Service updated' });
    } catch (error) {
        console.error('Update service error:', error);
        return res.status(500).json({ error: 'Failed to update service' });
    }
});

/**
 * DELETE /api/services/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM services WHERE id = ? AND company_id = ?',
            [req.params.id, req.companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        return res.json({ message: 'Service deleted' });
    } catch (error) {
        console.error('Delete service error:', error);
        return res.status(500).json({ error: 'Failed to delete service' });
    }
});

export default router;
