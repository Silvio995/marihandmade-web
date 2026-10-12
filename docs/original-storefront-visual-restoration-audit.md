# Original storefront visual restoration audit

Audit date: 2026-10-06. Phase 1: local, read-only source and asset comparison; this report is the sole authorized addition. NEW branch verified as `feat/restore-storefront-design`; initial working tree was clean.

Path convention throughout: **OLD** = `/home/dci-student/projects/mariHandmade/apps/storefront`; **NEW** = `/home/dci-student/projects/marihandmade-web`. Paths below are relative to the indicated root. Source evidence describes these local checkouts, not a verified production build. No production, database, Backend service, external media, or deployed site was accessed. No app was started, packages installed, or application/assets changed.

## A. Executive summary

Restore the original homepage's four-part composition: centered Fool illustration and Marì signature on warm ivory → full-width photographic carousel → custom-creations text and video → beige portrait collections. The NEW split hero, value marquee, featured products, two bag stories, service-value grid, and newsletter are absent from the active OLD homepage. Their removal from homepage composition is proposed, not performed.

The largest differences are homepage composition, multi-row header, footer structure, and heading font. Catalog/category retail cards and product detail already retain much of the OLD presentation. Avoid rewriting these functional screens. `HomeMediaCarousel.tsx` is byte-identical in OLD and NEW, so it can be reactivated rather than ported, with accessibility improvements.

The historical colors are verified in active OLD source: `#f8f3ea` opening; `#f4ede3` homepage wrapper; `#f1e9df` collections; `#1f1713` text/CTA; `#6f5c4d` eyebrows/footer text. OLD's header white text on the ivory opening is a source-level contrast problem, not a visual requirement to preserve.

Backend categories must supply collection identities, titles, and links. OLD's four hardcoded collections are visual examples only. No live category list was fetched; neither an enum, a campaign key, nor a fixture proves a current database category. In particular, NEW's clutch story already targets Borse; it does not define a Clutch category.

## B. Old vs New design system comparison

| Area | OLD source and actual presentation | NEW source and actual presentation | Proposed treatment / protected behavior |
|---|---|---|---|
| Root shell | `src/app/layout.tsx`: body `bg-brand-background` (`#F5F1EA`), `text-brand-dark` (`#4A4A4A`); fixed header; outer `main.pt-24` | Same target: local Inter, `bg-shop-cream`, `text-shop-ink`; relative header; plain children div; server `getCategories()` with empty fallback; `force-dynamic` | Visual-only shell adjustment if fixed header is chosen. Retain server category read, dynamic mode, Providers, Italian language, metadata ownership; one semantic main per page rather than OLD nested mains |
| Font | Layout calls the variable `--font-playfair` but loads `public/fonts/Yekan/Yekan.woff`. `globals.css` assigns it to h1–h3. Tailwind sans names `Inter`, but OLD layout does not load its existing Inter file | Layout actually loads Inter WOFF2 as `--font-inter`; headings inherit; homepage adds Georgia/system serif through specific classes | Inspect Latin/accented glyph rendering before adopting Yekan. It is not a Playfair font file. Restore verified heading appearance selectively; retain NEW reliable body font loading |
| Core tokens | `globals.css`: white/near-black HSL UI tokens, radius 0.5rem, light/dark variables; smooth scroll | Same core HSL values/radius; additional global focus outline and reduced-motion smooth-scroll override | Keep shared UI tokens stable; add/adjust storefront presentation tokens rather than recolor commerce/auth controls indiscriminately |
| Palette | OLD `page.tsx` warm colors above; copy `#4f4035`; footer `#efe4d8`; collection base `#e5d5c5`; borders `#d8c9b9`, `#d4c2b0` | `tailwind.config.js` shop: cream `#f8f5ef`, paper `#fffdf9`, sand `#eee5d9`, line `#d9cbbc`, ink `#29231f`, muted `#6c5e53`, brown `#79583f` | Visual-only palette alignment in homepage/header/footer. OLD brand palette also exists unchanged in NEW; its existence is not proof it colored the active homepage |
| Containers | OLD opening inner max 820px; custom/footer max 1320px; collection/header max-w-7xl (1280px); Tailwind `.container` 2rem padding, 1400px at 2xl, 1rem at ≤640px | Same Tailwind container config; NEW `components/storefront/layout.tsx` max 1280px with 20/32/40px padding | Restore section-specific widths rather than force one width everywhere. Keep catalog route nesting in view |
| Spacing | Opening 64vh/74vh minimum; custom 64/80px vertical padding; collections separate top margin and 64/80/96px padding | Hero inset with 24/32px top space; categories 84/96px padding; featured bottom 100px; stories 90px | Reconstruct OLD page rhythm from its classes; do not retain redesign spacing simply because its tokens exist |
| Radii | Opening/carousel/custom media square; collections 2.2rem; editorial product cards 28px; retail 12px | Homepage category images square with overlapping copy; second story arched; retail/detail radii largely match OLD | Restore portrait collection radius; preserve existing catalog/detail geometry unless a measured presentation discrepancy remains |
| Buttons/links | OLD custom CTA 44px high, 24px horizontal padding, 11px uppercase/.24em tracking, dark border, inverted hover. `.nav-pill` 11px/.24em, padding .8rem 1rem | NEW hero CTA 52px, 13px mixed case, filled; nav 14px with active underline; global links undecorated in both | Scoped visual styles only; retain actual hrefs, disabled states, action handlers, focus visibility |
| Shared button primitive | `src/components/ui/button.tsx` | Byte-identical file | No primitive replacement needed. Keep Radix Slot, variants, disabled behavior, ref forwarding |
| Motion | OLD nav 300ms; header/mobile collapse 500ms; portrait hover lift/shadow 500ms, scale 1.04/700ms; carousel autoplay | NEW hero entrance 900ms, photo drift 7s, marquee 45s; story/category motion and MotionReveal | Remove redesign-only motion with its page placement; preserve NEW reduced-motion protections and accessible controls |

