import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import dexRoutes from './routes/dex';
import authRoutes from './routes/auth';
import { prisma } from './lib/prisma';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.get('/', c => c.json({ message: 'DEX Creator API is running' }));
app.route('/api/dex', dexRoutes);
app.route('/api/auth', authRoutes);

// Error handling
app.notFound(c => {
  return c.json(
    {
      message: 'Not Found',
      status: 404,
    },
    404
  );
});

app.onError((err, c) => {
  console.error(`${err}`);
  return c.json(
    {
      message: 'Internal Server Error',
      status: 500,
    },
    500
  );
});

// Start the server
const port = process.env.PORT || 3001;
console.log(`Server is running on port ${port}`);

// Database connection check
prisma
  .$connect()
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err: Error) => {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  });

// Clean up database connection on shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

serve({
  fetch: app.fetch,
  port: Number(port),
});
