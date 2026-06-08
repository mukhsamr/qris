CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	name TEXT,
	avatar_url TEXT,
	password_hash TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	provider TEXT NOT NULL,
	provider_account_id TEXT NOT NULL,
	access_token TEXT,
	refresh_token TEXT,
	expires_at INTEGER,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_accounts_provider_account_id_unique
	ON oauth_accounts(provider, provider_account_id);

CREATE INDEX IF NOT EXISTS oauth_accounts_user_id_idx
	ON oauth_accounts(user_id);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at INTEGER NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx
	ON sessions(user_id);

CREATE TABLE IF NOT EXISTS saved_qris (
	id TEXT PRIMARY KEY,
	code TEXT NOT NULL,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name TEXT,
	qris_payload TEXT NOT NULL,
	r2_image_key TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS saved_qris_user_id_idx
	ON saved_qris(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS saved_qris_code_unique
	ON saved_qris(code);

CREATE TABLE IF NOT EXISTS projects (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	binding_name TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx
	ON projects(user_id);

CREATE TABLE IF NOT EXISTS generation_logs (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	project_id TEXT,
	amount INTEGER NOT NULL,
	reference TEXT,
	source TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS generation_logs_user_id_idx
	ON generation_logs(user_id);

CREATE TABLE IF NOT EXISTS api_keys (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	key_hash TEXT NOT NULL,
	key_prefix TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx
	ON api_keys(user_id);

CREATE TABLE IF NOT EXISTS api_usage_logs (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	api_key_id TEXT NOT NULL,
	amount INTEGER NOT NULL,
	reference TEXT,
	ip_address TEXT,
	user_agent TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS api_usage_logs_user_id_idx
	ON api_usage_logs(user_id);

CREATE INDEX IF NOT EXISTS api_usage_logs_api_key_id_idx
	ON api_usage_logs(api_key_id);

CREATE TABLE IF NOT EXISTS rate_limits (
	id TEXT PRIMARY KEY,
	key TEXT NOT NULL,
	window_start INTEGER NOT NULL,
	count INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS rate_limits_key_window_start_idx
	ON rate_limits(key, window_start);
