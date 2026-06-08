import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { apiKeys } from '$lib/server/db/schema';
import { generateSecureToken, hashToken } from '$lib/server/auth/password';
import { buildApiKey, getApiKeyDisplayPrefix } from '$lib/server/auth/api-key';
import type { RequestHandler } from './$types';

const updateSchema = z.object({
	name: z.string().min(1).max(200),
});

// PUT — update API key name
export const PUT: RequestHandler = async ({ request, params, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const { id } = params;
	const body = await request.json().catch(() => null);
	if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

	const parsed = updateSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0].message }, { status: 400 });
	}

	const { name } = parsed.data;
	const drizzle = getDb(db);

	// Verify ownership
	const [existing] = await drizzle
		.select({ id: apiKeys.id })
		.from(apiKeys)
		.where(and(eq(apiKeys.id, id), eq(apiKeys.userId, locals.user.id)));

	if (!existing) {
		return json({ error: 'API key tidak ditemukan' }, { status: 404 });
	}

	await drizzle.update(apiKeys)
		.set({ name })
		.where(eq(apiKeys.id, id));

	return json({ success: true });
};

// PATCH — rotate API key secret.
// The old key stops working immediately because only the stored hash is replaced.
export const PATCH: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const { id } = params;
	const drizzle = getDb(db);

	const [existing] = await drizzle
		.select({
			id: apiKeys.id,
			name: apiKeys.name,
			keyPrefix: apiKeys.keyPrefix,
		})
		.from(apiKeys)
		.where(and(eq(apiKeys.id, id), eq(apiKeys.userId, locals.user.id), eq(apiKeys.status, 'active')));

	if (!existing) {
		return json({ error: 'API key tidak ditemukan' }, { status: 404 });
	}

	const secret = generateSecureToken(24);
	const plainKey = buildApiKey(secret);
	const keyHash = await hashToken(plainKey);
	const keyPrefix = getApiKeyDisplayPrefix(plainKey);

	await drizzle
		.update(apiKeys)
		.set({
			keyHash,
			keyPrefix,
			lastUsedAt: null,
		})
		.where(eq(apiKeys.id, id));

	return json({
		success: true,
		data: {
			id: existing.id,
			name: existing.name ?? 'API Key',
			prefix: keyPrefix,
			lastUsed: 'Belum pernah',
			plainKey,
		},
	});
};

// DELETE — revoke/delete API key
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const { id } = params;
	const drizzle = getDb(db);

	// Verify ownership
	const [existing] = await drizzle
		.select({ id: apiKeys.id })
		.from(apiKeys)
		.where(and(eq(apiKeys.id, id), eq(apiKeys.userId, locals.user.id)));

	if (!existing) {
		return json({ error: 'API key tidak ditemukan' }, { status: 404 });
	}

	// Soft delete — set status to revoked
	await drizzle.update(apiKeys)
		.set({ status: 'revoked' })
		.where(eq(apiKeys.id, id));

	return json({ success: true });
};