Both store layouts (`src/app/(store)/layout.tsx`) are byte-identical: children receive horizontal padding 1.4rem, then 4/6/8/12rem at md/lg/xl/2xl. This compounds catalog/detail inner container padding. Do not mistake it for a newly introduced redesign or remove it casually.

## C. Header restoration map

Active OLD header is `src/components/native/nav/parent.tsx`, not the older `desktop.tsx`, `mobile.tsx`, or `sidebar.tsx` helpers. The latter include template/docs navigation and are not a source for restored active navigation.

OLD: fixed top-left, z-50; 96px row; max 1280px; horizontal padding 24px/40px at md. Signature box 110×56px, Image fill/object-cover. Home, Catalogo (`/catalog`), Contatti (`/contact`) with gap 12px, desktop at md (768px). Right side cart icon 20px, gap 12/16px; cart badge counts item rows. Above scrollY 40, header becomes `#f6efe7` at 65% opacity, blur-md, border white/20; otherwise transparent with white navigation/cart text. Mobile dropdown animates max-height 0→320px, ivory at 95%; menu closes when a link is clicked.

NEW: announcement row min 32px, large logo/search/action row, separate category nav row; desktop at lg (1024px). Signature is object-contain, 112×48px then 144×64px. Search GETs `/products?q=...`. Account, wishlist, cart have 44px targets; cart sums quantities; authenticated `UserNav` supports logout/error handling. Category links are encoded Backend slugs; active route has `aria-current`. Mobile has `hidden`, expanded/controls state, Escape closes and restores trigger focus.

**Proposal H1** — OLD `nav/parent.tsx` + OLD `.nav-pill/.nav-icon` in `globals.css` → NEW `nav/parent.tsx` + scoped NEW `globals.css`: restore a single compact row, signature scale, sparse Home/Catalogo/Contatti geometry; remove announcement/search/category rows from this composition, while retaining catalog search access within existing catalog presentation or an accessible compact disclosure. This is presentation/navigation placement only. Preserve search query semantics, Backend category routes, quantity-sum badge, Account `/profile/edit`, Wishlist `/wishlist`, Cart `/cart`, `UserNav` and its logout/session behavior. Category browsing remains reachable through catalog and collections.

**Proposal H2** — same OLD source → same NEW targets, plus NEW root layout only if needed: adapt fixed/transparent visual language with dark text on ivory and a stable light scroll surface. Keep expanded state, `hidden` for closed mobile content, Escape/focus return, correct close label, 44px targets. OLD has no account/wishlist affordances; add the current icons in its restrained language rather than delete functionality. Authenticated logout can be presented compactly without changing its action. If header is fixed, coordinate root offset and detail sticky top; do not blindly add OLD `pt-24` to every nested main.

## D. Homepage exact section map

OLD active `src/app/page.tsx`, with content from `src/data/homepage-editorial.ts`, renders exactly the following inside its homepage div. Root header/footer surround it; the root's 96px top offset precedes the opening.

| Order | OLD rendered content | Precise geometry | NEW correspondence / proposed disposition |
|---|---|---|---|
| 1 | Opening: Fool image then Marì SVG signature, no visible title, copy, or CTA | `#f8f3ea`, centered; min 64vh, md 74vh; px24/40, py40/56; max820 inner; inner margin-top -12/-20px | Replace homepage `HeroCarousel` placement with this opening; preserve NEW semantic main and move its screen-reader h1 into opening |
| 2 | `HomeMediaCarousel`, six historical photos in fixed editorial order | Full viewport width, edge-to-edge, zero gaps | Activate existing identical NEW component with safe editorial data and local assets |
| 3 | `#creazioni-personalizzate`: text left, YouTube right | Max1320; px24/40; py64/80; gap32/40; md columns 1.02fr/.98fr | Restore in NEW page, replacing the redesign's story sequence rather than keeping both |
| 4 | `#collezioni`: eyebrow, heading, subtitle, image-only rounded collection links | `#f1e9df`, top border; mt56/lg80/xl96; py64/lg80/xl96; max1280; headings space16; content space40 | Restyle NEW `CategoryTiles` and place here; use Backend categories, not OLD hardcoded collection records |

Opening Fool: intrinsic declared 380×240, actual responsive width `min(56vw,168px)` then md `min(22vw,228px)`. Signature: declared 240×90, width `min(38vw,100px)` then md `min(13vw,145px)`; margin-top -4/-8px. Both priority. The unused `hero` data object is not the active opening and should not be mistaken for a fifth section.

NEW active order is inset split `HeroCarousel` → `ValueMarquee` → `CategoryTiles` → `FeaturedCatalog` (Backend isFeatured, up to 8, `includeEditorial=false`) → explicitly mounted `EditorialStories` (two bag/clutch stories) → four service values → `NewsletterSection`. None of the last five section types is mounted by OLD home except that categories have an equivalent purpose with a different presentation. Newsletter is currently an explicitly disabled future form, not a working subscription service.

