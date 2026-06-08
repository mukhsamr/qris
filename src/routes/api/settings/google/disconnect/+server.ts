import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index';
import { oauthAccounts, users } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json() as { accountId?: string };
	const accountId = body?.accountId;

	if (!accountId || typeof accountId !== 'string') {
		return json({ error: 'Missing accountId' }, { status: 400 });
	}

	const db = platform?.env.DB;
	if (!db) {
		return json({ error: 'Database unavailable' }, { status: 500 });
	}

	const drizzle = getDb(db);
	const [user] = await drizzle
		.select({ passwordHash: users.passwordHash })
		.from(users)
		.where(eq(users.id, locals.user.id));

	if (!user?.passwordHash) {
		return json(
			{ error: 'Buat kata sandi terlebih dahulu sebelum memutuskan Google.' },
			{ status: 400 }
		);
	}

	// Verify the account belongs to this user
	const [account] = await drizzle
		.select({ id: oauthAccounts.id })
		.from(oauthAccounts)
		.where(
			and(
				eq(oauthAccounts.id, accountId),
				eq(oauthAccounts.userId, locals.user.id)
			)
		);

	if (!account) {
		return json({ error: 'Account not found' }, { status: 404 });
	}

	await drizzle.delete(oauthAccounts).where(eq(oauthAccounts.id, accountId));

	return json({ success: true });
};
