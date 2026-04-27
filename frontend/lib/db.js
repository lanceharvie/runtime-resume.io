import Database from "better-sqlite3"
import { mkdirSync } from "node:fs"
import path from "node:path"

const DATA_DIR = path.join(process.cwd(), "data")
const DEFAULT_DB_PATH = path.join(DATA_DIR, "runtime-resume.db")

let db

function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true })
}

function applyMigrations(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      session_id TEXT PRIMARY KEY,
      tier TEXT NOT NULL,
      tier_name TEXT,
      addons_json TEXT NOT NULL DEFAULT '[]',
      referral_code TEXT,
      referral_discount_id TEXT,
      checkout_status TEXT,
      payment_status TEXT,
      stripe_url TEXT,
      customer_email TEXT,
      customer_name TEXT,
      amount_total INTEGER,
      currency TEXT,
      stripe_customer_id TEXT,
      webhook_event_type TEXT,
      paid_at TEXT,
      confirmation_email_sent_at TEXT,
      intake_submitted_at TEXT,
      intake_reminder_sent_at TEXT,
      delivered_at TEXT,
      delivery_channel TEXT,
      delivery_notes TEXT,
      delivery_email_sent_at TEXT,
      internal_purchase_notification_sent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

    CREATE TABLE IF NOT EXISTS webhook_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stripe_event_id TEXT UNIQUE,
      session_id TEXT,
      event_type TEXT NOT NULL,
      processing_status TEXT NOT NULL DEFAULT 'received',
      error_message TEXT,
      payload_json TEXT,
      received_at TEXT NOT NULL,
      processed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_events_session_id ON webhook_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);

    CREATE TABLE IF NOT EXISTS intake_submissions (
      session_id TEXT PRIMARY KEY,
      linkedin_url TEXT,
      target_roles TEXT,
      target_companies TEXT,
      key_achievements TEXT,
      years_experience TEXT,
      geographic_preference TEXT,
      target_locations TEXT,
      salary_range TEXT,
      role_types TEXT,
      job_seek_status TEXT,
      open_to_representation TEXT,
      relocation_flag TEXT,
      concerns TEXT,
      resume_filename TEXT,
      resume_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES orders(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_intake_updated_at ON intake_submissions(updated_at);

    CREATE TABLE IF NOT EXISTS audit_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      source_filename TEXT,
      source_path TEXT,
      extracted_text TEXT,
      audit_json TEXT NOT NULL,
      reviewer_notes TEXT,
      reviewer_override_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES orders(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_runs_session_id ON audit_runs(session_id);
    CREATE INDEX IF NOT EXISTS idx_audit_runs_updated_at ON audit_runs(updated_at);

    CREATE TABLE IF NOT EXISTS report_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      artifact_type TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/pdf',
      size_bytes INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(session_id, artifact_type),
      FOREIGN KEY (session_id) REFERENCES orders(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_report_artifacts_session_id ON report_artifacts(session_id);
    CREATE INDEX IF NOT EXISTS idx_report_artifacts_updated_at ON report_artifacts(updated_at);

    CREATE TABLE IF NOT EXISTS delivery_access_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      access_mode TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES orders(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_delivery_access_events_session_id ON delivery_access_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_access_events_created_at ON delivery_access_events(created_at);

    CREATE TABLE IF NOT EXISTS rewrite_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      source_audit_id INTEGER,
      source_filename TEXT,
      source_path TEXT,
      rewrite_json TEXT NOT NULL,
      generator_source TEXT,
      llm_provider TEXT,
      llm_model TEXT,
      prompt_version TEXT,
      preset_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES orders(session_id),
      FOREIGN KEY (source_audit_id) REFERENCES audit_runs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_rewrite_drafts_session_id ON rewrite_drafts(session_id);
    CREATE INDEX IF NOT EXISTS idx_rewrite_drafts_updated_at ON rewrite_drafts(updated_at);

    CREATE TABLE IF NOT EXISTS llm_rewrite_traces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rewrite_draft_id INTEGER,
      session_id TEXT NOT NULL,
      trace_status TEXT NOT NULL,
      provider TEXT,
      model TEXT,
      prompt_version TEXT,
      preset_id TEXT,
      request_json TEXT,
      response_json TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (rewrite_draft_id) REFERENCES rewrite_drafts(id),
      FOREIGN KEY (session_id) REFERENCES orders(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_llm_rewrite_traces_session_id ON llm_rewrite_traces(session_id);
    CREATE INDEX IF NOT EXISTS idx_llm_rewrite_traces_rewrite_draft_id ON llm_rewrite_traces(rewrite_draft_id);
    CREATE INDEX IF NOT EXISTS idx_llm_rewrite_traces_created_at ON llm_rewrite_traces(created_at);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );


    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      linkedin_url TEXT,
      target_role TEXT,
      geography TEXT,
      fit_question TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);
    CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
  `)

  const orderColumns = database.prepare("PRAGMA table_info(orders)").all()
  if (!orderColumns.some((column) => column.name === "intake_submitted_at")) database.exec("ALTER TABLE orders ADD COLUMN intake_submitted_at TEXT")
  if (!orderColumns.some((column) => column.name === "intake_reminder_sent_at")) database.exec("ALTER TABLE orders ADD COLUMN intake_reminder_sent_at TEXT")
  if (!orderColumns.some((column) => column.name === "delivered_at")) database.exec("ALTER TABLE orders ADD COLUMN delivered_at TEXT")
  if (!orderColumns.some((column) => column.name === "delivery_channel")) database.exec("ALTER TABLE orders ADD COLUMN delivery_channel TEXT")
  if (!orderColumns.some((column) => column.name === "delivery_notes")) database.exec("ALTER TABLE orders ADD COLUMN delivery_notes TEXT")
  if (!orderColumns.some((column) => column.name === "delivery_email_sent_at")) database.exec("ALTER TABLE orders ADD COLUMN delivery_email_sent_at TEXT")
  if (!orderColumns.some((column) => column.name === "internal_purchase_notification_sent_at")) database.exec("ALTER TABLE orders ADD COLUMN internal_purchase_notification_sent_at TEXT")
  if (!orderColumns.some((column) => column.name === "referral_code")) database.exec("ALTER TABLE orders ADD COLUMN referral_code TEXT")
  if (!orderColumns.some((column) => column.name === "referral_discount_id")) database.exec("ALTER TABLE orders ADD COLUMN referral_discount_id TEXT")

  const auditColumns = database.prepare("PRAGMA table_info(audit_runs)").all()
  if (!auditColumns.some((column) => column.name === "reviewer_notes")) database.exec("ALTER TABLE audit_runs ADD COLUMN reviewer_notes TEXT")
  if (!auditColumns.some((column) => column.name === "reviewer_override_json")) database.exec("ALTER TABLE audit_runs ADD COLUMN reviewer_override_json TEXT")

  const rewriteColumns = database.prepare("PRAGMA table_info(rewrite_drafts)").all()
  if (!rewriteColumns.some((column) => column.name === "generator_source")) database.exec("ALTER TABLE rewrite_drafts ADD COLUMN generator_source TEXT")
  if (!rewriteColumns.some((column) => column.name === "llm_provider")) database.exec("ALTER TABLE rewrite_drafts ADD COLUMN llm_provider TEXT")
  if (!rewriteColumns.some((column) => column.name === "llm_model")) database.exec("ALTER TABLE rewrite_drafts ADD COLUMN llm_model TEXT")
  if (!rewriteColumns.some((column) => column.name === "prompt_version")) database.exec("ALTER TABLE rewrite_drafts ADD COLUMN prompt_version TEXT")
  if (!rewriteColumns.some((column) => column.name === "preset_id")) database.exec("ALTER TABLE rewrite_drafts ADD COLUMN preset_id TEXT")

  const traceColumns = database.prepare("PRAGMA table_info(llm_rewrite_traces)").all()
  if (traceColumns.length && !traceColumns.some((column) => column.name === "preset_id")) database.exec("ALTER TABLE llm_rewrite_traces ADD COLUMN preset_id TEXT")

  const traceTables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'llm_rewrite_traces'").get()
  if (!traceTables) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS llm_rewrite_traces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rewrite_draft_id INTEGER,
        session_id TEXT NOT NULL,
        trace_status TEXT NOT NULL,
        provider TEXT,
        model TEXT,
        prompt_version TEXT,
        preset_id TEXT,
        request_json TEXT,
        response_json TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (rewrite_draft_id) REFERENCES rewrite_drafts(id),
        FOREIGN KEY (session_id) REFERENCES orders(session_id)
      );
      CREATE INDEX IF NOT EXISTS idx_llm_rewrite_traces_session_id ON llm_rewrite_traces(session_id);
      CREATE INDEX IF NOT EXISTS idx_llm_rewrite_traces_rewrite_draft_id ON llm_rewrite_traces(rewrite_draft_id);
      CREATE INDEX IF NOT EXISTS idx_llm_rewrite_traces_created_at ON llm_rewrite_traces(created_at);
    `)
  }

  const settingsTable = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'app_settings'").get()
  if (!settingsTable) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)
  }

  const intakeColumns = database.prepare("PRAGMA table_info(intake_submissions)").all()
  if (!intakeColumns.some((column) => column.name === "target_locations")) database.exec("ALTER TABLE intake_submissions ADD COLUMN target_locations TEXT")
  if (!intakeColumns.some((column) => column.name === "salary_range")) database.exec("ALTER TABLE intake_submissions ADD COLUMN salary_range TEXT")
  if (!intakeColumns.some((column) => column.name === "role_types")) database.exec("ALTER TABLE intake_submissions ADD COLUMN role_types TEXT")
  if (!intakeColumns.some((column) => column.name === "job_seek_status")) database.exec("ALTER TABLE intake_submissions ADD COLUMN job_seek_status TEXT")
  if (!intakeColumns.some((column) => column.name === "open_to_representation")) database.exec("ALTER TABLE intake_submissions ADD COLUMN open_to_representation TEXT")
  if (!intakeColumns.some((column) => column.name === "relocation_flag")) database.exec("ALTER TABLE intake_submissions ADD COLUMN relocation_flag TEXT")
}

export function getDb() {
  if (!db) {
    ensureDataDir()
    const dbPath = process.env.ORDERS_DB_PATH || DEFAULT_DB_PATH
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
    applyMigrations(db)
  }

  return db
}
