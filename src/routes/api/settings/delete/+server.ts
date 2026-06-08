import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index';
import { users, oauthAccounts, sessions, savedQris, projects, generationLogs, apiKeys, apiUsageLogs } from '$lib/server/db/schema';
import { deleteSession, getSessionCookieName, getSessionCookieOptions } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, platform, cookies, url }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const drizzle = getDb(db);
	const userId = locals.user.id;

	// Delete all user data cascade
	// Note: D1 with foreign keys ON DELETE CASCADE handles children, 
	// but we explicitly delete to be safe
	await drizzle.delete(apiUsageLogs).where(eq(apiUsageLogs.userId, userId));
	await drizzle.delete(apiKeys).where(eq(apiKeys.userId, userId));
	await drizzle.delete(generationLogs).where(eq(generationLogs.userId, userId));
	await drizzle.delete(projects).where(eq(projects.userId, userId));
	await drizzle.delete(savedQris).where(eq(savedQris.userId, userId));
	await drizzle.delete(oauthAccounts).where(eq(oauthAccounts.userId, userId));
	await drizzle.delete(sessions).where(eq(sessions.userId, userId));
	await drizzle.delete(users).where(eq(users.id, userId));

	// Clear session cookie
	const token = cookies.get(getSessionCookieName());
	if (token) {
		await deleteSession(db, token);
	}
	cookies.set(getSessionCookieName(), '', getSessionCookieOptions(undefined, url.protocol === 'https:'));

	return json({ success: true });
};
