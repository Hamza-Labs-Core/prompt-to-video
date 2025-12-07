import type { Env } from '../types';

/**
 * Storage service for R2 operations
 */
export class StorageService {
  private bucket: R2Bucket;

  constructor(bucket: R2Bucket) {
    this.bucket = bucket;
  }

  /**
   * Download a file from URL and upload to R2
   */
  async uploadFromUrl(url: string, key: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.arrayBuffer();

    await this.bucket.put(key, body, {
      httpMetadata: {
        contentType,
      },
    });

    return key;
  }

  /**
   * Upload raw data to R2
   */
  async upload(key: string, data: ArrayBuffer | ReadableStream, contentType: string): Promise<string> {
    await this.bucket.put(key, data, {
      httpMetadata: {
        contentType,
      },
    });

    return key;
  }

  /**
   * Get a file from R2
   */
  async get(key: string): Promise<R2ObjectBody | null> {
    return this.bucket.get(key);
  }

  /**
   * Delete a file from R2
   */
  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  /**
   * Generate a public URL for an R2 object (requires public bucket or presigned URL)
   * For now, we'll use the direct fal.ai/creatomate URLs since they're temporary
   */
  getPublicUrl(key: string, bucketPublicUrl?: string): string {
    if (bucketPublicUrl) {
      return `${bucketPublicUrl}/${key}`;
    }
    // Fallback - you'll need to configure R2 public access or use presigned URLs
    return key;
  }

  /**
   * Generate a unique key for a file
   */
  static generateKey(jobId: string, type: 'image' | 'video', sceneId: number, suffix: string): string {
    return `jobs/${jobId}/scenes/${sceneId}/${type}_${suffix}`;
  }

  /**
   * Generate key for final compiled video
   */
  static generateFinalKey(jobId: string): string {
    return `jobs/${jobId}/final/output.mp4`;
  }
}
