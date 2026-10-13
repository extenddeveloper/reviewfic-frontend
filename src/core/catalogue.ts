export type LayoutGroup = "cards" | "shapes" | "motion" | "reading" | "badges"

export type ReviewLayout = "grid" | "masonry" | "highlight" | "list" | "pinboard" | "duo" | "feature" | "band" | "spotlightgrid" | "carousel" | "ticker" | "wall" | "spotlight" | "compact" | "orbit" | "breakdown" | "ribbon" | "gallery" | "flow" | "split" | "badge" | "avatars" | "ratingcard" | "gbadge" | "trustpilot"

export interface LayoutDef {
    key: ReviewLayout
    name: string
    group: LayoutGroup
    desc: string
    tier: "free" | "pro"
}

export const LAYOUT_GROUPS = [
    { id: "cards", name: "Card Blocks", desc: "Your reviews as a block of cards." },
    { id: "shapes", name: "Arrangements", desc: "The same cards, placed for a particular spot on the page." },
    { id: "motion", name: "In Motion", desc: "Layouts that move on their own." },
    { id: "reading", name: "Dedicated Designs", desc: "These bring their own look — no card styling needed." },
    { id: "badges", name: "Badges & Proof", desc: "One compact strip or rating badge." },
] as const

export const ALL_LAYOUTS: LayoutDef[] = [
    {
        "key": "grid",
        "name": "Grid",
        "group": "cards",
        "desc": "A classic uniform grid of review cards.",
        "tier": "free"
    },
    {
        "key": "masonry",
        "name": "Masonry",
        "group": "cards",
        "desc": "An asymmetric mosaic that feels editorial.",
        "tier": "free"
    },
    {
        "key": "highlight",
        "name": "Highlight",
        "group": "cards",
        "desc": "One hero review backed by quick supporting quotes.",
        "tier": "pro"
    },
    {
        "key": "list",
        "name": "Editorial",
        "group": "cards",
        "desc": "A single-column feed that reads like a story.",
        "tier": "free"
    },
    {
        "key": "pinboard",
        "name": "Pinboard",
        "group": "shapes",
        "desc": "Cards tacked up at slight angles, straightening as you hover.",
        "tier": "pro"
    },
    {
        "key": "duo",
        "name": "Two Columns",
        "group": "shapes",
        "desc": "Exactly two columns. When three is busy and one is too tall.",
        "tier": "free"
    },
    {
        "key": "feature",
        "name": "Feature",
        "group": "shapes",
        "desc": "Your first review at double width, the rest in a grid beneath.",
        "tier": "pro"
    },
    {
        "key": "band",
        "name": "Band",
        "group": "shapes",
        "desc": "A single row that never wraps. For a slim strip between sections.",
        "tier": "free"
    },
    {
        "key": "spotlightgrid",
        "name": "Hero + Grid",
        "group": "shapes",
        "desc": "A tall card down the left, a two-up grid beside it.",
        "tier": "pro"
    },
    {
        "key": "carousel",
        "name": "Carousel",
        "group": "motion",
        "desc": "Swipeable cards with scroll-snap — built for wide sections.",
        "tier": "free"
    },
    {
        "key": "ticker",
        "name": "Ticker",
        "group": "motion",
        "desc": "A continuous marquee gliding across the page. Pauses on hover.",
        "tier": "free"
    },
    {
        "key": "wall",
        "name": "Living Wall",
        "group": "motion",
        "desc": "Slow vertical streams of reviews in constant motion.",
        "tier": "pro"
    },
    {
        "key": "spotlight",
        "name": "Spotlight",
        "group": "motion",
        "desc": "One large quote at a time, auto-rotating with a soft fade.",
        "tier": "pro"
    },
    {
        "key": "compact",
        "name": "Compact List",
        "group": "reading",
        "desc": "One dense row per review. Made for sidebars and footers.",
        "tier": "free"
    },
    {
        "key": "orbit",
        "name": "Orbit",
        "group": "reading",
        "desc": "Reviewers ringed around your score; the chosen one opens in the middle.",
        "tier": "pro"
    },
    {
        "key": "breakdown",
        "name": "Rating Breakdown",
        "group": "reading",
        "desc": "The distribution — five bars beside the score.",
        "tier": "free"
    },
    {
        "key": "ribbon",
        "name": "Ribbon",
        "group": "reading",
        "desc": "A slim band: your score, and a quote that changes. Fits under a nav.",
        "tier": "pro"
    },
    {
        "key": "gallery",
        "name": "Gallery",
        "group": "reading",
        "desc": "A large quote, with the reviewers portraits as the selector.",
        "tier": "pro"
    },
    {
        "key": "flow",
        "name": "Flow",
        "group": "reading",
        "desc": "Two rows of quotes drifting past each other. Pauses on hover.",
        "tier": "pro"
    },
    {
        "key": "split",
        "name": "Split",
        "group": "reading",
        "desc": "Full-width rows, reviewer and quote on alternating sides.",
        "tier": "free"
    },
    {
        "key": "badge",
        "name": "Trust Badge",
        "group": "badges",
        "desc": "A compact rating strip. Perfect under a headline or CTA.",
        "tier": "free"
    },
    {
        "key": "avatars",
        "name": "Trusted By",
        "group": "badges",
        "desc": "Overlapping reviewer avatars, a rating and a headcount.",
        "tier": "free"
    },
    {
        "key": "ratingcard",
        "name": "Rating Card",
        "group": "badges",
        "desc": "A small vertical block: score, stars, count. Fits a sidebar.",
        "tier": "free"
    },
    {
        "key": "gbadge",
        "name": "Google Badge",
        "group": "badges",
        "desc": "Your Google score as a standalone badge, in Google colors.",
        "tier": "free"
    },
    {
        "key": "trustpilot",
        "name": "Trustpilot Badge",
        "group": "badges",
        "desc": "The official Trustpilot rating badge, styled like the real thing.",
        "tier": "free"
    }
]

