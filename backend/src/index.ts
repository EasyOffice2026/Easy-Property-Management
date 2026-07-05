import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './modules/auth/routes';
import propertiesRoutes from './modules/properties/routes';
import usersRoutes from './modules/users/routes';
import tenantsRoutes from './modules/tenants/routes';
import inquiriesRoutes from './modules/inquiries/routes';
import contractsRoutes from './modules/contracts/routes';
import maintenanceRoutes from './modules/maintenance/routes';
import pettyCashRoutes from './modules/pettycash/routes';
import dashboardRoutes from './modules/dashboard/routes';
import accountingRoutes from './modules/accounting/routes';
import settingsRoutes from './modules/settings/routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { UPLOAD_ROOT } from './utils/fileStorage';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? '*' }));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_ROOT));

app.get('/api/v1/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', propertiesRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/tenants', tenantsRoutes);
app.use('/api/v1/inquiries', inquiriesRoutes);
app.use('/api/v1/contracts', contractsRoutes);
app.use('/api/v1', maintenanceRoutes);
app.use('/api/v1/petty-cash', pettyCashRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/accounting', accountingRoutes);
app.use('/api/v1/settings', settingsRoutes);

const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.use(notFoundHandler);
}
app.use(errorHandler);

const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`EPM backend listening on port ${port}`);
});
