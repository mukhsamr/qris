interface Env {
	DB: D1Database;
	MEDIA: R2Bucket;
	ASSETS: { fetch: typeof fetch };

	// Plain env vars
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GOOGLE_REDIRECT_URI: string;
	TURNSTILE_SITE_KEY: string;

	// Secrets Store binding — hanya TURNSTILE_SECRET_KEY
	// Production: await env.TURNSTILE_SECRET_KEY.get()
	// Local dev:  string dari .dev.vars (uncomment override)
	TURNSTILE_SECRET_KEY: SecretsStoreSecret | string;
}

/**
 * Cloudflare Secrets Store binding.
 * Production pakai `.get()`, local dev pakai string dari .dev.vars.
 */
interface SecretsStoreSecret {
	get(): Promise<string>;
}
