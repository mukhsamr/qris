/**
 * Password hashing using Web Crypto PBKDF2.
 * Compatible with Cloudflare Workers runtime (no native Node modules).
 */

const ALGORITHM = 'PBKDF2';
const HASH_VERSION = 'pbkdf2-sha256';
const ITERATIONS = 150_000;
const KEY_LENGTH = 32; // 256 bits
const HASH_ALGORITHM = 'SHA-256';

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array<ArrayBuffer> {
	str = str.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) str += '=';
	const binary = atob(str);
	const bytes = new Uint8Array(new ArrayBuffer(binary.length));
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/**
 * Derive a PBKDF2 password hash.
 */
async function derivePasswordHash(
	password: string,
	salt: Uint8Array<ArrayBuffer>,
	iterations: number
): Promise<Uint8Array<ArrayBuffer>> {
	const encoder = new TextEncoder();
	const passwordData = encoder.encode(password);

	const key = await crypto.subtle.importKey(
		'raw',
		passwordData,
		{ name: ALGORITHM },
		false,
		['deriveBits']
	);

	const derived = await crypto.subtle.deriveBits(
		{
			name: ALGORITHM,
			salt,
			iterations,
			hash: HASH_ALGORITHM,
		},
		key,
		KEY_LENGTH * 8
	);

	return new Uint8Array(derived);
}

/**
 * Hash a password with a random salt.
 * Returns: "pbkdf2-sha256$iterations$salt$hash" (salt/hash base64url-encoded)
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derived = await derivePasswordHash(password, salt, ITERATIONS);

	const saltEncoded = base64UrlEncode(salt);
	const hashEncoded = base64UrlEncode(derived);

	return `${HASH_VERSION}$${ITERATIONS}$${saltEncoded}$${hashEncoded}`;
}

/**
 * Verify a password against a stored hash.
 * storedHash format: "pbkdf2-sha256$iterations$salt$hash"
 */
export async function verifyPassword(
	password: string,
	storedHash: string
): Promise<boolean> {
	const [version, iterationsRaw, saltEncoded, hashEncoded] = storedHash.split('$');
	if (version !== HASH_VERSION) return false;
	const iterations = Number(iterationsRaw);
	if (!Number.isInteger(iterations) || iterations <= 0) return false;
	if (!saltEncoded || !hashEncoded) return false;

	const salt = base64UrlDecode(saltEncoded);
	const expectedHash = base64UrlDecode(hashEncoded);

	const derivedBytes = await derivePasswordHash(password, salt, iterations);

	if (derivedBytes.length !== expectedHash.length) return false;

	// Constant-time comparison
	let diff = 0;
	for (let i = 0; i < derivedBytes.length; i++) {
		diff |= derivedBytes[i] ^ expectedHash[i];
	}
	return diff === 0;
}

/**
 * Generate a secure random token (for API keys, etc.)
 */
export function generateSecureToken(length = 32): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return base64UrlEncode(bytes);
}

/**
 * Hash a token with SHA-256 for storage.
 */
export async function hashToken(token: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(token);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return base64UrlEncode(hash);
}
