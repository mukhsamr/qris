import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index';
import { apiKeys } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) return { apiKeyList: [] };

	const db = platform?.env.DB;
	if (!db) return { apiKeyList: [] };

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

	const apiKeyList = items.map((item) => ({
		id: item.id,
		name: item.name ?? 'API Key',
		prefix: item.keyPrefix,
		createdAt: new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
		lastUsed: item.lastUsedAt
			? new Date(item.lastUsedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
			: 'Belum pernah',
	}));

	return { apiKeyList };
};
