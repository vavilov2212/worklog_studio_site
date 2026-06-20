import { describe, it, expect, vi } from 'vitest';

const { limit } = vi.hoisted(() => ({ limit: vi.fn() }));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    limit = limit;
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn().mockReturnValue({}) },
}));

import { checkRateLimit } from './ratelimit';

describe('checkRateLimit', () => {
  it('returns success: true when under the limit', async () => {
    limit.mockResolvedValue({ success: true });
    const result = await checkRateLimit('1.2.3.4');
    expect(result).toEqual({ success: true });
  });

  it('returns success: false when over the limit', async () => {
    limit.mockResolvedValue({ success: false });
    const result = await checkRateLimit('1.2.3.4');
    expect(result).toEqual({ success: false });
  });
});
