import app from './app.js';
import config from './config/index.js';
import prisma from './utils/prisma.js';
import { startScheduledTasks } from './jobs/scheduledTasks.js';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL Database via Prisma');

    // Start scheduled background tasks
    startScheduledTasks();

    // Start Express server
    app.listen(config.port, () => {
      console.log(`🚀 AssetFlow API running on port ${config.port}`);
      console.log(`📡 Health check: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