**Proposal P1** — OLD `page.tsx` → NEW `page.tsx`: restore this four-section order, visual-only composition. Preserve `getCategories()` and Backend failure/empty distinctions used by collections; never fill an unavailable catalog with OLD records. Removing the featured section may eliminate its otherwise unused homepage product fetch, but must not alter catalog clients/routes or product filtering elsewhere. Unmount redesign-only sections; do not delete shared components until their callers are checked.

## E. Old carousel behavior

OLD and NEW `src/components/native/HomeMediaCarousel.tsx` are byte-identical. Embla and autoplay dependencies already exist in both package manifests; no dependency change is needed.

| Detail | Verified implementation |
|---|---|
| Width | Section `relative left-1/2 w-screen -translate-x-1/2 overflow-hidden`; viewport width, not inner container width |
| Track | Flex, gap0; default height44vh, min320px/max430px; sm50vh; md54vh; lg62vh/min500/max680; xl64vh |
| Slides | Default flex-basis86vw; sm58vw; lg36vw; xl34vw; h-full and cropped overflow |
| Images | fill, object-cover/object-center, first two priority; uses `mobileImageUrl || imageUrl` at all widths, not breakpoint-specific source switching |
| Image sizes | `(max-width: 640px) 86vw, (max-width: 1024px) 58vw, 34vw`; small boundary mismatches and lg36vw discrepancy should be corrected without changing geometry |
| Embla | loop true, align start, skipSnaps false, dragFree false; swipe/drag snapping |
| Autoplay | delay5200ms; stopOnInteraction false, stopOnMouseEnter true. Hover stops; drag interaction does not permanently stop playback |
| Reduced motion | matchMedia listener updates state, stops plugin when reduce, starts otherwise. Initial state false creates a possible brief autoplay window before preference effect runs |
| Missing features | No labeled carousel region, manual previous/next buttons, pause toggle, keyboard handler, slide group semantics, or explicit focus-pause handling in component source |

**Proposal CA1** — OLD carousel geometry + NEW `HeroCarousel.tsx` accessibility patterns → NEW `HomeMediaCarousel.tsx`: reuse geometry and snapping; add keyboard/manual controls and explicit pause/resume, focus pause, preference-safe initial playback and motion-free scrolling. Visual-only interaction/accessibility, no commerce effects. Consider one-slide looping/autoplay and zero-slide behavior; existing zero slides render null. Keep images editorial/non-SKU and use existing safe image rules. Do not let autoplay announcements continuously interrupt screen readers. Test initial preference and live preference changes, not only CSS animation removal.

## F. Custom-creations restoration

OLD `page.tsx` + `data/homepage-editorial.ts` → NEW `page.tsx` and an editorial-only portion of NEW `data/homepage-editorial.ts` (or a focused presentation component): **Proposal CC1**, visual-only.

Exact content: eyebrow “Creazioni Personalizzate”; heading “Un dialogo creativo, un pezzo realizzato a mano solo per te.”; paragraph describes collaboration over colors, style, inspiration, characters, bouquets, dolls, bags, costumes, occasions and bespoke gifts. CTA “Inizia la tua creazione”, OLD href `/products`, which exists in NEW. Restore this valid route; changing it to `/contact` would be an explicit later content decision, not necessary for fidelity.

Text article has space20; eyebrow11px/.35em, h2 30/36px with tight leading; paragraph15/16px relaxed. CTA44px with border and inverse hover. Media rectangular, border `#d4c2b0`, base `#e8dbcb`, aspect-video; stacks after text on mobile and splits at md. OLD resolves `https://www.youtube.com/watch?v=7Fmg-cpmcxI&t=44s` to `/embed/7Fmg-cpmcxI`: the converter discards the 44-second parameter. Iframe lazy, titled “Video Marì Atelier”, fullscreen allowed, strict-origin-when-cross-origin referrer policy; no autoplay query. Missing/placeholder ID renders a beige gradient with badge/title/subtitle. No local video or poster file exists in either public tree.

Port copy/layout and approved fixed media identifier selectively, not the permissive URL converter as a general user-input mechanism. Retain NEW contact/catalog routes; create no order/custom-request persistence, subscription endpoint, server action, or payment behavior. External video availability is unverified. Keep an accessible titled fallback; any consent/media policy decision remains separate from commerce.

## G. Collections restoration

**Proposal CO1** — OLD collection markup in `page.tsx` → NEW `CategoryTiles` in `components/storefront/CatalogSections.tsx`, NEW page placement and scoped CSS. Visual-only geometry; preserve `CategoryDto[] | null`, encoded Backend slugs, IDs, error/empty messages and safe imagery.

OLD heading: “Collezioni” eyebrow11px/.35em; “Esplora l'universo Marì Atelier” 30/36px; subtitle16px describes available purchases and previously made showcase pieces. Grid1 column, md2, xl3; gap24/xl32. Links rounded2.2rem, beige base, subtle ring; article aspect5/6. Images cover/center; 700ms scale1.04 on hover/focus. Card lifts4px and gets shadow over500ms. Gradient black45% at bottom becomes visible on hover/focus; title is uppercase18px/.22em, bottom/side24px, transitions from translateY12 and opacity0. Link has accessible name and sr-only destination.

NEW tiles: two columns desktop with 48px gap and second card offset62px; images landscape1.35 (mobile1.25); outside cream copy panels overlap image by28/20px; large serif headings/copy/CTA. Replace this geometry with portraits and original section header. Keep titles visible on touch/coarse-pointer devices (OLD hover-only visual title is insufficient), retain focus outlines and reduced-motion handling. New data should map optional editorial image choices to actual returned categories; it must not create categories or determine SKU images.

