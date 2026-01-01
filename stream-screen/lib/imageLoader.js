// Top-level imports removed for client-side compatibility

/**
 * Helper para cargar imágenes desde diferentes fuentes
 * Optimizado para Skia-Canvas y entornos Next.js
 */
export async function loadImageFromPath(imagePath, fallbackPath = null) {
    const isServer = typeof window === 'undefined';

    // Dynamic imports for Node-only modules
    const fsMod = 'fs';
    const pathMod = 'path';
    const skiaMod = 'skia-canvas';
    const fs = isServer ? await import(fsMod) : null;
    const path = isServer ? await import(pathMod) : null;
    const skia = isServer ? await import(skiaMod) : null;

    // Browser loadImage fallback
    const browserLoadImage = (src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });

    const _loadImage = isServer ? skia.loadImage : browserLoadImage;
    if (!imagePath) {
        if (fallbackPath) {
            return await loadImageFromPath(fallbackPath);
        }
        throw new Error('No image path provided');
    }

    // Si es URL HTTP/HTTPS, cargar directamente
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        try {
            return await _loadImage(imagePath);
        } catch (e) {
            console.warn(`[ImageLoader] Failed to load URL ${imagePath}:`, e.message);
            if (fallbackPath) {
                return await loadImageFromPath(fallbackPath);
            }
            throw e;
        }
    }

    // Si es ruta relativa, buscar en public folder
    if (isServer) {
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        const publicPath = path.join(process.cwd(), 'public', cleanPath);

        if (fs && fs.existsSync(publicPath)) {
            try {
                return await skia.loadImage(publicPath);
            } catch (e) {
                console.warn(`[ImageLoader] Failed to load ${publicPath}:`, e.message);
            }
        }
    }

    // Intentar como URL absoluta del servidor
    try {
        const serverUrl = `http://localhost:3000${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
        return await _loadImage(serverUrl);
    } catch (e) {
        console.warn(`[ImageLoader] Failed to load from server ${imagePath}:`, e.message);
    }

    // Si hay fallback, intentarlo
    if (fallbackPath) {
        return await loadImageFromPath(fallbackPath);
    }

    throw new Error(`Could not load image: ${imagePath}`);
}




