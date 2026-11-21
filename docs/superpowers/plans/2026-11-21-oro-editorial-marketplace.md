# ORO editorial redesign

The marketplace keeps the ORO name and introduces a condensed masthead, white paper, near-black ink, graphite secondary text, and a restrained brick-red accent for editorial labels. The front page reads left to right on desktop, with an illustrated clothing feature, a narrower CS2 feature and collection stories, and a ruled editorial picks rail. Tablet moves the rail below the features. Mobile keeps the lead feature first and uses smaller landscape images for secondary stories.

1. Build the shared shell and editorial homepage. Keep theme and locale controls, existing destinations, and buying guidance. Use original campaign imagery and anonymous public seller reads for new arrivals. Keep curated picks explicitly editorial.
2. Refresh the live and sample catalogs and product pages. Add URL-based cross-category search using the existing server-side title query. Reuse seller listing display and price formatting, and retain availability and offer checks.
3. Bring account entry, profile, order checkout, and the sample cart into the design system. Keep the latest retirement of the archived storefront homepage and link to the retained sample catalog and cart. Keep account actions, Supabase contracts, and browser cart storage in place.
4. Run strict TypeScript, lint, unit tests, production build, and Chromium Playwright across the three existing viewport projects. Verify search, sample cart, locale paths, responsive layouts, and accessibility. Record browser evidence in PROJECT_PROGRESS.md.