OLD hardcoded Bambole/Borse/Costumi/Filati query links are forbidden as catalog truth. Filati is marked future in data, but active OLD markup ignores `isFuture/statusLabel` and renders a normal link. Do not restore that bug. Render only returned categories; use safe Backend banner or a neutral editorial fallback when a category lacks an approved campaign image. Category count/order need not match OLD's four entries. Existing NEW `categoryVisuals` for Borse/Bambole may inform imagery only. Clutch remains a style under Borse unless Backend actually returns a separate category.

## H. Product-card restoration

There are several card implementations, not a single universal OLD card. Both OLD catalog and category routes actively select `CategoryCollection variant="retail"`; those active cards are already largely preserved in NEW.

| Card source (OLD → same NEW path unless noted) | Verified design | Restoration recommendation and protected logic |
|---|---|---|
| `components/native/CategoryCollection.tsx` retail card | Rounded12px, neutral border/white/shadow-sm; image4/3 contain with24px padding; availability pill top-left; text below border, padding16, title15px semibold; grid2/sm3/lg4, gap16/lg20 | Keep geometry; restore only any measured font/surface mismatch. NEW wishlist sibling overlay, encoded URL, `formatEuro`, `getCatalogCompareAtPrice`, categories, `getAvailabilityLabel`, filtered count, catalog default ordering and purchasability filter remain untouched |
| `components/native/ProductGrid.tsx` editorial card | Rounded28px, warm border/gradient; cover4/5; stronger dark bottom gradient, category/status pills; glass inset title/price panel; 500ms lift/shadow, 700ms scale1.06; grid1/sm2/lg3/2xl4 | Already retains visual shell. Do not port OLD stock numbers or compare-at selection. Keep NEW DTOs, availability labels, safe images and separate wishlist control |
| `components/native/ProductCard.tsx` alternative | Rounded16px, cover4/5; category badge, bottom black45% brand/price strip, title/description beneath; lift/shadow300ms, scale1.05/700ms; grid2/md3/xl4 | Mostly retained. Treat as alternate component, not evidence active retail routes should switch to it; do not port its local stock helper |
| OLD editorial grid styling → NEW `components/storefront/CatalogSections.tsx` `CatalogProductCard` | NEW-only homepage card: no rounded outer shell, contain4/5, plain text below, feature badge, 2/lg4 columns | Proposed homepage unmount, not a reason to rewrite safe DTO/price/image/wishlist behavior if reused elsewhere |

**Proposal PC1** — above OLD card presentation → matching NEW card files, only if visual comparison reveals remaining drift: visual-only CSS/typography changes. Product identity/variant identity, authoritative imagery, prices, availability and links remain NEW. Avoid nested button-inside-link markup; NEW wishlist controls are siblings of product links. Retain lower and upper price/availability edge cases rather than OLD brand/quantity presentation assumptions.

## I. Product-detail restoration

OLD and NEW `src/app/(store)/(routes)/products/[productId]/page.tsx` already share: neutral `#f6f6f6` background, max1152px, px24, py32/48; breadcrumbs; mt32 grid gap40; lg columns1.22fr/.78fr; right panel sticky top112px; details mt40 with14px rounded white border/shadow, native details/summary.

Both `components/product-gallery.tsx` versions retain square contain images,12px radii, mobile snap gallery with56px thumbnails, desktop84px thumbnail rail in92px column and max560px height; image padding40px mobile/48px desktop, gentle scale1.01 desktop hover. NEW improves fallback through `PRODUCT_IMAGE_PLACEHOLDER` and uses safe ordered gallery helpers. NEW gallery still explicitly scrolls smoothly and needs preference-aware behavior if touched.

`components/data.tsx` shares the12px bordered white panel with24/28px padding and option/price layout. NEW adds provider wishlist and trustworthy availability labels. OLD product page includes reviews backed by legacy behavior; NEW explicitly leaves reviews unmounted pending a Backend contract. Do not restore reviews merely for visual completeness.

**Proposal PD1** — OLD detail page, data/gallery class styling → same NEW files: mostly retain; verify heading font after global decisions and adjust sticky offset if header changes. Visual-only. Keep `getProductById`, `notFound` semantics, `getProductGallery`, Backend category links, true description fallback, readable fulfillment labels and DTO-based lead times.

**Proposal PD2** — OLD gallery presentation + NEW motion requirement → NEW gallery only: reduce smooth scrolling when requested. Accessibility-only presentation behavior; retain selected image and thumbnails. Never replace `buildVariantOptionMap`, `findActiveVariant`, `pickInitialVariant`, compatible option disabling, selectedVariantId, inventory/backorder calculations, cart handlers or wishlist wrapper. Current cart permits removals even when addition is unavailable and gates increases using requested quantity; OLD handlers must not overwrite that behavior.

## J. Footer restoration

**Proposal F1** — OLD `components/native/Footer.tsx` and footer-only content from OLD `data/homepage-editorial.ts` → same NEW files. Visual-only structure/styles; preserve valid destinations and Backend category source.

OLD: `#efe4d8`, text`#1f1713`, top border`#d9c9b8`; max1320, px24/md40, py48/md56. Single mobile column, md columns1.3fr/1fr/1fr, gap40. Brand uppercase12px/.34em and short paragraph; Navigation column text14px, list gap8; Atelier Online social icons36×36px with border and16px glyphs; legal12px/.2em. Copyright mt40, border, pt20.

