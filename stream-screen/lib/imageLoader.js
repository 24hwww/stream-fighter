import { loadImage } from '@napi-rs/canvas';
import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Helper para cargar imágenes desde diferentes fuentes
 */
export async function loadImageFromPath(imagePath, fallbackPath = null) {
    if (!imagePath) {
        if (fallbackPath) {
            return await loadImageFromPath(fallbackPath);
        }
        throw new Error('No image path provided');
    }

    // Si es URL HTTP/HTTPS, cargar directamente
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        try {
            return await loadImage(imagePath);
        } catch (e) {
            console.warn(`[ImageLoader] Failed to load URL ${imagePath}:`, e.message);
            if (fallbackPath) {
                return await loadImageFromPath(fallbackPath);
            }
            throw e;
        }
    }

    // Si es ruta relativa, buscar en public folder
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const publicPath = join(process.cwd(), 'public', cleanPath);

    if (existsSync(publicPath)) {
        try {
            return await loadImage(publicPath);
        } catch (e) {
            console.warn(`[ImageLoader] Failed to load ${publicPath}:`, e.message);
        }
    }

    // Intentar como URL absoluta del servidor
    try {
        const serverUrl = `http://localhost:3000${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
        return await loadImage(serverUrl);
    } catch (e) {
        console.warn(`[ImageLoader] Failed to load from server ${imagePath}:`, e.message);
    }

    // Si hay fallback, intentarlo
    if (fallbackPath) {
        return await loadImageFromPath(fallbackPath);
    }

    throw new Error(`Could not load image: ${imagePath}`);
}

