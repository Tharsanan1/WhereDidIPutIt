-- WhereDidIPutIt initial schema
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS containers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('file','box')),
  label TEXT NOT NULL,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, kind, label)
);
CREATE INDEX IF NOT EXISTS idx_containers_user ON containers(user_id, kind);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  tags TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_container ON items(container_id);

-- FTS5 with trigram for typo-tolerant search
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  name, notes, tags,
  content='items', content_rowid='id',
  tokenize='trigram'
);

CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(rowid, name, notes, tags) VALUES (new.id, new.name, COALESCE(new.notes,''), COALESCE(new.tags,''));
END;
CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, name, notes, tags) VALUES('delete', old.id, old.name, COALESCE(old.notes,''), COALESCE(old.tags,''));
END;
CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, name, notes, tags) VALUES('delete', old.id, old.name, COALESCE(old.notes,''), COALESCE(old.tags,''));
  INSERT INTO items_fts(rowid, name, notes, tags) VALUES (new.id, new.name, COALESCE(new.notes,''), COALESCE(new.tags,''));
END;

-- Seed local-dev user
INSERT OR IGNORE INTO users (id, google_sub, email, name) VALUES (1, 'local-dev', 'you@localhost', 'Local Dev');
