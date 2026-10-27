import { framer } from "@framer/plugin"
import { ReviewConfig, ConnectedBusiness, ReviewWidget } from "./types"
import { DEFAULT_CONFIG, normalizeConfig } from "./config"
import { generateReviewsForBusiness } from "./google-places"
import { generateReviewsForTrustpilot } from "./trustpilot"

const STORAGE_KEY = "reviewfic_config_v1"
const STORAGE_KEY_BUSINESSES = "reviewfic_businesses_v2"
const STORAGE_KEY_WIDGETS = "reviewfic_widgets_v2"
const STORAGE_KEY_ACTIVE_BIZ = "reviewfic_active_biz_v2"
const STORAGE_KEY_ACTIVE_WIDGET = "reviewfic_active_widget_v2"

// Framer strictly asserts: value.length <= 2048 (max 2kB per value)
// and combined total across all keys on a node <= 4096 (max 4kB combined).
// We set a strict safety cap of 1800 bytes per key to guarantee zero Framer assertion errors.
const MAX_PLUGIN_DATA_VALUE_BYTES = 1800

async function ensureStoragePermissions(): Promise<void> {
    try {
        if (typeof (framer as any).isAllowedTo === "function") {
            await (framer as any).isAllowedTo("setPluginData", "getPluginData")
        }
    } catch {}
}

/**
 * Extracts only non-default properties from a ReviewConfig to create an ultra-compact delta (~60-120 bytes).
 * This prevents arrays of widgets from exceeding Framer's 2kB per-key and 4kB combined limits.
 */
export function getWidgetConfigDelta(config: ReviewConfig): Partial<ReviewConfig> {
    const full = config || DEFAULT_CONFIG
    const delta: any = {
        layout: full.layout || "carousel",
        cardStyle: full.cardStyle || "elevated",
    }

    if (full.sourceMode && full.sourceMode !== DEFAULT_CONFIG.sourceMode) delta.sourceMode = full.sourceMode
    if (full.themeMode && full.themeMode !== DEFAULT_CONFIG.themeMode) delta.themeMode = full.themeMode
    if (full.starColor && full.starColor !== DEFAULT_CONFIG.starColor) delta.starColor = full.starColor
    if (full.gridColumns && full.gridColumns !== DEFAULT_CONFIG.gridColumns) delta.gridColumns = full.gridColumns
    if (full.containerBg) delta.containerBg = full.containerBg

    if (full.showStars !== DEFAULT_CONFIG.showStars) delta.showStars = full.showStars
    if (full.showSourceIcon !== DEFAULT_CONFIG.showSourceIcon) delta.showSourceIcon = full.showSourceIcon
    if (full.showAvatar !== DEFAULT_CONFIG.showAvatar) delta.showAvatar = full.showAvatar
    if (full.showDate !== DEFAULT_CONFIG.showDate) delta.showDate = full.showDate
    if (full.showVerifiedBadge !== DEFAULT_CONFIG.showVerifiedBadge) delta.showVerifiedBadge = full.showVerifiedBadge
    if (full.showWriteReview !== DEFAULT_CONFIG.showWriteReview) delta.showWriteReview = full.showWriteReview
    if (full.writeReviewGoogleUrl) delta.writeReviewGoogleUrl = full.writeReviewGoogleUrl
    if (full.writeReviewTrustpilotUrl) delta.writeReviewTrustpilotUrl = full.writeReviewTrustpilotUrl
    if (full.minRatingFilter !== DEFAULT_CONFIG.minRatingFilter) delta.minRatingFilter = full.minRatingFilter
    if (full.hideEmptyText !== DEFAULT_CONFIG.hideEmptyText) delta.hideEmptyText = full.hideEmptyText
    if (full.maxReviews !== DEFAULT_CONFIG.maxReviews) delta.maxReviews = full.maxReviews
    if (full.sortOrder !== DEFAULT_CONFIG.sortOrder) delta.sortOrder = full.sortOrder
    if (full.textClamp !== DEFAULT_CONFIG.textClamp) delta.textClamp = full.textClamp
    if (full.carouselAutoplay !== DEFAULT_CONFIG.carouselAutoplay) delta.carouselAutoplay = full.carouselAutoplay
    if (full.carouselSpeed !== DEFAULT_CONFIG.carouselSpeed) delta.carouselSpeed = full.carouselSpeed
    if (full.carouselInfinite !== DEFAULT_CONFIG.carouselInfinite) delta.carouselInfinite = full.carouselInfinite
    if (full.marqueeSpeed !== DEFAULT_CONFIG.marqueeSpeed) delta.marqueeSpeed = full.marqueeSpeed
    if (full.cornerRadius !== DEFAULT_CONFIG.cornerRadius) delta.cornerRadius = full.cornerRadius
    if (full.cardPadding !== DEFAULT_CONFIG.cardPadding) delta.cardPadding = full.cardPadding
    if (full.cardGap !== DEFAULT_CONFIG.cardGap) delta.cardGap = full.cardGap
    if (full.showBrandingBadge !== DEFAULT_CONFIG.showBrandingBadge) delta.showBrandingBadge = full.showBrandingBadge
    if (full.enableJsonLdSchema !== DEFAULT_CONFIG.enableJsonLdSchema) delta.enableJsonLdSchema = full.enableJsonLdSchema

    return delta
}

