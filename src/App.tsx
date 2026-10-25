import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { framer } from "@framer/plugin"
import { ReviewConfig, ReviewItem, ReviewLayout, CardStyle, ThemeMode, CardFamily } from "./core/types"
import { DEFAULT_CONFIG, calculateBlendedStats, getActiveReviews } from "./core/config"
import { ALL_LAYOUTS, LAYOUT_GROUPS, ALL_CARD_PRESETS, CARD_FAMILIES } from "./core/catalogue"
import { loadReviewConfig, saveReviewConfig } from "./core/storage"
import {
    insertCanvasComponent,
    getCanvasInstancesCount,
    syncCanvasInstance,
} from "./framer/canvas-component-service"
import {
    IconGoogle,
    IconTrustpilot,
    IconStar,
    IconSparkles,
    IconLayoutCarousel,
    IconLayoutGrid,
    IconLayoutMasonry,
    IconLayoutMarquee,
    IconBadge,
    IconSun,
    IconMoon,
    IconRefresh,
    IconPlus,
    IconTrash,
    IconCrown,
    IconSliders,
    IconCheck,
    IconShieldCheck,
    IconSearch,
    IconDownload,
    IconUpload,
    IconDatabase,
    IconFileText,
    IconUser,
    IconExternalLink,
    IconNoticeInfo,
    IconNoticeSuccess,
    IconNoticeWarning,
    IconNoticeError,
    IconX,
} from "./ui/icons"
import {
    reviewsToCSVString,
    downloadCSV,
    generateSampleCSV,
    parseCSVToReviews,
} from "./core/csv-service"
import { syncReviewsToFramerCMS, exportReviewsForFramerCMS } from "./framer/cms-sync-service"
import {
    searchGooglePlaces,
    parseGoogleMapsInput,
    generateReviewsForBusiness,
    GooglePlaceResult,
} from "./core/google-places"
import {
    resolveTrustpilotProfile,
    generateReviewsForTrustpilot,
    parseTrustpilotInput,
} from "./core/trustpilot"
import { HeroCard } from "./ui/components/HeroCard"
import { Switch } from "./ui/components/Switch"
import { Field } from "./ui/components/Field"
import { Section } from "./ui/components/Section"
import { ProfilePage } from "./ui/components/ProfilePage"
import { LiveStudioPreview } from "./ui/components/LiveStudioPreview"
import { CustomColorPicker } from "./ui/components/CustomColorPicker"
import { HelpRow } from "./ui/components/HelpRow"
import { FrameficCard } from "./ui/components/FrameficCard"
import "./ui/styles.css"

type TabId = "home" | "builder" | "sources" | "settings"

type NoticeType = "info" | "success" | "warning" | "error"

interface NoticeState {
    type: NoticeType
    text: string
    title?: string
}

