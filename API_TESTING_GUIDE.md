# API Testing Guide

## Quick Start

### 1. Start the Backend
```bash
cd backend
npm run build
node dist/app.js
# Server will be running at http://localhost:3001
# Swagger UI at http://localhost:3001/api-docs
```

### 2. Start the Frontend
In a new terminal:
```bash
npm run dev
# Frontend at http://localhost:5173
```

### 3. Test the API

You can test the API in three ways:
- **Swagger UI** - `http://localhost:3001/api-docs` (recommended)
- **cURL** - Command line
- **Frontend** - Play the game and watch the data sync

## Testing Scenarios

### Scenario 1: Basic Word Management

**Objective:** Create a word and retrieve it

1. **Get Token (WRITER role)**
```bash
curl -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"WRITER"}' | jq .
```

Save the token from the response.

2. **Create a Word**
```bash
TOKEN="your-token-here"
curl -X POST http://localhost:3001/api/words \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "amazing",
    "language": "english",
    "difficulty": 2
  }' | jq .
```

3. **Get All Words**
```bash
curl "http://localhost:3001/api/words?limit=5&offset=0" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Scenario 2: Game Recording and Statistics

**Objective:** Record a game and check statistics

1. **Get Token (WRITER role)**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"WRITER"}' | jq -r '.data.token')
```

2. **Record a Won Game**
```bash
curl -X POST http://localhost:3001/api/game-history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "amazing",
    "guesses": ["hello", "world", "amazing"],
    "won": true,
    "difficulty": 2,
    "duration": 45
  }' | jq .
```

3. **Record a Lost Game**
```bash
curl -X POST http://localhost:3001/api/game-history \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "banana",
    "guesses": ["apple", "grape", "lemon", "peach", "melon", "beach"],
    "won": false,
    "difficulty": 1,
    "duration": 120
  }' | jq .
```

4. **View Game History**
```bash
curl "http://localhost:3001/api/game-history?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

5. **Check Statistics**
```bash
curl "http://localhost:3001/api/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Scenario 3: Authorization and Permissions

**Objective:** Test different roles and permissions

1. **VISITOR Role (READ only)**
```bash
# Get token with VISITOR role
VISITOR_TOKEN=$(curl -s -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"VISITOR"}' | jq -r '.data.token')

# Can read words
curl "http://localhost:3001/api/words?limit=5&offset=0" \
  -H "Authorization: Bearer $VISITOR_TOKEN" | jq '.data | length'

# Cannot create words (should get 403 Forbidden)
curl -X POST http://localhost:3001/api/words \
  -H "Authorization: Bearer $VISITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"word":"test","language":"english","difficulty":1}' | jq '.error'
```

2. **ADMIN Role (Full access)**
```bash
# Get ADMIN token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}' | jq -r '.data.token')

# Can delete words
curl -X DELETE http://localhost:3001/api/words/{word-id} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Scenario 4: Pagination

**Objective:** Test pagination with multiple records

1. **Create multiple words**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"WRITER"}' | jq -r '.data.token')

for i in {1..15}; do
  curl -s -X POST http://localhost:3001/api/words \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"word\":\"word$i\",\"language\":\"english\",\"difficulty\":$((i % 4 + 1))}" > /dev/null
  echo "Created word$i"
done
```

2. **Test pagination**
```bash
# First page (10 items)
curl "http://localhost:3001/api/words?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN" | jq '.pagination'

# Second page (next 10 items, but we only have ~15)
curl "http://localhost:3001/api/words?limit=10&offset=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.pagination'
```

### Scenario 5: Error Handling

**Objective:** Test error responses

1. **Missing Authorization Header**
```bash
curl http://localhost:3001/api/words | jq .
# Expected: 401 Unauthorized
```

2. **Invalid Token**
```bash
curl http://localhost:3001/api/words \
  -H "Authorization: Bearer invalid-token" | jq .
# Expected: 401 Invalid or expired token
```

