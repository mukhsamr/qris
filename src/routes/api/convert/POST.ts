import { json } from '@sveltejs/kit';
import { generateDynamicQRIS } from '$lib/qris/generate';
import { z } from 'zod';
import type { RequestEvent } from './$types';

const convertSchema = z.object({
  qrisPayload: z.string().min(1, 'Payload QRIS wajib diisi'),
  amount: z
    .number({ error: 'Nominal harus angka' })
    .int({ error: 'Nominal harus bilangan bulat' })
    .positive({ error: 'Nominal harus lebih dari 0' })
    .max(99_999_999_999, { message: 'Nominal terlalu besar (max 99 milyar)' })
});

export async function POST(event: RequestEvent) {
  try {
    const body = await event.request.json();
    const parsed = convertSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    const { qrisPayload, amount } = parsed.data;
    const result = generateDynamicQRIS(qrisPayload, amount);

    if (!result.success) {
      return json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return json({ success: true, payload: result.payload });
  } catch {
    return json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