/**
 * Strips heavy review arrays from a ConnectedBusiness before storing in Framer plugin data (~150 bytes per business).
 */
export function compactBusiness(b: ConnectedBusiness): ConnectedBusiness {
    return {
        id: b.id,
        name: b.name,
        googlePlaceId: b.googlePlaceId || "",
        googleBusinessName: b.googleBusinessName || "",
        googleMapsUrl: b.googleMapsUrl || "",
        googleRating: b.googleRating ?? 5,
        googleReviewCount: b.googleReviewCount ?? 0,
        googleEnabled: b.googleEnabled ?? true,
        googleReviews: undefined, // Omit bulky review arrays to stay strictly within 2kB/4kB Framer limits
        trustpilotDomain: b.trustpilotDomain || "",
        trustpilotRating: b.trustpilotRating ?? 5,
        trustpilotReviewCount: b.trustpilotReviewCount ?? 0,
        trustpilotEnabled: b.trustpilotEnabled ?? false,
        trustpilotReviews: undefined, // Omit bulky review arrays
        customReviews: Array.isArray(b.customReviews) ? b.customReviews.slice(0, 5) : [],
        lastSync: b.lastSync || "Just now",
        notes: b.notes,
    }
}

/**
 * Re-hydrates reviews for a ConnectedBusiness when loaded from storage.
 */
export function hydrateBusiness(b: ConnectedBusiness): ConnectedBusiness {
    const hasGoogleReviews = Array.isArray(b.googleReviews) && b.googleReviews.length > 0
    const hasTpReviews = Array.isArray(b.trustpilotReviews) && b.trustpilotReviews.length > 0

    return {
        ...b,
        googleReviews: hasGoogleReviews
            ? b.googleReviews
            : (b.googleBusinessName ? generateReviewsForBusiness(b.googleBusinessName, "Business", b.googleMapsUrl) : []),
        trustpilotReviews: hasTpReviews
            ? b.trustpilotReviews
            : (b.trustpilotDomain ? generateReviewsForTrustpilot(b.trustpilotDomain, 24) : []),
        customReviews: b.customReviews || [],
    }
}

/**
 * Strips review arrays and default values from widget config before storing (~120 bytes per widget).
 */
export function compactWidget(w: ReviewWidget): any {
    return {
        id: w.id,
        businessId: w.businessId,
        name: w.name,
        config: getWidgetConfigDelta(w.config),
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
    }
}

/**
 * Cleans up any legacy chunk keys (_c0, _c1, ...) that may be consuming Framer's 4kB quota.
 */
export async function cleanupStalePluginDataChunks(): Promise<void> {
    if (typeof (framer as any).setPluginData !== "function") return
    try {
        await ensureStoragePermissions()
        const keys = [STORAGE_KEY_BUSINESSES, STORAGE_KEY_WIDGETS, STORAGE_KEY]
        for (const key of keys) {
            for (let i = 0; i < 5; i++) {
                try {
                    await (framer as any).setPluginData(`${key}_c${i}`, null)
                } catch {}
            }
        }
    } catch {}
}

