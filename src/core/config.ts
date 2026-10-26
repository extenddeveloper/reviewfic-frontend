import { BlendedStats, ReviewConfig, ReviewItem, ConnectedBusiness, ReviewWidget } from "./types"
import { DEMO_REVIEWS } from "./mock-data"
import { generateReviewsForBusiness } from "./google-places"
import { generateReviewsForTrustpilot } from "./trustpilot"

export const DEFAULT_CONFIG: ReviewConfig = {
    isDemoMode: true,
    sourceMode: "blend",

    // Google defaults
    googlePlaceId: "ChIJ_themefic_dhaka_01",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Themefic+Dhaka",
    googleBusinessName: "Themefic",
    googleRating: 4.9,
    googleReviewCount: 340,
    googleEnabled: true,
    googleReviews: [],

    // Trustpilot defaults
    trustpilotDomain: "themefic.com",
    trustpilotRating: 4.8,
    trustpilotReviewCount: 180,
    trustpilotEnabled: true,
    trustpilotReviews: [],
    trustpilotStarStyle: true,

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
    maxReviews: 24,
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
        maxReviews: typeof saved.maxReviews === "number" ? saved.maxReviews : DEFAULT_CONFIG.maxReviews,
        customReviews: Array.isArray(saved.customReviews) ? saved.customReviews : DEFAULT_CONFIG.customReviews,
        googleReviews: Array.isArray(saved.googleReviews) ? saved.googleReviews : DEFAULT_CONFIG.googleReviews,
        trustpilotReviews: Array.isArray(saved.trustpilotReviews) ? saved.trustpilotReviews : DEFAULT_CONFIG.trustpilotReviews,
        trustpilotStarStyle: saved.trustpilotStarStyle !== undefined ? saved.trustpilotStarStyle : DEFAULT_CONFIG.trustpilotStarStyle,
    }
}

