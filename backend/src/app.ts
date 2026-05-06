import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes/api';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Word Game API',
      version: '1.0.0',
      description: 'CRUD API for word game application with JWT authentication',
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'JWT token (get from /token endpoint)',
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'JWT token generation',
      },
      {
        name: 'Words',
        description: 'Word CRUD operations',
      },
      {
        name: 'GameHistory',
        description: 'Game history CRUD operations',
      },
      {
        name: 'Statistics',
        description: 'Game statistics',
      },
    ],
  },
  apis: ['./src/routes/api.ts'],
};

const swaggerDocs = {
  ...swaggerOptions.definition,
};

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});
