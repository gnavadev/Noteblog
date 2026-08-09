/**
 * Client-side image helpers for uploads (browser only).
 */

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.82;

/**
 * Resize and re-encode an image file to JPEG so covers stay under LinkedIn's
 * 5 MB limit and don't waste storage bandwidth.
 * Returns the original file if compression fails or the file is not an image.
 */
export async function compressImageFile(
    file: File,
    maxEdge = DEFAULT_MAX_EDGE,
    quality = DEFAULT_QUALITY
): Promise<File> {
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
        return file;
    }

    // Skip tiny files already under ~400 KB unless they are huge dimensions
    // (we'll still decode them below only if needed — keep simple path for small JPGs)
    try {
        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;

        const scale = Math.min(1, maxEdge / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));

        // Already small enough and JPEG — skip re-encode
        if (scale === 1 && file.type === 'image/jpeg' && file.size < 400_000) {
            bitmap.close();
            return file;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bitmap.close();
            return file;
        }

        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        bitmap.close();

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', quality)
        );

        if (!blob || blob.size >= file.size) {
            // Compression didn't help
            return file;
        }

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
        return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
    } catch {
        return file;
    }
}
