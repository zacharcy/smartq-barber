import { Router } from 'express';
import { runMigrations } from '../lib/migrate.js';

const router = Router();

/**
 * POST /api/migrate
 * Run database migrations — creates all tables
 */
router.post('/', async (req, res) => {
    try {
        const result = await runMigrations();
        if (result.success) {
            return res.json(result);
        }
        return res.status(500).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