NEW: paper`#fffdf9`, max1280; brand SVG/social text links and four groups Shop/Assistenza/Il mondo Marì/Informazioni; nested grid2/sm4; outer split at lg; copyright mt48/pt24. Restore warm three-column editorial arrangement, retaining catalog `/products`, atelier `/about-us`, contact `/contact`, legal `/privacy` and `/terms`, account access, and any category links selected from actual DTOs. Do not reinsert OLD “Kit e Filati” merely because `/kit` exists; route existence is not functioning commerce. OLD all-social `target=_blank` also applied to local WhatsApp `/contact`; local navigation should remain same-tab. Keep external links safely labeled and focusable; enlarge icon hit targets while preserving compact visual boxes.

## K. Asset inventory

Every OLD public file was enumerated and compared to the matching NEW path using SHA-256. Five are identical; thirteen are missing; no OLD matching path differs. Raster dimensions were read locally with existing Pillow. No file was copied. “Safe” below means isolated visual use within this milestone, not verified rights or current SKU truth.

| OLD public asset | Bytes / dimensions where applicable | NEW status | Classification and allowed target/use |
|---|---|---|---|
| `brand/logo.svg` | 24,736 | Identical | Safe signature; use existing NEW path in header/opening; no port needed |
| `brand/logo.jpeg` | 19,121 /720×720 | Identical | Safe alternate branding/fallback; existing path |
| `brand/Maria.jpeg` |157,371 /1080×1077 | Identical | Safe founder/story image; existing path |
| `fonts/Inter/inter-var-latin.woff2` |36,532 | Identical | Safe existing NEW body font |
| `fonts/Inter/LICENSE.txt` |4,426 | Identical | Existing font license |
| `atelier/logo_fool.svg` |21,410 | Missing | Safe visual asset; proposed same NEW path for opening |
| `atelier/Atelier.jpeg` |182,364 /1536×1024 | Missing | Safe atelier/editorial image; same NEW path if approved for story/fallback |
| `fonts/Yekan/Yekan.woff` |22,204 | Missing | Safe presentation font candidate, coupled to OLD heading variable; inspect glyph appearance before selective loading |
| `fonts/Yekan/license.txt` |4,454 | Missing | SIL OFL1.1 text; port together with font if selected |
| `products/baby/baby.jpeg` |443,443 /2040×1530 | Missing | Historical carousel editorial image, slide1; same NEW path or isolated editorial directory |
| `products/borse/borsa.jpeg` |402,641 /1600×1040 | Missing | Historical editorial slide2 |
| `products/costumi/costume2.jpeg` |176,377 /1069×1079 | Missing | Historical editorial slide3 |
| `products/costumi/costume1.jpeg` |210,477 /1080×1071 | Missing | Historical slide4 and Costumi collection imagery only if returned category exists |
| `products/borse/borsa1.jpeg` |129,324 /958×945 | Missing | Historical slide5 and Borse editorial collection |
| `products/baby/baby1.jpeg` |115,228 /1079×991 | Missing | Historical editorial slide6 |
| `products/bambole/bambola.jpeg` |72,354 /648×1238 | Missing | Portrait collection editorial candidate for returned Bambole |
| `products/filati/filati.jpeg` |142,904 /1076×889 | Missing | Conditional editorial candidate only; obsolete as a promised hardcoded future category |
| `products/kit/kit.jpeg` |7,003 /180×180 | Missing | Low-resolution, unused by active OLD homepage; obsolete for restoration scope, coupled to old kit content references |

Historical `/products/...` files are photographs, not static catalog authority. Never map them to a specific live product as a DTO fallback. If later placed under a new editorial directory, update editorial references only.

NEW-only assets: `images/product-placeholder.svg` is protected safe missing-image presentation. Seven `images/home/*.png` files (`hero_borse`, `hero_bambole`, `hero_bambole_2`, `category_borse`, `category_bambole`, `featured_borse`, `featured_clutch`) are all1774×887, approximately2.1–2.5MB each. They support the redesign; retain on disk during initial unmount rather than delete. Landscape2:1 crops require evaluation before use in portrait5:6 cards. `category_borse` currently has an explicit unoptimized workaround for mobile image conversion stalls; preserve until replacement imagery is verified.

Neither public tree contains local video media. OLD YouTube identifier is external editorial content, not an asset copied from disk. NEW `data/homepage.ts` still refers to missing OLD atelier/product paths; these legacy reference arrays are not catalog truth and are not proof of working assets.

## L. AI-image-safe opportunities

No image generation was requested or performed. Optional future AI editorial imagery may be used in: non-SKU homepage photographic carousel; collection/editorial category illustration keyed to an actual Backend category; atelier/story or custom-creations fallback. It must not claim a generated object is an available real creation. Prefer original photography for historical fidelity, and provide accurate alt text describing the editorial illustration.

**Proposal AI1 (optional later)** — OLD carousel/collection/story references → NEW editorial asset paths and NEW editorial image maps only. Visual-only; actual categories and encoded links remain Backend-owned. No generated substitution in a card representing a specific SKU, product detail/gallery, Cart, Checkout, order confirmation/history/detail. No invented product identity, stock, prices, or catalog category. The Marì signature and Fool artwork should be reused as existing brand assets rather than regenerated.

## M. Responsive/accessibility differences

