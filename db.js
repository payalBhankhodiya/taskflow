import { Pool } from "pg";

const pool = new Pool({
    host : 'localhost',
    user : 'postgres',
    database : 'taskflow',
    password : 'postgres90',
    max : 20,
    idleTimeoutMillis : 30000,
    connectionTimeoutMillis : 2000,
    maxLifetimeSeconds : 60
});


export default pool;