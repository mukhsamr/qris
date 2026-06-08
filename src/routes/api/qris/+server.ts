import { json } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { savedQris } from '$lib/server/db/schema';
import { parseQrisImageDataUrl } from '$lib/server/qris-image';
import { validateQRIS } from '$lib/qris/validate';
import type { RequestHandler } from './$types';

const createSchema = z.object({
	name: z.string().min(1, 'Nama wajib diisi').max(200),
	qrisPayload: z.string().min(1, 'Payload QRIS wajib diisi'),
	imageBase64: z.string().optional(),
});

function generateQrisCode(): string {
	const bytes = new Uint8Array(8);
	crypto.getRandomValues(bytes);
	const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
	return `qris_${suffix}`;
}

// GET — list user's saved QRIS
export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const drizzle = getDb(db);

	const items = await drizzle
		.select({
			id: savedQris.id,
			code: savedQris.code,
			name: savedQris.name,
			qrisPayload: savedQris.qrisPayload,
			r2ImageKey: savedQris.r2ImageKey,
			createdAt: savedQris.createdAt,
		})
		.from(savedQris)
		.where(eq(savedQris.userId, locals.user.id))
		.orderBy(desc(savedQris.createdAt));

	const result = items.map((item) => ({
		id: item.id,
		code: item.code,
		name: item.name,
		qrisPayload: item.qrisPayload,
		imageUrl: item.r2ImageKey ? `/api/qris/${item.id}/image` : null,
		createdAt: item.createdAt,
	}));

	return json({ success: true, data: result });
};

// POST — create new saved QRIS
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const body = await request.json().catch(() => null);
	if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

	const parsed = createSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0].message }, { status: 400 });
	}

	const { name, qrisPayload, imageBase64 } = parsed.data;
	const drizzle = getDb(db);

	// Validate the QRIS payload
	const validation = validateQRIS(qrisPayload);
	if (!validation.valid) {
		return json({ error: validation.error ?? 'Payload QRIS tidak valid' }, { status: 400 });
	}

	const qrisId = crypto.randomUUID();
	const qrisCode = generateQrisCode();
	let r2ImageKey: string | null = null;

	// Upload image to R2 if provided
	if (imageBase64 && platform?.env.MEDIA) {
		const image = parseQrisImageDataUrl(imageBase64);
		if (!image.success) {
			return json({ error: image.error }, { status: image.status });
		}

		try {
			r2ImageKey = `qris-images/${locals.user.id}/${qrisId}.${image.extension}`;
			await platform.env.MEDIA.put(r2ImageKey, image.bytes, {
				httpMetadata: { contentType: image.contentType },
			});
		} catch (err) {
			console.error('R2 upload error:', err);
			// Continue without image if upload fails
		}
	}

	await drizzle.insert(savedQris).values({
		id: qrisId,
		code: qrisCode,
		userId: locals.user.id,
		name,
		qrisPayload,
		r2ImageKey,
	});

	return json({
		success: true,
		data: {
			id: qrisId,
			code: qrisCode,
			name,
			qrisPayload,
			imageUrl: r2ImageKey ? `/api/qris/${qrisId}/image` : null,
			createdAt: new Date().toISOString(),
		},
	});
};
