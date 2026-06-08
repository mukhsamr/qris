const MAX_QRIS_IMAGE_BYTES = 2 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/;

export type ParsedQrisImage =
	| { success: true; bytes: Uint8Array; extension: string; contentType: string }
	| { success: false; status: 400 | 413; error: string };

function getDecodedBase64Length(base64: string): number {
	const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
	return Math.floor((base64.length * 3) / 4) - padding;
}

export function parseQrisImageDataUrl(value: string): ParsedQrisImage {
	const match = value.match(DATA_URL_PATTERN);
	if (!match) {
		return { success: false, status: 400, error: 'Format gambar QRIS tidak valid' };
	}

	const mimeSubtype = match[1];
	const base64Data = match[2];
	const decodedLength = getDecodedBase64Length(base64Data);
	if (decodedLength > MAX_QRIS_IMAGE_BYTES) {
		return { success: false, status: 413, error: 'Ukuran gambar QRIS terlalu besar (maks 2 MiB)' };
	}

	try {
		const binaryStr = atob(base64Data);
		const bytes = new Uint8Array(binaryStr.length);
		for (let i = 0; i < binaryStr.length; i++) {
			bytes[i] = binaryStr.charCodeAt(i);
		}

		const extension = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype;
		const contentType = mimeSubtype === 'jpg' ? 'image/jpeg' : `image/${mimeSubtype}`;

		return { success: true, bytes, extension, contentType };
	} catch {
		return { success: false, status: 400, error: 'Data gambar QRIS tidak valid' };
	}
}
