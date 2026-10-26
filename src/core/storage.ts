import { framer } from "@framer/plugin"
import { ReviewConfig, ConnectedBusiness, ReviewWidget } from "./types"
import { DEFAULT_CONFIG, normalizeConfig, createDefaultBusiness, createDefaultWidget } from "./config"

const STORAGE_KEY = "reviewfic_config_v1"
const STORAGE_KEY_BUSINESSES = "reviewfic_businesses_v2"
const STORAGE_KEY_WIDGETS = "reviewfic_widgets_v2"
const STORAGE_KEY_ACTIVE_BIZ = "reviewfic_active_biz_v2"
const STORAGE_KEY_ACTIVE_WIDGET = "reviewfic_active_widget_v2"

const MAX_CHUNK_SIZE = 1400

async function readStorage(key: string): Promise<string | null> {
    const isFramer = typeof (framer as any).getPluginData === "function"

    if (isFramer) {
        try {
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
            // In Framer: null/empty means this project document has no saved data for this key.
            // Do NOT fall back to localStorage to prevent cross-project pollution.
            return null
        } catch (e) {
            console.warn(`[Reviewfic] getPluginData failed for ${key}:`, e)
        }
    }

    // Only fallback to localStorage when running in standalone browser dev mode outside Framer
    try {
        const local = localStorage.getItem(key)
        if (local) return local
    } catch {}

    return null
}

async function writeStorage(key: string, val: string): Promise<boolean> {
    const isFramer = typeof (framer as any).setPluginData === "function"

    if (isFramer) {
        try {
            if (val.length <= MAX_CHUNK_SIZE) {
                await (framer as any).setPluginData(key, val)
                // Purge any stale chunk keys
                for (let i = 0; i < 20; i++) {
                    try {
                        await (framer as any).setPluginData(`${key}_c${i}`, null)
                    } catch {}
                }
            } else {
                const chunks: string[] = []
                for (let i = 0; i < val.length; i += MAX_CHUNK_SIZE) {
                    chunks.push(val.slice(i, i + MAX_CHUNK_SIZE))
                }
                for (let i = 0; i < chunks.length; i++) {
                    await (framer as any).setPluginData(`${key}_c${i}`, chunks[i])
                }
                await (framer as any).setPluginData(key, JSON.stringify({ __chunks__: chunks.length }))
                for (let i = chunks.length; i < 20; i++) {
                    try {
                        await (framer as any).setPluginData(`${key}_c${i}`, null)
                    } catch {}
                }
            }
            return true
        } catch (e) {
            console.warn(`[Reviewfic] Failed to save ${key} to Framer plugin data:`, e)
        }
    }

    // Outside Framer: store in localStorage
    try {
        localStorage.setItem(key, val)
        return true
    } catch {}

    return false
}

export async function loadBusinesses(): Promise<ConnectedBusiness[]> {
    try {
        const raw = await readStorage(STORAGE_KEY_BUSINESSES)
        if (raw) {
            const list = JSON.parse(raw)
            if (Array.isArray(list)) return list
        }
    } catch (e) {
        console.warn("[Reviewfic] Failed to parse businesses:", e)
    }

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

