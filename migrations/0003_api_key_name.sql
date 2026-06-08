ALTER TABLE api_keys ADD COLUMN name TEXT;

UPDATE api_keys
SET name = key_prefix
WHERE name IS NULL;

UPDATE api_keys
SET key_prefix = 'qris_live_sk'
WHERE key_prefix NOT LIKE 'qris_live_sk%';
