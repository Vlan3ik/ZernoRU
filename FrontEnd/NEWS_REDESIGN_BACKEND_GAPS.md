# News redesign backend gaps

This file documents data that the redesigned frontend can render today only with local heuristics or static presentation fallbacks.

## News article contract gaps

- Full article body content for `/news/:id`:
  - structured text blocks or markdown/html body
  - subheadings, quotes, lists, and callouts
- Article metadata:
  - `sourceName`
  - `authorName`
  - `readingTimeMinutes`
  - canonical `tags[]`
  - `updatedAt`
  - `relatedIds`
- Editorial surface data:
  - pinned/featured flag for hero selection
  - section ordering / priority
  - article summary for card secondary text

## News dashboard gaps

- Server-side aggregates for the news hero and rail widgets:
  - today's publish count
  - section counters
  - topic counters
  - market/widget snapshots for exchanges, indices, logistics, and duties
- Dedicated response shape for sidebar blocks instead of deriving them from general `prices` and `referenceCatalogs`

## Marketplace gaps

- Service catalog / featured service offers should come from backend content instead of local presentation constants.

## Media gaps

- Optional `imageCaption` / `altText` metadata for news images.

## Frontend fallback policy

- Use `imageUrl` from snapshot first.
- Derive reading time, counts, and related-news selection locally only until the backend contract is expanded.
- Keep route structure unchanged in this iteration.
