import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './setup.js';
import {
  getCustomersSummary,
  getCustomerProfileService,
  updateCustomerProfileService,
} from '../src/services/customer.service.js';

describe('Customer Profile Operations', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should list customer summaries with avatar and preferredStyles', async () => {
    const customers = await getCustomersSummary();
    expect(customers.length).toBeGreaterThanOrEqual(10);
    expect(customers[0]).toHaveProperty('customerId');
    expect(customers[0]).toHaveProperty('name');
    expect(customers[0]).toHaveProperty('avatar');
    expect(customers[0]).toHaveProperty('preferredStyles');
  });

  it('should retrieve full customer profile for C001', async () => {
    const customer = await getCustomerProfileService('C001');
    expect(customer.customerId).toBe('C001');
    expect(customer.name).toBe('Aarav Sharma');
    expect(customer.budget).toBe(2500);
    expect(customer.preferredStyles).toContain('streetwear');
  });

  it('should update customer preferences via PATCH', async () => {
    const updated = await updateCustomerProfileService('C001', {
      budget: 3500,
      avoidedColors: ['neon', 'pink', 'magenta'],
    });

    expect(updated.budget).toBe(3500);
    expect(updated.avoidedColors).toContain('magenta');

    // Verify persistence
    const refetched = await getCustomerProfileService('C001');
    expect(refetched.budget).toBe(3500);
  });
});
