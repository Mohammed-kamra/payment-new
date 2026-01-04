# Neon Database Setup Guide

This application is now connected to a Neon PostgreSQL database via Netlify Functions.

## Setup Instructions

### 1. Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy your database connection string

### 2. Set Environment Variable

In your Netlify dashboard:
1. Go to Site settings > Environment variables
2. Add a new variable:
   - **Key**: `NETLIFY_DATABASE_URL`
   - **Value**: Your Neon database connection string (e.g., `postgresql://user:password@host/database`)

### 3. Run Database Schema

Execute the SQL in `database-schema.sql` in your Neon SQL editor to create the required tables:
- `registrations` - Stores all registration entries
- `settings` - Stores application settings
- `users` - Stores user accounts

### 4. Install Dependencies

```bash
npm install
```

This will install `@netlify/neon` package.

### 5. Deploy to Netlify

1. Push your code to GitHub/GitLab
2. Connect your repository to Netlify
3. Netlify will automatically:
   - Build your site
   - Deploy the functions
   - Use the environment variable for database connection

## API Endpoints

The following Netlify Functions are available:

### `/netlify/functions/registrations`
- **GET**: Fetch all registrations
- **POST**: Create new registration
- **PUT**: Update registration
- **DELETE**: Delete registration(s)

### `/netlify/functions/settings`
- **GET**: Fetch settings
- **POST/PUT**: Update settings

### `/netlify/functions/users`
- **GET**: Fetch users (or specific user with `?username=...`)
- **POST**: Create new user
- **PUT**: Update user
- **DELETE**: Delete user

## Fallback Behavior

The application includes automatic fallback to localStorage if the API calls fail. This ensures the app continues to work even if the database is temporarily unavailable.

## Testing Locally

To test locally with Netlify Dev:

```bash
npm install -g netlify-cli
netlify dev
```

Make sure to set `NETLIFY_DATABASE_URL` in your local environment or `.env` file.

