# Reviewfic — Software Design Document (SDD)

> **Document Status**: Authoritative  
> **Author**: Antigravity Orchestrator & Engineering Team  
> **Ecosystem**: Company Framer Plugin Standard  
> **Plugin Name**: Reviewfic - Google & Trustpilot Reviews  
> **Date**: 2026-10-13  

---

## 1. Executive Summary & Problem Statement

Reviewfic is the compliant, no-cutoff Google + Trustpilot social proof plugin for Framer. It blends both sources into a unified feed, never cuts off reviews behind view meters, and strictly adheres to platform display rules.

- **Market Anchor**: ~$9/month Pro tier, matching competitors (Vanssay, RevuKit, PlaceProof) while eliminating their view caps.
- **Winning Moats**:
  1. **Never-Dark Delivery**: Cached snapshot architecture; social proof never vanishes when site traffic surges.
  2. **Triple-Source Engine**: Google Reviews + Trustpilot Reviews + Customer Testimonials in one feed with separate filters.
  3. **Strict Compliance Mode**: Official Trustpilot star assets, required link-back, Google attribution, and honest handling of Google Places limits.
  4. **Framer-Native Component**: Pure React code component with 0 layout shift (CLS = 0) and native PropertyControls.
  5. **Instant Wireframe Demo Mode**: 1-click realistic demo preview on a blank canvas.

---

## 2. Competitor Feature Benchmark

| Area | Features & Market Offerings |
| :--- | :--- |
| **Review Ingestion** | Google import (Maps link / Place ID); Trustpilot import (URL); Blended dual feed (Vanssay only); CSV & manual entry (Pixels, Reviews Pro); Bring-your-own Google key (Live Reviews component). |
| **Display & Layouts** | Carousel, Grid, Masonry, Ticker/Marquee, List, Rating badge, Spotlight; 25 layouts and 50+ card designs (Vanssay); 27 components (Reviews Pro); Full-width social proof sections (RevuKit). |
| **Framer Integration** | Native code components (not iframes); Auto style-match to site fonts/radii; Live preview with real reviews; Property controls for colors, padding, gap, radius; Localization support. |
| **Curation & Moderation** | Minimum star filter; Pin, hide, reorder; Bulk moderation; Page-scoping; SEO stars schema. |
| **Business Model & Limits** | Free view caps (250–300 views/mo on RevuKit & Vanssay); Watermarks on free plans; Pro plans clustered at ~$8–$9/mo; Google API 5-review limit hidden by most. |

---

## 3. Missing Scopes We Implement

1. **Never-Dark Delivery**: Cached snapshot instead of a view-cap cutoff.
2. **Compliance Mode**: Trustpilot logo, link back and required wording, plus Google attribution and "Read on Google" links.
3. **Honest Handling of Google's 5-Review Limit**: Clear UI notice with customer testimonial and CSV fallbacks.
4. **Triple Blend**: Google + Trustpilot + Customer Testimonials in one feed with source filters and separate ratings.
5. **CMS Collection Sync (v1.1)**: Reviews written into Framer CMS for static, crawlable pages.
6. **"Write a Review" CTAs & QR**: Direct links to Google & Trustpilot review submission.
7. **Page & Tag Scoping (v1.1)**: Assign reviews by service, location, or product.
8. **SEO Schema (JSON-LD)**: AggregateRating markup with search eligibility checker.
9. **Accessibility & Zero CLS**: Keyboard/screen-reader support, reduced-motion media query, and reserved card heights.
10. **Language Tools (v1.1)**: Framer Localization alignment with translation toggle.

---

## 4. Phased Engineering Roadmap

### Phase 0: Technical Spike (Weeks 1-2)
- Confirm Google Places route, quotas, and caching rules.
- Confirm Trustpilot partner/API access route.
- Confirm Framer marketplace billing and submission guidelines.
- Prove end-to-end flow: business link -> fetch -> snapshot -> component.
- Configure serverless endpoint with CORS for `framer.com` and `framerusercontent.com`.
- Publish privacy note and deletion path.

### Phase 1: MVP v1.0 Core Launch (Active Implementation)
- **Sources & Ingestion**:
  - Connect Google Business Profile via Maps link or Place ID.
  - Connect Trustpilot profile via business URL.
  - Manual review editor for customer testimonials (labelled *"Customer testimonial"*, never shown with Google/Trustpilot logo).
  - Blended feed with combined review-count-weighted rating, per-source ratings, and source filter.
  - Overall rating & review count always computed from full source data.
  - Mock data on blank canvas preloaded with realistic review cards.
  - Clear Google 5-review limit callout in plugin UI.
- **Layouts**:
  - Carousel (touch swipe, autoplay, interval, pause on hover, arrows, dots).
  - Responsive Grid (1 to 4 columns).
  - Masonry Wall (column-balanced waterfall).
  - Infinite Marquee Ticker (speed control, pause on hover).
  - Compact List.
  - Rating Badge (compact, inline).
- **Styling**:
  - 2 Launch presets: Minimal and Elevated Card.
  - Platform icons on Google and Trustpilot cards only.
  - Star color options (platform colors or unified accent) and fractional stars.
  - Toggles for avatar (initials fallback), name, and date.
  - "Verified" mark shown only when verified by source.
  - Review text clamp with expandable "Read more".
  - Auto-match fonts, colors, radii; Light and Dark mode sync.
  - Live preview with real reviews before inserting; 1-click insert and update.
- **Curation**:
  - Minimum rating filter (All, 4+, 5 stars).
  - Hide reviews without text.
  - Pin top reviews.
  - Sort: Newest first, Highest rated first, Random shuffle.
- **Delivery, Compliance & Quality**:
  - Cached snapshot delivery with scheduled refresh (weekly Free, daily Pro) and zero view caps.
  - Fallback to last good snapshot if a refresh fails.
  - Lapsed plan falls back to free limits, never a blank widget.
  - Trustpilot logo, link back, and required wording (*"Showing our latest verified reviews"*).
  - Google attribution and *"Read on Google"* links on each review card.
  - "Write a review" buttons for Google and Trustpilot.
  - Keyboard navigation, reduced motion (`prefers-reduced-motion`), lazy loading.
  - Reserved card space to prevent Cumulative Layout Shift (CLS = 0).
  - Small "Reviews by Reviewfic" badge on Free; removable on Pro.
  - Plan limits: Free (1 business, 10 reviews/source); Pro (5 businesses, 50 reviews/source, all layouts).

### Phase 2: Growth & SEO v1.1
- Framer CMS collection sync with page and tag scoping.
- Review schema (JSON-LD) with eligibility checker.
- Floating trust badge expanding into a review drawer.
- Bento and Glassmorphism card presets.
- On-site review form with star selector, media upload, and moderation.
- CSV import and export.
- Visitor filter bar: search, stars, platform tabs, media-only.
- QR code generator to a review collection page.
- Framer Localization alignment with translation toggle.

---

## 5. Explicitly Out of Scope
- Fake or editable reviews presented as Google or Trustpilot content.
- Scraping that breaks a source's terms of service.
- Full reputation-management inbox with replying and invitation sending.

---

## 6. Internal Engineering Standards Compliance
- **Zero Inline CSS**: All plugin UI panel styles reside strictly in external `.css` files.
- **Theme Synchronization**: Full Dark & Light mode support syncing with `data-framer-theme`.
- **Primary CTA Standard**: Double-gradient `.primary-cta` button for all key actions.
- **Navigation Shell**: 4-part navigation (`Overview`, `Builder`, `Sources`, `Settings`).
- **Plugin Data Persistence**: Settings saved in `framer.setPluginData` so reopening recalls all state.