| Area | Source findings | Restoration requirement / source → target |
|---|---|---|
| Desktop/tablet | OLD header desktop md768; NEW lg1024. OLD homepage portrait grid2 at768,3 at1280; NEW landscape staggered2 then single under768 | OLD page/nav → NEW page/nav/CatalogSections: choose compact row at768 only if account/wishlist/cart/logout fit; otherwise keep lg breakpoint. Test768/1024 widths with actual long titles |
| Mobile | OLD menu only height-collapsed, focusable descendants remain; toggle lacks expanded/controls and correct closing name; no Escape handling | OLD geometry → NEW nav: keep current semantic hidden state, expanded/controls, Escape/focus return and closing-on-link behavior |
| Contrast | OLD unscrolled white nav/cart on ivory opening; collection labels invisible until hover/focus | OLD styling → NEW scoped CSS/nav/collections: dark header text; persistent readable touch labels and adequate overlay; measure focus/badge contrast |
| Keyboard | NEW hero has arrows, buttons and slide semantics; OLD photo strip lacks manual controls. NEW header active links and search labels are useful | OLD strip + NEW hero patterns → NEW HomeMediaCarousel: accessible region, keyboard/manual navigation and pause; preserve NEW header semantics |
| Focus | OLD cards/collections have local rings, no global focus rule; NEW global2px brown outline offset4 plus local rings | NEW globals/cards: retain visible focus, especially where local outline-none overrides it; style focus with restored palette |
| Reduced motion | OLD photo carousel stops autoplay via preference; OLD nav/collection transitions and global smooth scrolling not reduced. NEW globals disables homepage/header animation/transition and global smooth scrolling, MotionReveal respects preference | OLD visuals → NEW scoped CSS/carousel/gallery: carry protections over to restored class names, handle JS scrolling/autoplay too. Card motion outside shop-home remains a gap if touched |
| Image semantics | OLD logo alts “Logo archetipo Fool”/“Logo firma Marì Atelier”; photo fallbacks generic “Slide N”; OLD collection link aria-label and sr-only duplicate destination | OLD image data → NEW editorial data: descriptive photo alt; one accessible brand identity and appropriate decorative Fool alt if redundant; never generic invented SKU alt |
| Heading/landmarks | OLD opening has no h1; root main wraps pages that may themselves use main. NEW hero supplies sr-only h1, NEW homepage main idmain-content | OLD composition → NEW page/root: retain h1 and a single main. Do not copy nested landmark structure |
| Gallery | Both retain native buttons, aria-pressed thumbnails and mobile touch snap; NEW safe placeholders | Same OLD/New gallery: retain all controls and safe alt/source handling; reduced JS smooth scroll if adjusted |

These are source-level findings. No runtime viewport, screen-reader, contrast-tool, or pixel-diff result is claimed.

## N. Files in NEW Web expected to change

The following is the proposed implementation scope after approval; none of these application files was edited in this audit.

| NEW target | OLD reference | Change IDs / visual-only status | Must remain untouched |
|---|---|---|---|
| `src/app/page.tsx` | OLD same path | P1, CC1: composition/copy, yes | Backend categories, error/empty states; no static product/catalog fallback |
| `src/app/globals.css` | OLD same path + OLD page classes | H1/H2/CO1: scoped presentation/accessibility, yes | Generic commerce validation/disabled/focus behavior and reduced-motion guarantees |
| `tailwind.config.js` | OLD config + page palette | Optional storefront color/font tokens, yes | Dependency/package config and shared semantic token contracts |
| `src/app/layout.tsx` | OLD same path | Optional font/offset for H2/PD1, yes | server category read, Providers/session lifecycle, dynamic rendering |
| `src/components/native/nav/parent.tsx` | OLD same path | H1/H2, yes | current cart quantity sum, search semantics, account/wishlist routes, UserNav logout and mobile keyboard behavior |
| `src/components/native/nav/user.tsx` | OLD active header has no equivalent | Optional compact styling for H1, yes | current useAuth/logout/status/busy/error and router refresh |
| `src/components/native/HomeMediaCarousel.tsx` | OLD same path, already identical | CA1, yes | isolated editorial input; no commerce dependencies |
| `src/components/storefront/CatalogSections.tsx` | OLD collections in page | CO1; other sections only unmounted, yes | CategoryDto identities, encoded routes, safe images, states; retained product card helpers |
| `src/data/homepage-editorial.ts` | OLD same path | CC1/F1 + editorial image/copy selection, yes | no static catalog records or promised unavailable categories |
| `src/data/storefront.ts` | OLD editorial imagery/copy | Optional editorial map adaptation, yes | category lookup from actual DTOs, no Clutch category invention |
| `src/components/native/Footer.tsx` | OLD same path | F1, yes | Backend-derived links/valid legal/account/contact routes |
| Detail `page.tsx`, `components/data.tsx`, `components/product-gallery.tsx` under product route | OLD same paths | PD1/PD2 only if needed, yes | safe Backend data, selectors, cart/wishlist logic and gallery helpers |
| Native ProductCard/ProductGrid/CategoryCollection | OLD same paths | PC1 only after measured drift, yes | all current DTO, price, availability, sorting/filtering, wishlist helpers |
| Selected NEW public visual paths in K | Matching OLD public paths | Selective visual asset port only | no replacement of authoritative DTO SKU imagery |

No automatic deletion is proposed for `HeroCarousel`, `ValueMarquee`, `NewsletterSection`, `EditorialStories`, motion helpers, or redesign PNGs. First remove their homepage placements; retain unrelated callers. Shared storefront Container need not change globally just to restore1320px custom/footer widths.

## O. OLD files/assets safe to selectively port

