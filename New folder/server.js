const express = require('express');
const path = require('path');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database connection
const sql = neon(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL);

// Helper function to handle database errors
function handleError(res, error, message = 'Database error') {
    console.error(message, error);
    res.status(500).json({ error: `${message}: ${error.message}` });
}

// Ensure default admin user exists
async function ensureDefaultAdmin() {
    try {
        const result = await sql`SELECT id FROM users WHERE username = 'admin'`;
        if (result.length === 0) {
            await sql`
                INSERT INTO users (username, password, role, created_at)
                VALUES ('admin', '777', 'admin', NOW())
            `;
            console.log('✅ Default admin user created (username: admin, password: 777)');
        } else {
            console.log('✅ Default admin user already exists');
        }
    } catch (error) {
        console.error('⚠️  Could not ensure default admin user:', error.message);
    }
}

// API Routes

// Registrations API
app.get('/api/registrations', async (req, res) => {
    try {
        const result = await sql`SELECT * FROM registrations ORDER BY id DESC`;
        res.json(result);
    } catch (error) {
        handleError(res, error, 'Failed to fetch registrations');
    }
});

app.post('/api/registrations', async (req, res) => {
    try {
        const { name, company, phone, group, date, time, paid, revised } = req.body;
        const result = await sql`
            INSERT INTO registrations (name, company, phone, "group", date, time, paid, revised, created_at)
            VALUES (${name}, ${company}, ${phone}, ${group}, ${date || null}, ${time || null}, ${paid || false}, ${revised || false}, NOW())
            RETURNING *
        `;
        res.status(201).json(result[0]);
    } catch (error) {
        handleError(res, error, 'Failed to create registration');
    }
});

app.put('/api/registrations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Build dynamic update query
        const fields = [];
        const values = [];
        let paramIndex = 1;
        
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && updates[key] !== undefined) {
                fields.push(`"${key}" = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        });
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(id);
        const query = `
            UPDATE registrations 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await sql.unsafe(query, values);
        res.json(result[0] || {});
    } catch (error) {
        handleError(res, error, 'Failed to update registration');
    }
});

app.delete('/api/registrations', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'IDs array required' });
        }
        
        const result = await sql`
            DELETE FROM registrations 
            WHERE id = ANY(${sql.array(ids)})
            RETURNING id
        `;
        res.json({ deleted: result.length, ids: result.map(r => r.id) });
    } catch (error) {
        handleError(res, error, 'Failed to delete registrations');
    }
});

// Settings API
app.get('/api/settings', async (req, res) => {
    try {
        const result = await sql`SELECT * FROM settings WHERE id = 1`;
        if (result.length === 0) {
            return res.json({});
        }
        
        const settings = result[0];
        // If data is stored as JSONB, return it directly
        if (settings.data) {
            res.json(typeof settings.data === 'string' ? JSON.parse(settings.data) : settings.data);
        } else {
            res.json(settings);
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch settings');
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const data = req.body;
        const result = await sql`
            INSERT INTO settings (id, data, updated_at)
            VALUES (1, ${JSON.stringify(data)}::jsonb, NOW())
            ON CONFLICT (id) 
            DO UPDATE SET 
                data = ${JSON.stringify(data)}::jsonb,
                updated_at = NOW()
            RETURNING *
        `;
        res.json(result[0]);
    } catch (error) {
        handleError(res, error, 'Failed to save settings');
    }
});

app.put('/api/settings', async (req, res) => {
    // Same as POST
    return app.post('/api/settings', req, res);
});

// Users API
app.get('/api/users', async (req, res) => {
    try {
        const { username } = req.query;
        
        if (username) {
            const result = await sql`SELECT * FROM users WHERE username = ${username}`;
            res.json(result[0] || null);
        } else {
            const result = await sql`SELECT id, username, role, created_at FROM users ORDER BY id DESC`;
            res.json(result);
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch users');
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required' });
        }
        
        const result = await sql`
            INSERT INTO users (username, password, role, created_at)
            VALUES (${username}, ${password}, ${role}, NOW())
            RETURNING id, username, role, created_at
        `;
        res.status(201).json(result[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Username already exists' });
        }
        handleError(res, error, 'Failed to create user');
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role } = req.body;
        
        const updates = {};
        if (username !== undefined) updates.username = username;
        if (password !== undefined) updates.password = password;
        if (role !== undefined) updates.role = role;
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        const fields = Object.keys(updates).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        const query = `
            UPDATE users 
            SET ${fields}, updated_at = NOW()
            WHERE id = $${values.length}
            RETURNING id, username, role, created_at
        `;
        
        const result = await sql.unsafe(query, values);
        res.json(result[0] || {});
    } catch (error) {
        handleError(res, error, 'Failed to update user');
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
        res.json({ deleted: result.length > 0, id: result[0]?.id });
    } catch (error) {
        handleError(res, error, 'Failed to delete user');
    }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured (set DATABASE_URL)'}`);
    
    // Ensure default admin user exists on server start
    await ensureDefaultAdmin();
});

