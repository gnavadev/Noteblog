export const prerender = false;
import type { APIRoute } from 'astro';
import sharp from 'sharp';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;

export const GET: APIRoute = async ({ url }) => {
    const src = url.searchParams.get('url');
    const width = Math.min(parseInt(url.searchParams.get('w') ?? '800'), 2000);
    const quality = Math.min(parseInt(url.searchParams.get('q') ?? '75'), 100);

    if (!src) {
        return new Response('Missing url param', { status: 400 });
    }

    // Only proxy images from this project's Supabase storage to prevent abuse
    if (!src.startsWith(`${SUPABASE_URL}/storage/`)) {
        return new Response('Forbidden', { status: 403 });
    }

    let imageBuffer: ArrayBuffer;
    try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Upstream responded with ${res.status}`);
        imageBuffer = await res.arrayBuffer();
    } catch {
        return new Response('Failed to fetch image', { status: 502 });
    }

    const optimized = await sharp(Buffer.from(imageBuffer))
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

    return new Response(optimized, {
        headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
};
