---
name: Reel Studio architecture
description: Key design decisions, canvas rendering constraints, and wiring patterns for the Reel Studio editor
---

## Video Renderer (video-renderer.ts)

**Text effects run frame-by-frame on Canvas2D:**
- `drawQuoteScene(ctx, cfg, W, H, ms, timing)` — ms and SceneTiming are required params so effects can use scene progress
- Typewriter: cumulative char count across wrapped lines, clip/reveal based on `(ms - peakStart) / (peakEnd - peakStart)`
- Wave: per-line Y offset via `sin(ms * 0.0025 + i * 1.1)`
- Bounce: spring offset during `fadeIn → peakStart` only, no animation at peak
- Glow: `ctx.shadowBlur` pulsing; must reset to 0 after drawing

**Wipe transition uses ctx.clip() inside drawFrame's per-scene save/restore:**
- Each scene is wrapped in `ctx.save() ... ctx.restore()`, so clip state is safely isolated — no extra save/restore needed inside applyTransition

**Why:** Canvas2D has no built-in keyframe animation. All motion must be derived from `ms` deterministically so the MediaRecorder produces correct frames.

## CreateReel.tsx

**useCallback deps must include all new export-affecting state:**
- `handleExportVideo` deps: `[...existing..., textEffect, fontSizeScale, textPosition, textAlignMode]`
- Forgetting these causes stale closures — user changes controls, export still uses old values

**Why:** React useCallback captures state at definition time; export config reads state directly from closure.

## BulkImport.tsx

**Sequential await (not Promise.all) for batch import:**
- Each `createReel.mutate` is wrapped in a Promise and awaited before the next — avoids race conditions on the same mutation reference
- Success/failure counts come from final entry `.status` values, not a simple processed counter

**CSV parsing priority order:** JSON array → CSV (comma or semicolon) → plain quote lines
- Strips smart quotes, leading/trailing quotes from each field

## Routes

- `/templates` was removed; replaced by `/import` → `BulkImport`
- Sidebar icon: `Upload` from lucide-react
