import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../lib/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smartq-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '1d';

// Helper to sign Admin JWT
function signAdminToken(adminId) {
    return jwt.sign({ adminId, role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware to protect admin routes
function adminAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Admin authentication required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin' || !decoded.adminId) {
            return res.status(403).json({ error: 'Access denied: Requires admin role' });
        }
        req.adminId = decoded.adminId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired admin token' });
    }
}

/**
 * POST /api/admin/login
 * Log in an admin user
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [admins] = await pool.execute('SELECT * FROM admins WHERE username = ?', [username]);
        if (admins.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const adminUser = admins[0];
        const isValid = await bcrypt.compare(password, adminUser.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signAdminToken(adminUser.id);

        res.json({
            token,
            admin: {
                id: adminUser.id,
                username: adminUser.username
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/companies
 * Get all registered companies
 */
router.get('/companies', adminAuthMiddleware, async (req, res) => {
    try {
        // Fetch all companies along with basic stats securely
        const [companies] = await pool.execute(`
            SELECT 
                c.id, c.name, c.email, c.phone, c.category, c.city, c.created_at, c.is_locked,
                (SELECT COUNT(*) FROM staff s WHERE s.company_id = c.id) as staff_count,
                (SELECT COUNT(*) FROM appointments a WHERE a.company_id = c.id) as appointment_count
            FROM companies c
            ORDER BY c.created_at DESC
        `);

        res.json({ companies });
    } catch (error) {
        console.error('Error fetching companies for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/companies/:id/lock
 * Lock a company account (prevent login)
 */
router.post('/companies/:id/lock', adminAuthMiddleware, async (req, res) => {
    try {
        const [result] = await pool.execute(
            'UPDATE companies SET is_locked = TRUE WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        return res.json({ success: true, message: 'Company account locked' });
    } catch (error) {
        console.error('Lock company error:', error);
        return res.status(500).json({ error: 'Failed to lock company' });
    }
});

/**
 * POST /api/admin/companies/:id/unlock
 * Unlock a company account (allow login)
 */
router.post('/companies/:id/unlock', adminAuthMiddleware, async (req, res) => {
    try {
        const [result] = await pool.execute(
            'UPDATE companies SET is_locked = FALSE WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        return res.json({ success: true, message: 'Company account unlocked' });
    } catch (error) {
        console.error('Unlock company error:', error);
        return res.status(500).json({ error: 'Failed to unlock company' });
    }
});

/**
 * GET /api/admin/promotions
 * Get all promotions for admin management
 */
router.get('/promotions', adminAuthMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.id, p.title, p.description, p.image_url, p.start_date, p.end_date,
                   p.is_active, p.sms_status, p.created_at,
                   c.id AS company_id, c.name AS company_name, c.city AS company_city
            FROM promotions p
            JOIN companies c ON p.company_id = c.id
            WHERE p.is_active = TRUE AND p.end_date >= CURRENT_DATE()
            ORDER BY p.created_at DESC
        `);
        return res.json({ promotions: rows });
    } catch (error) {
        console.error('Fetch promotions error:', error);
        return res.status(500).json({ error: 'Failed to fetch promotions' });
    }
});

/**
 * POST /api/admin/promotions/:id/hide
 * Hide a promotion from the consumer page
 */
router.post('/promotions/:id/hide', adminAuthMiddleware, async (req, res) => {
    try {
        const [result] = await pool.execute(
            "UPDATE promotions SET sms_status = 'hidden' WHERE id = ?",
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        return res.json({ success: true, message: 'Promotion hidden from consumer page' });
    } catch (error) {
        console.error('Hide promotion error:', error);
        return res.status(500).json({ error: 'Failed to hide promotion' });
    }
});

/**
 * POST /api/admin/promotions/:id/restore
 * Restore a hidden promotion back to the consumer page
 */
router.post('/promotions/:id/restore', adminAuthMiddleware, async (req, res) => {
    try {
        const [result] = await pool.execute(
            "UPDATE promotions SET sms_status = 'approved' WHERE id = ?",
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        return res.json({ success: true, message: 'Promotion restored to consumer page' });
    } catch (error) {
        console.error('Restore promotion error:', error);
        return res.status(500).json({ error: 'Failed to restore promotion' });
    }
});

export default router;
