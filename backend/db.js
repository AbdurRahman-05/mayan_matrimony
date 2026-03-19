import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Connect to the Local/VPS PostgreSQL database specified in .env
const sql = postgres(process.env.DATABASE_URL);

export default sql;
