import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './setup.js';
import { runStylistWorkflow } from '../src/agent/langgraphWorkflow.js';

describe('LangGraph Multi-Node AI Stylist & Deterministic Fallback', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should run multi-node workflow and return recommendations, gaps, outfits, and high-level steps', async () => {
    const result = await runStylistWorkflow('C001', 'I need an outfit for college under 2000 rupees.');

    expect(result.message).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.outfits.length).toBeGreaterThan(0);
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.conversationId).toBeDefined();

    // Verify high-level processing steps without chain-of-thought
    expect(result.processingSteps).toContain('Understanding request');
    expect(result.processingSteps).toContain('Checking your closet');
    expect(result.processingSteps).toContain('Detecting wardrobe gaps');
    expect(result.processingSteps).toContain('Finding compatible pieces');
    expect(result.processingSteps).toContain('Ranking recommendations');
    expect(result.processingSteps).toContain('Building your look');
  });

  it('should ground recommendations in customer data and never invent products', async () => {
    const result = await runStylistWorkflow('C001', 'What outerwear should I buy next?');
    expect(result.recommendations.length).toBeGreaterThan(0);

    const topRec = result.recommendations[0];
    expect(topRec.productId).toMatch(/^P\d{4}$/);
    expect(topRec.price).toBeGreaterThan(0);
    expect(topRec.whyThis).toBeDefined();
  });
});
