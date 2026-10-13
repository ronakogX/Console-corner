PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  uid TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0 CHECK(points >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS redeem_codes (
  code TEXT PRIMARY KEY,
  points INTEGER NOT NULL CHECK(points > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','redeemed','disabled')),
  qualifying_reason TEXT NOT NULL DEFAULT 'staff-issued',
  customer_uid TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  redeemed_by TEXT,
  redeemed_at TEXT,
  FOREIGN KEY(customer_uid) REFERENCES customers(uid)
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(uid) REFERENCES customers(uid)
);

CREATE TABLE IF NOT EXISTS qualifying_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL,
  purchase_type TEXT NOT NULL CHECK(purchase_type IN ('gamepass','hourly')),
  purchase_reference TEXT NOT NULL UNIQUE,
  pass_name TEXT,
  hours INTEGER NOT NULL CHECK(hours > 0),
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
  code_issued INTEGER NOT NULL DEFAULT 0 CHECK(code_issued IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(uid) REFERENCES customers(uid)
);

CREATE INDEX IF NOT EXISTS idx_transactions_uid ON point_transactions(uid, created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_uid ON qualifying_purchases(uid, purchase_type, completed, code_issued);