export function calculateBlendedStats(config: ReviewConfig, _activeReviews?: ReviewItem[]): BlendedStats {
    const hasGoogleReviews = config.googleEnabled && Array.isArray(config.googleReviews) && config.googleReviews.length > 0
    const hasGoogleConn = config.googleEnabled && Boolean(config.googleBusinessName && config.googleBusinessName !== "Company Studio")
    const hasLiveGoogle = hasGoogleReviews || hasGoogleConn

    const hasTpReviews = config.trustpilotEnabled && Array.isArray(config.trustpilotReviews) && config.trustpilotReviews.length > 0
    const hasTpConn = config.trustpilotEnabled && Boolean(config.trustpilotDomain && config.trustpilotDomain !== "company.com")
    const hasLiveTp = hasTpReviews || hasTpConn

    // If strictly in demo mode without any connected Google or Trustpilot profile
    if (config.isDemoMode && !hasLiveGoogle && !hasLiveTp) {
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

    // Live mode blended calculation - only count sources that are enabled AND actually connected
    const hasGoogle = config.googleEnabled && hasLiveGoogle
    const hasTrustpilot = config.trustpilotEnabled && hasLiveTp

    if (hasGoogle && hasTrustpilot) {
        const gCount = config.googleReviewCount || (config.googleReviews?.length || 24)
        const tpCount = config.trustpilotReviewCount || (config.trustpilotReviews?.length || 24)
        const gRating = config.googleRating || 4.8
        const tpRating = config.trustpilotRating || 4.8
        const total = gCount + tpCount
        const weightedScore = gRating * gCount + tpRating * tpCount
        return {
            averageRating: total > 0 ? Number((weightedScore / total).toFixed(1)) : 4.8,
            totalReviews: total,
            googleCount: gCount,
            trustpilotCount: tpCount,
            customCount: (config.customReviews || []).length,
        }
    }

    if (hasGoogle) {
        const gCount = config.googleReviewCount || (config.googleReviews?.length || 24)
        return {
            averageRating: config.googleRating || 4.8,
            totalReviews: gCount + (config.customReviews || []).length,
            googleCount: gCount,
            trustpilotCount: 0,
            customCount: (config.customReviews || []).length,
        }
    }

    if (hasTrustpilot) {
        const tpCount = config.trustpilotReviewCount || (config.trustpilotReviews?.length || 24)
        return {
            averageRating: config.trustpilotRating || 4.8,
            totalReviews: tpCount + (config.customReviews || []).length,
            googleCount: 0,
            trustpilotCount: tpCount,
            customCount: (config.customReviews || []).length,
        }
    }

    return {
        averageRating: 5.0,
        totalReviews: (config.customReviews || []).length,
        googleCount: 0,
        trustpilotCount: 0,
        customCount: (config.customReviews || []).length,
    }
}

export function getActiveReviews(config: ReviewConfig): ReviewItem[] {
    let list: ReviewItem[] = []

    const hasGoogleReviews = config.googleEnabled && Array.isArray(config.googleReviews) && config.googleReviews.length > 0
    const hasGoogleConn = config.googleEnabled && Boolean(config.googleBusinessName && config.googleBusinessName !== "Company Studio")

    const hasTpReviews = config.trustpilotEnabled && Array.isArray(config.trustpilotReviews) && config.trustpilotReviews.length > 0
    const hasTpConn = config.trustpilotEnabled && Boolean(config.trustpilotDomain && config.trustpilotDomain !== "company.com")

    const hasCustomReviews = Array.isArray(config.customReviews) && config.customReviews.length > 0

    const isConnected = hasGoogleReviews || hasGoogleConn || hasTpReviews || hasTpConn || hasCustomReviews

    if (isConnected && !config.isDemoMode) {
        let gList: ReviewItem[] = []
        if (config.googleEnabled) {
            if (hasGoogleReviews) {
                gList = config.googleReviews
            } else if (hasGoogleConn) {
                gList = generateReviewsForBusiness(config.googleBusinessName, "Business", config.googleMapsUrl)
            }
        }

        let tpList: ReviewItem[] = []
        if (config.trustpilotEnabled) {
            if (hasTpReviews) {
                tpList = config.trustpilotReviews
            } else if (hasTpConn) {
                tpList = generateReviewsForTrustpilot(config.trustpilotDomain, 24)
            }
        }

        const cList = config.customReviews || []

        if (config.sourceMode === "google_only") {
            list = [...gList]
        } else if (config.sourceMode === "trustpilot_only") {
            list = [...tpList]
        } else if (config.sourceMode === "custom_only") {
            list = [...cList]
        } else {
            // Blend / interleave Google + Trustpilot + Custom
            const combined: ReviewItem[] = []
            const maxLen = Math.max(gList.length, tpList.length, cList.length)
            for (let i = 0; i < maxLen; i++) {
                if (i < gList.length) combined.push(gList[i])
                if (i < tpList.length) combined.push(tpList[i])
                if (i < cList.length) combined.push(cList[i])
            }
            list = combined
        }
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

export function createDefaultBusiness(
    name = "My Business",
    googleData?: {
        name: string
        placeId: string
        mapsUrl?: string
        rating?: number
        reviewCount?: number
        reviews?: ReviewItem[]
    },
    trustpilotData?: {
        domain: string
        rating?: number
        reviewCount?: number
        reviews?: ReviewItem[]
    }
): ConnectedBusiness {
    const id = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const gName = googleData?.name || name
    const tpDomain = trustpilotData?.domain || ""

    return {
        id,
        name: gName,
        googlePlaceId: googleData?.placeId || `ChIJ_${Date.now()}`,
        googleBusinessName: gName,
        googleMapsUrl: googleData?.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gName)}`,
        googleRating: googleData?.rating ?? 4.9,
        googleReviewCount: googleData?.reviewCount ?? 156,
        googleReviews: googleData?.reviews || generateReviewsForBusiness(gName),
        googleEnabled: Boolean(googleData || !trustpilotData),

        trustpilotDomain: tpDomain,
        trustpilotRating: trustpilotData?.rating ?? 4.8,
        trustpilotReviewCount: trustpilotData?.reviewCount ?? 120,
        trustpilotReviews: tpDomain ? (trustpilotData?.reviews || generateReviewsForTrustpilot(tpDomain, 20)) : [],
        trustpilotEnabled: Boolean(tpDomain),

        customReviews: [],
        lastSync: "Just now",
        createdAt: Date.now(),
    }
}

export function createDefaultWidget(
    businessId: string,
    name = "Review Showcase",
    layout: ReviewConfig["layout"] = "carousel",
    cardStyle: ReviewConfig["cardStyle"] = "elevated"
): ReviewWidget {
    const id = `widget_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    return {
        id,
        businessId,
        name,
        config: {
            ...DEFAULT_CONFIG,
            widgetId: id,
            businessId,
            layout,
            cardStyle,
            isDemoMode: false,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
}

export function mergeBusinessIntoConfig(
    business: ConnectedBusiness,
    widgetConfig: ReviewConfig
): ReviewConfig {
    return {
        ...widgetConfig,
        businessId: business.id,
        widgetId: widgetConfig.widgetId,
        isDemoMode: false,
        googleBusinessName: business.googleBusinessName || business.name,
        googlePlaceId: business.googlePlaceId || "",
        googleMapsUrl: business.googleMapsUrl || "",
        googleRating: business.googleRating || 5,
        googleReviewCount: business.googleReviewCount || 0,
        googleReviews: business.googleReviews || [],
        googleEnabled: business.googleEnabled ?? true,

        trustpilotDomain: business.trustpilotDomain || "",
        trustpilotRating: business.trustpilotRating || 5,
        trustpilotReviewCount: business.trustpilotReviewCount || 0,
        trustpilotReviews: business.trustpilotReviews || [],
        trustpilotEnabled: business.trustpilotEnabled ?? false,

        customReviews: business.customReviews || [],
    }
}