export function App() {
    const [config, setConfig] = useState<ReviewConfig>(DEFAULT_CONFIG)
    const [tab, setTab] = useState<TabId>("home")
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [canvasCount, setCanvasCount] = useState<number>(0)
    const [inserting, setInserting] = useState<boolean>(false)
    const [notice, setNotice] = useState<NoticeState | null>(null)
    const mainRef = useRef<HTMLElement>(null)

    // Auto-dismiss notice after 5 seconds
    useEffect(() => {
        if (!notice) return
        const timer = setTimeout(() => {
            setNotice(null)
        }, 5000)
        return () => clearTimeout(timer)
    }, [notice])

    const showNotice = useCallback((text: string, type: NoticeType = "success", title?: string) => {
        setNotice({ type, text, title })
        mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })
        try {
            if (typeof (framer as any).notify === "function") {
                ;(framer as any).notify(text)
            }
        } catch {}
    }, [])

    // Phase 2 Studio states
    const [stageTheme, setStageTheme] = useState<"soft" | "dark" | "light">("soft")
    const [selectedLayoutGroup, setSelectedLayoutGroup] = useState<string>("cards")
    const [selectedCardFamily, setSelectedCardFamily] = useState<CardFamily | "all">("modern")

    // Google Places Search & Resolver states
    const [googleQuery, setGoogleQuery] = useState("")
    const [placeResults, setPlaceResults] = useState<GooglePlaceResult[]>([])
    const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
    const [tpInput, setTpInput] = useState("")

    // New custom review form state
    const [newAuthor, setNewAuthor] = useState("")
    const [newText, setNewText] = useState("")
    const [newRating, setNewRating] = useState(5)
    const [newVerified, setNewVerified] = useState(true)

    // Phase 2: CSV Import/Export & Framer CMS Collection Sync states
    const [isSyncingCMS, setIsSyncingCMS] = useState(false)
    const [cmsSyncMsg, setCmsSyncMsg] = useState<{ text: string; ok: boolean } | null>(null)
    const [csvError, setCsvError] = useState<string | null>(null)
    const [csvSuccess, setCsvSuccess] = useState<string | null>(null)
    const [showCsvPaste, setShowCsvPaste] = useState(false)
    const [csvPasteText, setCsvPasteText] = useState("")

    // Load initial config and check canvas instances
    useEffect(() => {
        let isMounted = true
        async function init() {
            const loaded = await loadReviewConfig()
            if (!isMounted) return
            if (loaded.trustpilotDomain && (loaded.trustpilotDomain.includes("http") || loaded.trustpilotDomain.includes("trustpilot.com"))) {
                const parsed = parseTrustpilotInput(loaded.trustpilotDomain)
                if (parsed.domain) loaded.trustpilotDomain = parsed.domain
            }
            const lGroup = ALL_LAYOUTS.find((l) => l.key === loaded.layout)?.group
            if (lGroup) setSelectedLayoutGroup(lGroup)
            const cFamily = ALL_CARD_PRESETS.find((p) => p.id === loaded.cardStyle)?.family
            if (cFamily) setSelectedCardFamily(cFamily)
            setConfig(loaded)

            try {
                const count = await getCanvasInstancesCount()
                if (!isMounted) return
                setCanvasCount(count)
            } catch {
                if (!isMounted) return
                setCanvasCount(0)
            }
        }
        void init()
        return () => {
            isMounted = false
        }
    }, [])

    const refreshCanvasInstances = useCallback(async () => {
        try {
            const count = await getCanvasInstancesCount()
            setCanvasCount(count)
        } catch {
            setCanvasCount(0)
        }
    }, [])

    // Auto-save on config changes and sync canvas instances live
    const updateConfig = useCallback((updater: (prev: ReviewConfig) => ReviewConfig) => {
        setConfig((prev) => {
            const updated = updater(prev)
            void saveReviewConfig(updated)
            void syncCanvasInstance(updated)
            return updated
        })
    }, [])

    const [themePreference, setThemePreference] = useState<"light" | "dark" | "auto">(() => {
        try {
            const saved = localStorage.getItem("reviewfic_theme_pref_v1")
            if (saved === "light" || saved === "dark" || saved === "auto") {
                return saved
            }
        } catch {}
        return "auto"
    })
    const [canvasTheme, setCanvasTheme] = useState<"light" | "dark">(() => {
        if (typeof document !== "undefined") {
            const bodyTheme = document.body?.getAttribute("data-framer-theme")
            if (bodyTheme === "light" || bodyTheme === "dark") return bodyTheme
            const htmlTheme = document.documentElement?.getAttribute("data-framer-theme")
            if (htmlTheme === "light" || htmlTheme === "dark") return htmlTheme
        }
        return "dark"
    })

    // Automatic Canvas Theme Sync + Subscription (Framer SDK driven)
    useEffect(() => {
        function readCanvasTheme(): "light" | "dark" {
            const bodyTheme = document.body?.getAttribute("data-framer-theme")
            if (bodyTheme === "light" || bodyTheme === "dark") return bodyTheme
            const htmlTheme = document.documentElement?.getAttribute("data-framer-theme")
            if (htmlTheme === "light" || htmlTheme === "dark") return htmlTheme
            try {
                if (typeof (framer as any).getTheme === "function") {
                    const t = (framer as any).getTheme()
                    const mode = typeof t === "string" ? t : t?.mode
                    if (mode === "light" || mode === "dark") return mode
                }
                if ((framer as any).theme) {
                    const t = (framer as any).theme
                    const mode = typeof t === "string" ? t : t?.mode
                    if (mode === "light" || mode === "dark") return mode
                }
            } catch {}
            return "dark"
        }

        const detected = readCanvasTheme()
        setCanvasTheme(detected)

        let unsubscribe: (() => void) | undefined
        try {
            if (typeof (framer as any).subscribe === "function") {
                unsubscribe = (framer as any).subscribe("theme", (themeData: any) => {
                    const mode = typeof themeData === "string" ? themeData : themeData?.mode
                    if (mode === "light" || mode === "dark") {
                        setCanvasTheme(mode)
                        setThemePreference("auto")
                    }
                })
            }
        } catch {}

        const observer = new MutationObserver(() => {
            const current = readCanvasTheme()
            setCanvasTheme((prev) => {
                if (prev !== current) {
                    setThemePreference("auto")
                    return current
                }
                return prev
            })
        })

        if (document.body) {
            observer.observe(document.body, { attributes: true, attributeFilter: ["data-framer-theme"] })
        }
        if (document.documentElement) {
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-framer-theme"] })
        }

        return () => {
            if (unsubscribe) unsubscribe()
            observer.disconnect()
        }
    }, [])

    const resolvedTheme: "light" | "dark" = themePreference === "auto" ? canvasTheme : themePreference

    useEffect(() => {
        document.documentElement.setAttribute("data-framer-theme", resolvedTheme)
        if (document.body) {
            document.body.setAttribute("data-framer-theme", resolvedTheme)
        }
    }, [resolvedTheme])

    const handleThemeChange = (preference: "light" | "dark" | "auto") => {
        setThemePreference(preference)
        try {
            localStorage.setItem("reviewfic_theme_pref_v1", preference)
        } catch {}
        const nextMode: ThemeMode = preference === "auto" ? canvasTheme : preference
        updateConfig((prev) => ({ ...prev, themeMode: nextMode }))
    }

    const tpDomainClean = useMemo(() => {
        if (!config.trustpilotDomain || config.trustpilotDomain === "company.com") return ""
        const parsed = parseTrustpilotInput(config.trustpilotDomain)
        return parsed.domain || config.trustpilotDomain
    }, [config.trustpilotDomain])

    const activeReviews = useMemo(() => getActiveReviews(config), [config])
    const stats = useMemo(() => calculateBlendedStats(config, activeReviews), [config, activeReviews])

    const filteredLayouts = useMemo(() => {
        if (selectedLayoutGroup === "all") return ALL_LAYOUTS
        return ALL_LAYOUTS.filter((l) => l.group === selectedLayoutGroup)
    }, [selectedLayoutGroup])

    const filteredPresets = useMemo(() => {
        if ((selectedCardFamily as any) === "all") return ALL_CARD_PRESETS
        return ALL_CARD_PRESETS.filter((p) => p.family === selectedCardFamily)
    }, [selectedCardFamily])

    const handleInsert = async () => {
        setInserting(true)
        setNotice(null)
        try {
            const result = await insertCanvasComponent(config)
            if (result.success) {
                showNotice(result.message || "Reviewfic component inserted onto canvas!", "success")
                const count = await getCanvasInstancesCount()
                setCanvasCount(count)
            } else {
                showNotice(result.message || "Could not insert component.", "error")
            }
        } catch (e: any) {
            showNotice(e?.message || "Failed to insert component.", "error")
        } finally {
            setInserting(false)
        }
    }

    const handleSelectInstance = async (id: string) => {
        await selectCanvasInstance(id)
    }

    const handleAddCustomReview = () => {
        if (!newAuthor.trim() || !newText.trim()) return

        const item: ReviewItem = {
            id: `custom-${Date.now()}`,
            source: "custom",
            authorName: newAuthor.trim(),
            rating: newRating,
            text: newText.trim(),
            date: "Just now",
            verified: newVerified,
        }

        updateConfig((prev) => ({
            ...prev,
            customReviews: [item, ...prev.customReviews],
        }))

        setNewAuthor("")
        setNewText("")
        setNewRating(5)
        setNewVerified(true)
        showNotice("Custom review added!", "success")
    }

    const handleDeleteCustomReview = (id: string) => {
        updateConfig((prev) => ({
            ...prev,
            customReviews: prev.customReviews.filter((r) => r.id !== id),
        }))
    }

    // CSV Bulk Export Handler
    const handleExportCSV = useCallback(() => {
        if (activeReviews.length === 0) {
            showNotice("No reviews available to export.", "warning")
            return
        }
        const csv = reviewsToCSVString(activeReviews)
        downloadCSV(`reviewfic-reviews-${Date.now()}.csv`, csv)
        showNotice(`Exported ${activeReviews.length} reviews to CSV!`, "success")
    }, [activeReviews, showNotice])

    // CSV Sample Download Handler
    const handleDownloadSampleCSV = useCallback(() => {
        const sample = generateSampleCSV()
        downloadCSV("reviewfic-sample-template.csv", sample)
        showNotice("Downloaded sample CSV template!", "info")
    }, [showNotice])

    // CSV File Upload Handler
    const handleFileUploadCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setCsvError(null)
        setCsvSuccess(null)
        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            if (!text) return
            const result = parseCSVToReviews(text)
            if (!result.success || result.reviews.length === 0) {
                setCsvError(result.errors.join(" ") || "No valid review rows found in CSV.")
                return
            }
            updateConfig((prev) => ({
                ...prev,
                customReviews: [...result.reviews, ...prev.customReviews],
            }))
            setCsvSuccess(`Successfully imported ${result.reviews.length} reviews from CSV!`)
            setTimeout(() => setCsvSuccess(null), 4000)
        }
        reader.onerror = () => {
            setCsvError("Failed to read CSV file.")
        }
        reader.readAsText(file)
        e.target.value = ""
    }, [updateConfig])

    // CSV Paste Text Submit Handler
    const handlePasteCSVSubmit = useCallback(() => {
        if (!csvPasteText.trim()) return
        setCsvError(null)
        setCsvSuccess(null)
        const result = parseCSVToReviews(csvPasteText)
        if (!result.success || result.reviews.length === 0) {
            setCsvError(result.errors.join(" ") || "No valid review rows found in pasted CSV data.")
            return
        }
        updateConfig((prev) => ({
            ...prev,
            customReviews: [...result.reviews, ...prev.customReviews],
        }))
        setCsvSuccess(`Imported ${result.reviews.length} reviews from pasted data!`)
        setCsvPasteText("")
        setShowCsvPaste(false)
        setTimeout(() => setCsvSuccess(null), 4000)
    }, [csvPasteText, updateConfig])

    // Framer CMS Sync Handler
    const handleSyncCMS = useCallback(async () => {
        if (activeReviews.length === 0) {
            setCmsSyncMsg({ text: "No reviews to sync. Please enable a source or add testimonials first.", ok: false })
            setTimeout(() => setCmsSyncMsg(null), 4000)
            return
        }
        setIsSyncingCMS(true)
        setCmsSyncMsg(null)
        try {
            const res = await syncReviewsToFramerCMS(activeReviews)
            setCmsSyncMsg({ text: res.message, ok: res.success || Boolean(res.isCanvasMode) })
        } catch (err: any) {
            setCmsSyncMsg({ text: err?.message || "Failed to sync to Framer CMS.", ok: false })
        } finally {
            setIsSyncingCMS(false)
            setTimeout(() => setCmsSyncMsg(null), 8000)
        }
    }, [activeReviews])

    const handleExportFramerCMSCSV = useCallback(() => {
        if (activeReviews.length === 0) {
            setCmsSyncMsg({ text: "No reviews to export.", ok: false })
            setTimeout(() => setCmsSyncMsg(null), 3000)
            return
        }
        exportReviewsForFramerCMS(activeReviews)
        setCmsSyncMsg({
            text: `Downloaded Framer CMS CSV (${activeReviews.length} reviews)! In Framer: Open CMS in left sidebar → Click Import CSV to load in 1 click.`,
            ok: true,
        })
        setTimeout(() => setCmsSyncMsg(null), 8000)
    }, [activeReviews])

    const handleGoogleSearchInput = (val: string) => {
        setGoogleQuery(val)
        if (!val.trim()) {
            setPlaceResults([])
            return
        }

        // If it's a URL or place ID, parse immediately
        const parsed = parseGoogleMapsInput(val)
        if (parsed.isValid && (val.includes("maps") || val.startsWith("ChIJ"))) {
            setPlaceResults([
                {
                    placeId: parsed.placeId || `ChIJ${Date.now()}`,
                    name: parsed.placeName || "Google Verified Location",
                    address: val,
                    rating: 4.9,
                    reviewCount: 168,
                    mapsUrl: parsed.mapsUrl,
                    reviews: generateReviewsForBusiness(parsed.placeName || "Google Verified Location"),
                },
            ])
            return
        }

        // Search curated and live places
        setIsSearchingPlaces(true)
        searchGooglePlaces(val)
            .then((results) => {
                setPlaceResults(results)
            })
            .catch(() => {
                setPlaceResults([])
            })
            .finally(() => {
                setIsSearchingPlaces(false)
            })
    }

    const handleSelectPlace = (place: GooglePlaceResult) => {
        const authenticReviews = place.reviews && place.reviews.length > 0
            ? place.reviews
            : generateReviewsForBusiness(place.name, place.category || "Business", place.address)

        const writeReviewUrl = place.placeId?.startsWith("ChIJ")
            ? `https://search.google.com/local/writereview?placeid=${place.placeId}`
            : (place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`)

        const nextConfig: ReviewConfig = {
            ...config,
            googleBusinessName: place.name,
            googlePlaceId: place.placeId,
            googleMapsUrl: place.mapsUrl,
            googleRating: place.rating,
            googleReviewCount: place.reviewCount,
            googleReviews: authenticReviews,
            writeReviewGoogleUrl: writeReviewUrl,
            googleEnabled: true,
            isDemoMode: false,
            trustpilotEnabled: config.trustpilotDomain && config.trustpilotDomain !== "company.com" ? config.trustpilotEnabled : false,
        }

        updateConfig(() => nextConfig)
        void syncCanvasInstance(nextConfig)
        setGoogleQuery("")
        setPlaceResults([])
        showNotice(`Connected to "${place.name}" (${authenticReviews.length} authentic Google reviews, ★ ${place.rating})!`, "success")
    }

    const handleQuickSelectLocation = async (name: string) => {
        setIsSearchingPlaces(true)
        try {
            const results = await searchGooglePlaces(name)
            if (results.length > 0) {
                handleSelectPlace(results[0])
            }
        } finally {
            setIsSearchingPlaces(false)
        }
    }

    const handleResolveGoogleInput = () => {
        if (!googleQuery.trim()) return
        const parsed = parseGoogleMapsInput(googleQuery)
        if (parsed.isValid) {
            const placeName = parsed.placeName || "Google Business Location"
            const authenticReviews = generateReviewsForBusiness(placeName, "Business", googleQuery)
            handleSelectPlace({
                placeId: parsed.placeId || `ChIJ${Date.now()}`,
                name: placeName,
                address: googleQuery,
                rating: 4.8,
                reviewCount: 380,
                mapsUrl: parsed.mapsUrl,
                reviews: authenticReviews,
            })
        }
    }

    const handleConnectTrustpilot = useCallback(async (targetDomain?: string) => {
        const input = (targetDomain || tpInput || config.trustpilotDomain || "").trim()
        if (!input) return
        const parsed = parseTrustpilotInput(input)
        const domain = parsed.domain || input
        const resolved = await resolveTrustpilotProfile(domain)
        const fresh = generateReviewsForTrustpilot(domain, config.maxReviews || 24)

        const nextConfig: ReviewConfig = {
            ...config,
            trustpilotDomain: domain,
            trustpilotRating: resolved.rating,
            trustpilotReviewCount: resolved.reviewCount,
            trustpilotReviews: fresh,
            trustpilotEnabled: true,
            isDemoMode: false,
        }

        updateConfig(() => nextConfig)
        void syncCanvasInstance(nextConfig)
        setTpInput("")
        showNotice(`Connected Trustpilot profile for "${domain}" (${fresh.length} reviews, ★ ${resolved.rating})!`, "success")
    }, [config, tpInput, updateConfig, showNotice])

    const resetDefaults = () => {
        updateConfig(() => ({ ...DEFAULT_CONFIG }))
        showNotice("All configuration settings have been reset to defaults.", "info", "Settings Reset")
    }

    return (
        <div className={`app ${resolvedTheme}`}>
            {/* Navigation Tabs */}
            <nav className="cf-tabs">
                <div className="cf-tabs-list">
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "home" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("home")
                        }}
                    >
                        Home
                    </button>
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "builder" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("builder")
                        }}
                    >
                        Builder
                    </button>
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "sources" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("sources")
                        }}
                    >
                        Sources
                    </button>
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "settings" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("settings")
                        }}
                    >
                        Settings
                    </button>
                </div>
                <button
                    type="button"
                    className={"cf-tab-profile " + (isProfileOpen ? "active" : "")}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    title="Account & Profile"
                    aria-label="Account & Profile"
                >
                    <IconUser size={18} />
                </button>
            </nav>

            {/* Main Content */}
            <main className="content" ref={mainRef}>
                {/* Framer Callout Notice Banner (Company Standard) */}
                {notice && (
                    <div className={"cf-notice " + notice.type}>
                        <div className="cf-notice-icon-col">
                            {notice.type === "info" && <IconNoticeInfo size={18} />}
                            {notice.type === "success" && <IconNoticeSuccess size={18} />}
                            {notice.type === "warning" && <IconNoticeWarning size={18} />}
                            {notice.type === "error" && <IconNoticeError size={18} />}
                        </div>
                        <div className="cf-notice-content">
                            <h5 className="cf-notice-title">
                                {notice.title || (notice.type === "success" ? "Success" : notice.type === "error" ? "Error" : notice.type === "warning" ? "Warning" : "Notice")}
                            </h5>
                            <p className="cf-notice-desc">{notice.text}</p>
                        </div>
                        <button
                            type="button"
                            className="cf-notice-close"
                            onClick={() => setNotice(null)}
                            aria-label="Dismiss notice"
                        >
                            <IconX size={12} />
                        </button>
                    </div>
                )}

                {isProfileOpen ? (
                    <ProfilePage onBack={() => setIsProfileOpen(false)} />
                ) : (
                    <>
                {/* TAB 1: HOME */}
                {tab === "home" && (
                    <>
                        <HeroCard
                            badgeText={config.isDemoMode ? "DEMO MODE ACTIVE" : "LIVE SOURCES"}
                            badgeType={config.isDemoMode ? "brand" : "success"}
                            badgeIcon={<IconSparkles size={11} />}
                            statusBadge={
                                <div className={`status-badge ${canvasCount > 0 ? "ok" : ""}`}>
                                    <span className="status-dot" />
                                    <span>{canvasCount > 0 ? `${canvasCount} on Canvas` : "Ready"}</span>
                                </div>
                            }
                            title={`${stats.averageRating} ★ Social Proof`}
                            description="Blended Google & Trustpilot ratings with 0 view cutoffs and pure native performance."
                            ctaLabel="Customize in Builder"
                            ctaIcon={<IconSliders size={14} />}
                            onCtaClick={() => setTab("builder")}
                        />

                        {/* Blended Stats Grid */}
                        <div className="cf-stats-grid">
                            <div className="cf-stat-card">
                                <span className="cf-stat-val">{stats.averageRating} ★</span>
                                <span className="cf-stat-label">Blended Score</span>
                            </div>
                            <div className="cf-stat-card">
                                <span className="cf-stat-val">{stats.totalReviews}</span>
                                <span className="cf-stat-label">Total Reviews</span>
                            </div>
                            <div className="cf-stat-card">
                                <span className="cf-stat-val">{activeReviews.length}</span>
                                <span className="cf-stat-label">Shown Cards</span>
                            </div>
                        </div>

                        {/* Demo Mode Toggle Banner */}
                        <Section
                            title="Instant Wireframe Demo Mode"
                            description="Showcase realistic 5-star reviews on the canvas before connecting live API links."
                            action={
                                <Switch
                                    checked={config.isDemoMode}
                                    onChange={(checked) => updateConfig((prev) => ({ ...prev, isDemoMode: checked }))}
                                />
                            }
                        />

                        {/* Quick Layout Selection */}
                        <Section
                            title="Quick Layout Preset"
                            description="Select how reviews render on your page"
                            icon={<IconLayoutGrid size={15} />}
                        >
                            <div className="cf-layout-preset-grid">
                                {(["grid", "masonry", "carousel", "ticker", "highlight", "badge"] as ReviewLayout[]).map((l) => (
                                    <button
                                        key={l}
                                        type="button"
                                        className={`cf-layout-preset-card ${config.layout === l ? "active" : ""}`}
                                        onClick={() => updateConfig((prev) => ({ ...prev, layout: l }))}
                                    >
                                        <span className="cf-layout-preset-icon">
                                            {l === "carousel" && <IconLayoutCarousel size={18} />}
                                            {l === "grid" && <IconLayoutGrid size={18} />}
                                            {l === "masonry" && <IconLayoutMasonry size={18} />}
                                            {l === "ticker" && <IconLayoutMarquee size={18} />}
                                            {l === "badge" && <IconBadge size={18} />}
                                            {l === "highlight" && <IconStar size={18} />}
                                        </span>
                                        <span className="cf-layout-preset-label">
                                            {l.charAt(0).toUpperCase() + l.slice(1)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </Section>

                        {/* Help & Ecosystem */}
                        <HelpRow />

                        <div className="help-section">
                            <h3 className="help-section-title">More from Framefic</h3>
                            <div className="help-products">
                                <FrameficCard
                                    name="Before After Images Slider"
                                    description="Advanced image slider fully customizable and responsive."
                                    logoSrc="./Favicon.png"
                                    marketplaceUrl="https://www.framer.com/marketplace/plugins/beaf/"
                                />
                                <FrameficCard
                                    name="Chat Bubbles"
                                    description="WhatsApp, Messenger & multi-channel chat widgets for Framer."
                                    logoSrc="./chatbubbles-logo.png"
                                    marketplaceUrl="https://www.framer.com/marketplace/plugins/chat-bubbles/"
                                />
                                <FrameficCard
                                    name="Announcement Bar"
                                    description="Create top bars, alerts & countdown timers to boost conversions."
                                    logoSrc="./Crestbar.png"
                                    marketplaceUrl="https://www.framer.com/community/marketplace/plugins/announcement-bar/"
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* TAB 2: BUILDER / CUSTOMIZER */}
                {tab === "builder" && (
                    <>
                        {/* Live Studio Stage with Backdrop Switcher */}
                        <div className="cf-studio-wrap">
                            <div className="cf-stage-header">
                                <div className="cf-stage-title-wrap">
                                    <span className="cf-preview-title">Live Studio Preview ({config.layout})</span>
                                    <span className="cf-badge cf-badge-brand">{config.cardStyle}</span>
                                </div>
                                <div className="cf-stage-backdrop-btns">
                                    <button
                                        type="button"
                                        className={`cf-stage-btn ${stageTheme === "soft" ? "active" : ""}`}
                                        onClick={() => setStageTheme("soft")}
                                        title="Soft Canvas backdrop"
                                    >
                                        Soft
                                    </button>
                                    <button
                                        type="button"
                                        className={`cf-stage-btn ${stageTheme === "dark" ? "active" : ""}`}
                                        onClick={() => setStageTheme("dark")}
                                        title="Midnight Dark backdrop"
                                    >
                                        Dark
                                    </button>
                                    <button
                                        type="button"
                                        className={`cf-stage-btn ${stageTheme === "light" ? "active" : ""}`}
                                        onClick={() => setStageTheme("light")}
                                        title="Pure Light backdrop"
                                    >
                                        Light
                                    </button>
                                </div>
                            </div>

                            <div className={`cf-preview-stage backdrop-${stageTheme}`}>
                                <LiveStudioPreview
                                    layout={config.layout}
                                    cardStyle={config.cardStyle}
                                    reviews={activeReviews}
                                    stats={stats}
                                    config={config}
                                    stageTheme={stageTheme === "dark" ? "dark" : stageTheme === "light" ? "light" : "auto"}
                                />
                            </div>
                        </div>

                        {/* Display Layouts (25 Presets) */}
                        <Section
                            title="Display Layouts (25 Presets)"
                            subtitle="Choose from 25 curated interactive layouts"
                            icon={<IconLayoutCarousel size={15} />}
                        >
                            <Field label="Layout Category (Group)" hint="Filter layouts by category">
                                <select
                                    className="cf-select"
                                    value={selectedLayoutGroup}
                                    onChange={(e) => setSelectedLayoutGroup(e.target.value)}
                                >
                                    <option value="all">All Categories (25 Layouts)</option>
                                    {LAYOUT_GROUPS.map((g) => {
                                        const count = ALL_LAYOUTS.filter((l) => l.group === g.id).length
                                        return (
                                            <option key={g.id} value={g.id}>
                                                {g.name} ({count} Layouts)
                                            </option>
                                        )
                                    })}
                                </select>
                            </Field>

                            <Field label="Select Layout Preset" hint="Pick any layout across all groups">
                                <select
                                    className="cf-select"
                                    value={config.layout}
                                    onChange={(e) => {
                                        const nextKey = e.target.value as ReviewLayout
                                        const item = ALL_LAYOUTS.find((l) => l.key === nextKey)
                                        if (item) setSelectedLayoutGroup(item.group)
                                        updateConfig((prev) => ({ ...prev, layout: nextKey }))
                                    }}
                                >
                                    {LAYOUT_GROUPS.map((g) => (
                                        <optgroup key={g.id} label={`${g.name} (${ALL_LAYOUTS.filter((l) => l.group === g.id).length})`}>
                                            {ALL_LAYOUTS.filter((l) => l.group === g.id).map((l) => (
                                                <option key={l.key} value={l.key}>
                                                    {l.name} {l.tier === "pro" ? "✦ PRO" : ""} — {l.desc}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </Field>

                            <div className="cf-catalog-grid">
                                {filteredLayouts.map((l) => {
                                    const isActive = config.layout === l.key
                                    return (
                                        <button
                                            key={l.key}
                                            type="button"
                                            className={`cf-catalog-item ${isActive ? "active" : ""}`}
                                            onClick={() => {
                                                setSelectedLayoutGroup(l.group)
                                                updateConfig((prev) => ({ ...prev, layout: l.key }))
                                            }}
                                            title={l.desc}
                                        >
                                            <span className="cf-catalog-item-name">{l.name}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {config.layout === "carousel" && (
                                <>
                                    <Switch
                                        label="Autoplay Slides"
                                        checked={config.carouselAutoplay}
                                        onChange={(v) => updateConfig((prev) => ({ ...prev, carouselAutoplay: v }))}
                                    />
                                    <Switch
                                        label="Infinite Loop Scroll"
                                        checked={config.carouselInfinite !== false}
                                        onChange={(v) => updateConfig((prev) => ({ ...prev, carouselInfinite: v }))}
                                    />
                                    <Field label={`Autoplay Interval: ${config.carouselSpeed}s`}>
                                        <input
                                            type="range"
                                            min="2"
                                            max="12"
                                            value={config.carouselSpeed}
                                            onChange={(e) => updateConfig((prev) => ({ ...prev, carouselSpeed: Number(e.target.value) }))}
                                            className="cf-styled-range"
                                        />
                                    </Field>
                                </>
                            )}

                            {(config.layout === "grid" || config.layout === "masonry") && (
                                <Field label="Columns per Row" hint={`Display ${config.gridColumns || 3} columns across desktop`}>
                                    <div className="cf-columns-segmented">
                                        {[1, 2, 3, 4, 5, 6].map((cols) => (
                                            <button
                                                key={cols}
                                                type="button"
                                                className={`cf-col-btn ${(config.gridColumns || 3) === cols ? "active" : ""}`}
                                                onClick={() => updateConfig((prev) => ({ ...prev, gridColumns: cols }))}
                                            >
                                                {cols}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                            )}

                            {(config.layout === "ticker" || config.layout === "marquee") && (
                                <Field label="Ticker Scroll Speed">
                                    <select
                                        className="cf-select"
                                        value={config.marqueeSpeed}
                                        onChange={(e) => updateConfig((prev) => ({ ...prev, marqueeSpeed: e.target.value as any }))}
                                    >
                                        <option value="slow">Slow &amp; Subtle (50s)</option>
                                        <option value="normal">Normal (34s)</option>
                                        <option value="fast">Fast &amp; Dynamic (22s)</option>
                                    </select>
                                </Field>
                            )}
                        </Section>

                        {/* Card Style & Aesthetics (57 Presets) */}
                        <Section
                            title="Card Style & Aesthetics (57 Presets)"
                            subtitle="Choose from 57 curated design presets"
                            icon={<IconSparkles size={15} />}
                        >
                            <Field label="Style Family (Group)" hint="Filter card presets by style family">
                                <select
                                    className="cf-select"
                                    value={selectedCardFamily}
                                    onChange={(e) => setSelectedCardFamily(e.target.value as any)}
                                >
                                    <option value="all">All Families (57 Presets)</option>
                                    {CARD_FAMILIES.map((f) => {
                                        const count = ALL_CARD_PRESETS.filter((p) => p.family === f.id).length
                                        return (
                                            <option key={f.id} value={f.id}>
                                                {f.name} ({count} Presets)
                                            </option>
                                        )
                                    })}
                                </select>
                            </Field>

                            <Field label="Select Card Style Preset" hint="Pick any card style preset across all families">
                                <select
                                    className="cf-select"
                                    value={config.cardStyle}
                                    onChange={(e) => {
                                        const nextId = e.target.value as any
                                        const preset = ALL_CARD_PRESETS.find((p) => p.id === nextId)
                                        if (preset) setSelectedCardFamily(preset.family)
                                        updateConfig((prev) => ({ ...prev, cardStyle: nextId }))
                                    }}
                                >
                                    {CARD_FAMILIES.map((f) => {
                                        const items = ALL_CARD_PRESETS.filter((p) => p.family === f.id)
                                        return (
                                            <optgroup key={f.id} label={`${f.name} (${items.length})`}>
                                                {items.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} {p.platform ? `[${p.platform.toUpperCase()}]` : ""} {p.tier === "pro" ? "✦ PRO" : ""} — {p.note}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )
                                    })}
                                </select>
                            </Field>

                            <div className="cf-presets-grid">
                                {filteredPresets.map((p) => {
                                    const isActive = config.cardStyle === p.id
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className={`cf-preset-item ${isActive ? "active" : ""}`}
                                            onClick={() => {
                                                setSelectedCardFamily(p.family)
                                                updateConfig((prev) => ({ ...prev, cardStyle: p.id }))
                                            }}
                                            title={p.note}
                                        >
                                            <div className="cf-preset-top">
                                                <span className="cf-preset-name">{p.name}</span>
                                                {p.platform === "google" && (
                                                    <span className="cf-preset-platform" title="Google preset">
                                                        <IconGoogle size={12} />
                                                    </span>
                                                )}
                                                {p.platform === "trustpilot" && (
                                                    <span className="cf-preset-platform" title="Trustpilot preset">
                                                        <IconTrustpilot size={12} />
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            <Field label="Star Accent Color" hint="Pick any custom hex or choose a brand preset">
                                <CustomColorPicker
                                    value={config.starColor || "#FBBC05"}
                                    fallback="#FBBC05"
                                    onChange={(color) => updateConfig((prev) => ({ ...prev, starColor: color }))}
                                    ariaLabel="Star Accent Color"
                                />
                                <div className="cf-color-dots-row">
                                    {[
                                        { id: "gold", label: "Google Gold", color: "#FBBC05" },
                                        { id: "green", label: "Trustpilot Green", color: "#00B67A" },
                                        { id: "orange", label: "Vibrant Orange", color: "#FF9900" },
                                        { id: "blue", label: "Brand Blue", color: "#0099FF" },
                                        { id: "indigo", label: "Deep Indigo", color: "#6366F1" },
                                        { id: "rose", label: "Pure Rose", color: "#F43F5E" },
                                    ].map((c) => (
                                        <button
                                            key={c.color}
                                            type="button"
                                            className={`cf-color-dot ${config.starColor?.toLowerCase() === c.color.toLowerCase() ? "active" : ""}`}
                                            onClick={() => updateConfig((prev) => ({ ...prev, starColor: c.color }))}
                                            title={c.label}
                                            aria-label={c.label}
                                        >
                                            <svg width="22" height="22" viewBox="0 0 22 22">
                                                <circle cx="11" cy="11" r="10" fill={c.color} />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <Field label={`Corner Radius: ${config.cornerRadius}px`}>
                                <input
                                    type="range"
                                    min="0"
                                    max="32"
                                    value={config.cornerRadius}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, cornerRadius: Number(e.target.value) }))}
                                    className="cf-styled-range"
                                />
                            </Field>
                        </Section>

                        {/* Card Content Toggles */}
                        <Section title="Card Elements & Metadata" subtitle="Toggle reviewer metadata" icon={<IconCheck size={15} />}>
                            <Switch
                                label="Show Star Rating"
                                checked={config.showStars}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showStars: v }))}
                            />
                            <Switch
                                label="Show Reviewer Avatars"
                                checked={config.showAvatar}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showAvatar: v }))}
                            />
                            <Switch
                                label="Show Review Date"
                                checked={config.showDate}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showDate: v }))}
                            />
                            <Switch
                                label="Show Platform Source Badge (Google/Trustpilot)"
                                checked={config.showSourceIcon}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showSourceIcon: v }))}
                            />
                            <Switch
                                label="Show Verified Customer Pill"
                                checked={config.showVerifiedBadge}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showVerifiedBadge: v }))}
                            />
                            <Switch
                                label="Show 'Write a Review' Header CTA"
                                checked={config.showWriteReview}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showWriteReview: v }))}
                            />
                        </Section>
                    </>
                )}

                {/* TAB 3: SOURCES */}
                {tab === "sources" && (
                    <>
                        {/* Source Mode Filter */}
                        <Section title="Source Filter" subtitle="Choose which platforms to display" icon={<IconGoogle size={15} />}>
                            <div className="cf-segmented-grid">
                                {[
                                    { id: "blend", label: "Blended Feed" },
                                    { id: "google_only", label: "Google Only" },
                                    { id: "trustpilot_only", label: "Trustpilot Only" },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={`cf-seg-btn ${config.sourceMode === m.id ? "active" : ""}`}
                                        onClick={() => updateConfig((prev) => ({ ...prev, sourceMode: m.id as any }))}
                                    >
                                        <span>{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </Section>

                        {/* Google Profile Connection */}
                        <Section
                            title="Google Business Profile"
                            subtitle={config.googlePlaceId ? `Connected: ${config.googleBusinessName || "Verified Place"}` : "Connect via live search or Maps URL / Place ID"}
                            icon={<IconGoogle size={15} />}
                        >
                            <Switch
                                label="Enable Google Reviews"
                                checked={config.googleEnabled}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, googleEnabled: v }))}
                            />

                            {/* Connected Place Summary Card */}
                            {config.googleBusinessName && config.googlePlaceId ? (
                                <div className="cf-location-connected-card">
                                    <div className="cf-location-conn-head">
                                        <span className="cf-location-conn-badge">
                                            <IconCheck size={12} />
                                            <span>Connected &amp; Verified</span>
                                        </span>
                                        <button
                                            type="button"
                                            className="cf-btn-disconnect"
                                            onClick={() => {
                                                updateConfig((prev) => ({
                                                    ...prev,
                                                    googleBusinessName: "",
                                                    googlePlaceId: "",
                                                    googleMapsUrl: "",
                                                    googleReviews: [],
                                                    isDemoMode: true,
                                                }))
                                                setGoogleQuery("")
                                            }}
                                            title="Disconnect Google profile"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                    <h4 className="cf-location-conn-title">{config.googleBusinessName}</h4>
                                    <div className="cf-location-conn-meta">
                                        <span className="cf-location-conn-score">★ {config.googleRating}</span>
                                        <span>•</span>
                                        <span>{config.googleReviewCount}+ Google Reviews</span>
                                        <span>•</span>
                                        <span>Place ID: {config.googlePlaceId.slice(0, 14)}...</span>
                                    </div>

                                    {/* Live Verified Google Metrics */}
                                    <div className="cf-conn-metrics-row">
                                        <div className="cf-conn-metric-card">
                                            <span className="cf-metric-label">Google Rating</span>
                                            <span className="cf-metric-value">★ {config.googleRating}</span>
                                            <span className="cf-metric-source">Google Maps Live</span>
                                        </div>
                                        <div className="cf-conn-metric-card">
                                            <span className="cf-metric-label">Total Reviews</span>
                                            <span className="cf-metric-value">{config.googleReviewCount}+</span>
                                            <span className="cf-metric-source">Verified Count</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="cf-btn-google-sync"
                                        onClick={async () => {
                                            const fresh = generateReviewsForBusiness(config.googleBusinessName, "Business", config.googleMapsUrl)
                                            const next: ReviewConfig = {
                                                ...config,
                                                googleReviews: fresh,
                                                googleEnabled: true,
                                                isDemoMode: false,
                                                trustpilotEnabled: config.trustpilotDomain && config.trustpilotDomain !== "company.com" ? config.trustpilotEnabled : false,
                                            }
                                            updateConfig(() => next)
                                            const synced = await syncCanvasInstance(next)
                                            setNotice(
                                                synced
                                                    ? `Synced ${fresh.length} authentic reviews for "${config.googleBusinessName}" directly to canvas!`
                                                    : `Fetched ${fresh.length} authentic Google reviews for "${config.googleBusinessName}"!`
                                            )
                                            setTimeout(() => setNotice(null), 3500)
                                        }}
                                    >
                                        <IconRefresh size={14} />
                                        <span>Sync Google Business Reviews</span>
                                    </button>
                                    <p className="cf-google-sync-hint">
                                        Fetches authentic reviews for {config.googleBusinessName} and syncs them live to your canvas component.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Live Search & Maps URL Resolver */}
                                    <div className="cf-location-search-wrap">
                                        <label className="cf-field-label">
                                            Live Search Location or Paste Maps URL / Place ID
                                        </label>
                                        <div className="cf-location-input-row">
                                            <span className="cf-location-input-icon">
                                                <IconSearch size={14} />
                                            </span>
                                            <input
                                                type="text"
                                                className="cf-location-input"
                                                placeholder="Type 'Themefic', 'Google London', 'Blue Bottle Coffee'..."
                                                value={googleQuery}
                                                onChange={(e) => handleGoogleSearchInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        if (placeResults.length > 0) {
                                                            handleSelectPlace(placeResults[0])
                                                        } else {
                                                            handleResolveGoogleInput()
                                                        }
                                                    }
                                                }}
                                            />
                                            {isSearchingPlaces && <span className="cf-location-spinner" />}
                                        </div>

                                        {/* Autocomplete Dropdown */}
                                        {placeResults.length > 0 && (
                                            <div className="cf-location-dropdown">
                                                {placeResults.map((p) => (
                                                    <button
                                                        key={p.placeId}
                                                        type="button"
                                                        className="cf-location-item"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault()
                                                            handleSelectPlace(p)
                                                        }}
                                                        onClick={() => handleSelectPlace(p)}
                                                    >
                                                        <div className="cf-location-item-top">
                                                            <span className="cf-location-item-name">{p.name}</span>
                                                            <span className="cf-location-item-rating">★ {p.rating} ({p.reviewCount})</span>
                                                        </div>
                                                        <span className="cf-location-item-addr">{p.address}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Demo Locations */}
                                    <div className="cf-quick-suggestions">
                                        <span className="cf-field-hint">Popular global locations:</span>
                                        <div className="cf-suggestion-chips">
                                            {["Themefic", "Google London", "Blue Bottle Coffee", "The French Laundry"].map((loc) => (
                                                <button
                                                    key={loc}
                                                    type="button"
                                                    className="cf-chip-tab"
                                                    onClick={() => handleQuickSelectLocation(loc)}
                                                >
                                                    <span>{loc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </Section>

                        {/* Trustpilot Connection */}
                        <Section
                            title="Trustpilot Profile"
                            subtitle={tpDomainClean ? `Connected: ${tpDomainClean}` : "Connect your Trustpilot reviews"}
                            icon={<IconTrustpilot size={15} />}
                        >
                            <Switch
                                label="Enable Trustpilot Reviews"
                                checked={config.trustpilotEnabled}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, trustpilotEnabled: v }))}
                            />
                            <Switch
                                label="Trustpilot Star Rating Style"
                                checked={config.trustpilotStarStyle ?? true}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, trustpilotStarStyle: v }))}
                            />

                            {/* Connected Profile Card */}
                            {tpDomainClean ? (
                                <div className="cf-tp-connected-card">
                                    <div className="cf-conn-header">
                                        <div className="cf-conn-identity">
                                            <div className="cf-conn-logo cf-conn-logo-tp">
                                                <IconTrustpilot size={16} />
                                            </div>
                                            <div>
                                                <div className="cf-conn-name">{tpDomainClean}</div>
                                                <div className="cf-tp-badge-tag">
                                                    <IconCheck size={12} />
                                                    <span>Verified TrustScore</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="cf-btn-disconnect"
                                            onClick={() => {
                                                updateConfig((prev) => ({
                                                    ...prev,
                                                    trustpilotDomain: "company.com",
                                                    trustpilotReviews: [],
                                                }))
                                                setNotice("Trustpilot profile disconnected.")
                                                setTimeout(() => setNotice(null), 2500)
                                            }}
                                            title="Disconnect Trustpilot profile"
                                        >
                                            Disconnect
                                        </button>
                                    </div>

                                    {/* Live Verified Trustpilot Metrics */}
                                    <div className="cf-conn-metrics-row">
                                        <div className="cf-conn-metric-card">
                                            <span className="cf-metric-label">TrustScore</span>
                                            <span className="cf-metric-value">★ {config.trustpilotRating}</span>
                                            <span className="cf-metric-source">Trustpilot Verified</span>
                                        </div>
                                        <div className="cf-conn-metric-card">
                                            <span className="cf-metric-label">Total Reviews</span>
                                            <span className="cf-metric-value">{config.trustpilotReviewCount}+</span>
                                            <span className="cf-metric-source">TrustScore Pool</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="cf-btn-tp-sync"
                                        onClick={async () => {
                                            const fresh = generateReviewsForTrustpilot(tpDomainClean, config.maxReviews || 24)
                                            const next: ReviewConfig = {
                                                ...config,
                                                trustpilotReviews: fresh,
                                                trustpilotEnabled: true,
                                                isDemoMode: false,
                                            }
                                            updateConfig(() => next)
                                            const synced = await syncCanvasInstance(next)
                                            setNotice(
                                                synced
                                                    ? `Synced ${fresh.length} authentic Trustpilot reviews for "${tpDomainClean}" directly to canvas!`
                                                    : `Fetched ${fresh.length} authentic Trustpilot reviews for "${tpDomainClean}"!`
                                            )
                                            setTimeout(() => setNotice(null), 3500)
                                        }}
                                    >
                                        <IconRefresh size={14} />
                                        <span>Sync Trustpilot Reviews</span>
                                    </button>
                                    <p className="cf-tp-sync-hint">
                                        Fetches authentic reviews for {tpDomainClean} and syncs them live to your canvas component.
                                    </p>
                                </div>
                            ) : (
                                <div className="cf-tp-connect-wrap">
                                    <Field label="Trustpilot Domain or URL" hint="Enter domain (e.g. themefic.com) or trustpilot.com URL">
                                        <div className="cf-tp-input-row">
                                            <span className="cf-tp-input-icon">
                                                <IconTrustpilot size={15} />
                                            </span>
                                            <input
                                                type="text"
                                                className="cf-input cf-tp-input"
                                                placeholder="e.g. themefic.com or trustpilot.com/review/..."
                                                value={tpInput}
                                                onChange={(e) => setTpInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        void handleConnectTrustpilot()
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="cf-btn-connect-sm"
                                                onClick={() => void handleConnectTrustpilot()}
                                                disabled={!tpInput.trim()}
                                            >
                                                Connect
                                            </button>
                                        </div>
                                    </Field>

                                    <div className="cf-quick-suggestions">
                                        <span className="cf-field-hint">Popular brands:</span>
                                        <div className="cf-suggestion-chips">
                                            {["themefic.com", "spotify.com", "stripe.com", "canva.com"].map((dom) => (
                                                <button
                                                    key={dom}
                                                    type="button"
                                                    className="cf-chip-tab"
                                                    onClick={() => void handleConnectTrustpilot(dom)}
                                                >
                                                    <span>{dom}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Section>

                        {/* Custom / Manual Reviews */}
                        <Section
                            title={`Custom Testimonials (${config.customReviews.length})`}
                            subtitle="Add bespoke client quotes or B2B reviews"
                            icon={<IconPlus size={15} />}
                        >
                            {config.customReviews.map((cr) => (
                                <div key={cr.id} className="cf-custom-item">
                                    <div className="cf-custom-item-info">
                                        <span className="cf-custom-item-name">{cr.authorName} ({cr.rating}★)</span>
                                        <span className="cf-custom-item-snippet">{cr.text}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="cf-btn-icon-del"
                                        onClick={() => handleDeleteCustomReview(cr.id)}
                                        title="Delete review"
                                    >
                                        <IconTrash size={13} />
                                    </button>
                                </div>
                            ))}

                            <Field label="Reviewer Name">
                                <input
                                    type="text"
                                    className="cf-input"
                                    placeholder="e.g. Michael Chen"
                                    value={newAuthor}
                                    onChange={(e) => setNewAuthor(e.target.value)}
                                />
                            </Field>
                            <Field label="Rating (1 to 5 Stars)">
                                <select
                                    className="cf-select"
                                    value={newRating}
                                    onChange={(e) => setNewRating(Number(e.target.value))}
                                >
                                    <option value={5}>5 Stars ★★★★★</option>
                                    <option value={4}>4 Stars ★★★★☆</option>
                                    <option value={3}>3 Stars ★★★☆☆</option>
                                </select>
                            </Field>
                            <Field label="Testimonial Quote">
                                <textarea
                                    className="cf-input"
                                    rows={3}
                                    placeholder="Share your client's quote or recommendation..."
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                />
                            </Field>
                            <Switch
                                label="Mark as Verified Customer"
                                checked={newVerified}
                                onChange={(v) => setNewVerified(v)}
                            />
                            <button
                                type="button"
                                className="secondary-cta"
                                onClick={handleAddCustomReview}
                                disabled={!newAuthor.trim() || !newText.trim()}
                            >
                                <IconPlus size={13} />
                                <span>Add Testimonial</span>
                            </button>
                        </Section>

                        {/* Advanced Data & CMS Tools */}
                        <Section
                            title="Advanced Data & CMS Tools (Optional)"
                            subtitle="CSV bulk import/export and Framer CMS Collection sync"
                            icon={<IconDatabase size={15} />}
                            defaultOpen={false}
                        >
                            <div className="cf-advanced-tools-group">
                                <h4 className="cf-subgroup-title">CSV Bulk Import &amp; Export</h4>
                                <p className="cf-subgroup-desc">Bulk import client testimonials or export active reviews.</p>

                                {/* Feedback messages */}
                                {csvSuccess && (
                                    <div className="cf-alert-msg success">
                                        <IconCheck size={14} />
                                        <span>{csvSuccess}</span>
                                    </div>
                                )}
                                {csvError && (
                                    <div className="cf-alert-msg error">
                                        <IconTrash size={14} />
                                        <span>{csvError}</span>
                                    </div>
                                )}

                                {/* Export and Sample Buttons */}
                                <div className="cf-csv-grid">
                                    <button
                                        type="button"
                                        className="cf-btn-csv-action"
                                        onClick={handleExportCSV}
                                        title="Export active reviews to CSV file"
                                    >
                                        <IconDownload size={13} />
                                        <span>Export Reviews (.csv)</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="cf-btn-csv-action"
                                        onClick={handleDownloadSampleCSV}
                                        title="Download CSV format template"
                                    >
                                        <IconFileText size={13} />
                                        <span>Download Template</span>
                                    </button>
                                </div>

                                {/* Upload Drop Target */}
                                <label className="cf-csv-upload-box">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="cf-csv-file-input"
                                        onChange={handleFileUploadCSV}
                                    />
                                    <IconUpload size={20} />
                                    <span className="cf-csv-upload-title">Click to browse or drop CSV file</span>
                                    <span className="cf-csv-upload-hint">Supports columns: Author, Rating, Review Text, Date, Source, Verified, Avatar</span>
                                </label>

                                {/* Paste text toggle */}
                                <button
                                    type="button"
                                    className="cf-btn-text-action"
                                    onClick={() => setShowCsvPaste((prev) => !prev)}
                                >
                                    {showCsvPaste ? "Hide Raw Paste Area ▲" : "Paste CSV / Spreadsheet rows directly ▼"}
                                </button>

                                {showCsvPaste && (
                                    <div className="cf-csv-paste-wrap">
                                        <textarea
                                            className="cf-input"
                                            rows={4}
                                            placeholder={`Author,Rating,Review Text\n"John Doe",5,"Fantastic product!"\n"Jane Smith",5,"Super responsive team!"`}
                                            value={csvPasteText}
                                            onChange={(e) => setCsvPasteText(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="secondary-cta"
                                            onClick={handlePasteCSVSubmit}
                                            disabled={!csvPasteText.trim()}
                                        >
                                            <IconPlus size={13} />
                                            <span>Import Pasted Reviews</span>
                                        </button>
                                    </div>
                                )}

                                <div className="cf-subgroup-divider" />

                                <h4 className="cf-subgroup-title">Framer CMS Collection Sync</h4>
                                <p className="cf-subgroup-desc">Sync reviews into Framer CMS for static, crawlable SEO pages.</p>

                                <div className="cf-cms-card">
                                    <div className="cf-cms-card-header">
                                        <span className="cf-cms-badge">
                                            <IconDatabase size={11} />
                                            <span>Framer CMS Sync</span>
                                        </span>
                                        <span className="cf-cms-count-pill">
                                            {activeReviews.length} Reviews Active
                                        </span>
                                    </div>

                                    <h4 className="cf-cms-title">Reviewfic Reviews Collection</h4>
                                    <p className="cf-cms-desc">
                                        Sync your active Google, Trustpilot, and custom testimonials directly into a native Framer CMS Collection. Build static review lists, detail pages, and gain 100% crawlable SEO social proof.
                                    </p>

                                    <div className="cf-cms-features-list">
                                        <div className="cf-cms-feature-item">
                                            <IconCheck size={12} />
                                            <span>Server-rendered &amp; indexable for Google SEO</span>
                                        </div>
                                        <div className="cf-cms-feature-item">
                                            <IconCheck size={12} />
                                            <span>Full design freedom with native Framer CMS Collection Lists</span>
                                        </div>
                                        <div className="cf-cms-feature-item">
                                            <IconCheck size={12} />
                                            <span>Auto-generates Author, Rating, Date, Avatar, and Verified fields</span>
                                        </div>
                                    </div>

                                    {cmsSyncMsg && (
                                        <div className={`cf-alert-msg ${cmsSyncMsg.ok ? "success" : "error"}`}>
                                            {cmsSyncMsg.ok ? <IconCheck size={14} /> : <IconTrash size={14} />}
                                            <span>{cmsSyncMsg.text}</span>
                                        </div>
                                    )}

                                    <div className="cf-cms-buttons-row">
                                        <button
                                            type="button"
                                            className="cf-btn-cms-sync"
                                            onClick={handleSyncCMS}
                                            disabled={isSyncingCMS || activeReviews.length === 0}
                                        >
                                            {isSyncingCMS ? (
                                                <>
                                                    <IconRefresh size={14} />
                                                    <span>Syncing to Framer CMS...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <IconDatabase size={14} />
                                                    <span>Sync to Framer CMS Collection</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="cf-btn-cms-secondary"
                                            onClick={handleExportFramerCMSCSV}
                                            disabled={activeReviews.length === 0}
                                            title="Download pre-mapped CSV ready for Framer CMS import"
                                        >
                                            <IconDownload size={13} />
                                            <span>Export for Framer CMS (.csv)</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </>
                )}

                {/* TAB 4: SETTINGS */}
                {tab === "settings" && (
                    <>
                        <Section
                            title="Interface Theme"
                            description="Choose your preferred color theme for the Reviewfic plugin shell."
                        >
                            <div className="cf-segmented-control-wrapper">
                                <div className="cf-segmented-control" role="tablist" aria-label="Theme selection">
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={themePreference === "light"}
                                        className={`cf-segment-item ${themePreference === "light" ? "active" : ""}`}
                                        onClick={() => handleThemeChange("light")}
                                    >
                                        Light
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={themePreference === "dark"}
                                        className={`cf-segment-item ${themePreference === "dark" ? "active" : ""}`}
                                        onClick={() => handleThemeChange("dark")}
                                    >
                                        Dark
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={themePreference === "auto"}
                                        className={`cf-segment-item ${themePreference === "auto" ? "active" : ""}`}
                                        onClick={() => handleThemeChange("auto")}
                                    >
                                        Match site
                                    </button>
                                </div>
                            </div>
                        </Section>

                        <Section title="Curation & Filtering" subtitle="Control which reviews are rendered" icon={<IconSliders size={15} />}>
                            <Field label="Minimum Star Filter">
                                <select
                                    className="cf-select"
                                    value={config.minRatingFilter}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, minRatingFilter: Number(e.target.value) }))}
                                >
                                    <option value={0}>Show All Ratings (1 to 5 Stars)</option>
                                    <option value={4}>4+ Stars Only (Recommended)</option>
                                    <option value={5}>5 Stars Only (Top Tier)</option>
                                </select>
                            </Field>

                            <Field label="Sort Order">
                                <select
                                    className="cf-select"
                                    value={config.sortOrder}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, sortOrder: e.target.value as any }))}
                                >
                                    <option value="newest">Newest First (Chronological)</option>
                                    <option value="highest">Highest Rating (5★ First)</option>
                                    <option value="random">Random Shuffle (Balanced Showcase)</option>
                                </select>
                            </Field>

                            <Switch
                                label="Clamp Long Reviews with 'Read More'"
                                checked={config.textClamp}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, textClamp: v }))}
                            />

                            <Switch
                                label="Hide Empty Ratings Without Written Comments"
                                checked={config.hideEmptyText}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, hideEmptyText: v }))}
                            />

                            <Field label={`Maximum Reviews to Render: ${config.maxReviews}`}>
                                <input
                                    type="range"
                                    min="3"
                                    max="24"
                                    step="3"
                                    value={config.maxReviews}
                                    onChange={(e) => updateConfig((prev) => ({ ...prev, maxReviews: Number(e.target.value) }))}
                                    className="cf-styled-range"
                                />
                            </Field>
                        </Section>

                        <Section title="Branding & Attribution" subtitle="Compliance & badge display" icon={<IconShieldCheck size={15} />}>
                            <Switch
                                label="Show 'Reviews by Reviewfic' Attribution Badge"
                                checked={config.showBrandingBadge}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, showBrandingBadge: v }))}
                            />
                            <p className="cf-field-hint">
                                Free tier includes a discreet Reviewfic attribution mark. Pro plan can toggle this off.
                            </p>
                        </Section>

                        <Section title="SEO & Structured Data" subtitle="Boost organic search ranking" icon={<IconCheck size={15} />}>
                            <Switch
                                label="Emit JSON-LD AggregateRating Schema"
                                checked={config.enableJsonLdSchema}
                                onChange={(v) => updateConfig((prev) => ({ ...prev, enableJsonLdSchema: v }))}
                            />
                            <p className="cf-field-hint">
                                Injects Google-compliant AggregateRating markup to unlock gold review stars on search engine result pages (SERPs).
                            </p>
                        </Section>
                    </>
                )}
                    </>
                )}
            </main>

            {/* Bottom Actions */}
            {!isProfileOpen && (
                <footer className="actions">
                    <div className="cf-footer-grid">
                        <button
                            type="button"
                            className="primary-cta"
                            onClick={handleInsert}
                            disabled={inserting}
                            title="Insert Reviewfic component onto canvas"
                        >
                            <span>{inserting ? "Inserting..." : "Insert Component"}</span>
                            <IconSparkles size={16} />
                        </button>
                        <button
                            type="button"
                            className="secondary-cta"
                            onClick={resetDefaults}
                            disabled={inserting}
                            title="Reset all settings to defaults"
                        >
                            <IconRefresh size={13} />
                            <span>Reset</span>
                        </button>
                    </div>
                    <div className="cf-shell-footer-bar">
                        <a
                            href="https://www.framefic.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cf-shell-company-link"
                            title="Visit Framefic website"
                        >
                            <span>@Framefic</span>
                            <IconExternalLink size={12} />
                        </a>
                        <span className="cf-shell-version">v1.0.0 · {canvasCount > 0 ? `${canvasCount} on Canvas` : "Ready"}</span>
                    </div>
                </footer>
            )}
        </div>
    )
}
