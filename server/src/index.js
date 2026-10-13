const http = require('http');
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const initSocket = require('./socket');

async function start() {
  try {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);
    server.listen(env.port, () => {
      console.log(`✔ API running on http://localhost:${env.port}  (${env.nodeEnv})`);
      console.log(`  Frontend expected at ${env.clientUrl}`);
    });

    const shutdown = (sig) => {
      console.log(`\n${sig} received – shutting down`);
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('✖ Failed to start server:', err.message);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

start();
