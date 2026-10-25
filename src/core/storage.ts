import { framer } from "@framer/plugin"
import { ReviewConfig, ConnectedBusiness, ReviewWidget } from "./types"
import { DEFAULT_CONFIG, normalizeConfig, createDefaultBusiness, createDefaultWidget } from "./config"

const STORAGE_KEY = "reviewfic_config_v1"
const STORAGE_KEY_BUSINESSES = "reviewfic_businesses_v2"
const STORAGE_KEY_WIDGETS = "reviewfic_widgets_v2"
const STORAGE_KEY_ACTIVE_BIZ = "reviewfic_active_biz_v2"
const STORAGE_KEY_ACTIVE_WIDGET = "reviewfic_active_widget_v2"

async function readStorage(key: string): Promise<string | null> {
    try {
        if (typeof (framer as any).getPluginData === "function") {
            const raw = await (framer as any).getPluginData(key)
            if (raw) return raw
        }
    } catch {}

    try {
        const local = localStorage.getItem(key)
        if (local) return local
    } catch {}

    return null
}

async function writeStorage(key: string, val: string): Promise<boolean> {
    let saved = false
    try {
        if (typeof (framer as any).setPluginData === "function") {
            await (framer as any).setPluginData(key, val)
            saved = true
        }
    } catch {}

    try {
        localStorage.setItem(key, val)
        saved = true
    } catch {}

    return saved
}

export async function loadBusinesses(): Promise<ConnectedBusiness[]> {
    try {
        const raw = await readStorage(STORAGE_KEY_BUSINESSES)
        if (raw) {
            const list = JSON.parse(raw)
            if (Array.isArray(list) && list.length > 0) return list
        }
    } catch (e) {
        console.warn("[Reviewfic] Failed to parse businesses:", e)
    }

    // Auto-migration from legacy single config
    try {
        const legacyRaw = await readStorage(STORAGE_KEY)
        if (legacyRaw) {
            const legacy = normalizeConfig(JSON.parse(legacyRaw))
            const biz = createDefaultBusiness(
                legacy.googleBusinessName || "Gazipur City Corporation",
                {
                    name: legacy.googleBusinessName || "Gazipur City Corporation",
                    placeId: legacy.googlePlaceId || "",
                    mapsUrl: legacy.googleMapsUrl || "",
                    rating: legacy.googleRating,
                    reviewCount: legacy.googleReviewCount,
                    reviews: legacy.googleReviews,
                },
                legacy.trustpilotDomain
                    ? {
                          domain: legacy.trustpilotDomain,
                          rating: legacy.trustpilotRating,
                          reviewCount: legacy.trustpilotReviewCount,
                          reviews: legacy.trustpilotReviews,
                      }
                    : undefined
            )
            biz.customReviews = legacy.customReviews || []
            await saveBusinesses([biz])
            return [biz]
        }
    } catch {}

    return []
}

export async function saveBusinesses(businesses: ConnectedBusiness[]): Promise<boolean> {
    return writeStorage(STORAGE_KEY_BUSINESSES, JSON.stringify(businesses))
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
    return writeStorage(STORAGE_KEY_WIDGETS, JSON.stringify(widgets))
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
    return writeStorage(STORAGE_KEY, JSON.stringify(config))
}

