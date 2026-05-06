# Word Game API - Lab 7 Backend

## Overview
RESTful CRUD API for the word game application with JWT-based authentication and role-based access control.

## Features
✅ JWT Authentication (1 minute expiration)
✅ Role-Based Access Control (ADMIN, WRITER, VISITOR)
✅ Swagger UI API Documentation
✅ SQLite Database
✅ Pagination Support (limit/offset)
✅ CORS Enabled
✅ Comprehensive Error Handling

## Quick Start

### Installation
```bash
cd backend
npm install
npm run build
```

### Running the Server

**Development (TypeScript):**
```bash
npm run dev
```

**Production (Compiled JavaScript):**
```bash
npm run build
node dist/app.js
```

The server runs on `http://localhost:3001`
API Documentation: `http://localhost:3001/api-docs`

## API Endpoints

### Authentication
- **POST /token** - Generate JWT token
  - Request: `{ "role": "ADMIN|WRITER|VISITOR", "permissions": [...] }`
  - Response: `{ token, role, permissions, expiresIn: 60 }`

### Words (CRUD)
- **GET /words** - Get all words (paginated)
- **POST /words** - Create word (requires WRITE)
- **GET /words/:id** - Get specific word
- **PUT /words/:id** - Update word (requires WRITE)
- **DELETE /words/:id** - Delete word (requires DELETE)

### Game History (CRUD)
- **GET /game-history** - Get all records (paginated)
- **POST /game-history** - Record a game (requires WRITE)
- **GET /game-history/:id** - Get specific record
- **DELETE /game-history/:id** - Delete record (requires DELETE)

### Statistics
- **GET /statistics** - Get game statistics

## Role Permissions

| Role | Permissions |
|------|---|
| ADMIN | READ, WRITE, DELETE, MANAGE_USERS |
| WRITER | READ, WRITE |
| VISITOR | READ |

## Authorization Header
```
Authorization: Bearer <jwt_token>
```

## Query Parameters

### Pagination
- `limit` - Number of records (default: 10, max: 100)
- `offset` - Skip N records (default: 0)

Example: `GET /words?limit=20&offset=40`

## Error Responses

| Status | Meaning |
|--------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (word already exists) |
| 500 | Internal Server Error |

## Example Usage

### 1. Get Token
```bash
curl -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"WRITER"}'
```

### 2. Create a Word
```bash
curl -X POST http://localhost:3001/api/words \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"word":"example","language":"english","difficulty":3}'
```

### 3. Get All Words
```bash
curl http://localhost:3001/api/words?limit=10&offset=0 \
  -H "Authorization: Bearer <TOKEN>"
```

## Database

Uses SQLite3 with two main tables:
- **words** - Word entries with difficulty levels
- **game_history** - Game records with statistics

Database file: `backend/data/game.db`

## Environment Variables
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret key for JWT signing (default: 'your-secret-key-change-in-production')

## Development

### Project Structure
```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── config/
│   │   └── database.ts     # SQLite configuration
│   ├── middleware/
│   │   └── auth.ts         # JWT verification
│   ├── routes/
│   │   └── api.ts          # API endpoints
│   ├── services/
│   │   ├── wordService.ts
│   │   └── gameHistoryService.ts
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   └── utils/
│       └── jwt.ts          # JWT utilities
├── dist/                   # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Next Steps
- [ ] Connect frontend app to backend
- [ ] Add more detailed statistics
- [ ] Implement token refresh mechanism
- [ ] Add input validation middleware
- [ ] Add rate limiting
