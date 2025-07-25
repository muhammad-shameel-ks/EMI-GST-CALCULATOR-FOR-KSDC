import sql from "mssql";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const baseConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER!,
  port: Number(process.env.DB_PORT),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: process.env.NODE_ENV === "production", // Use this if you're on Azure SQL
    trustServerCertificate: true, // Change to true for local dev / self-signed certs
  },
};

let pool: sql.ConnectionPool | null = null;
let currentDB: string | undefined = process.env.DB_DATABASE;

export const connectDB = async (dbName?: string) => {
  console.log(
    `Attempting to connect to database. Requested dbName: ${
      dbName || "default (from environment variable)"
    }`
  );
  if (pool && !dbName) {
    console.log(
      `Already connected to a database and no new dbName provided. Keeping existing connection.`
    );
    return; // Already connected, and no new DB name provided
  }

  if (pool) {
    await pool.close();
    pool = null;
  }

  currentDB = dbName || process.env.DB_DATABASE;

  const sqlConfig: sql.config = {
    ...baseConfig,
    database: currentDB,
  };
  console.log(`SQL Connection Config Database: ${sqlConfig.database}`);

  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log(`✅ Database connection to ${currentDB} successful!`);
  } catch (err) {
    console.error(`❌ Database Connection to ${currentDB} Failed:`, err);
    pool = null; // Reset pool on connection failure
    throw err; // Re-throw error to be handled by caller
  }
};

export const getPool = (): sql.ConnectionPool => {
  if (!pool) {
    throw new Error(
      "Database not connected. Call connectDB() during server initialization."
    );
  }
  return pool;
};
