// A tiny JSON-file database server. No dependencies, just Node.
//
//   node server/index.js [path/to/db.json]      (PORT env var, default 3001)
//
// Collections
//   GET    /collections               list collections and their record counts
//   POST   /collections  {"name"}     create an empty collection
//   DELETE /collections/:name         drop a collection and all its records
//
// Records (any collection; POST to a new name creates it)
//   GET    /:collection               list (filters below)
//   GET    /:collection/:id           one record
//   POST   /:collection               add a record (id assigned if missing)
//   PUT    /:collection/:id           replace the whole record
//   PATCH  /:collection/:id           merge fields into the record
//   DELETE /:collection/:id           remove the record
//
// List filters (same names as json-server)
//   ?field=value   exact match, repeat for OR       ?q=text   search all fields
//   ?_sort=field&_order=asc|desc                    ?_page=1&_limit=10

import { createServer } from 'node:http'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DB_PATH = resolve(process.argv[2] ?? 'db.json')
const PORT = Number(process.env.PORT ?? 3001)
const NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/
const RESERVED = new Set(['collections'])

/* ---------- storage ---------- */

function load() {
  if (!existsSync(DB_PATH)) return {}
  const data = JSON.parse(readFileSync(DB_PATH, 'utf8'))
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${DB_PATH} must contain a JSON object of collections`)
  }
  return data
}

let db = load()

// Write to a temp file, then rename over db.json, so a crash never leaves half a file.
function save() {
  const tmp = DB_PATH + '.tmp'
  writeFileSync(tmp, JSON.stringify(db, null, 2) + '\n')
  renameSync(tmp, DB_PATH)
}

/* ---------- http helpers ---------- */

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(status === 204 ? undefined : JSON.stringify(body))
}

async function readBody(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 1_000_000) throw new HttpError(413, 'Body too large (max 1 MB)')
  }
  if (!raw) throw new HttpError(400, 'Request body is required')
  let body
  try {
    body = JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'Body is not valid JSON')
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Body must be a JSON object')
  }
  return body
}

/* ---------- collections ---------- */

function collection(name, { create = false } = {}) {
  if (!NAME.test(name) || RESERVED.has(name)) throw new HttpError(400, `Invalid collection name "${name}"`)
  if (!Array.isArray(db[name])) {
    if (!create) throw new HttpError(404, `Collection "${name}" does not exist`)
    db[name] = []
  }
  return db[name]
}

// ids in the URL are strings; records may use numbers (1) or strings ("PR-10428").
const sameId = (record, id) => String(record.id) === id

function findIndex(items, id) {
  const index = items.findIndex((r) => sameId(r, id))
  if (index === -1) throw new HttpError(404, `No record with id "${id}"`)
  return index
}

function nextId(items) {
  const numeric = items.map((r) => r.id).filter((id) => Number.isInteger(id))
  return numeric.length ? Math.max(...numeric) + 1 : 1
}

function compare(a, b) {
  if (a === b) return 0
  if (a === undefined || a === null) return 1
  if (b === undefined || b === null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

function list(items, params) {
  let result = items

  for (const key of new Set(params.keys())) {
    if (key.startsWith('_') || key === 'q') continue
    const allowed = params.getAll(key)
    result = result.filter((r) => allowed.includes(String(r[key])))
  }

  const q = params.get('q')?.toLowerCase()
  if (q) result = result.filter((r) => JSON.stringify(Object.values(r)).toLowerCase().includes(q))

  const sort = params.get('_sort')
  if (sort) {
    const dir = params.get('_order') === 'desc' ? -1 : 1
    result = [...result].sort((a, b) => dir * compare(a[sort], b[sort]))
  }

  const limit = Number(params.get('_limit'))
  if (limit > 0) {
    const page = Math.max(1, Number(params.get('_page')) || 1)
    result = result.slice((page - 1) * limit, page * limit)
  }

  return result
}

/* ---------- routes ---------- */

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const [name, id, extra] = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const method = req.method

  if (method === 'OPTIONS') return send(res, 204)
  if (!name) return send(res, 200, { collections: Object.keys(db).filter((k) => Array.isArray(db[k])) })
  if (extra !== undefined) throw new HttpError(404, 'Route not found')

  // /collections
  if (name === 'collections') {
    if (method === 'GET' && !id) {
      const out = {}
      for (const [k, v] of Object.entries(db)) if (Array.isArray(v)) out[k] = v.length
      return send(res, 200, out)
    }
    if (method === 'POST' && !id) {
      const body = await readBody(req)
      const newName = String(body.name ?? '')
      if (Array.isArray(db[newName])) throw new HttpError(409, `Collection "${newName}" already exists`)
      collection(newName, { create: true })
      save()
      return send(res, 201, { name: newName, count: 0 })
    }
    if (method === 'DELETE' && id) {
      collection(id)
      delete db[id]
      save()
      return send(res, 200, {})
    }
    throw new HttpError(405, `${method} is not allowed here`)
  }

  // /:collection
  if (!id) {
    if (method === 'GET') return send(res, 200, list(collection(name), url.searchParams))
    if (method === 'POST') {
      const body = await readBody(req)
      const items = collection(name, { create: true })
      if (body.id !== undefined && items.some((r) => sameId(r, String(body.id)))) {
        throw new HttpError(409, `A record with id "${body.id}" already exists`)
      }
      const record = { id: body.id ?? nextId(items), ...body }
      items.push(record)
      save()
      return send(res, 201, record)
    }
    throw new HttpError(405, `${method} is not allowed on a collection`)
  }

  // /:collection/:id
  const items = collection(name)
  const index = findIndex(items, id)
  const current = items[index]

  switch (method) {
    case 'GET':
      return send(res, 200, current)
    case 'PUT': {
      const { id: _ignored, ...fields } = await readBody(req) // the id in the URL wins
      items[index] = { id: current.id, ...fields }
      save()
      return send(res, 200, items[index])
    }
    case 'PATCH': {
      const body = await readBody(req)
      items[index] = { ...current, ...body, id: current.id }
      save()
      return send(res, 200, items[index])
    }
    case 'DELETE':
      items.splice(index, 1)
      save()
      return send(res, 200, {})
    default:
      throw new HttpError(405, `${method} is not allowed on a record`)
  }
}

createServer(async (req, res) => {
  try {
    await handle(req, res)
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500
    if (status === 500) console.error(err)
    send(res, status, { error: err.message })
  } finally {
    console.log(`${req.method} ${req.url} → ${res.statusCode}`)
  }
}).listen(PORT, () => {
  console.log(`JSON database: ${DB_PATH}`)
  console.log(`Listening on http://localhost:${PORT}`)
  console.log(`Collections: ${Object.keys(db).join(', ') || '(none yet)'}`)
})
