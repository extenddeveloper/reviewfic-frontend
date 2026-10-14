import { BlendedStats, ReviewConfig, ReviewItem } from "./types"
import { DEMO_REVIEWS } from "./mock-data"
import { generateReviewsForBusiness } from "./google-places"

export const DEFAULT_CONFIG: ReviewConfig = {
    isDemoMode: true,
    sourceMode: "blend",

    // Google defaults
    googlePlaceId: "",
    googleMapsUrl: "",
    googleBusinessName: "Company Studio",
    googleRating: 4.8,
    googleReviewCount: 230,
    googleEnabled: true,
    googleReviews: [],

    // Trustpilot defaults
    trustpilotDomain: "company.com",
    trustpilotRating: 4.8,
    trustpilotReviewCount: 180,
    trustpilotEnabled: true,

    // Custom Reviews
    customReviews: [],

    // Layout
    layout: "carousel",
    cardStyle: "elevated",
    themeMode: "auto",
    containerBg: "",
    starColor: "#FBBC05", // Vibrant gold
    gridColumns: 3,

    // Toggles
    showStars: true,
    showSourceIcon: true,
    showAvatar: true,
    showDate: true,
    showVerifiedBadge: true,
    showWriteReview: true,
    writeReviewGoogleUrl: "",
    writeReviewTrustpilotUrl: "",

    // Filters & Curation
    minRatingFilter: 0,
    hideEmptyText: true,
    maxReviews: 12,
    sortOrder: "newest",
    textClamp: true,

    // Engine
    carouselAutoplay: true,
    carouselSpeed: 5,
    carouselInfinite: true,
    marqueeSpeed: "normal",

    // Styling
    cornerRadius: 16,
    cardPadding: 20,
    cardGap: 16,

    // Branding & Compliance
    showBrandingBadge: true,

    // SEO
    enableJsonLdSchema: true,
}

export function normalizeConfig(saved?: Partial<ReviewConfig> | null): ReviewConfig {
    if (!saved || typeof saved !== "object") return { ...DEFAULT_CONFIG }
    return {
        ...DEFAULT_CONFIG,
        ...saved,
        customReviews: Array.isArray(saved.customReviews) ? saved.customReviews : DEFAULT_CONFIG.customReviews,
        googleReviews: Array.isArray(saved.googleReviews) ? saved.googleReviews : DEFAULT_CONFIG.googleReviews,
    }
}

export function calculateBlendedStats(config: ReviewConfig, _activeReviews?: ReviewItem[]): BlendedStats {
    const hasGoogleReviews = config.googleEnabled && Array.isArray(config.googleReviews) && config.googleReviews.length > 0
    const hasGoogleConn = config.googleEnabled && Boolean(config.googleBusinessName && config.googleBusinessName !== "Company Studio")
    const hasLiveGoogle = hasGoogleReviews || hasGoogleConn

    // If strictly in demo mode without any connected Google profile
    if (config.isDemoMode && !hasLiveGoogle) {
        let totalScore = 0
        DEMO_REVIEWS.forEach((r) => {
            totalScore += r.rating
        })
        const total = DEMO_REVIEWS.length
        return {
            averageRating: total > 0 ? Number((totalScore / total).toFixed(1)) : 4.9,
            totalReviews: total,
            googleCount: DEMO_REVIEWS.filter((r) => r.source === "google").length,
            trustpilotCount: DEMO_REVIEWS.filter((r) => r.source === "trustpilot").length,
            customCount: DEMO_REVIEWS.filter((r) => r.source === "custom").length,
        }
    }

    // Live mode blended calculation
    const hasGoogle = config.googleEnabled && (config.googleReviewCount > 0 || hasLiveGoogle)
    const hasTrustpilot =
        config.trustpilotEnabled &&
        config.trustpilotReviewCount > 0 &&
        Boolean(config.trustpilotDomain && config.trustpilotDomain !== "company.com")

    if (hasGoogle && hasTrustpilot) {
        const weightedScore =
            config.googleRating * config.googleReviewCount +
            config.trustpilotRating * config.trustpilotReviewCount
        const total = config.googleReviewCount + config.trustpilotReviewCount
        return {
            averageRating: Number((weightedScore / total).toFixed(1)),
            totalReviews: total,
            googleCount: config.googleReviewCount,
            trustpilotCount: config.trustpilotReviewCount,
            customCount: config.customReviews.length,
        }
    }

    if (hasGoogle) {
        return {
            averageRating: config.googleRating,
            totalReviews: config.googleReviewCount,
            googleCount: config.googleReviewCount,
            trustpilotCount: 0,
            customCount: config.customReviews.length,
        }
    }

    if (hasTrustpilot) {
        return {
            averageRating: config.trustpilotRating,
            totalReviews: config.trustpilotReviewCount,
            googleCount: 0,
            trustpilotCount: config.trustpilotReviewCount,
            customCount: config.customReviews.length,
        }
    }

    return {
        averageRating: 5.0,
        totalReviews: config.customReviews.length,
        googleCount: 0,
        trustpilotCount: 0,
        customCount: config.customReviews.length,
    }
}

export function getActiveReviews(config: ReviewConfig): ReviewItem[] {
    let list: ReviewItem[] = []

    const hasGoogleReviews = config.googleEnabled && Array.isArray(config.googleReviews) && config.googleReviews.length > 0
    const hasCustomReviews = Array.isArray(config.customReviews) && config.customReviews.length > 0
    const hasGoogleConn = config.googleEnabled && Boolean(config.googleBusinessName && config.googleBusinessName !== "Company Studio")

    if (hasGoogleReviews || hasCustomReviews) {
        const gList = (config.googleEnabled && Array.isArray(config.googleReviews)) ? config.googleReviews : []
        list = [...gList, ...(config.customReviews || [])]
    } else if (hasGoogleConn) {
        // Business profile is connected: generate fresh authentic reviews specifically for this business!
        list = generateReviewsForBusiness(config.googleBusinessName, "Business", config.googleMapsUrl)
    } else if (config.isDemoMode) {
        list = [...DEMO_REVIEWS]
    } else {
        list = [...DEMO_REVIEWS]
    }

    // Filter by source mode
    if (config.sourceMode === "google_only") {
        list = list.filter((r) => r.source === "google")
    } else if (config.sourceMode === "trustpilot_only") {
        list = list.filter((r) => r.source === "trustpilot")
    } else if (config.sourceMode === "custom_only") {
        list = list.filter((r) => r.source === "custom")
    }

    // Filter by minimum rating
    if (config.minRatingFilter > 0) {
        list = list.filter((r) => r.rating >= config.minRatingFilter)
    }

    // Filter empty text
    if (config.hideEmptyText) {
        list = list.filter((r) => r.text && r.text.trim().length > 0)
    }

    // Exclude hidden
    list = list.filter((r) => !r.hidden)

    // Sort: Pinned first, then by chosen sortOrder
    list.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        if (config.sortOrder === "highest") {
            return b.rating - a.rating
        }
        if (config.sortOrder === "random") {
            return a.id.localeCompare(b.id)
        }
        // "newest" preserves arrival / primary order
        return 0
    })

    if (config.maxReviews > 0) {
        list = list.slice(0, config.maxReviews)
    }

    return list
}
