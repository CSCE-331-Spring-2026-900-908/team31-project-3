import http from 'node:http'
import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const API_PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 3001)

function resolveSslConfig() {
  const sslMode = (process.env.PSQL_SSL_MODE ?? '').toLowerCase()

  if (sslMode === 'disable') {
    return false
  }

  if (sslMode === 'strict') {
    return { rejectUnauthorized: true }
  }

  if (sslMode === 'allow' || sslMode === 'require') {
    return { rejectUnauthorized: false }
  }

  if (process.env.PSQL_SSL === 'true') {
    return { rejectUnauthorized: false }
  }

  // Default to TLS for hosted databases that disallow plaintext connections.
  return { rejectUnauthorized: false }
}

const pool = new Pool({
  host: process.env.PSQL_HOST,
  user: process.env.PSQL_USER,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: Number(process.env.PSQL_PORT ?? 5432),
  ssl: resolveSslConfig(),
})

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(payload))
}

async function getUserTableName() {
  const result = await pool.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY CASE table_name
        WHEN 'users' THEN 1
        WHEN 'user' THEN 2
        ELSE 3
      END
      LIMIT 1
    `,
    [['users', 'user']],
  )

  if (result.rowCount === 0) {
    return null
  }

  return result.rows[0].table_name
}

function getSafeTableIdentifier(tableName) {
  if (tableName === 'users') {
    return 'public.users'
  }

  if (tableName === 'user') {
    return 'public."user"'
  }

  return null
}

async function handleHealthCheck(res) {
  try {
    await pool.query('SELECT 1')
    writeJson(res, 200, { ok: true, message: 'Database connected' })
  } catch (error) {
    writeJson(res, 500, {
      ok: false,
      message: 'Database connection failed',
      error: error.message,
    })
  }
}

async function handleUserEndpoint(req, res, requestUrl) {
  if (req.method !== 'GET') {
    writeJson(res, 405, { message: 'Method not allowed' })
    return
  }

  try {
    const tableName = await getUserTableName()

    if (!tableName) {
      writeJson(res, 404, {
        message: "No 'users' or 'user' table found in the public schema",
      })
      return
    }

    const safeTableIdentifier = getSafeTableIdentifier(tableName)
    const userId = requestUrl.searchParams.get('id')

    if (userId) {
      const singleUserResult = await pool.query(
        `SELECT * FROM ${safeTableIdentifier} WHERE id = $1 LIMIT 1`,
        [userId],
      )

      if (singleUserResult.rowCount === 0) {
        writeJson(res, 404, { message: 'User not found' })
        return
      }

      writeJson(res, 200, { data: singleUserResult.rows[0] })
      return
    }

    const requestedLimit = Number(requestUrl.searchParams.get('limit') ?? 50)
    const safeLimit = Number.isNaN(requestedLimit)
      ? 50
      : Math.min(Math.max(requestedLimit, 1), 200)

    const usersResult = await pool.query(
      `SELECT * FROM ${safeTableIdentifier} LIMIT $1`,
      [safeLimit],
    )

    writeJson(res, 200, {
      count: usersResult.rowCount,
      data: usersResult.rows,
    })
  } catch (error) {
    writeJson(res, 500, {
      message: 'Failed to fetch user data',
      error: error.message,
    })
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    writeJson(res, 204, {})
    return
  }

  if (requestUrl.pathname === '/health') {
    await handleHealthCheck(res)
    return
  }

  if (requestUrl.pathname === '/user') {
    await handleUserEndpoint(req, res, requestUrl)
    return
  }

  writeJson(res, 404, { message: 'Not found' })
})

server.listen(API_PORT, () => {
  // Keep startup logging simple so students can quickly verify API status.
  console.log(`API server listening on http://localhost:${API_PORT}`)
})

process.on('SIGINT', async () => {
  await pool.end()
  server.close(() => process.exit(0))
})
