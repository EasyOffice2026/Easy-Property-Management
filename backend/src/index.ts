import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/routes';
import propertiesRoutes from './modules/properties/routes';
import usersRoutes from './modules/users/routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? '*' }));
app.use(express.json());

app.get('/api/v1/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', propertiesRoutes);
app.use('/api/v1/users', usersRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`EPM backend listening on port ${port}`);
});
