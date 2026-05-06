# Lab 7 - Back-end CRUD API Implementation

## Overview
Lab 7 implements a complete backend CRUD API with JWT authentication and integrates it with the Lab 6 word game frontend application.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Frontend (React + TypeScript)                  │
│                                                                   │
│  - Token Management (tokenService)                              │
│  - API Client (apiService)                                      │
│  - Game History Sync (gameHistoryAPI)                           │
│  - Words Management (wordsAPI)                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                HTTP (CORS Enabled)
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│               Backend (Node.js + Express + TypeScript)          │
│                                                                   │
│  - JWT Authentication & Authorization                           │
│  - SQLite Database                                              │
│  - CRUD Operations (Words, Game History)                        │
│  - Swagger UI Documentation                                     │
│  - Pagination & Filtering                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
lab6/
├── backend/                          # Backend API
│   ├── src/
│   │   ├── app.ts                   # Express app setup & Swagger config
│   │   ├── config/
│   │   │   └── database.ts          # SQLite configuration
│   │   ├── middleware/
│   │   │   └── auth.ts              # JWT verification & authorization
│   │   ├── routes/
│   │   │   └── api.ts               # All API endpoints with Swagger docs
│   │   ├── services/
│   │   │   ├── wordService.ts       # Words CRUD logic
│   │   │   └── gameHistoryService.ts # Game history CRUD & statistics
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   └── utils/
│   │       └── jwt.ts               # JWT generation & verification
│   ├── dist/                        # Compiled JavaScript
│   ├── data/                        # SQLite database
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── src/                             # Frontend (React)
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiService.ts       # Main API client with CRUD operations
│   │   │   ├── tokenService.ts     # JWT token management
│   │   │   └── index.ts             # Exports
│   │   └── storage/
│   │       ├── gameHistoryAPI.ts   # API-backed game history
│   │       └── wordsAPI.ts          # API-backed words management
│   ├── components/
│   │   └── Game/
│   │       └── Game.tsx             # Updated to save games to API
│   └── pages/
│       └── Statistics.tsx           # Updated to fetch stats from API
│
├── .env                             # API configuration
├── .env.example
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 16+ (frontend) and 18+ (backend)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run build  # Compile TypeScript
```

**Running the Backend:**

Development (with TypeScript):
```bash
npm run dev
```

Production (compiled JavaScript):
```bash
node dist/app.js
```

Backend runs on: `http://localhost:3001`
Swagger UI: `http://localhost:3001/api-docs`

### Frontend Setup

```bash
npm install
npm run dev  # Development server
```

Frontend runs on: `http://localhost:5173`

### Environment Configuration

Frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

## Core Features

### 1. JWT Authentication
- **Token Endpoint:** `POST /api/token`
- **Expiration:** 1 minute (as per requirements)
- **Payload Structure:**
  ```json
  {
    "userId": "user_timestamp",
    "role": "ADMIN|WRITER|VISITOR",
    "permissions": ["READ", "WRITE", "DELETE"],
    "iat": 1620000000,
    "exp": 1620000060
  }
  ```

### 2. Role-Based Access Control

| Role | Permissions | Can Do |
|------|---|---|
| ADMIN | READ, WRITE, DELETE, MANAGE_USERS | Full CRUD access to all resources |
| WRITER | READ, WRITE | Can create and read, cannot delete |
| VISITOR | READ | Read-only access |

### 3. API Endpoints

#### Authentication
```http
POST /token
Content-Type: application/json

{
  "role": "WRITER",
  "permissions": ["READ", "WRITE"]
}

Response: {
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "role": "WRITER",
    "permissions": ["READ", "WRITE"],
    "expiresIn": 60
  }
}
```

#### Words CRUD
```http
# Get all words (paginated)
GET /words?limit=10&offset=0
Authorization: Bearer <JWT_TOKEN>

# Create word
POST /words
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "word": "example",
  "language": "english",
  "difficulty": 2
}

# Get single word
GET /words/{id}
Authorization: Bearer <JWT_TOKEN>

# Update word
PUT /words/{id}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "word": "updated",
  "difficulty": 3
}

# Delete word
DELETE /words/{id}
Authorization: Bearer <JWT_TOKEN>
```

#### Game History CRUD
```http
# Get game history
GET /game-history?limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>

# Record game
POST /game-history
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "word": "example",
  "guesses": ["guess1", "guess2", "guess3"],
  "won": true,
  "difficulty": 2,
  "duration": 120
}

# Get statistics
GET /statistics
Authorization: Bearer <JWT_TOKEN>
```

### 4. Pagination

All list endpoints support pagination:
- `limit` - Number of records (default: 10, max: 100)
- `offset` - Skip N records (default: 0)

