import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL);

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, body, queryStringParameters } = event;

    switch (httpMethod) {
      case 'GET':
        // Get user by username for login
        if (queryStringParameters?.username) {
          const username = queryStringParameters.username;
          const [user] = await sql`
            SELECT id, username, role, created_at FROM users 
            WHERE username = ${username}
          `;
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(user || null),
          };
        }
        
        // Get all users
        const users = await sql`
          SELECT id, username, role, created_at 
          FROM users
          ORDER BY id DESC
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(users),
        };

      case 'POST':
        // Create new user
        const newUser = JSON.parse(body);
        const { username, password, role } = newUser;
        
        const [user] = await sql`
          INSERT INTO users (username, password, role, created_at)
          VALUES (${username}, ${password}, ${role || 'user'}, NOW())
          RETURNING id, username, role, created_at
        `;
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(user),
        };

      case 'PUT':
        // Update user
        const updateData = JSON.parse(body);
        const { id, username, password, role } = updateData;
        
        const [updated] = await sql`
          UPDATE users 
          SET 
            username = ${username ?? null},
            password = ${password ?? null},
            role = ${role ?? 'user'}
          WHERE id = ${id}
          RETURNING id, username, role, created_at
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updated || {}),
        };

      case 'DELETE':
        // Delete user
        const { userId } = JSON.parse(body);
        
        await sql`
          DELETE FROM users 
          WHERE id = ${userId}
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true }),
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