Port presentation fragments only: OLD `page.tsx` opening/custom/collection markup and class geometry; OLD `globals.css` nav hover styling adapted for current contrast/focus/motion; OLD Footer markup/style; editorial copy, six-slide order, approved video identifier and fallback from OLD `data/homepage-editorial.ts`; missing Fool/editorial photos and optional licensed Yekan pair from K.

No full root layout/provider or page replacement. Existing NEW carousel, shared button, store layout, brand files and Inter files already match and need no copied replacement. OLD card/detail JSX can inform specific class corrections, but their imports/calculations/handlers must stay NEW. Fonts require visual glyph verification; the misleading variable name is not evidence of Playfair.

## P. Files/logic explicitly forbidden to port

Do not port OLD `src/lib/prisma.ts`, generated Prisma client/schema, monorepo Prisma package wiring, schema/migrations/seeds, or package scripts/dependencies. Do not import OLD Prisma product/category queries from catalog/products/category/detail pages or `src/actions/get-*`. Do not restore `withPublicProductWhere`/old filtering as database ownership.

Do not port OLD `src/lib/auth.ts`, jwt/session implementation, NextAuth types/adapter, `src/app/api/auth/[...nextauth]/route.ts`, middleware auth behavior, OLD Providers/User/Cart or useAuthentication. Do not copy OLD API handlers for Auth/Profile/Addresses/Cart/Wishlist/Checkout/Orders, nor OLD cart/wishlist/detail event handlers or persistence.

Do not port OLD stock shortcuts (`quantityOnHand`, product stock fallback as new truth), unrelated compare-at variant selection, static collection/catalog data, review mounting/API business logic, subscriptions, server actions bypassing Backend, or template docs links. All OLD PayPal/payment routes, `src/lib/paypal.ts`, payment/order-access behavior, webhook/return flows are forbidden in this milestone. NEW transitional payment files also remain unchanged.

No Backend repository changes; no Prisma schema/migrations, Supabase, production data, inventory semantics, installations, package manifests/lockfiles, commits, pushes, merges or deploys.

## Q. Protected technical boundaries

NEW is the functional source of truth. A matching OLD class does not authorize restoring OLD imports or state handling.

- Catalog: `src/lib/api/catalog.ts` and `contracts.ts`, safe runtime DTO allowlists, no-store HTTP reads, encoded identifiers, 404 vs unavailable behavior, Backend categories/products. Preserve `types/product.ts`, `product-display.ts`, `safe-image.ts`, current image ordering/cover selection/placeholders, EUR formatting and same-variant compare-at pricing.
- Auth: `state/Auth.tsx`, client/backend HTTP clients, forwarding routes/contracts, cookies/session identity, login/logout propagation and guarded routes. Keep root provider lifecycle rather than OLD NextAuth.
- Profile/Addresses: current clients/contracts/forwarders and page behavior; no redesign port of ownership or mutations.
- Cart: `state/Cart.tsx`, `client-cart`, cart API/forwarding contracts and `cart-transfer.ts`. Keep shared provider, account HTTP mutations, guest compatibility, ProductVariant identity, quantity checks, transfer/idempotency and retry behavior. Do not recreate OLD nested CartContextProvider in cart button.
- Wishlist: `state/Wishlist.tsx`, `WishlistButton`, clients/contracts/forwarders. Keep membership/pending/error/refresh and auth gating. Visual controls must still use current provider.
- Checkout/Orders: `checkout-operation.ts`, order HTTP clients/contracts/forwarders/server readers and history/detail pages. Preserve stable operation keys, retries/recovery, guest cleanup replay markers, capabilities/cookies, order access and cart transitions. No layout work should change request bodies or trigger order/payment actions.
- Inventory: `inventory-availability.ts`, `variant-selection.ts`, Backend-safe variant data and bundle information; preserve availability semantics rather than merely “positive stock”.
- Payments/PayPal: intentionally deferred transitional area. Do not change even incidental behavior during visual work.

These boundaries are implementation guardrails, not a claim that this audit reran the existing validation suites.

## R. Proposed implementation stages

1. Establish a local fixture-based visual baseline and record selected viewports before changing source. Confirm approved font rendering and asset selections; no production access.
2. Introduce scoped warm tokens, verified heading treatment, and minimal header/footer presentation. Retain all providers/clients/routes. Resolve fixed-header offset as one coordinated change.
3. Restore opening and reactivate existing photographic strip; selectively add approved missing visual assets and editorial slide data. Improve carousel keyboard/pause/reduced-motion behavior.
4. Restore custom text/video/fallback and exact spacing/order. Remove redesign-only homepage placements; leave reusable modules on disk.
5. Restore Backend-driven portrait collections, failure/empty states, touch-visible labels and accessible motion. No hardcoded category creation.
6. Compare existing catalog/cards/detail against OLD at the same fixture sizes; make only proven typography/spacing/offset corrections, with protected selectors/actions intact.
7. Run the regression plan, review diff scope and local screenshots, then present implementation for review. Publishing remains outside this milestone.

## S. Test/regression plan

Audit checks: source/path inspection, SHA-256 equality, raster dimensions, branch/status, and `git diff --check` only. No build/test/service execution was necessary for this documentation-only change.

After implementation approval, use existing installed tooling and local mocked Backend fixtures; never production endpoints. Run `npm run typecheck`, `npm run lint`, relevant Vitest suites and a safe local build only after ensuring it will not reach production or old database hooks. Review existing tests before relying on them; a package script name is not sufficient isolation proof.

Relevant existing NEW suites observed in the test inventory:

