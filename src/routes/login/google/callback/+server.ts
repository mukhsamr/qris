import { isRedirect, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index';
import { users, oauthAccounts } from '$lib/server/db/schema';
import { createSession, getSessionCookieName, getSessionCookieOptions } from '$lib/server/auth/session';
import { hasGoogleAuthEnv, validateGoogleCallback } from '$lib/server/auth/google';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, cookies, url, locals }) => {
	const env = platform?.env;
	if (!env?.DB || !hasGoogleAuthEnv(env)) throw redirect(302, '/login?error=config');

	const db = env.DB;
	const drizzle = getDb(db);
	let redirectTo = '/dashboard';

	try {
		const { googleUserId, email, name, picture } = await validateGoogleCallback(
			env,
			cookies,
			url
		);

		// Check if this Google account is already linked
		const [existingOAuth] = await drizzle
			.select({ userId: oauthAccounts.userId })
			.from(oauthAccounts)
			.where(
				and(
					eq(oauthAccounts.provider, 'google'),
					eq(oauthAccounts.providerAccountId, googleUserId)
				)
			);

		let userId: string;

		if (existingOAuth) {
			if (locals.user && existingOAuth.userId !== locals.user.id) {
				throw redirect(302, '/dashboard/settings?error=google_already_linked');
			}
			userId = existingOAuth.userId;
		} else if (locals.user) {
			userId = locals.user.id;
			redirectTo = '/dashboard/settings?connected=google';
			await drizzle.insert(oauthAccounts).values({
				userId,
				provider: 'google',
				providerAccountId: googleUserId,
			});
		} else {
			// Check if user with this email already exists
			const [existingUser] = await drizzle
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, email));

			if (existingUser) {
				// Link Google account to existing user
				userId = existingUser.id;
				await drizzle.insert(oauthAccounts).values({
					userId,
					provider: 'google',
					providerAccountId: googleUserId,
				});
			} else {
				// Create new user with Google account
				userId = crypto.randomUUID();
				await drizzle.insert(users).values({
					id: userId,
					email,
					name,
					avatarUrl: picture,
				});
				await drizzle.insert(oauthAccounts).values({
					userId,
					provider: 'google',
					providerAccountId: googleUserId,
				});
			}
		}

		// Create session
		const { token, expiresAt } = await createSession(db, userId);
		cookies.set(
			getSessionCookieName(),
			token,
			getSessionCookieOptions(expiresAt, url.protocol === 'https:')
		);
	} catch (err) {
		if (isRedirect(err)) throw err;
		console.error('Google OAuth error:', err);
		throw redirect(302, '/login?error=google_auth_failed');
	}

	throw redirect(302, redirectTo);
};
