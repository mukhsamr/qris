import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Phase 2 tables

export const users = sqliteTable('users', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	email: text('email').unique().notNull(),
	name: text('name'),
	avatarUrl: text('avatar_url'),
	passwordHash: text('password_hash'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const oauthAccounts = sqliteTable('oauth_accounts', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	provider: text('provider').notNull(), // 'google'
	providerAccountId: text('provider_account_id').notNull(), // Google sub
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	expiresAt: integer('expires_at'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at').notNull(),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Phase 2 - saved QRIS
export const savedQris = sqliteTable('saved_qris', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	code: text('code').notNull().unique(),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name'),
	qrisPayload: text('qris_payload').notNull(),
	r2ImageKey: text('r2_image_key'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Phase 2 - projects / bindings
export const projects = sqliteTable('projects', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	bindingName: text('binding_name'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Phase 2 - generation logs
export const generationLogs = sqliteTable('generation_logs', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	projectId: text('project_id'),
	amount: integer('amount').notNull(),
	reference: text('reference'),
	source: text('source').notNull(),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Phase 3 - API keys
export const apiKeys = sqliteTable('api_keys', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	name: text('name'),
	keyHash: text('key_hash').notNull(),
	keyPrefix: text('key_prefix').notNull(),
	status: text('status').notNull().default('active'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	lastUsedAt: text('last_used_at'),
});

// Phase 3 - API usage logs
export const apiUsageLogs = sqliteTable('api_usage_logs', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	apiKeyId: text('api_key_id').notNull(),
	amount: integer('amount').notNull(),
	reference: text('reference'),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Rate limiting table for external API
export const rateLimits = sqliteTable(
	'rate_limits',
	{
		id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
		key: text('key').notNull(), // api_key_id or identifier
		windowStart: integer('window_start').notNull(), // unix timestamp of window start
		count: integer('count').notNull().default(1),
		createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex('rate_limits_key_window_start_unique').on(table.key, table.windowStart),
	]
);