async function readStorage(key: string): Promise<string | null> {
    const isFramer = typeof (framer as any).getPluginData === "function"

    if (isFramer) {
        try {
            await ensureStoragePermissions()
            const raw = await (framer as any).getPluginData(key)
            if (raw) {
                try {
                    const parsed = JSON.parse(raw)
                    if (parsed && typeof parsed.__chunks__ === "number") {
                        let full = ""
                        for (let i = 0; i < parsed.__chunks__; i++) {
                            const chunk = await (framer as any).getPluginData(`${key}_c${i}`)
                            if (chunk) full += chunk
                        }
                        if (full) return full
                    }
                } catch {}
                return raw
            }
        } catch (e) {
            console.warn(`[Reviewfic] getPluginData failed for ${key}:`, e)
        }
    }

    // Fallback to localStorage
    try {
        const local = localStorage.getItem(key)
        if (local) return local
    } catch {}

    return null
}

async function writeStorage(key: string, val: string): Promise<boolean> {
    // Always mirror to localStorage as resilient fallback
    try {
        localStorage.setItem(key, val)
    } catch {}

    const isFramer = typeof (framer as any).setPluginData === "function"

    if (isFramer) {
        // STRICT SAFETY CHECK: Framer throws Assertion Error if val.length > 2048
        if (val.length > MAX_PLUGIN_DATA_VALUE_BYTES) {
            console.warn(`[Reviewfic] Payload for ${key} (${val.length} bytes) exceeds safe limit (${MAX_PLUGIN_DATA_VALUE_BYTES} bytes). Preserved in localStorage to protect Framer quota.`)
            return true
        }

        try {
            await ensureStoragePermissions()
            await (framer as any).setPluginData(key, val)
            return true
        } catch (e) {
            console.warn(`[Reviewfic] Failed to save ${key} to Framer plugin data:`, e)
            return false
        }
    }

    return true
}

export async function loadBusinesses(): Promise<ConnectedBusiness[]> {
    try {
        const raw = await readStorage(STORAGE_KEY_BUSINESSES)
        if (raw) {
            const list = JSON.parse(raw)
            if (Array.isArray(list)) {
                return list.map(hydrateBusiness)
            }
        }
    } catch (e) {
        console.warn("[Reviewfic] Failed to parse businesses:", e)
    }

    return []
}

export async function saveBusinesses(businesses: ConnectedBusiness[]): Promise<boolean> {
    const compacted = businesses.map(compactBusiness)
    return writeStorage(STORAGE_KEY_BUSINESSES, JSON.stringify(compacted))
}

export async function loadWidgets(): Promise<ReviewWidget[]> {
    try {
        const raw = await readStorage(STORAGE_KEY_WIDGETS)
        if (raw) {
            const list = JSON.parse(raw)
            if (Array.isArray(list) && list.length > 0) {
                return list.map((w) => ({
                    ...w,
                    config: normalizeConfig({
                        ...DEFAULT_CONFIG,
                        ...(w.config || {}),
                        widgetId: w.id,
                        businessId: w.businessId,
                    }),
                }))
            }
        }
    } catch (e) {
        console.warn("[Reviewfic] Failed to parse widgets:", e)
    }
    return []
}

export async function saveWidgets(widgets: ReviewWidget[]): Promise<boolean> {
    const compacted = widgets.map(compactWidget)
    return writeStorage(STORAGE_KEY_WIDGETS, JSON.stringify(compacted))
}

export async function loadActiveBusinessId(): Promise<string | null> {
    return readStorage(STORAGE_KEY_ACTIVE_BIZ)
}

export async function saveActiveBusinessId(id: string): Promise<boolean> {
    return writeStorage(STORAGE_KEY_ACTIVE_BIZ, id)
}

export async function loadActiveWidgetId(): Promise<string | null> {
    return readStorage(STORAGE_KEY_ACTIVE_WIDGET)
}

export async function saveActiveWidgetId(id: string): Promise<boolean> {
    return writeStorage(STORAGE_KEY_ACTIVE_WIDGET, id)
}

export async function loadReviewConfig(): Promise<ReviewConfig> {
    try {
        const raw = await readStorage(STORAGE_KEY)
        if (raw) {
            return normalizeConfig(JSON.parse(raw))
        }
    } catch (e) {
        console.warn("[Reviewfic] Failed to load config from storage:", e)
    }
    return { ...DEFAULT_CONFIG }
}

export async function saveReviewConfig(config: ReviewConfig): Promise<boolean> {
    const delta = getWidgetConfigDelta(config)
    return writeStorage(STORAGE_KEY, JSON.stringify(delta))
}
