import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { users } from '$lib/server/db/schema';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, getSessionCookieName, getSessionCookieOptions } from '$lib/server/auth/session';
import {
	checkRateLimit,
	getClientRateLimitKey,
	getRateLimitHeaders,
	RATE_LIMIT_ERROR,
} from '$lib/server/auth/rate-limit';
import { verifyTurnstile } from '$lib/server/turnstile';
import type { RequestHandler } from './$types';

const loginSchema = z.object({
	email: z.string().email('Email tidak valid'),
	password: z.string().min(1, 'Password wajib diisi'),
	turnstileToken: z.string({ error: 'Verifikasi Turnstile wajib diisi' }).min(1, 'Verifikasi Turnstile wajib diisi'),
});

export const POST: RequestHandler = async (event) => {
	const { request, platform, cookies, url } = event;
	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const body = await request.json().catch(() => null);
	if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0].message }, { status: 400 });
	}

	const { email, password } = parsed.data;
	const normalizedEmail = email.trim().toLowerCase();
	const rateResult = await checkRateLimit(
		db,
		getClientRateLimitKey(request, 'auth:login', normalizedEmail),
		10,
		10 * 60
	);
	if (!rateResult.allowed) {
		return json(
			{ error: RATE_LIMIT_ERROR },
			{ status: 429, headers: getRateLimitHeaders(rateResult) }
		);
	}

	const turnstile = await verifyTurnstile(event, parsed.data.turnstileToken, 'login');
	if (!turnstile.success) {
		return json({ error: turnstile.error }, { status: 400 });
	}

	const drizzle = getDb(db);

	const [user] = await drizzle
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			avatarUrl: users.avatarUrl,
			passwordHash: users.passwordHash,
		})
		.from(users)
		.where(eq(users.email, email));

	if (!user || !user.passwordHash) {
		return json({ error: 'Email atau password salah' }, { status: 401 });
	}

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) {
		return json({ error: 'Email atau password salah' }, { status: 401 });
	}

	const { token, expiresAt } = await createSession(db, user.id);
	cookies.set(
		getSessionCookieName(),
		token,
		getSessionCookieOptions(expiresAt, url.protocol === 'https:')
	);

	return json({
		success: true,
		user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
	});
};
