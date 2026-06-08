import { eq, desc } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index';
import { savedQris } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) return { qrisList: [] };

	const db = platform?.env.DB;
	if (!db) return { qrisList: [] };

	const drizzle = getDb(db);

	const items = await drizzle
		.select({
			id: savedQris.id,
			code: savedQris.code,
			name: savedQris.name,
			qrisPayload: savedQris.qrisPayload,
			r2ImageKey: savedQris.r2ImageKey,
			createdAt: savedQris.createdAt,
		})
		.from(savedQris)
		.where(eq(savedQris.userId, locals.user.id))
		.orderBy(desc(savedQris.createdAt));

	const qrisList = items.map((item) => ({
		id: item.id,
		code: item.code,
		name: item.name ?? '',
		qrisPayload: item.qrisPayload,
		imageUrl: item.r2ImageKey ? `/api/qris/${item.id}/image` : '',
		createdAt: new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
	}));

	return { qrisList };
};
