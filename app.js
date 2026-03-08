import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

// Route imports
import authRoutes from './server/routes/auth.js';
import servicesRoutes from './server/routes/services.js';
import clientsRoutes from './server/routes/clients.js';
import appointmentsRoutes from './server/routes/appointments.js';
import staffRoutes from './server/routes/staff.js';
import rolesRoutes from './server/routes/roles.js';
import migrateRoutes from './server/routes/migrate.js';
import dashboardRoutes from './server/routes/dashboard.js';
import uploadRoutes from './server/routes/upload.js';
import adminRoutes from './server/routes/admin.js';
import chatRoutes from './server/routes/chat.js';
import bookingsRoutes from './server/routes/bookings.js';
import promotionsRoutes from './server/routes/promotions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Only start server if running locally (not on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 SmartQ API server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
export default app;
