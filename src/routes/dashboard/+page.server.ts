import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index';
import { generationLogs } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		return {
			summary: [],
			logs: [],
			chartData: [],
		};
	}

	const db = platform?.env.DB;
	if (!db) {
		return {
			summary: [],
			logs: [],
			chartData: [],
		};
	}

	const drizzle = getDb(db);

	const [totalResult] = await drizzle
		.select({ count: sql<number>`COUNT(*)` })
		.from(generationLogs)
		.where(eq(generationLogs.userId, locals.user.id));

	const [totalAmountResult] = await drizzle
		.select({ total: sql<number>`COALESCE(SUM(${generationLogs.amount}), 0)` })
		.from(generationLogs)
		.where(eq(generationLogs.userId, locals.user.id));

	const [apiCallResult] = await drizzle
		.select({ count: sql<number>`COUNT(*)` })
		.from(generationLogs)
		.where(and(eq(generationLogs.userId, locals.user.id), eq(generationLogs.source, 'api')));

	const totalCount = totalResult?.count ?? 0;
	const totalAmount = totalAmountResult?.total ?? 0;
	const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
	const apiCalls = apiCallResult?.count ?? 0;

	const summary = [
		{ label: 'Total Generate', value: String(totalCount), icon: 'bar-chart-3' },
		{
			label: 'Total Nominal',
			value: `Rp ${totalAmount.toLocaleString('id-ID')}`,
			icon: 'trending-up',
		},
		{
			label: 'Rata-rata Nominal',
			value: `Rp ${avgAmount.toLocaleString('id-ID')}`,
			icon: 'activity',
		},
		{ label: 'API Calls', value: String(apiCalls), icon: 'clock' },
	];

	const recentLogs = await drizzle
		.select({
			id: generationLogs.id,
			amount: generationLogs.amount,
			reference: generationLogs.reference,
			source: generationLogs.source,
			createdAt: generationLogs.createdAt,
		})
		.from(generationLogs)
		.where(eq(generationLogs.userId, locals.user.id))
		.orderBy(desc(generationLogs.createdAt))
		.limit(20);

	const logs = recentLogs.map((log) => ({
		id: log.id,
		time: formatRelative(new Date(log.createdAt)),
		reference: log.reference ?? '-',
		amount: log.amount,
		source: log.source === 'api' ? 'API' : 'Dashboard',
	}));

	const chartData = await getLast7DaysData(drizzle, locals.user.id);

	return { summary, logs, chartData };
};

function formatRelative(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	if (diffMins < 1) return 'Baru saja';
	if (diffMins < 60) return `${diffMins} menit lalu`;
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `${diffHours} jam lalu`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays === 1) return 'Kemarin';
	if (diffDays < 7) return `${diffDays} hari lalu`;
	return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function getLast7DaysData(
	drizzle: ReturnType<typeof getDb>,
	userId: string
): Promise<Array<{ day: string; api: number; dashboard: number }>> {
	const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
	const result: Array<{ day: string; api: number; dashboard: number }> = [];

	for (let i = 6; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		date.setHours(0, 0, 0, 0);
		const nextDate = new Date(date);
		nextDate.setDate(nextDate.getDate() + 1);

		const dayStr = date.toISOString().split('T')[0];
		const nextDayStr = nextDate.toISOString().split('T')[0];

		const [apiResult] = await drizzle
			.select({ total: sql<number>`COALESCE(SUM(${generationLogs.amount}), 0)` })
			.from(generationLogs)
			.where(
				sql`${generationLogs.userId} = ${userId}
				AND ${generationLogs.source} = 'api'
				AND ${generationLogs.createdAt} >= ${dayStr}
				AND ${generationLogs.createdAt} < ${nextDayStr}`
			);

		const [dashboardResult] = await drizzle
			.select({ total: sql<number>`COALESCE(SUM(${generationLogs.amount}), 0)` })
			.from(generationLogs)
			.where(
				sql`${generationLogs.userId} = ${userId}
				AND ${generationLogs.source} != 'api'
				AND ${generationLogs.createdAt} >= ${dayStr}
				AND ${generationLogs.createdAt} < ${nextDayStr}`
			);

		result.push({
			day: dayNames[date.getDay()],
			api: apiResult?.total ?? 0,
			dashboard: dashboardResult?.total ?? 0,
		});
	}

	return result;
}
