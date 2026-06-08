import { type Handle, redirect } from '@sveltejs/kit';
import { validateSession, getSessionCookieName } from '$lib/server/auth/session';

const PUBLIC_ROUTES = [
	'/login',
	'/register',
	'/forgot-password',
	'/api/convert',
	'/api/auth/login',
	'/api/auth/register',
	'/api/v1/qris/generate',
];

function isRouteMatch(pathname: string, route: string): boolean {
	return pathname === route || pathname.startsWith(`${route}/`);
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(getSessionCookieName());
	const pathname = event.url.pathname;

	// Load session if token exists
	if (token && event.platform?.env.DB) {
		const user = await validateSession(event.platform.env.DB, token);
		if (user) {
			event.locals.user = user;
			event.locals.sessionToken = token;
		}
	}

	// Protect dashboard routes
	const isDashboardRoute = pathname.startsWith('/dashboard');
	const isPublicRoute = PUBLIC_ROUTES.some((route) => isRouteMatch(pathname, route));
	const isGoogleAuthRoute = pathname.startsWith('/login/google');

	if (isDashboardRoute && !event.locals.user) {
		throw redirect(302, '/login');
	}

	// Redirect logged-in users away from auth pages
	if ((isPublicRoute || pathname === '/login' || pathname === '/register') && event.locals.user && !isGoogleAuthRoute) {
		throw redirect(302, '/dashboard');
	}

	return resolve(event);
};
