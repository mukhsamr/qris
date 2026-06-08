import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index';
import { users, oauthAccounts } from '$lib/server/db/schema';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { deleteSession, getSessionCookieName, getSessionCookieOptions } from '$lib/server/auth/session';
import type { PageServerLoad, Actions } from './$types';
import { sessions, savedQris, projects, generationLogs, apiKeys, apiUsageLogs } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) throw new Error('Unauthorized');
	const db = platform?.env.DB;
	if (!db) throw new Error('Database unavailable');

	const drizzle = getDb(db);

	const linkedAccounts = await drizzle
		.select({
			id: oauthAccounts.id,
			provider: oauthAccounts.provider,
			createdAt: oauthAccounts.createdAt,
		})
		.from(oauthAccounts)
		.where(eq(oauthAccounts.userId, locals.user!.id));

	return {
		user: {
			...locals.user!,
			hasPassword: Boolean(
				(
					await drizzle
						.select({ passwordHash: users.passwordHash })
						.from(users)
						.where(eq(users.id, locals.user!.id))
				)[0]?.passwordHash
			),
		},
		linkedAccounts,
	};
};

const profileSchema = z.object({
	name: z.string().min(1, 'Nama wajib diisi').max(100),
});

const passwordSchema = z.object({
	currentPassword: z.string().optional(),
	newPassword: z.string().min(8, 'Password baru minimal 8 karakter').max(128),
	confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
	message: 'Password baru tidak cocok',
	path: ['confirmPassword'],
});

function getFormString(data: FormData, key: string): string {
	const value = data.get(key);
	return typeof value === 'string' ? value : '';
}

function getOptionalFormString(data: FormData, key: string): string | undefined {
	const value = data.get(key);
	if (typeof value !== 'string' || value.length === 0) return undefined;
	return value;
}

export const actions: Actions = {
	updateProfile: async ({ request, locals, platform }) => {
		if (!locals.user) throw redirect(303, '/login');
		const db = platform?.env.DB;
		if (!db) return fail(500, { error: 'Database unavailable' });

		const data = await request.formData();
		const name = getFormString(data, 'name');

		const parsed = profileSchema.safeParse({ name });
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0].message, field: 'profile' });
		}

		const drizzle = getDb(db);
		await drizzle.update(users).set({ name: parsed.data.name }).where(eq(users.id, locals.user.id));

		return { success: true, field: 'profile' };
	},

	changePassword: async ({ request, locals, platform }) => {
		if (!locals.user) throw redirect(303, '/login');
		const db = platform?.env.DB;
		if (!db) return fail(500, { error: 'Database unavailable' });

		const data = await request.formData();
		const parsed = passwordSchema.safeParse({
			currentPassword: getOptionalFormString(data, 'currentPassword'),
			newPassword: getFormString(data, 'newPassword'),
			confirmPassword: getFormString(data, 'confirmPassword'),
		});
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0].message, field: 'password' });
		}

		const drizzle = getDb(db);
		const [user] = await drizzle
			.select({ passwordHash: users.passwordHash })
			.from(users)
			.where(eq(users.id, locals.user.id));

		if (user?.passwordHash) {
			if (!parsed.data.currentPassword) {
				return fail(400, { error: 'Password saat ini wajib diisi', field: 'password' });
			}

			const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
			if (!valid) {
				return fail(401, { error: 'Password saat ini salah', field: 'password' });
			}
		}

		const newHash = await hashPassword(parsed.data.newPassword);
		await drizzle.update(users).set({ passwordHash: newHash }).where(eq(users.id, locals.user.id));

		return { success: true, field: 'password' };
	},

	deleteAccount: async ({ locals, platform, cookies, url }) => {
		if (!locals.user) throw redirect(303, '/login');
		const db = platform?.env.DB;
		if (!db) return fail(500, { error: 'Database unavailable' });

		const drizzle = getDb(db);
		const userId = locals.user.id;

		await drizzle.delete(apiUsageLogs).where(eq(apiUsageLogs.userId, userId));
		await drizzle.delete(apiKeys).where(eq(apiKeys.userId, userId));
		await drizzle.delete(generationLogs).where(eq(generationLogs.userId, userId));
		await drizzle.delete(projects).where(eq(projects.userId, userId));
		await drizzle.delete(savedQris).where(eq(savedQris.userId, userId));
		await drizzle.delete(oauthAccounts).where(eq(oauthAccounts.userId, userId));
		await drizzle.delete(sessions).where(eq(sessions.userId, userId));
		await drizzle.delete(users).where(eq(users.id, userId));

		const token = cookies.get(getSessionCookieName());
		if (token) {
			await deleteSession(db, token);
		}
		cookies.set(getSessionCookieName(), '', getSessionCookieOptions(undefined, url.protocol === 'https:'));

		throw redirect(303, '/login');
	},
};
