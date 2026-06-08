CREATE TABLE IF NOT EXISTS rate_limits_new (
	id TEXT PRIMARY KEY,
	key TEXT NOT NULL,
	window_start INTEGER NOT NULL,
	count INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	UNIQUE(key, window_start)
);

INSERT INTO rate_limits_new (id, key, window_start, count, created_at)
SELECT
	'rate_' || lower(hex(randomblob(16))) AS id,
	key,
	window_start,
	SUM(count) AS count,
	MIN(created_at) AS created_at
FROM rate_limits
GROUP BY key, window_start;

DROP TABLE rate_limits;

ALTER TABLE rate_limits_new RENAME TO rate_limits;

CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_key_window_start_unique
	ON rate_limits(key, window_start);
