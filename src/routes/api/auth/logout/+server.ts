import { redirect } from '@sveltejs/kit';
import { deleteSession, getSessionCookieName, getSessionCookieOptions } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ platform, cookies, url }) => {
	const db = platform?.env.DB;
	if (!db) throw redirect(302, '/login');

	const token = cookies.get(getSessionCookieName());
	if (token) {
		await deleteSession(db, token);
	}

	// Clear cookie
	cookies.set(getSessionCookieName(), '', getSessionCookieOptions(undefined, url.protocol === 'https:'));

	throw redirect(302, '/login');
};
