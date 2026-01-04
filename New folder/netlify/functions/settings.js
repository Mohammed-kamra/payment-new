import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL);

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, body } = event;

    switch (httpMethod) {
      case 'GET':
        // Get settings
        const settingsResult = await sql`
          SELECT * FROM settings 
          WHERE id = 1
        `;
        const settings = settingsResult[0] || null;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(settings || {}),
        };

      case 'POST':
      case 'PUT':
        // Update or create settings
        const settingsData = JSON.parse(body);
        
        const [result] = await sql`
          INSERT INTO settings (id, data, updated_at)
          VALUES (1, ${JSON.stringify(settingsData)}, NOW())
          ON CONFLICT (id) 
          DO UPDATE SET 
            data = ${JSON.stringify(settingsData)},
            updated_at = NOW()
          RETURNING *
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
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

