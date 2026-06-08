import { type Handle, redirect } from '@sveltejs/kit';
import { validateSession, getSessionCookieName } from '$lib/server/auth/session';

const AUTH_ROUTES = [
	'/login',
	'/register',
	'/forgot-password',
];

const PROTECTED_ROUTES = ['/dashboard'];

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
		} else {
			event.cookies.delete(getSessionCookieName(), { path: '/' });
		}
	}

	const isProtectedRoute = PROTECTED_ROUTES.some((route) => isRouteMatch(pathname, route));
	const isAuthRoute = AUTH_ROUTES.some((route) => isRouteMatch(pathname, route));
	const isGoogleAuthRoute = pathname.startsWith('/login/google');

	if (isProtectedRoute && !event.locals.user) {
		throw redirect(302, '/login');
	}

	// Redirect logged-in users away from auth pages
	if (isAuthRoute && event.locals.user && !isGoogleAuthRoute) {
		throw redirect(302, '/dashboard');
	}

	return resolve(event);
};
