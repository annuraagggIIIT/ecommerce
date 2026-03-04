import 'dotenv/config';
import pg from 'pg';

const DATABASE_URL = "postgresql://ecommerce_db_54vm_user:Fma7jtccjVRyYyGUfyhzD56Bg681s3e2@dpg-d64bpgchg0os73d36is0-a.oregon-postgres.render.com/ecommerce_db_54vm";

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function makeAdmin() {
  try {
    // Get all users
    const users = await pool.query('SELECT id, name, email, role FROM users');
    console.log('Current users:', users.rows);

    if (users.rows.length > 0) {
      // Make first user admin
      const firstUser = users.rows[0];
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['ADMIN', firstUser.id]);
      console.log(`Made ${firstUser.email} an ADMIN!`);
    } else {
      console.log('No users found. Please sign up first at https://ecommerce-frontend-cd8j.onrender.com/signup');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

makeAdmin();
