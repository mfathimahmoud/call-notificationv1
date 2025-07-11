import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Import modules
import { config, isMercuryMode } from './lib/config.js';
import { connectDatabase } from './lib/database.js';
import { setupSocketHandlers } from './lib/socketHandler.js';

// Import routes
import mainRoutes from './routes/main.js';
import databaseRoutes from './routes/database.js';
import adminRoutes from './routes/admin.js';
import webhookRoutes from './routes/webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

//TODOs:
//Refreshing the page while on a call with a company should populate the data.
//  - This is a challenge.  Current method might depend on webhook mode, because getting an active call with API doesn't show redirections.
//  -                       SDK doesn't appear to recognize any calls answered outside of it.

//4. Test in Docker/Prod
//5. Push to Git

//TODO Any time goals:
//?. When multiple agents receive the same calls... do we want to cache the DB pull?
//?. Add Call Logs button - this means a call logs display as well...


// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'static')));
app.use(cookieParser());
app.use(express.json());

// Make io available to routes that need it
app.set('io', io);

// Routes
app.use('/', mainRoutes);
app.use('/', databaseRoutes);
app.use('/', adminRoutes);
app.use('/', webhookRoutes);

// Initialize application
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Setup Socket.IO handlers
    setupSocketHandlers(io);
    
    // Start server
    server.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
      console.log("Mercury Mode:", isMercuryMode());
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;