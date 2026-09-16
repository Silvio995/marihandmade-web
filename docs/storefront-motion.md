# Homepage visual and motion milestone

The homepage now uses a warm editorial composition: a larger hero, a quiet moving value strip, staggered category discovery, real featured catalog cards, two alternating image-led stories, atelier values, the existing disabled newsletter, and footer.

## Architecture and scope

`src/app/page.tsx` remains a server component and retains the existing concurrent HTTP category/product reads. `CatalogSections.tsx` continues rendering DTO-driven products and category links on the server. The existing `HeroCarousel.tsx` and header remain client components. New client boundaries are `MotionReveal.tsx` and `ValueMarquee.tsx`; server-rendered content is passed through the reveal wrapper as children.

`MotionReveal` uses Framer Motion `LazyMotion`, lightweight `m` components, and asynchronously loaded `domAnimation` from `motion-features.ts`. It observes groups rather than every paragraph. Initial markup is visible; missing JavaScript or IntersectionObserver does not hide content. Animation uses opacity and a 12px translation, once per group, with a 90ms child stagger and 750ms easing. CSS effects live under storefront classes in `globals.css`. Product hover styles are scoped to the homepage.

## Interaction and visual behavior

- Hero: existing Embla swipe/drag, a smooth manual slide transition, staggered HTML text, a seven-second 2.5% image scale settling to its natural crop, animated pagination, round 44px controls, and CTA arrow movement. No autoplay was added. Hover/focus pauses image drift. Left/right arrow keys operate the focused carousel. Inactive CTAs stay outside the tab order, with slide announcements and one page h1.
- Categories: larger images, offset desktop placement, overlapping cream copy panels, grouped entrance, 3.5% hover zoom, 4px copy lift and a moving CTA arrow. Titles and routes continue to come from real category DTOs.
- Products: real catalog images, prices, availability and detail links remain intact. A small hover lift, image zoom and link-color transition refine existing cards. No quick-add, wishlist mutation, or new business action was introduced; header wishlist/cart icons gain presentation-only hover feedback.
- Editorial: separate full-width warm backgrounds, oversized type, alternating image/text direction, grouped reveals and gentle image hover scale. The clutch image has an arched frame. Centralized focal points are now 85% center for featured Borse and 75% center for Clutch to keep subjects visible in the taller frames. Clutch remains a style and links to the real Borse route or catalog fallback.
- Marquee: one 45-second linear track with duplicate visual content hidden from assistive technology. A single accessible text equivalent remains. Hover, keyboard focus and an explicit pause/resume button stop movement.
- Header: animated nav underline, icon lift, and search focus color. Existing search, menu, cart count and account links are unchanged. Header remains in normal flow.

## Reduced motion and mobile

CSS disables decorative keyframes and transitions under `prefers-reduced-motion`. Framer reveals stay fully visible without transforms, Embla changes slides instantly, and the marquee becomes one static wrapping value strip. Hero image drift and hover translations stop. Mobile uses stacked hero copy/images, a 285px image frame, smaller type and spacing, single-column categories/stories, and 44px carousel controls. No scroll hijacking, scroll-linked parallax, WebGL, new fonts or dependencies were added.

## Performance and preserved behavior

All seven original campaign assets remain centralized in `src/data/storefront.ts`, without duplicate files. The existing `category_borse.png` `unoptimized: true` workaround is preserved; its approximately 2.4 MB original PNG remains the known image cost. Other assets retain Next Image optimization, reserved dimensions and responsive sizes. Only the first hero image is prioritized. The production build reports 125 kB initial homepage JavaScript, up from the prior 109 kB (the first implementation was 148 kB before feature splitting). Motion adds a deferred feature chunk; other UI effects use CSS transforms/opacity rather than layout animation.

No API contracts, backend integrations, auth, cart, wishlist, checkout, profile, orders, payment, Prisma code, schema, database access, or sibling repositories were changed. No database commands or mutations were performed. Browser validation uses the existing local fixture HTTP server with an unreachable database URL, not live catalog data.

## Validation artifacts

Tests: 26 passing across 6 files. Lint: no warnings/errors. Strict typecheck and production build: pass. Chromium checks pass at 1440, 1200, 820 and 390px: all seven assets return HTTP 200 and load, no horizontal overflow, one h1, working scroll reveals, keyboard navigation and marquee pause. Reduced-motion and JavaScript-disabled content remain visible. No browser runtime exceptions were recorded.

- `.motion-tests.log`: test suite including carousel keyboard navigation and marquee pause/resume coverage.
- `.motion-lint.log`, `.motion-types.log`, `.motion-build.log`: lint, strict TypeScript and production build.
- `.motion-browser-check.cjs` / `.motion-browser.log`: 1440, 1200, 820 and 390px image/layout checks, keyboard carousel interaction, marquee pause, reduced-motion and runtime errors.
- `.motion-*.jpg`: responsive hero, category, product and editorial screenshots. Product screenshots show the existing test fixture.

## Resumed verification — 2026-09-11

Inspected the existing working tree, homepage components, catalog reads, motion styles, and saved validation artifacts before proceeding. The repository has no commits and all project files are untracked, so a historical diff cannot identify the previous run's exact changes. The original conversation prompt was unavailable; this saved milestone supplied the recoverable scope.

No unfinished implementation or failing behavior was found within that scope. Existing application code and business logic were preserved without edits. The remaining work was fresh verification and this handoff.

Fresh validation passed: 26 tests across six files, lint without warnings/errors, explicit `npm run typecheck -- --strict`, and production build (125 kB first-load homepage JavaScript). The existing Chromium script passed at 1440, 1200, 820, and 390px, including seven loaded campaign assets, no horizontal overflow, one h1, active scroll reveals, keyboard carousel navigation, marquee pause, reduced motion, JavaScript-disabled visibility, and no runtime exceptions. Mobile hero and desktop editorial screenshots were also visually inspected. Logs and screenshots listed above were refreshed.

Browser checks used the existing local catalog HTTP fixture; live backend availability was not validated. The build and preview used unreachable database URLs. No database commands ran, and no sibling repositories, Prisma files, auth, cart, checkout, or payment implementations were modified during this continuation. The previously documented large category PNG remains unchanged.
