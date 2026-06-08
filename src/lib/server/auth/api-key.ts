export const API_KEY_PREFIX = 'qris_live_sk';

export function buildApiKey(secret: string): string {
	return `${API_KEY_PREFIX}_${secret}`;
}

export function getApiKeyDisplayPrefix(plainKey: string): string {
	const visibleChars = API_KEY_PREFIX.length + 1 + 6;
	return plainKey.slice(0, visibleChars);
}
