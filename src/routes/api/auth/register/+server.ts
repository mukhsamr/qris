import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { users } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';
import { createSession, getSessionCookieName, getSessionCookieOptions } from '$lib/server/auth/session';
import {
	checkRateLimit,
	getClientRateLimitKey,
	getRateLimitHeaders,
	RATE_LIMIT_ERROR,
} from '$lib/server/auth/rate-limit';
import { verifyTurnstile } from '$lib/server/turnstile';
import type { RequestHandler } from './$types';

const registerSchema = z.object({
	name: z.string().min(1, 'Nama wajib diisi').max(100),
	email: z.string().email('Email tidak valid').max(255),
	password: z.string().min(8, 'Password minimal 8 karakter').max(128),
	turnstileToken: z.string({ error: 'Verifikasi Turnstile wajib diisi' }).min(1, 'Verifikasi Turnstile wajib diisi'),
});

export const POST: RequestHandler = async (event) => {
	const { request, platform, cookies, url } = event;
	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const body = await request.json().catch(() => null);
	if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

	const parsed = registerSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0].message }, { status: 400 });
	}

	const { name, email, password } = parsed.data;
	const normalizedEmail = email.trim().toLowerCase();
	const rateResult = await checkRateLimit(
		db,
		getClientRateLimitKey(request, 'auth:register', normalizedEmail),
		5,
		60 * 60
	);
	if (!rateResult.allowed) {
		return json(
			{ error: RATE_LIMIT_ERROR },
			{ status: 429, headers: getRateLimitHeaders(rateResult) }
		);
	}

	const turnstile = await verifyTurnstile(event, parsed.data.turnstileToken, 'register');
	if (!turnstile.success) {
		return json({ error: turnstile.error }, { status: 400 });
	}

	const drizzle = getDb(db);

	// Check if email already exists
	const [existing] = await drizzle
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email));

	if (existing) {
		return json({ error: 'Email sudah terdaftar' }, { status: 409 });
	}

	// Hash password and create user
	const passwordHash = await hashPassword(password);
	const userId = crypto.randomUUID();

	await drizzle.insert(users).values({
		id: userId,
		email,
		name,
		passwordHash,
	});

	// Create session
	const { token, expiresAt } = await createSession(db, userId);
	cookies.set(
		getSessionCookieName(),
		token,
		getSessionCookieOptions(expiresAt, url.protocol === 'https:')
	);

	return json({ success: true, user: { id: userId, email, name } });
};
