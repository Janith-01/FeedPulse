type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number | null = null;

  private readonly failureThreshold: number;
  private readonly recoveryTimeMs: number;

  constructor(failureThreshold = 5, recoveryTimeSec = 60) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeMs = recoveryTimeSec * 1000;
  }

  /**
   * Returns true if calls should be blocked (circuit is OPEN and
   * recovery timeout hasn't elapsed). Automatically transitions
   * from OPEN → HALF-OPEN when the timeout expires.
   */
  isOpen(): boolean {
    if (this.state === 'CLOSED') return false;

    if (this.state === 'OPEN' && this.lastFailureTime) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.recoveryTimeMs) {
        this.state = 'HALF-OPEN';
        console.log('[CircuitBreaker] Transitioning to HALF-OPEN — allowing test call');
        return false; // allow one test call
      }
    }

    if (this.state === 'HALF-OPEN') return false; // allow the test call

    return true; // OPEN and timeout not yet elapsed
  }

  /** Call when an external request succeeds. */
  onSuccess(): void {
    if (this.state === 'HALF-OPEN') {
      console.log('[CircuitBreaker] Test call succeeded — circuit CLOSED');
    }
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /** Call when an external request fails. */
  onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF-OPEN') {
      // Test call failed — trip back to OPEN
      this.state = 'OPEN';
      console.log('[CircuitBreaker] HALF-OPEN test call failed — circuit OPEN for another 60s');
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log(
        `[CircuitBreaker] ${this.failureCount} consecutive failures — circuit OPEN`
      );
    }
  }

  /** Returns the current state for the health endpoint. */
  getStatus(): {
    circuit: CircuitState;
    failureCount: number;
    nextRetryAt: string | null;
  } {
    let nextRetryAt: string | null = null;

    if (this.state === 'OPEN' && this.lastFailureTime) {
      const retryTimestamp = this.lastFailureTime + this.recoveryTimeMs;
      nextRetryAt = new Date(retryTimestamp).toISOString();
    }

    return {
      circuit: this.state,
      failureCount: this.failureCount,
      nextRetryAt,
    };
  }
}

// Shared singleton for the Gemini AI service
export const geminiBreaker = new CircuitBreaker(5, 60);
