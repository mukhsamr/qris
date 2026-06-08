import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { users } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const profileSchema = z.object({
	name: z.string().min(1, 'Nama wajib diisi').max(100),
});

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const body = await request.json().catch(() => null);
	if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

	const parsed = profileSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0].message }, { status: 400 });
	}

	const { name } = parsed.data;
	const drizzle = getDb(db);

	await drizzle.update(users)
		.set({ name })
		.where(eq(users.id, locals.user.id));

	return json({ success: true, name });
};
