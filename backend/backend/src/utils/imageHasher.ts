import crypto from 'crypto';

export function computeImageHash(imageUrl: string): string {
  // Normalize Unsplash or CDN parameters to identify the core image asset
  let cleanKey = imageUrl.trim().toLowerCase();
  try {
    const parsed = new URL(imageUrl);
    // For Unsplash images, photo ID is in pathname
    if (parsed.hostname.includes('unsplash.com')) {
      cleanKey = `unsplash_${parsed.pathname}${parsed.search}`;
    } else {
      cleanKey = `${parsed.hostname}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Fallback to raw string
  }

  return crypto.createHash('sha256').update(cleanKey).digest('hex').substring(0, 16);
}

export function detectDuplicates(items: Array<{ id: string; name: string; imageUrl: string }>): {
  uniqueCount: number;
  duplicateGroups: Record<string, string[]>;
} {
  const hashMap: Record<string, string[]> = {};
  for (const item of items) {
    if (!item.imageUrl) continue;
    const hash = computeImageHash(item.imageUrl);
    if (!hashMap[hash]) {
      hashMap[hash] = [];
    }
    hashMap[hash].push(item.id);
  }

  const duplicateGroups: Record<string, string[]> = {};
  let uniqueCount = 0;
  for (const [hash, ids] of Object.entries(hashMap)) {
    if (ids.length > 1) {
      duplicateGroups[hash] = ids;
    } else {
      uniqueCount++;
    }
  }

  return { uniqueCount, duplicateGroups };
}
