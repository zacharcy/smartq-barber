import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

// Route imports
import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import clientsRoutes from './routes/clients.js';
import appointmentsRoutes from './routes/appointments.js';
import staffRoutes from './routes/staff.js';
import rolesRoutes from './routes/roles.js';
import migrateRoutes from './routes/migrate.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import bookingsRoutes from './routes/bookings.js';
import promotionsRoutes from './routes/promotions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

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

// Only start server if not running in Vercel Serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 SmartQ API server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel Serverless
export default app;
