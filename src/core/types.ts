export type ReviewSource = "google" | "trustpilot" | "custom"

export interface ReviewItem {
    id: string
    source: ReviewSource
    authorName: string
    authorAvatar?: string
    rating: number // 1 to 5
    date: string // e.g., "2 days ago" or "Oct 2026"
    text: string
    verified?: boolean
    originalUrl?: string
    pinned?: boolean
    hidden?: boolean
}

import type {
    ReviewLayout,
    CardStyle,
    LayoutGroup,
    LayoutDef,
    CardFamily,
    CardPresetDef,
} from "./catalogue"

export type {
    ReviewLayout,
    CardStyle,
    LayoutGroup,
    LayoutDef,
    CardFamily,
    CardPresetDef,
}

export type ThemeMode = "auto" | "light" | "dark"

export type MarqueeSpeed = "slow" | "normal" | "fast"

export interface ReviewConfig {
    // Mode
    isDemoMode: boolean
    sourceMode: "blend" | "google_only" | "trustpilot_only" | "custom_only"

    // Google Source
    googlePlaceId: string
    googleMapsUrl: string
    googleBusinessName: string
    googleRating: number
    googleReviewCount: number
    googleEnabled: boolean
    googleReviews: ReviewItem[]

    // Trustpilot Source
    trustpilotDomain: string
    trustpilotRating: number
    trustpilotReviewCount: number
    trustpilotEnabled: boolean
    trustpilotReviews: ReviewItem[]

    // Custom Reviews
    customReviews: ReviewItem[]

    // Layout & Display
    layout: ReviewLayout
    cardStyle: CardStyle
    themeMode: ThemeMode
    containerBg?: string
    starColor: string // hex
    gridColumns: number // 1 to 4

    // Toggles
    showStars: boolean
    showSourceIcon: boolean
    showAvatar: boolean
    showDate: boolean
    showVerifiedBadge: boolean
    showWriteReview: boolean
    writeReviewGoogleUrl: string
    writeReviewTrustpilotUrl: string

    // Filters & Curation
    minRatingFilter: number // 0 (all), 4, 5
    hideEmptyText: boolean
    maxReviews: number
    sortOrder: "newest" | "highest" | "random"
    textClamp: boolean

    // Engine options
    carouselAutoplay: boolean
    carouselSpeed: number // in seconds
    carouselInfinite: boolean // infinite slide scroll option
    marqueeSpeed: MarqueeSpeed

    // Styling metrics
    cornerRadius: number // px
    cardPadding: number // px
    cardGap: number // px

    // Branding & Compliance
    showBrandingBadge: boolean

    // SEO
    enableJsonLdSchema: boolean
}

export interface BlendedStats {
    averageRating: number
    totalReviews: number
    googleCount: number
    trustpilotCount: number
    customCount: number
}
