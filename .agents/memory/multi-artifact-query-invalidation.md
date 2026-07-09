---
name: Multi-artifact query invalidation
description: How to invalidate React Query data from the generated shared API client in mobile and web artifacts.
---

When an app consumes the generated React Query client from `@workspace/api-client-react`, the generated hook keys are **not** the operation ID string. For example, the `useListReels` hook uses a key built from the request path and query parameters, not `['listReels']`.

Invalidating the wrong key leaves the UI stale after mutations. This was observed in the Reel Studio mobile artifact, where mutations invalidated `['listReels']` instead of the generated key.

**Rule:** Always import the generated query-key function and pass the returned array to `invalidateQueries`:

```ts
import { getListReelsQueryKey, getGetStatsQueryKey, getGetRecentReelsQueryKey } from "@workspace/api-client-react";

queryClient.invalidateQueries({ queryKey: getListReelsQueryKey() });
```

**Why:** The generated client owns the key structure. Using bare strings only works if the generated key happens to match, which is brittle and broke during an Orval upgrade.

**How to apply:**
- In every mobile/web artifact using the shared API client, search for `queryKey: [` and replace with the matching generated `get...QueryKey` call.
- Keep a helper `invalidateReels()` near the hooks so mutations share the same invalidations and updates are reflected in the UI immediately.
