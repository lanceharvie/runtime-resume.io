import { getDb } from "@/lib/db"

export async function logDeliveryAccessEvent({
  session_id,
  event_type,
  access_mode,
  ip_address = "",
  user_agent = ""
}) {
  const database = getDb()
  const now = new Date().toISOString()

  database
    .prepare(`
      INSERT INTO delivery_access_events (
        session_id,
        event_type,
        access_mode,
        ip_address,
        user_agent,
        created_at
      ) VALUES (
        @session_id,
        @event_type,
        @access_mode,
        @ip_address,
        @user_agent,
        @created_at
      )
    `)
    .run({
      session_id,
      event_type,
      access_mode,
      ip_address,
      user_agent,
      created_at: now
    })
}

export async function listRecentDeliveryAccessEvents(limit = 100) {
  const database = getDb()
  return database
    .prepare(`
      SELECT *
      FROM delivery_access_events
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?
    `)
    .all(limit)
}

export async function listDeliveryAccessEventsForSession(sessionId, limit = 50) {
  const database = getDb()
  return database
    .prepare(`
      SELECT *
      FROM delivery_access_events
      WHERE session_id = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?
    `)
    .all(sessionId, limit)
}
