# Backend Setup Guide

This application supports multiple backend options:

1. **Node.js/Express Server** (Recommended for development)
2. **PHP API** (For traditional hosting)
3. **Netlify Functions** (For Netlify deployment)

## Quick Start - Node.js/Express Server

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variable

Create a `.env` file or set environment variable:

```bash
# Windows (PowerShell)
$env:DATABASE_URL="postgresql://user:password@host:port/database"

# Linux/Mac
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### 3. Start Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 4. Update Frontend Configuration

In `index.html`, set:

```javascript
const USE_PHP_API = false; // Use Node.js server
const API_BASE = 'http://localhost:3000/api'; // Or your server URL
```

## API Endpoints

All endpoints support CORS and JSON responses.

### Registrations

- `GET /api/registrations` - Get all registrations
- `POST /api/registrations` - Create new registration
- `PUT /api/registrations/:id` - Update registration
- `DELETE /api/registrations` - Delete registrations (body: `{ ids: [1,2,3] }`)

### Settings

- `GET /api/settings` - Get settings
- `POST /api/settings` - Save settings
- `PUT /api/settings` - Update settings

### Users

- `GET /api/users` - Get all users
- `GET /api/users?username=admin` - Get specific user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Setup

1. Create a PostgreSQL database (Neon, Supabase, or self-hosted)
2. Run the SQL schema:

```bash
psql -d your_database -f database-schema.sql
```

Or import `database-schema.sql` through your database admin panel.

## Deployment Options

### Option 1: Node.js Server (Heroku, Railway, Render, etc.)

1. Set `DATABASE_URL` environment variable
2. Deploy `server.js`
3. Update `API_BASE` in `index.html` to your server URL

### Option 2: PHP API (cPanel, Shared Hosting)

1. Upload files to web root
2. Set `DATABASE_URL` in `.htaccess` or PHP config
3. Ensure PHP PostgreSQL extension is enabled
4. Set `USE_PHP_API = true` in `index.html`

### Option 3: Netlify Functions

1. Deploy to Netlify
2. Set `NETLIFY_DATABASE_URL` in Netlify environment variables
3. Set `USE_PHP_API = false` in `index.html`
4. Functions will be available at `/.netlify/functions/`

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NETLIFY_DATABASE_URL` - Alternative name for Netlify
- `PORT` - Server port (default: 3000)

## Testing the API

```bash
# Get registrations
curl http://localhost:3000/api/registrations

# Create registration
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","company":"Test Co","phone":"123","group":"A"}'

# Get settings
curl http://localhost:3000/api/settings

# Save settings
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"A":{"visible":true,"date":"2025-01-01"}}'
```

## Troubleshooting

**Port already in use:**
```bash
# Change port
PORT=3001 npm start
```

**Database connection error:**
- Verify `DATABASE_URL` is set correctly
- Check database is accessible
- Ensure PostgreSQL extension is installed

**CORS errors:**
- Server includes CORS middleware
- Check browser console for specific errors
- Verify API base URL matches server URL

## Production Checklist

- [ ] Set `DATABASE_URL` environment variable
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure rate limiting (if needed)
- [ ] Set up error logging
- [ ] Update CORS origins for production domain
- [ ] Test all API endpoints
- [ ] Verify database schema is up to date

