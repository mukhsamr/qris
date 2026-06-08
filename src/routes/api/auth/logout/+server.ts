import { redirect } from '@sveltejs/kit';
import { deleteSession, getSessionCookieName } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ platform, cookies }) => {
	const db = platform?.env.DB;
	if (!db) throw redirect(302, '/login');

	const token = cookies.get(getSessionCookieName());
	if (token) {
		await deleteSession(db, token);
	}

	cookies.delete(getSessionCookieName(), { path: '/' });

	throw redirect(302, '/login');
};