export type CardFamily = "modern" | "basic" | "editorial" | "animated" | "bold" | "warm" | "premium"

export type CardStyle = "elevated" | "outline" | "gradient" | "glass" | "bento" | "spotlight" | "aurora" | "frame" | "google" | "gcompact" | "gdark" | "tp" | "tpstrip" | "tpc" | "verified" | "plain" | "quote" | "pull" | "mag" | "news" | "press" | "museum" | "ruled" | "broad" | "reveal" | "unfold" | "tilt" | "shine" | "trace" | "pop" | "unblur" | "liquid" | "brutal" | "neon" | "duo" | "sticker" | "neu" | "sheen" | "pearl" | "term" | "memphis" | "clay" | "linen" | "eink" | "sage" | "pebble" | "kraft" | "sunbaked" | "ceramic" | "noir" | "gilt" | "hotel" | "couture" | "onyx" | "platinum" | "velvet" | "atelier"

export interface CardPresetDef {
    id: CardStyle
    name: string
    family: CardFamily
    tier: "free" | "starter" | "pro"
    platform?: "google" | "trustpilot" | null
    note: string
}

export const CARD_FAMILIES = [
    { id: "modern", name: "Modern & Clean", desc: "Sleek elevation, soft gradients, and glassmorphism" },
    { id: "basic", name: "Official & Minimal", desc: "Native Google & Trustpilot platform designs" },
    { id: "editorial", name: "Editorial & Print", desc: "Serif typography, oversized pull quotes, and newsprint" },
    { id: "animated", name: "Motion & Dynamic", desc: "3D tilt, border traces, shine sweeps, and liquid transitions" },
    { id: "bold", name: "Bold & Neo-Brutal", desc: "Brutalist borders, neon glow, duotone, and terminal CRT" },
    { id: "warm", name: "Warm & Natural", desc: "Terracotta clay, woven linen, e-ink paper, and ceramic" },
    { id: "premium", name: "Luxury & Studio", desc: "Noir dark mode, gold foil gilt, hotel boutique, and velvet" },
] as const

