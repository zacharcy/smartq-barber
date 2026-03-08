import { Router } from 'express';
import pool from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/dashboard
 * Returns summary stats for the logged-in company
 */
router.get('/', async (req, res) => {
    try {
        const companyId = req.companyId;

        // Today's date
        const today = new Date().toISOString().split('T')[0];

        // Total clients
        const [[{ totalClients }]] = await pool.execute(
            'SELECT COUNT(*) AS totalClients FROM clients WHERE company_id = ?',
            [companyId]
        );

        // New clients this week
        const [[{ newClientsWeek }]] = await pool.execute(
            'SELECT COUNT(*) AS newClientsWeek FROM clients WHERE company_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
            [companyId]
        );

        const [[{ todayAppointments }]] = await pool.execute(
            'SELECT COUNT(*) AS todayAppointments FROM appointments WHERE company_id = ? AND DATE(start_time) = ? AND is_deleted = FALSE',
            [companyId, today]
        );

        const [[{ upcomingAppointments }]] = await pool.execute(
            'SELECT COUNT(*) AS upcomingAppointments FROM appointments WHERE company_id = ? AND start_time >= NOW() AND start_time <= DATE_ADD(NOW(), INTERVAL 7 DAY) AND is_deleted = FALSE',
            [companyId]
        );

        // Total staff
        const [[{ totalStaff }]] = await pool.execute(
            'SELECT COUNT(*) AS totalStaff FROM staff WHERE company_id = ?',
            [companyId]
        );

        // Total services
        const [[{ totalServices }]] = await pool.execute(
            'SELECT COUNT(*) AS totalServices FROM services WHERE company_id = ?',
            [companyId]
        );

        // Today's schedule (appointments with names)
        const [todaySchedule] = await pool.execute(
            `SELECT a.*, c.name AS client_name, s.name AS staff_name, sv.name AS service_name 
       FROM appointments a 
       LEFT JOIN clients c ON a.client_id = c.id 
       LEFT JOIN staff s ON a.staff_id = s.id 
       LEFT JOIN services sv ON a.service_id = sv.id 
       WHERE a.company_id = ? AND DATE(a.start_time) = ? AND a.is_deleted = FALSE
       ORDER BY a.start_time ASC`,
            [companyId, today]
        );

        // Revenue last 7 days (paid + completed appointments)
        const [[{ revenueWeek }]] = await pool.execute(
            `SELECT COALESCE(SUM(sv.price), 0) AS revenueWeek
             FROM appointments a
             JOIN services sv ON a.service_id = sv.id
             WHERE a.company_id = ? AND a.status IN ('paid', 'completed')
             AND a.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [companyId]
        );

        // Revenue previous 7 days (for comparison)
        const [[{ revenuePrevWeek }]] = await pool.execute(
            `SELECT COALESCE(SUM(sv.price), 0) AS revenuePrevWeek
             FROM appointments a
             JOIN services sv ON a.service_id = sv.id
             WHERE a.company_id = ? AND a.status IN ('paid', 'completed')
             AND a.start_time >= DATE_SUB(NOW(), INTERVAL 14 DAY)
             AND a.start_time < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [companyId]
        );

        // Daily sales for last 7 days (for chart)
        const [dailySales] = await pool.execute(
            `SELECT DATE(a.start_time) AS day, COALESCE(SUM(sv.price), 0) AS total
             FROM appointments a
             JOIN services sv ON a.service_id = sv.id
             WHERE a.company_id = ? AND a.status IN ('paid', 'completed')
             AND a.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(a.start_time)
             ORDER BY day ASC`,
            [companyId]
        );

        return res.json({
            totalClients,
            newClientsWeek,
            todayAppointments,
            upcomingAppointments,
            totalStaff,
            totalServices,
            todaySchedule,
            revenueWeek: parseFloat(revenueWeek),
            revenuePrevWeek: parseFloat(revenuePrevWeek),
            dailySales,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;
