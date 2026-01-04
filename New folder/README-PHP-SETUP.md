# PHP API Setup Guide

This application now includes PHP API endpoints as an alternative to Netlify Functions.

## PHP Requirements

- PHP 7.4 or higher
- PDO PostgreSQL extension (`pdo_pgsql`)
- Apache/Nginx web server with PHP support

## Installation

### 1. Enable PostgreSQL Extension

**On Ubuntu/Debian:**
```bash
sudo apt-get install php-pgsql
```

**On CentOS/RHEL:**
```bash
sudo yum install php-pgsql
```

**On Windows (XAMPP/WAMP):**
- Edit `php.ini`
- Uncomment: `extension=pdo_pgsql`
- Restart Apache

### 2. Configure Database Connection

Set environment variable `DATABASE_URL` or `NETLIFY_DATABASE_URL`:

**Apache (.htaccess or httpd.conf):**
```apache
SetEnv DATABASE_URL "postgresql://user:password@host:port/database"
```

**Nginx (php-fpm):**
```nginx
fastcgi_param DATABASE_URL "postgresql://user:password@host:port/database";
```

**Or in PHP directly (api/config.php):**
```php
putenv('DATABASE_URL=postgresql://user:password@host:port/database');
```

### 3. File Structure

```
your-project/
├── api/
│   ├── registrations.php
│   ├── settings.php
│   └── users.php
├── index.html
└── .htaccess
```

### 4. Update index.html

The application automatically detects PHP API availability. To force PHP API usage:

```javascript
const USE_PHP_API = true; // In index.html
```

## API Endpoints

### `/api/registrations.php`
- **GET**: Fetch all registrations
- **POST**: Create new registration
- **PUT**: Update registration
- **DELETE**: Delete registration(s)

### `/api/settings.php`
- **GET**: Fetch settings
- **POST/PUT**: Update settings

### `/api/users.php`
- **GET**: Fetch users (or specific user with `?username=...`)
- **POST**: Create new user
- **PUT**: Update user
- **DELETE**: Delete user

## Testing

Test the API endpoints:

```bash
# Get registrations
curl http://localhost/api/registrations.php

# Create registration
curl -X POST http://localhost/api/registrations.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","company":"Test Co","phone":"123","group":"A"}'
```

## Deployment

### Traditional Hosting (cPanel, etc.)
1. Upload all files to your web root
2. Set `DATABASE_URL` environment variable
3. Ensure PHP PostgreSQL extension is enabled
4. Test API endpoints

### Docker
```dockerfile
FROM php:7.4-apache
RUN docker-php-ext-install pdo pdo_pgsql
COPY . /var/www/html/
ENV DATABASE_URL="postgresql://user:pass@host/db"
```

## Switching Between PHP and Netlify Functions

In `index.html`, change:
```javascript
const USE_PHP_API = true;  // Use PHP API
const USE_PHP_API = false; // Use Netlify Functions
```

## Troubleshooting

**Error: "Database connection failed"**
- Check `DATABASE_URL` is set correctly
- Verify PostgreSQL extension is installed: `php -m | grep pdo_pgsql`
- Test connection: `php -r "new PDO('pgsql:host=...', 'user', 'pass');"`

**Error: "Class 'PDO' not found"**
- Install PHP PDO extension
- Restart web server

**CORS errors:**
- Ensure `.htaccess` is loaded
- Check Apache `mod_headers` is enabled
- For Nginx, add CORS headers in server config

