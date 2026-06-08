import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { users } from '$lib/server/db/schema';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import type { RequestHandler } from './$types';

const passwordSchema = z.object({
	currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
	newPassword: z.string().min(8, 'Password baru minimal 8 karakter').max(128),
});

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const body = await request.json().catch(() => null);
	if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

	const parsed = passwordSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0].message }, { status: 400 });
	}

	const { currentPassword, newPassword } = parsed.data;
	const drizzle = getDb(db);

	const [user] = await drizzle
		.select({ passwordHash: users.passwordHash })
		.from(users)
		.where(eq(users.id, locals.user.id));

	if (!user) {
		return json({ error: 'User tidak ditemukan' }, { status: 404 });
	}

	// If user has no password set (OAuth-only), they can't change password
	if (!user.passwordHash) {
		return json({ error: 'Akun ini menggunakan Google login, tidak memiliki password' }, { status: 400 });
	}

	const valid = await verifyPassword(currentPassword, user.passwordHash);
	if (!valid) {
		return json({ error: 'Password saat ini salah' }, { status: 401 });
	}

	const newHash = await hashPassword(newPassword);
	await drizzle.update(users)
		.set({ passwordHash: newHash })
		.where(eq(users.id, locals.user.id));

	return json({ success: true });
};
