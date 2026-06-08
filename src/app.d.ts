import type { SessionUser } from '$lib/server/auth/session';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			user?: SessionUser;
			sessionToken?: string;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
