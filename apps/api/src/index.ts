import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config, validateConfig } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Validate configuration
validateConfig();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use(config.apiPrefix, routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Sausage & Burger Packing Assistant API',
    version: '1.0.0',
    docs: `${config.apiPrefix}/docs`,
    health: `${config.apiPrefix}/health`,
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🌭 Sausage & Burger Packing Assistant API 🍔        ║
╠═══════════════════════════════════════════════════════╣
║   Server running on port ${config.port.toString().padEnd(28)}║
║   Environment: ${config.nodeEnv.padEnd(37)}║
║   API Base: ${(config.apiPrefix).padEnd(40)}║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;

