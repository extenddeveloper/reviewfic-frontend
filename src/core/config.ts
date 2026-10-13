import { BlendedStats, ReviewConfig, ReviewItem } from "./types"
import { DEMO_REVIEWS } from "./mock-data"

export const DEFAULT_CONFIG: ReviewConfig = {
    isDemoMode: true,
    sourceMode: "blend",

    // Google defaults
    googlePlaceId: "",
    googleMapsUrl: "",
    googleBusinessName: "Company Studio",
    googleRating: 4.9,
    googleReviewCount: 142,
    googleEnabled: true,

    // Trustpilot defaults
    trustpilotDomain: "company.com",
    trustpilotRating: 4.8,
    trustpilotReviewCount: 88,
    trustpilotEnabled: true,

    // Custom Reviews
    customReviews: [],

    // Layout
    layout: "carousel",
    cardStyle: "elevated",
    themeMode: "auto",
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

    // Filters
    minRatingFilter: 0,
    hideEmptyText: true,
    maxReviews: 12,

    // Engine
    carouselAutoplay: true,
    carouselSpeed: 5,
    marqueeSpeed: "normal",

    // Styling
    cornerRadius: 16,
    cardPadding: 20,
    cardGap: 16,

    // SEO
    enableJsonLdSchema: true,
}

export function normalizeConfig(saved?: Partial<ReviewConfig> | null): ReviewConfig {
    if (!saved || typeof saved !== "object") return { ...DEFAULT_CONFIG }
    return {
        ...DEFAULT_CONFIG,
        ...saved,
        customReviews: Array.isArray(saved.customReviews) ? saved.customReviews : DEFAULT_CONFIG.customReviews,
    }
}

export function calculateBlendedStats(config: ReviewConfig, activeReviews: ReviewItem[]): BlendedStats {
    let totalScore = 0
    let totalCount = 0
    let googleCount = 0
    let trustpilotCount = 0
    let customCount = 0

    if (config.isDemoMode) {
        // Weighted composite of demo reviews
        activeReviews.forEach((r) => {
            if (r.hidden) return
            totalScore += r.rating
            totalCount += 1
            if (r.source === "google") googleCount += 1
            else if (r.source === "trustpilot") trustpilotCount += 1
            else customCount += 1
        })

        const avg = totalCount > 0 ? Number((totalScore / totalCount).toFixed(1)) : 4.9
        return {
            averageRating: avg || 4.9,
            totalReviews: totalCount || 8,
            googleCount: googleCount || 4,
            trustpilotCount: trustpilotCount || 3,
            customCount: customCount || 1,
        }
    }

    // Live mode blended calculation
    const hasGoogle = config.googleEnabled && config.googleReviewCount > 0
    const hasTrustpilot = config.trustpilotEnabled && config.trustpilotReviewCount > 0

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

    if (config.isDemoMode) {
        list = [...DEMO_REVIEWS]
    } else {
        // Include custom reviews + any synced reviews
        list = [...config.customReviews]
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

    // Sort: Pinned first, then by rating/date
    list.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return b.rating - a.rating
    })

    if (config.maxReviews > 0) {
        list = list.slice(0, config.maxReviews)
    }

    return list
}
