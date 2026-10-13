# Reviewfic — Software Design Document (SDD)

> **Document Status**: Approved  
> **Author**: Antigravity Orchestrator & Engineering Team  
> **Ecosystem**: Company Framer Plugin Standard  
> **Plugin Name**: Reviewfic - Google & Trustpilot Reviews  
> **Date**: 2026-10-13  

---

## 1. Executive Summary & Problem Statement

Reviewfic is a high-performance, design-first Framer plugin that enables web designers and agencies to embed and curate authentic **Google Reviews**, **Trustpilot Reviews**, and **Custom Client Testimonials** onto the Framer canvas as native React code components.

### 1.1. Key Problems Solved
1. **The Iframe & Performance Trap**: Legacy tools (Elfsight, EmbedSocial) use `<iframe>` and heavy external JavaScript, degrading Framer Core Web Vitals, causing layout shifts (CLS), and loading slowly. Reviewfic generates a pure, native React code component with 0 CLS and 0 external render dependencies.
2. **The "Blank Canvas" Dilemma**: Competing plugins require live API credentials upfront before showing anything on the canvas. Reviewfic features a 1-click **Instant Demo/Mock Mode** preloaded with realistic 5-star reviews so designers can wireframe and pitch clients immediately.
3. **The "Disappearing Social Proof" Risk**: Competitors (Vanssay, RevuKit) cap free views at 250–300 views/month, causing reviews to abruptly vanish when traffic spikes. Reviewfic provides **Never-Dark cached delivery** with zero view cutoffs.
4. **Triple-Source Ingestion**: Blends Google and Trustpilot scores into a unified weighted star rating, while also allowing custom offline/B2B client quotes.

---

## 2. Framer Canvas Architecture & Permissions

### 2.1. Plugin Configuration (`framer.json`)
```json
{
  "id": "8f7cf3",
  "name": "Reviewfic - Google & Trustpilot Reviews",
  "modes": ["canvas"],
  "icon": "/icon.svg"
}
```

### 2.2. Generated Code Component Schema (`Reviewfic.tsx`)
- **File Name**: `Reviewfic.tsx`
- **Component Name**: `Reviewfic`
- **Framer Property Controls (`addPropertyControls`)**:
  - `layout`: Enum (`"carousel"`, `"grid"`, `"masonry"`, `"marquee"`, `"badge"`)
  - `cardStyle`: Enum (`"elevated"`, `"minimal"`, `"glass"`, `"bento"`)
  - `themeMode`: Enum (`"auto"`, `"light"`, `"dark"`)
  - `starColor`: Color
  - `minRating`: Enum (`0` [All], `4` [4+ Stars], `5` [5 Stars Only])
  - `showAvatar`: Boolean
  - `showDate`: Boolean
  - `showSourceIcon`: Boolean
  - `showVerifiedBadge`: Boolean
  - `showWriteReview`: Boolean
  - `carouselAutoplay`: Boolean
  - `carouselSpeed`: Number
  - `marqueeSpeed`: Enum (`"slow"`, `"normal"`, `"fast"`)
  - `columns`: Number (1 to 4)
  - `cornerRadius`: Number (0 to 32)
  - `cardPadding`: Number (12 to 36)
  - `cardGap`: Number (8 to 32)

---

## 3. UI Navigation & Page Breakdown

Window Dimensions: `framer.showUI({ position: "top right", width: 400, height: 720 })`

| Tab | Title | Purpose |
| :--- | :--- | :--- |
| **Tab 1** | `Overview` | Welcome hero banner, aggregated rating stats, source connection status, 1-click Demo Mode toggle, quick insert. |
| **Tab 2** | `Builder` | Live interactive preview, layout switcher (Carousel, Grid, Masonry, Marquee, Badge), design presets, and visual controls. |
| **Tab 3** | `Sources` | Google Places connector (URL / Place ID), Trustpilot connector (URL / domain), and Custom Review CRUD manager. |
| **Tab 4** | `Settings` | Sync frequency, theme switcher (System/Light/Dark), schema rich snippet toggle, and profile/license status. |

---

## 4. Design Standards Compliance

1. **Zero Inline CSS**: 100% of styling resides in external stylesheet (`src/ui/styles.css`), verified by `lint-zero-inline-css.js`.
2. **Mandatory `.primary-cta`**: Double-gradient CTA (`#0099FF` to `#0077E6`) with hover, focus, and disabled states.
3. **Theme Synchronization**: Full automatic dark & light mode support syncing with Framer's `data-framer-theme`.
4. **Legal & Compliance Rules**: Trustpilot star attribution, direct link-back, and Google original review links built-in by default.
