import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  database: "taskflow",
  password: "postgres01",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxLifetimeSeconds: 60,
});

setInterval(() => {
  console.log("PostgreSQL Pool Stats:", {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    active: pool.totalCount - pool.idleCount,
  });
}, 1000000);

pool.on("connect", () => {
  console.log(" New client connected");
});

pool.on("acquire", () => {
  console.log("Client acquired from pool");
});

pool.on("remove", () => {
  console.log("Client removed from pool");
});

pool.on("error", (err) => {
  console.error("Pool error", err);
});

export default pool;
