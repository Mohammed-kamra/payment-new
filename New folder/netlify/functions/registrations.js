import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL);

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
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
        // Get all registrations
        const registrations = await sql`
          SELECT * FROM registrations 
          ORDER BY id DESC
        `;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(registrations || []),
        };

      case 'POST':
        // Create new registration
        const newRegistration = JSON.parse(body);
        const { name, company, phone, group, day, date, time, paid } = newRegistration;
        
        const [result] = await sql`
          INSERT INTO registrations (name, company, phone, group_name, day, date, time, paid, created_at)
          VALUES (${name}, ${company}, ${phone}, ${group}, ${day}, ${date}, ${time}, ${paid || false}, NOW())
          RETURNING *
        `;
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result || {}),
        };

      case 'PUT':
        // Update registration
        const updateData = JSON.parse(body);
        const { id, name, company, phone, group, day, date, time, paid, review, revised } = updateData;
        
        const [updated] = await sql`
          UPDATE registrations 
          SET 
            name = ${name ?? null},
            company = ${company ?? null},
            phone = ${phone ?? null},
            group_name = ${group ?? null},
            day = ${day ?? null},
            date = ${date ?? null},
            time = ${time ?? null},
            paid = ${paid ?? false},
            review = ${review ?? null},
            revised = ${revised ?? false}
          WHERE id = ${id}
          RETURNING *
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updated || {}),
        };

      case 'DELETE':
        // Delete registration(s)
        const deleteData = JSON.parse(body);
        const { ids } = deleteData;
        
        if (Array.isArray(ids) && ids.length > 0) {
          await sql`
            DELETE FROM registrations 
            WHERE id = ANY(${sql.array(ids)})
          `;
        } else if (typeof ids === 'number' || typeof ids === 'string') {
          await sql`
            DELETE FROM registrations 
            WHERE id = ${parseInt(ids)}
          `;
        } else {
          // Delete all
          await sql`DELETE FROM registrations`;
        }
        
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

