---
name: Bulk import counters
description: Correctly count async batch import successes and failures without relying on stale React state.
---

When a bulk import loop fires many mutations and updates entry status via `setEntries((prev) => ...)` inside callbacks, the `entries` variable captured in the outer function is **stale** by the end of the loop. Counting final statuses from that snapshot produces wrong totals (often 0 successes even after successful imports).

**Rule:** Track success/failure counts with local variables inside the import function, incrementing them directly in the mutation `onSuccess`/`onError` callbacks:

```ts
let successCount = 0;
let failCount = 0;

for (const entry of pending) {
  createReel.mutate(data, {
    onSuccess: () => { successCount++; /* ... */ },
    onError: () => { failCount++; /* ... */ },
  });
}

// Use successCount / failCount for the toast message
```

**Why:** React state updates are scheduled, not synchronous. The closure captures the state at the start of the event loop tick, not after all batched updates have flushed. Local variables are synchronous and authoritative.

**How to apply:**
- Use local counters for any batch operation that needs to report a final tally.
- Keep the UI progress state in React state for rendering, but use counters for final reporting.
- Avoid reading derived totals from the same state that was just updated asynchronously.