- Presentation/catalog: `storefront.test.tsx`, `catalog-rendering.test.tsx`, `catalog.test.tsx`; verify Backend links, empty/unavailable behavior, unsafe-image fallback, cover order, EUR/compare-at consistency and no invented Clutch/Filati rows.
- Auth: `auth-boundary.test.ts`, `auth-client.test.tsx`, `auth-ownership.test.tsx`, `auth-checkout.test.tsx`, `middleware.test.ts`, `providers.test.tsx`; check guest/auth/loading/error/logout and identity reset from the compact header.
- Cart: `cart-provider-regression.test.tsx`, `cart-transfer.test.ts`, `cart-backend.test.ts`, `cart-state.test.tsx`; badge sums quantities and updates with shared provider, variant identity, transfer retries and no provider remount regressions.
- Wishlist: `wishlist-forwarding.test.ts`, `wishlist.page.test.tsx`; card/header/detail routes and actions retain pending/error/auth states and keyboard access.
- Profile/Addresses: `profile-addresses-pages.test.tsx`, `profile-addresses-ui.test.tsx`, `profile-addresses.test.ts`; shared font/header/footer must not obscure controls.
- Checkout/Orders: `checkout-operation.test.ts`, `orders-cart-transition.test.ts`, `orders-pages.test.tsx`, `orders-source-guard.test.ts`; preserve guest/account order creation, replay/recovery, history/detail, no old persistence paths. Do not exercise live payment actions.

Visual review at320/375/390px mobile,768/820px tablet,1024px laptop,1280/1440px desktop. Compare section order, opening whitespace, portrait crops, carousel peeking widths/heights, CTA/media stacking, font accents, footer geometry, and fixed-header overlap. Include category lists of0/1/many/long titles and failure; product ready/out-of-stock/backorder/made-to-order, missing/unsafe images and multi-variant fixtures.

Accessibility review: full keyboard path and visible focus, menu open/close/Escape/focus return, no focusable collapsed links, carousel manual control/pause/hover/focus/preference change, persistent touch labels, reduced-motion initial load, gallery scroll preference,200% zoom, landmarks/h1, meaningful alt text, and contrast. Add focused behavior tests for any newly added menu/carousel behavior; do not write tests merely restating class strings.

## T. Risks/open questions

1. Local OLD source is the requested visual reference; deployed pixel fidelity cannot be certified without a separately authorized reference capture. No production access is needed to begin source-led restoration.
2. OLD font naming is misleading and its actual Latin rendering/fallback is not measured. Decide from a local glyph sample whether to selectively load Yekan; do not claim it is Playfair or replace NEW Inter blindly.
3. Actual current categories/order are unknown without a permitted local Backend fixture/runtime. Implement dynamic rendering; do not freeze historical four-category composition or infer DB membership from enum values.
4. Original editorial photo rights/currency and intended reuse can be confirmed during implementation review. Their paths must never imply SKU authority. NEW landscape campaign crops may be poor portrait alternatives.
5. Fixed96px header vs added account/wishlist/logout controls needs mobile fit testing; retain44px targets and avoid overlap. Tablet desktop breakpoint may need to remain lg even if OLD used md.
6. OLD opening is intentionally sparse but lacks h1; restored branding must retain NEW semantics and readable header contrast.
7. OLD photo autoplay lacks pause/keyboard/focus affordances; identical component reuse needs an accessibility adaptation, including preference timing and one-slide behavior.
8. OLD collection text is hover-only visually; touch devices need persistent labels. Hover animation must not return for reduced motion through newly restored class names.
9. OLD YouTube embed start time is dropped, and availability is unverified. Preserve the known valid identifier/fallback; any start-time/content change is a separate choice.
10. Shared CSS/font changes can affect Auth, Profile, Cart, Checkout and Orders even without editing their files. Keep changes scoped and review these screens with mocked sessions.
11. Legacy missing asset references already exist in NEW `data/homepage.ts`; copying an entire OLD data module would broaden scope and risk reviving static catalog assumptions.
12. Cards/detail already close to OLD; extensive “restoration” there could destroy validated behavior for little visual gain. Verify before editing.

### Inspection record

Read OLD and NEW root `package.json`, `tailwind.config.js`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`; both source/public file inventories; both active navigation parent plus desktop/mobile/sidebar/user helper sources; Footer, HomeMediaCarousel, homepage-editorial, ProductCard, ProductGrid, CategoryCollection; both product detail page and data/gallery/cart/wishlist components through source comparison; both catalog/category/products route implementations; shared UI button and store layout equality. Read NEW homepage data/storefront data, CatalogSections, Container/SectionHeading, HeroCarousel, ValueMarquee, MotionReveal, NewsletterSection, WishlistButton, Providers, catalog HTTP/schema, safe-image/product-display, Auth provider, checkout-operation, orders-forwarding and payment-access boundary. Inspected import/export/identity/idempotency-related excerpts of the larger NEW Cart/Wishlist/cart-transfer sources. Enumerated existing NEW test filenames; tests were not run or comprehensively reviewed in this audit. Read OLD Yekan license; hashed all18 OLD public files against NEW and read raster dimensions in both trees. Checked project/ancestor instruction locations; no applicable AGENTS.md was found. No secrets/environment files were read.

### Concise implementation order

Approve scoped plan → verify font/assets locally → warm visual tokens and compact header/footer → centered Fool/signature opening → existing photo carousel with accessible controls → custom-creations section → Backend-driven portrait collections → unmount redesign-only homepage sections → minimal measured card/detail adjustments → isolated regression and viewport/accessibility review. Stop here pending implementation approval.
