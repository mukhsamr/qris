import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '$lib/server/db/index';
import { savedQris } from '$lib/server/db/schema';
import { parseQrisImageDataUrl } from '$lib/server/qris-image';
import { validateQRIS } from '$lib/qris/validate';
import type { RequestHandler } from './$types';

const updateSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	qrisPayload: z.string().min(1, 'Payload QRIS wajib diisi').optional(),
	imageBase64: z.string().optional(),
});

// PUT — update saved QRIS
export const PUT: RequestHandler = async ({ request, params, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const { id } = params;
	const body = await request.json().catch(() => null);
	if (!body) return json({ error: 'Invalid request body' }, { status: 400 });

	const parsed = updateSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error.issues[0].message }, { status: 400 });
	}

	const { name, qrisPayload, imageBase64 } = parsed.data;
	const drizzle = getDb(db);

	// Verify ownership
	const [existing] = await drizzle
		.select({ id: savedQris.id, r2ImageKey: savedQris.r2ImageKey })
		.from(savedQris)
		.where(and(eq(savedQris.id, id), eq(savedQris.userId, locals.user.id)));

	if (!existing) {
		return json({ error: 'QRIS tidak ditemukan' }, { status: 404 });
	}

	const updates: Record<string, unknown> = {};

	if (name !== undefined) {
		updates.name = name;
	}

	if (qrisPayload !== undefined) {
		const validation = validateQRIS(qrisPayload);
		if (!validation.valid) {
			return json({ error: validation.error ?? 'Payload QRIS tidak valid' }, { status: 400 });
		}
		updates.qrisPayload = qrisPayload;
	}

	// Handle image update
	if (imageBase64 !== undefined && platform?.env.MEDIA) {
		// Delete old image if exists
		if (existing.r2ImageKey) {
			try {
				await platform.env.MEDIA.delete(existing.r2ImageKey);
			} catch { /* ignore */ }
		}

		let r2ImageKey: string | null = null;

		if (imageBase64) {
			const image = parseQrisImageDataUrl(imageBase64);
			if (!image.success) {
				return json({ error: image.error }, { status: image.status });
			}

			try {
				r2ImageKey = `qris-images/${locals.user.id}/${id}.${image.extension}`;
				await platform.env.MEDIA.put(r2ImageKey, image.bytes, {
					httpMetadata: { contentType: image.contentType },
				});
			} catch (err) {
				console.error('R2 upload error:', err);
			}
		}
		updates.r2ImageKey = r2ImageKey;
	}

	if (Object.keys(updates).length > 0) {
		await drizzle.update(savedQris).set(updates).where(eq(savedQris.id, id));
	}

	const imageUrl = updates.r2ImageKey !== undefined
		? (updates.r2ImageKey ? `/api/qris/${id}/image` : null)
		: (existing.r2ImageKey ? `/api/qris/${id}/image` : null);

	return json({
		success: true,
		data: { id, name: name ?? null, qrisPayload: qrisPayload ?? null, imageUrl },
	});
};

// DELETE — delete saved QRIS
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

	const { id } = params;
	const drizzle = getDb(db);

	// Verify ownership
	const [existing] = await drizzle
		.select({ r2ImageKey: savedQris.r2ImageKey })
		.from(savedQris)
		.where(and(eq(savedQris.id, id), eq(savedQris.userId, locals.user.id)));

	if (!existing) {
		return json({ error: 'QRIS tidak ditemukan' }, { status: 404 });
	}

	// Delete image from R2
	if (existing.r2ImageKey && platform?.env.MEDIA) {
		try {
			await platform.env.MEDIA.delete(existing.r2ImageKey);
		} catch { /* ignore */ }
	}

	await drizzle.delete(savedQris).where(eq(savedQris.id, id));

	return json({ success: true });
};
