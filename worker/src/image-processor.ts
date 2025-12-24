import sharp from 'sharp';
import { config } from './config.js';

export interface ProcessImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Process image: resize, compress, convert format
 */
export async function processImage(
    inputBuffer: Buffer,
    options: ProcessImageOptions = {}
): Promise<Buffer> {
    const {
        width = 1024,
        height = 1024,
        quality = config.image.quality,
        format = config.image.format,
    } = options;

    console.log(`Processing image: ${width}x${height} ${format} @ ${quality}%`);

    let pipeline = sharp(inputBuffer)
        .resize(width, height, {
            fit: 'cover',
            position: 'center',
        });

    // Apply format-specific compression
    switch (format) {
        case 'webp':
            pipeline = pipeline.webp({ quality });
            break;
        case 'jpeg':
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
            break;
        case 'png':
            pipeline = pipeline.png({ quality, compressionLevel: 9 });
            break;
    }

    return pipeline.toBuffer();
}
