// server/db.js
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }
});

console.log("Connecting to DB at:", process.env.PGHOST);
console.log("ENV:", {
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT
});

export default pool;
