const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const CLEANUP_INTERVAL_MS = 60 * 1000; // clean up every minute

interface Entry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private attempts = new Map<string, Entry>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Allow Node to exit even if the timer is still running
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  check(key: string): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now >= entry.resetAt) {
      return { allowed: true, retryAfter: 0 };
    }

    if (entry.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true, retryAfter: 0 };
  }

  increment(key: string): void {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry || now >= entry.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts) {
      if (now >= entry.resetAt) {
        this.attempts.delete(key);
      }
    }
  }
}

export const loginRateLimiter = new RateLimiter();
