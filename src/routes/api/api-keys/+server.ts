import { json } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { apiKeys } from '$lib/server/db/schema';
import { hashToken, generateSecureToken } from '$lib/server/auth/password';
import { buildApiKey, getApiKeyDisplayPrefix } from '$lib/server/auth/api-key';
import type { RequestHandler } from './$types';

const createSchema = z.object({
	name: z.string().min(1, 'Nama wajib diisi').max(200),
});

// GET — list user's API keys (no secret shown)
export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const drizzle = getDb(db);

	const items = await drizzle
		.select({
			id: apiKeys.id,
			name: apiKeys.name,
			keyPrefix: apiKeys.keyPrefix,
			createdAt: apiKeys.createdAt,
			lastUsedAt: apiKeys.lastUsedAt,
		})
		.from(apiKeys)
		.where(and(eq(apiKeys.userId, locals.user.id), eq(apiKeys.status, 'active')))
		.orderBy(desc(apiKeys.createdAt));

	const result = items.map((item) => ({
		id: item.id,
		name: item.name ?? 'API Key',
		prefix: item.keyPrefix,
		createdAt: item.createdAt,
		lastUsed: item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum pernah',
	}));

	return json({ success: true, data: result });
};

// POST — create new API key
// The plain key is returned ONCE and never stored — only the SHA-256 hash is stored.
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const body = await request.json().catch(() => null);
	if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

	const parsed = createSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0].message }, { status: 400 });
	}

	const { name } = parsed.data;
	const drizzle = getDb(db);

	// Generate API key
	const secret = generateSecureToken(24);
	const plainKey = buildApiKey(secret);
	const keyHash = await hashToken(plainKey);
	const keyPrefix = getApiKeyDisplayPrefix(plainKey);

	const keyId = crypto.randomUUID();
	await drizzle.insert(apiKeys).values({
		id: keyId,
		userId: locals.user.id,
		name,
		keyHash,
		keyPrefix,
	});

	return json({
		success: true,
		data: {
			id: keyId,
			name,
			prefix: keyPrefix,
			createdAt: new Date().toISOString(),
			// This is the ONLY time the plain key is returned
			plainKey,
		},
	});
};
