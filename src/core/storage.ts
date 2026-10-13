import { framer } from "@framer/plugin"
import { ReviewConfig } from "./types"
import { DEFAULT_CONFIG, normalizeConfig } from "./config"

const STORAGE_KEY = "reviewfic_config_v1"

export async function loadReviewConfig(): Promise<ReviewConfig> {
    try {
        if (typeof (framer as any).getPluginData === "function") {
            const raw = await (framer as any).getPluginData(STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                return normalizeConfig(parsed)
            }
        }
    } catch (e) {
        console.warn("[Reviewfic] Failed to load config from Framer storage:", e)
    }

    try {
        const local = localStorage.getItem(STORAGE_KEY)
        if (local) {
            return normalizeConfig(JSON.parse(local))
        }
    } catch {}

    return { ...DEFAULT_CONFIG }
}

export async function saveReviewConfig(config: ReviewConfig): Promise<boolean> {
    const serialized = JSON.stringify(config)
    let saved = false

    try {
        if (typeof (framer as any).setPluginData === "function") {
            await (framer as any).setPluginData(STORAGE_KEY, serialized)
            saved = true
        }
    } catch (e) {
        console.warn("[Reviewfic] Failed to save config to Framer storage:", e)
    }

    try {
        localStorage.setItem(STORAGE_KEY, serialized)
        saved = true
    } catch {}

    return saved
}
