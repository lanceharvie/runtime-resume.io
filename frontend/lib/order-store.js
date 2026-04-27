import { getDb } from "@/lib/db"

function mapOrderRow(row) {
  if (!row) return null

  return {
    ...row,
    addons: JSON.parse(row.addons_json || "[]")
  }
}

export async function upsertOrder(order) {
  const database = getDb()
  const now = new Date().toISOString()
  const existing = database
    .prepare("SELECT * FROM orders WHERE session_id = ?")
    .get(order.session_id)

  const merged = {
    ...(existing ? mapOrderRow(existing) : {}),
    ...order,
    addons: Array.isArray(order.addons)
      ? order.addons
      : existing
        ? mapOrderRow(existing).addons
        : [],
    created_at: order.created_at || existing?.created_at || now,
    updated_at: order.updated_at || now
  }

  database
    .prepare(`
      INSERT INTO orders (
        session_id,
        tier,
        tier_name,
        addons_json,
        referral_code,
        referral_discount_id,
        checkout_status,
        payment_status,
        stripe_url,
        customer_email,
        customer_name,
        amount_total,
        currency,
        stripe_customer_id,
        webhook_event_type,
        paid_at,
        confirmation_email_sent_at,
        intake_submitted_at,
        intake_reminder_sent_at,
        delivered_at,
        delivery_channel,
        delivery_notes,
        delivery_email_sent_at,
        internal_purchase_notification_sent_at,
        created_at,
        updated_at
      ) VALUES (
        @session_id,
        @tier,
        @tier_name,
        @addons_json,
        @referral_code,
        @referral_discount_id,
        @checkout_status,
        @payment_status,
        @stripe_url,
        @customer_email,
        @customer_name,
        @amount_total,
        @currency,
        @stripe_customer_id,
        @webhook_event_type,
        @paid_at,
        @confirmation_email_sent_at,
        @intake_submitted_at,
        @intake_reminder_sent_at,
        @delivered_at,
        @delivery_channel,
        @delivery_notes,
        @delivery_email_sent_at,
        @internal_purchase_notification_sent_at,
        @created_at,
        @updated_at
      )
      ON CONFLICT(session_id) DO UPDATE SET
        tier = excluded.tier,
        tier_name = excluded.tier_name,
        addons_json = excluded.addons_json,
        referral_code = excluded.referral_code,
        referral_discount_id = excluded.referral_discount_id,
        checkout_status = excluded.checkout_status,
        payment_status = excluded.payment_status,
        stripe_url = excluded.stripe_url,
        customer_email = excluded.customer_email,
        customer_name = excluded.customer_name,
        amount_total = excluded.amount_total,
        currency = excluded.currency,
        stripe_customer_id = excluded.stripe_customer_id,
        webhook_event_type = excluded.webhook_event_type,
        paid_at = excluded.paid_at,
        confirmation_email_sent_at = excluded.confirmation_email_sent_at,
        intake_submitted_at = excluded.intake_submitted_at,
        intake_reminder_sent_at = excluded.intake_reminder_sent_at,
        delivered_at = excluded.delivered_at,
        delivery_channel = excluded.delivery_channel,
        delivery_notes = excluded.delivery_notes,
        delivery_email_sent_at = excluded.delivery_email_sent_at,
        internal_purchase_notification_sent_at = excluded.internal_purchase_notification_sent_at,
        updated_at = excluded.updated_at
    `)
    .run({
      session_id: merged.session_id,
      tier: merged.tier || "",
      tier_name: merged.tier_name || "",
      addons_json: JSON.stringify(merged.addons || []),
      referral_code: merged.referral_code || "",
      referral_discount_id: merged.referral_discount_id || "",
      checkout_status: merged.checkout_status || "",
      payment_status: merged.payment_status || "",
      stripe_url: merged.stripe_url || "",
      customer_email: merged.customer_email || "",
      customer_name: merged.customer_name || "",
      amount_total: merged.amount_total ?? null,
      currency: merged.currency || "",
      stripe_customer_id: merged.stripe_customer_id || "",
      webhook_event_type: merged.webhook_event_type || "",
      paid_at: merged.paid_at || null,
      confirmation_email_sent_at: merged.confirmation_email_sent_at || null,
      intake_submitted_at: merged.intake_submitted_at || null,
      intake_reminder_sent_at: merged.intake_reminder_sent_at || null,
      delivered_at: merged.delivered_at || null,
      delivery_channel: merged.delivery_channel || "",
      delivery_notes: merged.delivery_notes || "",
      delivery_email_sent_at: merged.delivery_email_sent_at || null,
      internal_purchase_notification_sent_at: merged.internal_purchase_notification_sent_at || null,
      created_at: merged.created_at,
      updated_at: merged.updated_at
    })

  return getOrderBySessionId(merged.session_id)
}