Example:
```http
GET /words?limit=20&offset=40
```

### 5. HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (missing/invalid fields) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate word) |
| 500 | Internal Server Error |

## Frontend Integration

### Token Management (`tokenService`)
```typescript
import { tokenService } from "@/services/api";

// Request a new token
const token = await tokenService.requestToken("WRITER");

// Get valid token (auto-refreshes if needed)
const token = await tokenService.getValidToken("VISITOR");

// Check if token is valid
const isValid = tokenService.isTokenValid();
```

### API Operations (`apiService`)
```typescript
import { apiService } from "@/services/api";

// Get words
const response = await apiService.getWords({ limit: 20, offset: 0 });

// Create word
await apiService.createWord({
  word: "test",
  language: "english",
  difficulty: 1
});

// Record game
await apiService.recordGame({
  word: "example",
  guesses: ["guess1", "guess2"],
  won: true,
  difficulty: 2,
  duration: 120
});

// Get statistics
const stats = await apiService.getStatistics();
```

### Game Recording

When a game ends, the frontend now:
1. Saves the game locally (IndexedDB)
2. Attempts to sync with the backend API
3. Continues gracefully if the API is unavailable

```typescript
// In Game component
await addGameToHistory(historyEntry); // Local save
try {
  await addGameToHistoryAPI(historyEntry, guesses);
} catch (error) {
  console.warn("API unavailable, but game saved locally");
}
```

## Database Schema

### Words Table
```sql
CREATE TABLE words (
  id TEXT PRIMARY KEY,
  word TEXT UNIQUE NOT NULL,
  language TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

### Game History Table
```sql
CREATE TABLE game_history (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  guesses TEXT NOT NULL,      -- JSON array
  won INTEGER NOT NULL,       -- 0 or 1
  difficulty INTEGER NOT NULL,
  playedAt INTEGER NOT NULL,
  duration INTEGER NOT NULL
);
```

## Example Usage

### Step 1: Get a Token
```bash
curl -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"WRITER"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "WRITER",
    "permissions": ["READ", "WRITE"],
    "expiresIn": 60
  }
}
```

### Step 2: Create a Word
```bash
curl -X POST http://localhost:3001/api/words \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "hello",
    "language": "english",
    "difficulty": 1
  }'
```

### Step 3: Get All Words
```bash
curl http://localhost:3001/api/words?limit=10&offset=0 \
  -H "Authorization: Bearer <TOKEN>"
```

### Step 4: Record a Game
```bash
curl -X POST http://localhost:3001/api/game-history \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "hello",
    "guesses": ["hello"],
    "won": true,
    "difficulty": 1,
    "duration": 30
  }'
```

## Features Checklist

- ✅ REST API with Express.js
- ✅ JWT Authentication (1 minute expiration)
- ✅ Role-Based Access Control (ADMIN, WRITER, VISITOR)
- ✅ Permissions System (READ, WRITE, DELETE, MANAGE_USERS)
- ✅ SQLite Database
- ✅ CRUD Operations (Words, Game History)
- ✅ Pagination Support (limit/offset)
- ✅ Swagger UI Documentation
- ✅ Appropriate HTTP Status Codes
- ✅ CORS Support
- ✅ Frontend Integration
- ✅ Token Management
- ✅ Game Recording Sync
- ✅ Statistics API
- ✅ Error Handling

## Security Notes

1. **JWT Secret:** Change `JWT_SECRET` in production
2. **Token Expiration:** Currently set to 1 minute for demos
3. **CORS:** Enabled for localhost; configure for production
4. **Validation:** Input validation added for all endpoints
5. **Database:** Use connection pooling in production

## Future Enhancements

- [ ] Implement token refresh mechanism
- [ ] Add user authentication (login/register)
- [ ] Add more detailed filtering and sorting
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Add database migrations system
- [ ] Add logging system
- [ ] Deploy to cloud (Heroku, AWS, etc.)

## Troubleshooting

### "Cannot find module" errors
```bash
# Make sure dependencies are installed
npm install
```

### "SQLITE_CANTOPEN" error
```bash
# Backend needs data directory
mkdir backend/data
```

### CORS errors
```
# Make sure frontend and backend URLs are correct in .env
VITE_API_BASE_URL=http://localhost:3001/api
```

### "Invalid token" errors
```
# Tokens expire after 1 minute, request a new one
```

## Contributing

When making changes:
1. Follow the project structure
2. Use TypeScript for type safety
3. Update API documentation in `api.ts`
4. Test endpoints in Swagger UI
5. Commit frequently with clear messages

## License

MIT

---

For detailed backend documentation, see [backend/README.md](./backend/README.md)
