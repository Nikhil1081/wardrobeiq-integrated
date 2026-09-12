import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './setup.js';
import { createApp } from '../src/app.js';
import http from 'http';

let server: http.Server;
let baseUrl: string;

describe('End-to-End Express API Route Contracts', () => {
  beforeAll(async () => {
    await setupTestDB();
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await teardownTestDB();
  });

  it('GET /health returns healthy', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('healthy');
  });

  it('GET /api/v1/home/:customerId returns unified DashboardDTO BFF response', async () => {
    const res = await fetch(`${baseUrl}/api/v1/home/C001`);
    expect(res.status).toBe(200);
    const { data } = await res.json();

    expect(data.customer.customerId).toBe('C001');
    expect(data.greeting).toBeDefined();
    expect(data.profileSummary).toBeDefined();
    expect(data.wardrobeStatistics).toBeDefined();
    expect(data.wardrobeHealth.overallScore).toBeGreaterThanOrEqual(10);
    expect(data.topWardrobeGaps.length).toBeGreaterThan(0);
    expect(data.recommendedProducts.length).toBeGreaterThan(0);
    expect(data.recommendedOutfits.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/closet/:customerId supports category filtering and pagination', async () => {
    const res = await fetch(`${baseUrl}/api/v1/closet/C001?category=top`);
    expect(res.status).toBe(200);
    const { data, meta } = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.every((i: any) => i.category === 'top')).toBe(true);
    expect(meta.total).toBeGreaterThan(0);
  });

  it('POST & DELETE /api/v1/closet/:customerId performs closet mutation with live health recalculation', async () => {
    // Add item
    const postRes = await fetch(`${baseUrl}/api/v1/closet/C001`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Midnight Velvet Blazer',
        category: 'outerwear',
        subcategory: 'blazer',
        color: 'black',
        styleTags: ['smart-casual', 'formal'],
        occasion: ['workwear', 'party'],
        season: ['winter'],
        price: 4999,
        store: 'Zara',
        isCustom: false,
      }),
    });
    expect(postRes.status).toBe(201);
    const postJson = await postRes.json();
    expect(postJson.data.item.itemId).toBeDefined();
    expect(postJson.data.updatedHealth).toBeDefined();
    expect(postJson.data.updatedGaps).toBeDefined();

    const newItemId = postJson.data.item.itemId;

    // Delete item
    const delRes = await fetch(`${baseUrl}/api/v1/closet/C001/${newItemId}`, {
      method: 'DELETE',
    });
    expect(delRes.status).toBe(200);
    const delJson = await delRes.json();
    expect(delJson.data.success).toBe(true);
    expect(delJson.data.deletedItemId).toBe(newItemId);
  });

  it('GET /api/v1/gaps/:customerId and /:gapId return gaps and drawer detail', async () => {
    const gapsRes = await fetch(`${baseUrl}/api/v1/gaps/C001`);
    expect(gapsRes.status).toBe(200);
    const { data: gaps } = await gapsRes.json();
    expect(gaps.length).toBeGreaterThan(0);

    const firstGapId = gaps[0].gapId;
    const detailRes = await fetch(`${baseUrl}/api/v1/gaps/C001/${firstGapId}`);
    expect(detailRes.status).toBe(200);
    const { data: detail } = await detailRes.json();
    expect(detail.gap.gapId).toBe(firstGapId);
    expect(detail.compatibleProducts.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/recommendations and GET /explanation return recommendations with score breakdown', async () => {
    const recRes = await fetch(`${baseUrl}/api/v1/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'C001',
        query: 'casual shirts for college',
      }),
    });
    expect(recRes.status).toBe(200);
    const { data: recData } = await recRes.json();
    expect(recData.recommendations.length).toBeGreaterThan(0);

    const topProduct = recData.recommendations[0];
    expect(topProduct.scoreBreakdown).toBeDefined();

    // Test explanation endpoint
    const expRes = await fetch(
      `${baseUrl}/api/v1/recommendations/C001/${topProduct.productId}/explanation`
    );
    expect(expRes.status).toBe(200);
    const { data: explanation } = await expRes.json();
    expect(explanation.productId).toBe(topProduct.productId);
    expect(explanation.styleReason).toBeDefined();
  });

  it('POST /api/v1/outfits/generate, replace, and shuffle works', async () => {
    // Generate
    const genRes = await fetch(`${baseUrl}/api/v1/outfits/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'C001',
        occasion: 'casual',
        season: 'winter',
        budget: 4000,
      }),
    });
    expect(genRes.status).toBe(201);
    const { data: outfit } = await genRes.json();
    expect(outfit.items.length).toBeGreaterThanOrEqual(3);

    // Replace
    const repRes = await fetch(`${baseUrl}/api/v1/outfits/replace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'C001',
        outfit,
        slot: outfit.items[0].slot,
      }),
    });
    expect(repRes.status).toBe(200);
    const { data: repData } = await repRes.json();
    expect(repData.replacementItem).toBeDefined();

    // Shuffle
    const shufRes = await fetch(`${baseUrl}/api/v1/outfits/shuffle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'C001',
        occasion: 'casual',
        season: 'winter',
        budget: 4000,
        lockedItems: [{ ...outfit.items[0], locked: true }],
      }),
    });
    expect(shufRes.status).toBe(200);
    const { data: shufData } = await shufRes.json();
    expect(shufData.items.length).toBeGreaterThanOrEqual(3);
  });

  it('POST, GET, and DELETE /api/v1/saved/:customerId persists saved products', async () => {
    const prodId = 'P0010';

    // Save
    const saveRes = await fetch(`${baseUrl}/api/v1/saved/C001/${prodId}`, { method: 'POST' });
    expect(saveRes.status).toBe(201);

    // Get
    const getRes = await fetch(`${baseUrl}/api/v1/saved/C001`);
    expect(getRes.status).toBe(200);
    const { data } = await getRes.json();
    expect(data.savedProducts.some((p: any) => p.productId === prodId)).toBe(true);

    // Remove
    const delRes = await fetch(`${baseUrl}/api/v1/saved/C001/${prodId}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);
  });

  it('POST & GET /api/v1/feedback persists love and not_for_me signals', async () => {
    const postRes = await fetch(`${baseUrl}/api/v1/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'C001',
        productId: 'P0015',
        type: 'love',
      }),
    });
    expect(postRes.status).toBe(201);

    const getRes = await fetch(`${baseUrl}/api/v1/feedback/C001`);
    expect(getRes.status).toBe(200);
    const { data } = await getRes.json();
    expect(data.loved).toContain('P0015');
  });

  it('POST & GET /api/v1/browsing records telemetry and returns activity', async () => {
    const postRes = await fetch(`${baseUrl}/api/v1/browsing/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'C001',
        productId: 'P0020',
        eventType: 'viewed',
      }),
    });
    expect(postRes.status).toBe(201);

    const getRes = await fetch(`${baseUrl}/api/v1/browsing/C001`);
    expect(getRes.status).toBe(200);
    const { data } = await getRes.json();
    expect(data.recentEvents.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/explore returns 8 curated themed product collections', async () => {
    const res = await fetch(`${baseUrl}/api/v1/explore`);
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.trending).toBeDefined();
    expect(data.seasonal).toBeDefined();
    expect(data.college).toBeDefined();
    expect(data.minimal).toBeDefined();
    expect(data.weekend).toBeDefined();
    expect(data.dateNight).toBeDefined();
    expect(data.workwear).toBeDefined();
    expect(data.monsoon).toBeDefined();
  });

  it('POST /api/v1/ai/stylist runs LangGraph pipeline and returns high-level steps', async () => {
    const res = await fetch(`${baseUrl}/api/v1/ai/stylist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'C001',
        message: 'Can you recommend an outfit for college?',
      }),
    });
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.message).toBeDefined();
    expect(data.recommendations.length).toBeGreaterThan(0);
    expect(data.outfits.length).toBeGreaterThan(0);
    expect(data.processingSteps).toContain('Building your look');
  });

  it('verifies legacy routes /api/wardrobe/dashboard/:customerId and /api/explore continue working', async () => {
    const dashRes = await fetch(`${baseUrl}/api/wardrobe/dashboard/C001`);
    expect(dashRes.status).toBe(200);
    const { data: dashData } = await dashRes.json();
    expect(dashData.customer.customerId).toBe('C001');

    const expRes = await fetch(`${baseUrl}/api/explore`);
    expect(expRes.status).toBe(200);
  });
});
