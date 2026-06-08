import { Google, generateState, generateCodeVerifier, decodeIdToken } from 'arctic';
import type { Cookies } from '@sveltejs/kit';

interface GoogleEnv {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GOOGLE_REDIRECT_URI: string;
}

function getGoogleClient(env: GoogleEnv) {
	return new Google(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		env.GOOGLE_REDIRECT_URI
	);
}

const STATE_COOKIE = 'google_oauth_state';
const CODE_VERIFIER_COOKIE = 'google_oauth_code_verifier';

function oauthCookieOptions(secure: boolean, maxAge = 60 * 10) {
	return {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax' as const,
		maxAge,
	};
}

export function createGoogleAuthUrl(env: GoogleEnv, cookies: Cookies, requestUrl: URL): URL {
	const google = getGoogleClient(env);
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const scopes = ['openid', 'profile', 'email'];
	const secureCookies = requestUrl.protocol === 'https:';

	cookies.set(STATE_COOKIE, state, oauthCookieOptions(secureCookies));
	cookies.set(CODE_VERIFIER_COOKIE, codeVerifier, oauthCookieOptions(secureCookies));

	const url = google.createAuthorizationURL(state, codeVerifier, scopes);
	return url;
}

export async function validateGoogleCallback(
	env: GoogleEnv,
	cookies: Cookies,
	url: URL
): Promise<{ googleUserId: string; email: string; name: string; picture: string | null }> {
	const stateCookie = cookies.get(STATE_COOKIE);
	const codeVerifierCookie = cookies.get(CODE_VERIFIER_COOKIE);

	const state = url.searchParams.get('state');
	const code = url.searchParams.get('code');
	const secureCookies = url.protocol === 'https:';

	// Clear OAuth cookies
	cookies.delete(STATE_COOKIE, oauthCookieOptions(secureCookies));
	cookies.delete(CODE_VERIFIER_COOKIE, oauthCookieOptions(secureCookies));

	if (!stateCookie || !codeVerifierCookie || !state || !code) {
		throw new Error('Invalid OAuth callback: missing parameters');
	}

	if (state !== stateCookie) {
		throw new Error('Invalid OAuth callback: state mismatch');
	}

	const google = getGoogleClient(env);

	const tokens = await google.validateAuthorizationCode(code, codeVerifierCookie);
	const idToken = tokens.idToken();
	if (!idToken) {
		throw new Error('No ID token received from Google');
	}

	const claims = decodeIdToken(idToken) as Record<string, unknown>;
	const googleUserId = typeof claims.sub === 'string' ? claims.sub : '';
	const email = typeof claims.email === 'string' ? claims.email : '';
	const emailVerified = claims.email_verified === true;

	if (!googleUserId || !email || !emailVerified) {
		throw new Error('Google account email is not verified');
	}

	const name = (typeof claims.name === 'string' && claims.name) || email;
	const picture = (typeof claims.picture === 'string' && claims.picture) || null;

	return { googleUserId, email, name, picture };
}
