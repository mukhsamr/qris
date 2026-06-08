import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { apiKeys, savedQris, generationLogs, apiUsageLogs } from '$lib/server/db/schema';
import { generateDynamicQRIS } from '$lib/qris/generate';
import { hashToken } from '$lib/server/auth/password';
import { checkRateLimit } from '$lib/server/auth/rate-limit';
import type { RequestHandler } from './$types';

const generateSchema = z.object({
	qris_code: z.string().min(1, 'qris_code wajib diisi'),
	amount: z
		.number({ error: 'amount harus angka' })
		.int({ error: 'amount harus bilangan bulat' })
		.positive({ error: 'amount harus lebih dari 0' })
		.max(99_999_999_999, { message: 'amount terlalu besar (max 99 milyar)' }),
	reference: z.string().max(100).optional(),
});

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env.DB;
	if (!db) return json({ success: false, error: 'Service unavailable' }, { status: 503 });

	// Extract API key from Authorization header
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return json({ success: false, error: 'Missing API key' }, { status: 401 });
	}

	const plainKey = authHeader.slice(7).trim();
	if (!plainKey) {
		return json({ success: false, error: 'Invalid API key' }, { status: 401 });
	}

	const keyHash = await hashToken(plainKey);
	const drizzle = getDb(db);

	// Find the API key
	const [keyRecord] = await drizzle
		.select({
			id: apiKeys.id,
			userId: apiKeys.userId,
		})
		.from(apiKeys)
		.where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.status, 'active')));

	if (!keyRecord) {
		return json({ success: false, error: 'Invalid API key' }, { status: 401 });
	}

	// Rate limit check
	const rateResult = await checkRateLimit(db, keyRecord.id);
	const rateHeaders: Record<string, string> = {
		'X-RateLimit-Limit': String(rateResult.limit),
		'X-RateLimit-Remaining': String(rateResult.remaining),
		'X-RateLimit-Reset': String(rateResult.reset),
	};

	if (!rateResult.allowed) {
		return json(
			{ success: false, error: 'Rate limit exceeded. Try again later.' },
			{ status: 429, headers: rateHeaders }
		);
	}

	// Parse body
	const body = await request.json().catch(() => null);
	if (!body) {
		return json({ success: false, error: 'Invalid request body' }, { status: 400, headers: rateHeaders });
	}

	const parsed = generateSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0].message },
			{ status: 400, headers: rateHeaders }
		);
	}

	const { qris_code, amount, reference } = parsed.data;

	// Verify the QRIS belongs to this user
	const [qrisRecord] = await drizzle
		.select({
			id: savedQris.id,
			code: savedQris.code,
			qrisPayload: savedQris.qrisPayload,
		})
		.from(savedQris)
		.where(and(eq(savedQris.code, qris_code), eq(savedQris.userId, keyRecord.userId)));

	if (!qrisRecord) {
		return json(
			{ success: false, error: 'QRIS tidak ditemukan atau bukan milik kamu' },
			{ status: 404, headers: rateHeaders }
		);
	}

	// Generate dynamic QRIS
	const result = generateDynamicQRIS(qrisRecord.qrisPayload, amount);
	if (!result.success) {
		return json(
			{ success: false, error: result.error },
			{ status: 400, headers: rateHeaders }
		);
	}

	// Log generation
	const logId = crypto.randomUUID();
	try {
		await drizzle.insert(generationLogs).values({
			id: logId,
			userId: keyRecord.userId,
			amount,
			reference: reference || null,
			source: 'api',
		});

		await drizzle.insert(apiUsageLogs).values({
			id: crypto.randomUUID(),
			userId: keyRecord.userId,
			apiKeyId: keyRecord.id,
			amount,
			reference: reference || null,
			ipAddress: request.headers.get('CF-Connecting-IP') || null,
			userAgent: request.headers.get('User-Agent') || null,
		});

		// Update last_used_at
		await drizzle.update(apiKeys)
			.set({ lastUsedAt: new Date().toISOString() })
			.where(eq(apiKeys.id, keyRecord.id));
	} catch (err) {
		console.error('Failed to log generation:', err);
		// Don't fail the request if logging fails
	}

	return json({
		success: true,
		qris_code: qrisRecord.code,
		amount,
		reference: reference || null,
		payload: result.payload,
	}, { headers: rateHeaders });
};