3. **Duplicate Word**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"WRITER"}' | jq -r '.data.token')

# Create a word
curl -s -X POST http://localhost:3001/api/words \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"word":"unique","language":"english","difficulty":1}' > /dev/null

# Try to create the same word again
curl -X POST http://localhost:3001/api/words \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"word":"unique","language":"english","difficulty":1}' | jq .
# Expected: 409 Conflict
```

4. **Not Found**
```bash
curl http://localhost:3001/api/words/non-existent-id \
  -H "Authorization: Bearer $TOKEN" | jq .
# Expected: 404 Not Found
```

## Frontend Testing

### Test Game Recording

1. Navigate to `http://localhost:5173`
2. Play a game (win or lose)
3. Check browser console for API calls
4. Game should be saved locally AND synced to backend
5. Go to Statistics page - data should load from both sources

### Test Statistics Page

1. Play several games
2. Go to Statistics page
3. Check that stats are displayed:
   - Total games
   - Win/Loss ratio
   - Guess distribution

### Monitor API Calls

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Play a game
4. Watch the network requests:
   - POST to `/api/token` (if token expired)
   - POST to `/api/game-history` (when game ends)
5. Filter by XHR/Fetch to see only API calls

## Performance Testing

### Load Testing (Optional)

Create many records:
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/token \
  -H "Content-Type: application/json" \
  -d '{"role":"WRITER"}' | jq -r '.data.token')

# Create 100 game records
for i in {1..100}; do
  curl -s -X POST http://localhost:3001/api/game-history \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"word\":\"test\",\"guesses\":[\"guess1\"],\"won\":$((i % 2)),\"difficulty\":$((i % 4 + 1)),\"duration\":60}" > /dev/null
  echo "Created record $i"
done

# Check response time for paginated requests
time curl "http://localhost:3001/api/game-history?limit=50&offset=0" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
```

## Swagger UI Testing

The easiest way to test:

1. Go to `http://localhost:3001/api-docs`
2. Click "Try it out" on any endpoint
3. Fill in parameters
4. Click "Execute"
5. See response in real-time

**Features:**
- No need to manually construct requests
- Automatically includes auth header
- See request/response in JSON
- Test all endpoints interactively

## Debugging

### Check Backend Logs

Terminal where backend is running will show:
```
Server running on http://localhost:3001
API Documentation: http://localhost:3001/api-docs
Connected to SQLite database

# When requests come in:
GET /api/words 401
POST /api/token 200
POST /api/words 201
```

### Check Frontend Logs

Browser console (F12):
```javascript
// Token requests
console.log(tokenService.getToken())  // Current token

// API responses
// Check the Network tab for requests/responses
```

### Check Database

View SQLite database:
```bash
# Windows - using sqlite3 if installed
sqlite3 backend/data/game.db ".tables"
sqlite3 backend/data/game.db "SELECT COUNT(*) FROM words;"
sqlite3 backend/data/game.db "SELECT COUNT(*) FROM game_history;"
```

## Common Issues

### Issue: "CORS error"
**Solution:** Make sure:
- Backend is running on port 3001
- Frontend .env has `VITE_API_BASE_URL=http://localhost:3001/api`
- Backend has CORS enabled (it does by default)

### Issue: "Token expired immediately"
**Expected behavior** - tokens expire in 1 minute (as per requirements)
**Solution:** Request a new token - `tokenService` handles this automatically

### Issue: "Cannot connect to API"
**Solution:**
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check firewall settings
3. Ensure ports 3001 and 5173 are not in use

### Issue: "Database file not found"
**Solution:**
```bash
cd backend
mkdir data
npm run dev  # or npm run build && node dist/app.js
```

## Next Steps

After testing:
1. ✅ Verify all CRUD operations work
2. ✅ Check pagination
3. ✅ Test authorization
4. ✅ Verify frontend integration
5. 📝 Document any issues found
6. 🚀 Ready for deployment!