export const ALL_CARD_PRESETS: CardPresetDef[] = [
    {
        "id": "elevated",
        "name": "Elevated",
        "family": "modern",
        "tier": "free",
        "platform": null,
        "note": "Soft ambient shadow, lifts on hover. The most universally flattering."
    },
    {
        "id": "outline",
        "name": "Outline",
        "family": "modern",
        "tier": "free",
        "platform": null,
        "note": "Hairline border, no shadow. Crisp on busy or textured backgrounds."
    },
    {
        "id": "gradient",
        "name": "Gradient Edge",
        "family": "modern",
        "tier": "pro",
        "platform": null,
        "note": "Two-tone gradient border in your accent colour."
    },
    {
        "id": "glass",
        "name": "Glass",
        "family": "modern",
        "tier": "pro",
        "platform": null,
        "note": "Frosted blur that picks up whatever sits behind it on your page."
    },
    {
        "id": "bento",
        "name": "Bento",
        "family": "modern",
        "tier": "free",
        "platform": null,
        "note": "Flush modular blocks, tinted header, hairline seams."
    },
    {
        "id": "spotlight",
        "name": "Spotlight",
        "family": "modern",
        "tier": "pro",
        "platform": null,
        "note": "A soft radial light follows the cursor across the card."
    },
    {
        "id": "aurora",
        "name": "Aurora",
        "family": "modern",
        "tier": "pro",
        "platform": null,
        "note": "Three colour fields drift inside the card, under a soft veil."
    },
    {
        "id": "frame",
        "name": "Frame",
        "family": "modern",
        "tier": "free",
        "platform": null,
        "note": "Sits inside a soft accent ring that tightens onto the card on hover."
    },
    {
        "id": "google",
        "name": "Google Card",
        "family": "basic",
        "tier": "free",
        "platform": "google",
        "note": "Material elevation, Google blue avatar, 8px corners."
    },
    {
        "id": "gcompact",
        "name": "Google Compact",
        "family": "basic",
        "tier": "free",
        "platform": "google",
        "note": "Google's search-result ordering: name, then rating and date, then the text."
    },
    {
        "id": "gdark",
        "name": "Google Dark",
        "family": "basic",
        "tier": "free",
        "platform": "google",
        "note": "Google's own dark surface, elevation instead of borders."
    },
    {
        "id": "tp",
        "name": "Trustpilot Card",
        "family": "basic",
        "tier": "free",
        "platform": "trustpilot",
        "note": "Trustpilot green squares instead of stars, 4px corners."
    },
    {
        "id": "tpstrip",
        "name": "Trustpilot Strip",
        "family": "basic",
        "tier": "free",
        "platform": "trustpilot",
        "note": "Unbroken Trustpilot-green header bar, name reversed out."
    },
    {
        "id": "tpc",
        "name": "Trustpilot Compact",
        "family": "basic",
        "tier": "free",
        "platform": "trustpilot",
        "note": "Trustpilot's own order — stars first, name as the byline underneath."
    },
    {
        "id": "verified",
        "name": "Verified Minimal",
        "family": "basic",
        "tier": "free",
        "platform": null,
        "note": "Hairline card with a green verified dot after the name."
    },
    {
        "id": "plain",
        "name": "Plain",
        "family": "basic",
        "tier": "free",
        "platform": null,
        "note": "As plain as it gets. Inherits almost everything from your site."
    },
    {
        "id": "quote",
        "name": "Big Quote",
        "family": "editorial",
        "tier": "free",
        "platform": null,
        "note": "Oversized serif quote mark bleeding off the corner."
    },
    {
        "id": "pull",
        "name": "Pull Quote",
        "family": "editorial",
        "tier": "free",
        "platform": null,
        "note": "Quote leads, accent rule down the left, italic body."
    },
    {
        "id": "mag",
        "name": "Magazine",
        "family": "editorial",
        "tier": "free",
        "platform": null,
        "note": "Serif body with a coloured drop cap."
    },
    {
        "id": "news",
        "name": "Newsprint",
        "family": "editorial",
        "tier": "free",
        "platform": null,
        "note": "Heavy top rule, monospaced meta, no avatar."
    },
    {
        "id": "press",
        "name": "Letterpress",
        "family": "editorial",
        "tier": "pro",
        "platform": null,
        "note": "Warm paper stock, inset highlight, printed rather than rendered."
    },
    {
        "id": "museum",
        "name": "Museum Label",
        "family": "editorial",
        "tier": "pro",
        "platform": null,
        "note": "Gallery wall label: tracked caps, serif quote fenced by hairlines."
    },
    {
        "id": "ruled",
        "name": "Ruled Paper",
        "family": "editorial",
        "tier": "pro",
        "platform": null,
        "note": "Rules painted on the quote itself, plus a red margin line."
    },
    {
        "id": "broad",
        "name": "Broadsheet",
        "family": "editorial",
        "tier": "pro",
        "platform": null,
        "note": "Double top rule, justified serif, small-caps opening line."
    },
    {
        "id": "reveal",
        "name": "Reveal on Scroll",
        "family": "animated",
        "tier": "pro",
        "platform": null,
        "note": "Each element fades and rises in sequence as the card enters view."
    },
    {
        "id": "unfold",
        "name": "Unfold",
        "family": "animated",
        "tier": "pro",
        "platform": null,
        "note": "Swings down into place on its top edge, then stays put and readable."
    },
    {
        "id": "tilt",
        "name": "Tilt",
        "family": "animated",
        "tier": "pro",
        "platform": null,
        "note": "Card tips toward the cursor in 3D, springs back on leave."
    },
    {
        "id": "shine",
        "name": "Shine Sweep",
        "family": "animated",
        "tier": "pro",
        "platform": null,
        "note": "A light band sweeps diagonally across on hover. One pass."
    },
    {
        "id": "trace",
        "name": "Border Trace",
        "family": "animated",
        "tier": "pro",
        "platform": null,
        "note": "An accent highlight runs continuously around the border."
    },
    {
        "id": "pop",
        "name": "Lift & Pop",
        "family": "animated",
        "tier": "pro",
        "platform": null,
        "note": "Card lifts while the stars pop outward one by one."
    },
    {
        "id": "unblur",
        "name": "Text Unblur",
        "family": "animated",
        "tier": "pro",
        "platform": null,
        "note": "The quote resolves word by word out of a blur as it enters view."
    },
    {
        "id": "liquid",
        "name": "Liquid",
        "family": "animated",
        "tier": "pro",
        "platform": null,
        "note": "Card and glow breathe the same corner radius while the gradient travels."
    },
    {
        "id": "brutal",
        "name": "Brutalist",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "Hard black border, offset solid shadow, square everything."
    },
    {
        "id": "neon",
        "name": "Neon",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "Dark card with an accent glow ring. Reads best on a dark section."
    },
    {
        "id": "duo",
        "name": "Duotone",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "A solid navy header block over a white body. One card, no seam."
    },
    {
        "id": "sticker",
        "name": "Sticker",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "Thick white keyline, rotated slightly, straightens on hover."
    },
    {
        "id": "neu",
        "name": "Neumorphic",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "Soft extruded surface, dual light-source shadows."
    },
    {
        "id": "sheen",
        "name": "Brushed Sheen",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "Brushed graphite with a single silver band that tracks the pointer."
    },
    {
        "id": "pearl",
        "name": "Pearl",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "Ivory card, faint pearlescent wash. The quietest way to catch the light."
    },
    {
        "id": "term",
        "name": "Terminal",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "Phosphor green, CRT scanlines, shell prompt and a blinking caret."
    },
    {
        "id": "memphis",
        "name": "Memphis",
        "family": "bold",
        "tier": "pro",
        "platform": null,
        "note": "Hard keyline, offset shadow, a circle and a triangle. Bobs gently."
    },
    {
        "id": "clay",
        "name": "Clay",
        "family": "warm",
        "tier": "free",
        "platform": null,
        "note": "Terracotta tint, generous radius, a shadow with warmth in it."
    },
    {
        "id": "linen",
        "name": "Linen",
        "family": "warm",
        "tier": "free",
        "platform": null,
        "note": "Sand-beige stock with a woven grain. No shadow, just cloth."
    },
    {
        "id": "eink",
        "name": "E-Ink",
        "family": "warm",
        "tier": "free",
        "platform": null,
        "note": "Matte paper white, ink black, instant transitions. Made for reading."
    },
    {
        "id": "sage",
        "name": "Sage",
        "family": "warm",
        "tier": "free",
        "platform": null,
        "note": "Soft cream fill inside an olive hairline. Quiet and clinical-clean."
    },
    {
        "id": "pebble",
        "name": "Pebble",
        "family": "warm",
        "tier": "pro",
        "platform": null,
        "note": "Fully rounded stone shape, dual soft shadows, everything centred."
    },
    {
        "id": "kraft",
        "name": "Kraft",
        "family": "warm",
        "tier": "pro",
        "platform": null,
        "note": "Cardboard stock, stamped uppercase meta, a strip of tape at the corner."
    },
    {
        "id": "sunbaked",
        "name": "Sunbaked",
        "family": "warm",
        "tier": "pro",
        "platform": null,
        "note": "A slow cream-to-clay wash across the card. Warm, never loud."
    },
    {
        "id": "ceramic",
        "name": "Ceramic",
        "family": "warm",
        "tier": "pro",
        "platform": null,
        "note": "Glazed off-white with an inner rim highlight, like fired porcelain."
    },
    {
        "id": "noir",
        "name": "Noir",
        "family": "premium",
        "tier": "pro",
        "platform": null,
        "note": "Near-black surface, one hairline gold rule, serif quote."
    },
    {
        "id": "gilt",
        "name": "Gilt",
        "family": "premium",
        "tier": "pro",
        "platform": null,
        "note": "Ivory card inside a thin gold frame, inset from the edge."
    },
    {
        "id": "hotel",
        "name": "Hotel",
        "family": "premium",
        "tier": "pro",
        "platform": null,
        "note": "Cream stock, name in tracked small caps, everything down the middle."
    },
    {
        "id": "couture",
        "name": "Couture",
        "family": "premium",
        "tier": "pro",
        "platform": null,
        "note": "High-contrast serif under a hairline rule. Nothing else on the card."
    },
    {
        "id": "onyx",
        "name": "Onyx",
        "family": "premium",
        "tier": "pro",
        "platform": null,
        "note": "Charcoal with a slow vertical sheen and a cool metal edge."
    },
    {
        "id": "platinum",
        "name": "Platinum",
        "family": "premium",
        "tier": "pro",
        "platform": null,
        "note": "Cool grey card in a brushed-metal gradient rim."
    },
    {
        "id": "velvet",
        "name": "Velvet",
        "family": "premium",
        "tier": "pro",
        "platform": null,
        "note": "Deep ink-plum surface with a soft inner vignette."
    },
    {
        "id": "atelier",
        "name": "Atelier",
        "family": "premium",
        "tier": "pro",
        "platform": null,
        "note": "Off-white, wide margins, a single rule under the name. Studio-quiet."
    }
]

export function getLayoutDef(key: string): LayoutDef {
    return ALL_LAYOUTS.find((l) => l.key === key) || ALL_LAYOUTS[0]
}

export function getCardPresetDef(id: string): CardPresetDef {
    return ALL_CARD_PRESETS.find((p) => p.id === id) || ALL_CARD_PRESETS[0]
}

export function getPresetsByFamily(family: CardFamily): CardPresetDef[] {
    return ALL_CARD_PRESETS.filter((p) => p.family === family)
}
