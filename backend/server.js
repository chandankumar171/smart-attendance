require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { startCronJobs, seedAdmin } = require('./jobs/cronJobs');

const PORT = process.env.PORT || 5000;

// Connect to database then seed default admin
connectDB().then(() => seedAdmin());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start scheduled cron jobs (auto-absent marking)
startCronJobs();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});