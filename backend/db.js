import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Connect to the Local/VPS PostgreSQL database specified in .env
// max: 10 keeps connection pool healthy; idle_timeout frees unused connections
const sql = postgres(process.env.DATABASE_URL, {
    max: 50,           // max simultaneous DB connections
    idle_timeout: 30,  // close idle connections after 30s
    connect_timeout: 10, // fail fast if DB unreachable
    max_lifetime: 60 * 30, // recycle connections after 30 mins
});

export default sql;