export async function getOrderBySessionId(sessionId) {
  const database = getDb()
  const row = database
    .prepare("SELECT * FROM orders WHERE session_id = ?")
    .get(sessionId)

  return mapOrderRow(row)
}

export async function markConfirmationEmailSent(sessionId) {
  const existing = await getOrderBySessionId(sessionId)
  if (!existing) return null

  return upsertOrder({
    ...existing,
    confirmation_email_sent_at: new Date().toISOString()
  })
}

export async function listRecentOrders(limit = 50) {
  const database = getDb()
  const rows = database
    .prepare(`
      SELECT *
      FROM orders
      ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
      LIMIT ?
    `)
    .all(limit)

  return rows.map(mapOrderRow)
}

export async function logWebhookEvent({
  stripe_event_id,
  session_id = "",
  event_type,
  processing_status = "received",
  error_message = "",
  payload_json = "",
  received_at,
  processed_at = null
}) {
  const database = getDb()
  const now = received_at || new Date().toISOString()

  database
    .prepare(`
      INSERT INTO webhook_events (
        stripe_event_id,
        session_id,
        event_type,
        processing_status,
        error_message,
        payload_json,
        received_at,
        processed_at
      ) VALUES (
        @stripe_event_id,
        @session_id,
        @event_type,
        @processing_status,
        @error_message,
        @payload_json,
        @received_at,
        @processed_at
      )
      ON CONFLICT(stripe_event_id) DO UPDATE SET
        session_id = excluded.session_id,
        event_type = excluded.event_type,
        processing_status = excluded.processing_status,
        error_message = excluded.error_message,
        payload_json = excluded.payload_json,
        processed_at = excluded.processed_at
    `)
    .run({
      stripe_event_id,
      session_id,
      event_type,
      processing_status,
      error_message,
      payload_json,
      received_at: now,
      processed_at
    })
}

export async function listRecentWebhookEvents(limit = 100) {
  const database = getDb()
  return database
    .prepare(`
      SELECT *
      FROM webhook_events
      ORDER BY datetime(received_at) DESC, id DESC
      LIMIT ?
    `)
    .all(limit)
}

export async function markIntakeSubmitted(sessionId) {
  const existing = await getOrderBySessionId(sessionId)
  if (!existing) return null

  return upsertOrder({
    ...existing,
    intake_submitted_at: new Date().toISOString()
  })
}

export async function markIntakeReminderSent(sessionId) {
  const existing = await getOrderBySessionId(sessionId)
  if (!existing) return null

  return upsertOrder({
    ...existing,
    intake_reminder_sent_at: new Date().toISOString()
  })
}

export async function listOrdersNeedingIntakeReminder(hoursSincePaid = 2, limit = 50) {
  const database = getDb()
  return database
    .prepare(`
      SELECT *
      FROM orders
      WHERE payment_status = 'paid'
        AND intake_submitted_at IS NULL
        AND intake_reminder_sent_at IS NULL
        AND paid_at IS NOT NULL
        AND datetime(paid_at) <= datetime('now', ?)
      ORDER BY datetime(paid_at) ASC
      LIMIT ?
    `)
    .all(`-${hoursSincePaid} hours`, limit)
    .map(mapOrderRow)
}

export async function markOrderDelivered(sessionId, { delivery_channel = "manual", delivery_notes = "" } = {}) {
  const existing = await getOrderBySessionId(sessionId)
  if (!existing) return null

  return upsertOrder({
    ...existing,
    delivered_at: new Date().toISOString(),
    delivery_channel,
    delivery_notes
  })
}

export async function markDeliveryEmailSent(sessionId) {
  const existing = await getOrderBySessionId(sessionId)
  if (!existing) return null

  return upsertOrder({
    ...existing,
    delivery_email_sent_at: new Date().toISOString()
  })
}


export async function markInternalPurchaseNotificationSent(sessionId) {
  const existing = await getOrderBySessionId(sessionId)
  if (!existing) return null

  return upsertOrder({
    ...existing,
    internal_purchase_notification_sent_at: new Date().toISOString()
  })
}
