import type { D1Database } from '@cloudflare/workers-types';

const WINDOW_SECONDS = 60; // 1 minute window
const MAX_REQUESTS = 60; // 60 requests per minute per key

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	reset: number; // Unix timestamp when window resets
	limit: number;
}

export const RATE_LIMIT_ERROR = 'Terlalu banyak percobaan. Coba lagi nanti.';

export function getClientRateLimitKey(request: Request, scope: string, subject?: string): string {
	const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
	const ip = request.headers.get('CF-Connecting-IP') ?? forwarded ?? 'unknown';
	const suffix = subject ? `:${subject.trim().toLowerCase()}` : '';

	return `${scope}:${ip}${suffix}`;
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
	return {
		'X-RateLimit-Limit': String(result.limit),
		'X-RateLimit-Remaining': String(result.remaining),
		'X-RateLimit-Reset': String(result.reset),
	};
}

/**
 * Check rate limit for a given key (e.g., api_key_id).
 * Uses D1 for persistent rate limiting across Workers.
 */
export async function checkRateLimit(
	db: D1Database,
	key: string,
	limit = MAX_REQUESTS,
	windowSec = WINDOW_SECONDS
): Promise<RateLimitResult> {
	const now = Math.floor(Date.now() / 1000);
	const windowStart = now - (now % windowSec);
	const reset = windowStart + windowSec;

	await db
		.prepare('DELETE FROM rate_limits WHERE key = ? AND window_start < ?')
		.bind(key, windowStart)
		.run();

	const current = await db
		.prepare(`
			INSERT INTO rate_limits (id, key, window_start, count, created_at)
			VALUES (?, ?, ?, 1, ?)
			ON CONFLICT(key, window_start)
			DO UPDATE SET count = count + 1
			RETURNING count
		`)
		.bind(crypto.randomUUID(), key, windowStart, new Date().toISOString())
		.first<{ count: number }>();

	const count = current?.count ?? limit + 1;
	const remaining = Math.max(0, limit - count);

	return { allowed: count <= limit, remaining, reset, limit };
}
