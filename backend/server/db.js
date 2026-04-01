const { Pool } = require("pg");

const host = process.env.PSQL_HOST || "localhost";
const port = Number(process.env.PSQL_PORT || 5432);
const database = process.env.PSQL_DBNAME || "postgres";
const user = process.env.PSQL_USER || "postgres";
const password = process.env.PSQL_PASSWORD || "";

const isLocalHost =
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "::1";

const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
  // Local Postgres usually does not use SSL.
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
});

module.exports = pool;
