import { eq, and } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index';
import { savedQris } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

// GET — serve QRIS image from R2
export const GET: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return new Response('Unauthorized', { status: 401 });

	const bucket = platform?.env.MEDIA;
	if (!bucket) return new Response('Storage unavailable', { status: 500 });

	const db = platform?.env.DB;
	if (!db) return new Response('Database unavailable', { status: 500 });

	const { id } = params;
	const drizzle = getDb(db);

	// Verify ownership
	const [qris] = await drizzle
		.select({ r2ImageKey: savedQris.r2ImageKey })
		.from(savedQris)
		.where(and(eq(savedQris.id, id), eq(savedQris.userId, locals.user.id)));

	if (!qris?.r2ImageKey) {
		return new Response('Not found', { status: 404 });
	}

	const object = await bucket.get(qris.r2ImageKey);
	if (!object) return new Response('Not found', { status: 404 });

	const headers = new Headers();
	const metadata = object.httpMetadata;
	if (metadata?.contentType) headers.set('Content-Type', metadata.contentType);
	if (metadata?.contentLanguage) headers.set('Content-Language', metadata.contentLanguage);
	if (metadata?.contentDisposition) headers.set('Content-Disposition', metadata.contentDisposition);
	if (metadata?.contentEncoding) headers.set('Content-Encoding', metadata.contentEncoding);
	headers.set('Cache-Control', 'private, no-store');
	if (object.httpEtag) headers.set('etag', object.httpEtag);

	return new Response(object.body, { headers });
};
