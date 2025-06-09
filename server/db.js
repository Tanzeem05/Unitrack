// server/db.js
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  // host: process.env.PGHOST,
  // user: process.env.PGUSER,
  // password: process.env.PGPASSWORD,
  // database: process.env.PGDATABASE,
  // port: process.env.PGPORT,
  connectionString: "postgresql://postgres:Unitrack_05@db.vcydrjueccpbyyqnndmy.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

console.log("Connecting to DB at:", process.env.PGHOST);

export default pool;
