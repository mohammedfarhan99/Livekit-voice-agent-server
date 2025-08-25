import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import agentsRoutes from './routes/agents.routes';
import healthRoutes from './routes/health.routes';

class VoiceAgentServer {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for development
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Add your production domains
        : true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        query: req.query,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      next();
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/agents', agentsRoutes);
    this.app.use('/health', healthRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'LiveKit Voice Agent Server',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health',
        endpoints: {
          agents: '/api/agents',
          createAgent: 'POST /api/agents/create',
          getAgentTypes: 'GET /api/agents/types',
          getRooms: 'GET /api/agents/rooms',
          getRoomInfo: 'GET /api/agents/rooms/:roomName',
          endRoom: 'DELETE /api/agents/rooms/:roomName'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public start(): void {
    const port = config.PORT;
    
    this.app.listen(port, () => {
      logger.info(`🚀 Voice Agent Server is running!`, {
        port,
        environment: config.NODE_ENV,
        livekitUrl: config.LIVEKIT_URL,
        pid: process.pid
      });

      logger.info('📋 Available endpoints:');
      logger.info('  - Health Check: GET /health');
      logger.info('  - Create Agent: POST /api/agents/create');
      logger.info('  - List Agent Types: GET /api/agents/types');
      logger.info('  - Active Rooms: GET /api/agents/rooms');
      logger.info('');
      logger.info('🎤 Available Agent Types:');
      logger.info('  - debt-collector: Professional debt collection agent');
      logger.info('  - cheerleader: Enthusiastic motivational coach');
      logger.info('  - assistant: General purpose AI assistant');
      logger.info('  - customer-service: Customer service representative');
      logger.info('  - therapist: Therapeutic listener and counselor');
      logger.info('  - teacher: Educational instructor and tutor');
      logger.info('  - sales-rep: Consultative sales professional');
      logger.info('  - technical-support: Technical support specialist');
    });

    // Graceful shutdown handling
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      // Close server and perform cleanup
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Start the server if this file is executed directly
if (require.main === module) {
  const server = new VoiceAgentServer();
  server.start();
}

export default VoiceAgentServer;
