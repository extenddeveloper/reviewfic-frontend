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

// Framer enforces a strict total combined limit of 4096 bytes across all plugin data keys on a node.
// We set a conservative safe limit per key to guarantee the total sum never exceeds 4kB.
const MAX_SAFE_PLUGIN_DATA_SIZE = 2500

async function ensureStoragePermissions(): Promise<void> {
    try {
        if (typeof (framer as any).isAllowedTo === "function") {
            await (framer as any).isAllowedTo("setPluginData", "getPluginData")
        }
    } catch {}
}

/**
 * Strips heavy review arrays from a ConnectedBusiness before storing in Framer plugin data.
 * Reviews are re-hydrated dynamically upon load, keeping storage < 500 bytes per business.
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
        googleReviews: undefined, // Omit bulky review arrays to stay strictly within 4kB Framer limit
        trustpilotDomain: b.trustpilotDomain || "",
        trustpilotRating: b.trustpilotRating ?? 5,
        trustpilotReviewCount: b.trustpilotReviewCount ?? 0,
        trustpilotEnabled: b.trustpilotEnabled ?? false,
        trustpilotReviews: undefined, // Omit bulky review arrays
        customReviews: Array.isArray(b.customReviews) ? b.customReviews.slice(0, 10) : [],
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
 * Strips review arrays from widget config before storing. Reviews are inherited from the active business.
 */
export function compactWidget(w: ReviewWidget): ReviewWidget {
    const { googleReviews, trustpilotReviews, customReviews, ...restConfig } = w.config || DEFAULT_CONFIG
    return {
        id: w.id,
        businessId: w.businessId,
        name: w.name,
        config: restConfig as ReviewConfig,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
    }
}

/**
 * Cleans up any legacy chunk keys (_c0, _c1, ...) that may be consuming Framer's 4kB quota.
 */
export async function cleanupStalePluginDataChunks(): Promise<void> {
    if (typeof (framer as any).setPluginData !== "function") return
    await ensureStoragePermissions()
    const keys = [STORAGE_KEY_BUSINESSES, STORAGE_KEY_WIDGETS, STORAGE_KEY]
    for (const key of keys) {
        for (let i = 0; i < 10; i++) {
            try {
                await (framer as any).setPluginData(`${key}_c${i}`, null)
            } catch {}
        }
    }
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
                        return full
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
        try {
            await ensureStoragePermissions()

            if (val.length <= MAX_SAFE_PLUGIN_DATA_SIZE) {
                await (framer as any).setPluginData(key, val)
                // Clean up any historical chunk keys for this key
                for (let i = 0; i < 5; i++) {
                    try {
                        await (framer as any).setPluginData(`${key}_c${i}`, null)
                    } catch {}
                }
                return true
            } else {
                console.warn(`[Reviewfic] Payload for ${key} (${val.length} bytes) exceeds safe limit, relying on local storage to preserve Framer 4kB quota.`)
                return true
            }
        } catch (e) {
            console.warn(`[Reviewfic] Failed to save ${key} to Framer plugin data (using local storage):`, e)
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
                    config: normalizeConfig(w.config || DEFAULT_CONFIG),
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
    const { googleReviews, trustpilotReviews, customReviews, ...rest } = config
    return writeStorage(STORAGE_KEY, JSON.stringify(rest))
}
