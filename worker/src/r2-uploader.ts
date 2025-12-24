import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from './config.js';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
    },
});

/**
 * Upload image to Cloudflare R2
 */
export async function uploadToR2(
    recipeId: string,
    imageBuffer: Buffer,
    format: string = 'webp'
): Promise<string> {
    const key = `recipes/${recipeId}/hero.${format}`;

    console.log(`Uploading to R2: ${key}`);

    const command = new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: `image/${format}`,
        CacheControl: 'public, max-age=31536000, immutable',
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = `${config.r2.publicUrl}/${key}`;
    console.log(`Uploaded successfully: ${publicUrl}`);

    return publicUrl;
}
