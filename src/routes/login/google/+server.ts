import { redirect } from '@sveltejs/kit';
import { createGoogleAuthUrl, hasGoogleAuthEnv } from '$lib/server/auth/google';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, cookies, url }) => {
	if (!hasGoogleAuthEnv(platform?.env)) throw redirect(302, '/login?error=config');
	const authUrl = createGoogleAuthUrl(platform.env, cookies, url);
	throw redirect(302, authUrl.toString());
};
