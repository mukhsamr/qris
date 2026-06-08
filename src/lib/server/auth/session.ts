import { eq } from 'drizzle-orm';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb } from '$lib/server/db/index';
import { sessions, users } from '$lib/server/db/schema';

const SESSION_COOKIE = 'qris_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function base64UrlEncode(buffer: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

async function generateToken(length = 32): Promise<string> {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return base64UrlEncode(bytes.buffer);
}

export interface SessionUser {
	id: string;
	email: string;
	name: string | null;
	avatarUrl: string | null;
}

export function getSessionCookieName(): string {
	return SESSION_COOKIE;
}

export function getSessionCookieOptions(expiresAt?: Date, secure = true) {
	return {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax' as const,
		...(expiresAt ? { expires: expiresAt } : {}),
	};
}

export async function createSession(
	db: D1Database,
	userId: string
): Promise<{ token: string; expiresAt: Date }> {
	const drizzle = getDb(db);
	const token = await generateToken();
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

	await drizzle.insert(sessions).values({
		userId,
		id: await hashToken(token),
		expiresAt: Math.floor(expiresAt.getTime() / 1000),
	});

	return { token, expiresAt };
}

export async function validateSession(
	db: D1Database,
	token: string
): Promise<SessionUser | null> {
	const drizzle = getDb(db);
	const sessionId = await hashToken(token);

	const [session] = await drizzle
		.select({
			userId: sessions.userId,
			expiresAt: sessions.expiresAt,
		})
		.from(sessions)
		.where(eq(sessions.id, sessionId));

	if (!session) return null;

	// Check expiry
	if (Date.now() > session.expiresAt * 1000) {
		await drizzle.delete(sessions).where(eq(sessions.id, sessionId));
		return null;
	}

	const [user] = await drizzle
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			avatarUrl: users.avatarUrl,
		})
		.from(users)
		.where(eq(users.id, session.userId));

	if (!user) return null;

	return user;
}

export async function deleteSession(
	db: D1Database,
	token: string
): Promise<void> {
	const drizzle = getDb(db);
	const sessionId = await hashToken(token);
	await drizzle.delete(sessions).where(eq(sessions.id, sessionId));
}

async function hashToken(token: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(token);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return base64UrlEncode(hash);
}
