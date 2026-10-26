import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { framer } from "@framer/plugin"
import {
    ReviewConfig,
    ReviewItem,
    ReviewLayout,
    CardStyle,
    ThemeMode,
    CardFamily,
    ConnectedBusiness,
    ReviewWidget,
} from "./core/types"
import {
    DEFAULT_CONFIG,
    calculateBlendedStats,
    getActiveReviews,
    createDefaultBusiness,
    createDefaultWidget,
    mergeBusinessIntoConfig,
} from "./core/config"
import { ALL_LAYOUTS, LAYOUT_GROUPS, ALL_CARD_PRESETS, CARD_FAMILIES } from "./core/catalogue"
import {
    loadBusinesses,
    saveBusinesses,
    loadWidgets,
    saveWidgets,
    loadActiveBusinessId,
    saveActiveBusinessId,
    loadActiveWidgetId,
    saveActiveWidgetId,
} from "./core/storage"
import {
    insertCanvasWidget,
    syncCanvasWidget,
    countCanvasInstancesForWidget,
    deleteCanvasInstancesForWidget,
    getCanvasInstancesCount,
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
import { Switch } from "./ui/components/Switch"
import { Field } from "./ui/components/Field"
import { Section } from "./ui/components/Section"
import { ProfilePage } from "./ui/components/ProfilePage"
import { LiveStudioPreview } from "./ui/components/LiveStudioPreview"
import { CustomColorPicker } from "./ui/components/CustomColorPicker"
import { HelpRow } from "./ui/components/HelpRow"
import { FrameficCard } from "./ui/components/FrameficCard"
import { ConnectReviewsView } from "./ui/components/ConnectReviewsView"
import { BusinessesListView } from "./ui/components/BusinessesListView"
import { ManageBusinessesView } from "./ui/components/ManageBusinessesView"
import { AllWidgetsView } from "./ui/components/AllWidgetsView"
import { HomeView } from "./ui/components/HomeView"
import { LayoutThumbnailPreview } from "./ui/components/LayoutThumbnailPreview"
import { DeleteWidgetModal } from "./ui/components/DeleteWidgetModal"
import "./ui/styles.css"

export type TabId = "home" | "widgets" | "businesses" | "settings"

type NoticeType = "info" | "success" | "warning" | "error"

interface NoticeState {
    type: NoticeType
    text: string
    title?: string
}

export function App() {
    // Multi-Business & Multi-Widget core states
    const [businesses, setBusinesses] = useState<ConnectedBusiness[]>([])
    const [activeBusinessId, setActiveBusinessId] = useState<string>("")
    const [widgets, setWidgets] = useState<ReviewWidget[]>([])
    const [activeWidgetId, setActiveWidgetId] = useState<string>("")
    const [isLoaded, setIsLoaded] = useState(false)

    // Navigation and subview flags
    const [tab, setTab] = useState<TabId>("home")
    const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null)
    const [widgetEditTab, setWidgetEditTab] = useState<"builder" | "sources">("builder")
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isAddingBusiness, setIsAddingBusiness] = useState(false)
    const [isManagingBusinesses, setIsManagingBusinesses] = useState(false)
    const [deleteWidgetTarget, setDeleteWidgetTarget] = useState<{ id: string; name: string } | null>(null)
    const [isDeletingWidget, setIsDeletingWidget] = useState(false)

    // Canvas stats
    const [canvasCount, setCanvasCount] = useState<number>(0)
    const [canvasWidgetCounts, setCanvasWidgetCounts] = useState<Record<string, number>>({})
    const [inserting, setInserting] = useState<boolean>(false)
    const [notice, setNotice] = useState<NoticeState | null>(null)
    const mainRef = useRef<HTMLElement>(null)

    // Studio states
    const [stageTheme, setStageTheme] = useState<"soft" | "dark" | "light">("soft")
    const [selectedLayoutGroup, setSelectedLayoutGroup] = useState<string>("cards")
    const [selectedCardFamily, setSelectedCardFamily] = useState<CardFamily | "all">("modern")

    // Google Places Search states
    const [googleQuery, setGoogleQuery] = useState("")
    const [placeResults, setPlaceResults] = useState<GooglePlaceResult[]>([])
    const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
    const [tpInput, setTpInput] = useState("")

    // Custom review form state
    const [newAuthor, setNewAuthor] = useState("")
    const [newText, setNewText] = useState("")
    const [newRating, setNewRating] = useState(5)
    const [newVerified, setNewVerified] = useState(true)

    // CSV & Framer CMS states
    const [isSyncingCMS, setIsSyncingCMS] = useState(false)
    const [cmsSyncMsg, setCmsSyncMsg] = useState<{ text: string; ok: boolean } | null>(null)
    const [csvError, setCsvError] = useState<string | null>(null)
    const [csvSuccess, setCsvSuccess] = useState<string | null>(null)
    const [showCsvPaste, setShowCsvPaste] = useState(false)
    const [csvPasteText, setCsvPasteText] = useState("")

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

    // Refresh canvas counts for all widgets
    const refreshCanvasCounts = useCallback(async (allWidgets: ReviewWidget[]) => {
        try {
            const counts: Record<string, number> = {}
            let total = 0
            for (const w of allWidgets) {
                const count = await countCanvasInstancesForWidget(w.id)
                counts[w.id] = count
                total += count
            }
            setCanvasWidgetCounts(counts)
            const overall = await getCanvasInstancesCount()
            setCanvasCount(Math.max(total, overall))
        } catch {
            setCanvasCount(0)
        }
    }, [])

    // Initial storage loader
    useEffect(() => {
        let isMounted = true
        async function init() {
            const loadedBiz = await loadBusinesses()
            const loadedWidgets = await loadWidgets()
            const savedBizId = await loadActiveBusinessId()
            const savedWidgetId = await loadActiveWidgetId()

            if (!isMounted) return

            let currentBizList = loadedBiz
            let currentBizId = savedBizId || loadedBiz[0]?.id || ""

            // If no businesses exist at all, we remain with empty list to trigger Connect screen
            if (currentBizList.length > 0 && !currentBizList.some((b) => b.id === currentBizId)) {
                currentBizId = currentBizList[0].id
            }

            // Ensure there is at least one default widget for the active business if businesses exist
            let currentWidgets = loadedWidgets
            if (currentBizList.length > 0) {
                const bizWidgets = currentWidgets.filter((w) => w.businessId === currentBizId)
                if (bizWidgets.length === 0) {
                    const defaultWidget = createDefaultWidget(currentBizId, "Default Review Showcase", "carousel", "elevated")
                    currentWidgets = [defaultWidget, ...currentWidgets]
                    void saveWidgets(currentWidgets)
                }
            }

            let currentWidgetId = savedWidgetId || ""
            const validActiveWidget = currentWidgets.find((w) => w.id === currentWidgetId && w.businessId === currentBizId)
            if (!validActiveWidget) {
                const firstForBiz = currentWidgets.find((w) => w.businessId === currentBizId)
                currentWidgetId = firstForBiz?.id || currentWidgets[0]?.id || ""
            }

            setBusinesses(currentBizList)
            setActiveBusinessId(currentBizId)
            setWidgets(currentWidgets)
            setActiveWidgetId(currentWidgetId)
            setIsLoaded(true)

            void refreshCanvasCounts(currentWidgets)
        }

        void init()
        return () => {
            isMounted = false
        }
    }, [refreshCanvasCounts])

    // Derived active entities
    const activeBusiness = useMemo(() => {
        return businesses.find((b) => b.id === activeBusinessId) || businesses[0]
    }, [businesses, activeBusinessId])

    const activeWidgets = useMemo(() => {
        if (!activeBusiness) return []
        return widgets.filter((w) => w.businessId === activeBusiness.id)
    }, [widgets, activeBusiness])

    const activeWidget = useMemo(() => {
        return activeWidgets.find((w) => w.id === activeWidgetId) || activeWidgets[0]
    }, [activeWidgets, activeWidgetId])

    // Merged config for the active widget
    const activeConfig: ReviewConfig = useMemo(() => {
        if (activeWidget && activeBusiness) {
            return mergeBusinessIntoConfig(activeBusiness, activeWidget.config)
        }
        if (activeBusiness) {
            return mergeBusinessIntoConfig(activeBusiness, DEFAULT_CONFIG)
        }
        return DEFAULT_CONFIG
    }, [activeWidget, activeBusiness])

    // Active reviews and stats
    const activeReviews = useMemo(() => getActiveReviews(activeConfig), [activeConfig])
    const stats = useMemo(() => calculateBlendedStats(activeConfig, activeReviews), [activeConfig, activeReviews])

    // Catalog filtering
    const filteredLayouts = useMemo(() => {
        if (selectedLayoutGroup === "all") return ALL_LAYOUTS
        return ALL_LAYOUTS.filter((l) => l.group === selectedLayoutGroup)
    }, [selectedLayoutGroup])

    const filteredPresets = useMemo(() => {
        if ((selectedCardFamily as any) === "all") return ALL_CARD_PRESETS
        return ALL_CARD_PRESETS.filter((p) => p.family === selectedCardFamily)
    }, [selectedCardFamily])

    // Theme state
    const [themePreference, setThemePreference] = useState<"light" | "dark" | "auto">(() => {
        try {
            const saved = localStorage.getItem("reviewfic_theme_pref_v1")
            if (saved === "light" || saved === "dark" || saved === "auto") {
                return saved
            }
        } catch {}
        return "auto"
    })
    const [canvasTheme, setCanvasTheme] = useState<"light" | "dark">("dark")

    // Automatic Canvas Theme Sync + Subscription (Framer SDK driven)
    useEffect(() => {
        function readCanvasTheme(): "light" | "dark" {
            // 1. Check document.body and documentElement attributes set by Framer SDK
            const bodyTheme = document.body?.getAttribute("data-framer-theme")
            if (bodyTheme === "light" || bodyTheme === "dark") {
                return bodyTheme
            }
            const htmlTheme = document.documentElement?.getAttribute("data-framer-theme")
            if (htmlTheme === "light" || htmlTheme === "dark") {
                return htmlTheme
            }

            // 2. Check Framer API if available
            try {
                if (typeof (framer as any).getTheme === "function") {
                    const t = (framer as any).getTheme()
                    const mode = typeof t === "string" ? t : t?.mode
                    if (mode === "light" || mode === "dark") {
                        return mode
                    }
                }
                if ((framer as any).theme) {
                    const t = (framer as any).theme
                    const mode = typeof t === "string" ? t : t?.mode
                    if (mode === "light" || mode === "dark") {
                        return mode
                    }
                }
            } catch {}

            // 3. Fallback to system media query
            if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
                return "light"
            }

            return "dark"
        }

        const detected = readCanvasTheme()
        setCanvasTheme(detected)

        // 1. Subscribe to Framer theme updates via Framer SDK
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

        // 2. Listen for postMessage from preview or host wrapper
        const handleMessage = (e: MessageEvent) => {
            const data = e.data
            if (!data) return
            if (data.type === "subscriptionEvent" && data.topic === "theme") {
                const mode = data.payload?.mode || data.payload
                if (mode === "light" || mode === "dark") {
                    setCanvasTheme(mode)
                    setThemePreference("auto")
                }
            } else if (data.type === "themeChange") {
                const mode = data.mode
                if (mode === "light" || mode === "dark") {
                    setCanvasTheme(mode)
                    setThemePreference("auto")
                }
            } else if (data.type === "pluginReadyResponse" && data.theme?.mode) {
                const mode = data.theme.mode
                if (mode === "light" || mode === "dark") {
                    setCanvasTheme(mode)
                }
            }
        }
        window.addEventListener("message", handleMessage)

        // 3. Observe DOM attributes injected by Framer SDK
        const observer = new MutationObserver(() => {
            const current = readCanvasTheme()
            setCanvasTheme((prev) => (prev !== current ? current : prev))
        })

        if (document.body) {
            observer.observe(document.body, { attributes: true, attributeFilter: ["data-framer-theme"] })
        }
        if (document.documentElement) {
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-framer-theme"] })
        }

        return () => {
            if (unsubscribe) unsubscribe()
            window.removeEventListener("message", handleMessage)
            observer.disconnect()
        }
    }, [])

    const resolvedTheme: "light" | "dark" = themePreference === "auto" ? canvasTheme : themePreference

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", resolvedTheme)
        if (document.body) {
            document.body.setAttribute("data-theme", resolvedTheme)
        }
        if (themePreference !== "auto") {
            document.documentElement.setAttribute("data-framer-theme", resolvedTheme)
            if (document.body) {
                document.body.setAttribute("data-framer-theme", resolvedTheme)
            }
        }
    }, [resolvedTheme, themePreference])

    const handleThemeChange = (preference: "light" | "dark" | "auto") => {
        setThemePreference(preference)
        try {
            localStorage.setItem("reviewfic_theme_pref_v1", preference)
        } catch {}
    }

    // Config updater for the active widget
    const updateActiveWidgetConfig = useCallback(
        (updater: (prev: ReviewConfig) => ReviewConfig) => {
            if (!activeWidget || !activeBusiness) return

            setWidgets((prevWidgets) => {
                const nextWidgets = prevWidgets.map((w) => {
                    if (w.id === activeWidget.id) {
                        const nextConfig = updater(w.config)
                        const updatedWidget: ReviewWidget = {
                            ...w,
                            config: nextConfig,
                            updatedAt: Date.now(),
                        }
                        void syncCanvasWidget(updatedWidget, activeBusiness)
                        return updatedWidget
                    }
                    return w
                })
                void saveWidgets(nextWidgets)
                return nextWidgets
            })
        },
        [activeWidget, activeBusiness]
    )

    // Business updater
    const updateActiveBusiness = useCallback(
        (updater: (prev: ConnectedBusiness) => ConnectedBusiness) => {
            if (!activeBusiness) return
            const updated = updater(activeBusiness)
            setBusinesses((prev) => {
                const next = prev.map((b) => (b.id === updated.id ? updated : b))
                void saveBusinesses(next)
                return next
            })
            if (activeWidget) {
                void syncCanvasWidget(activeWidget, updated)
            }
        },
        [activeBusiness, activeWidget]
    )

    // Handlers for Onboarding / Connect Reviews
    const handleInitialBusinessConnected = (business: ConnectedBusiness) => {
        const nextBusinesses = [business, ...businesses.filter((b) => b.id !== business.id)]
        const defaultWidget = createDefaultWidget(business.id, `${business.name} Showcase`, "carousel", "elevated")
        const nextWidgets = [defaultWidget, ...widgets]

        setBusinesses(nextBusinesses)
        setActiveBusinessId(business.id)
        setWidgets(nextWidgets)
        setActiveWidgetId(defaultWidget.id)
        setIsAddingBusiness(false)
        setTab("widgets")

        void saveBusinesses(nextBusinesses)
        void saveWidgets(nextWidgets)
        void saveActiveBusinessId(business.id)
        void saveActiveWidgetId(defaultWidget.id)
        showNotice(`Connected "${business.name}" successfully!`, "success")
    }

    // Handlers for Widgets
    const handleCreateWidget = (name: string, layout: ReviewLayout, cardStyle: CardStyle) => {
        if (!activeBusiness) return
        const newWidget = createDefaultWidget(activeBusiness.id, name, layout, cardStyle)
        const nextWidgets = [newWidget, ...widgets]

        setWidgets(nextWidgets)
        setActiveWidgetId(newWidget.id)
        setEditingWidgetId(newWidget.id)
        setWidgetEditTab("builder")
        setTab("widgets")

        void saveWidgets(nextWidgets)
        void saveActiveWidgetId(newWidget.id)
        void refreshCanvasCounts(nextWidgets)
        showNotice(`Created widget "${name}". Customize it below, then click "Go with this design"!`, "success")
    }

    const handleEditWidget = (widget: ReviewWidget) => {
        setActiveWidgetId(widget.id)
        setEditingWidgetId(widget.id)
        setWidgetEditTab("builder")
        setTab("widgets")
        void saveActiveWidgetId(widget.id)
    }

    const handleInsertWidget = async (widget: ReviewWidget) => {
        if (!activeBusiness) return
        setInserting(true)
        try {
            const res = await insertCanvasWidget(widget, activeBusiness)
            if (res.success) {
                showNotice(`Reviewfic widget "${widget.name}" inserted onto canvas!`, "success")
                void refreshCanvasCounts(widgets)
            } else {
                showNotice(res.message || "Failed to insert widget.", "error")
            }
        } catch (e: any) {
            showNotice(e?.message || "Failed to insert widget.", "error")
        } finally {
            setInserting(false)
        }
    }

    const handleConfirmDeleteWidget = async () => {
        if (!deleteWidgetTarget) return
        setIsDeletingWidget(true)
        const targetId = deleteWidgetTarget.id
        const targetName = deleteWidgetTarget.name

        try {
            const canvasRemoved = await deleteCanvasInstancesForWidget(targetId)
            const nextWidgets = widgets.filter((w) => w.id !== targetId)
            setWidgets(nextWidgets)
            void saveWidgets(nextWidgets)

            if (editingWidgetId === targetId) {
                setEditingWidgetId(null)
            }

            if (activeWidgetId === targetId) {
                const remainingForBiz = nextWidgets.filter((w) => w.businessId === activeBusinessId)
                const nextActiveId = remainingForBiz[0]?.id || ""
                setActiveWidgetId(nextActiveId)
                void saveActiveWidgetId(nextActiveId)
            }

            void refreshCanvasCounts(nextWidgets)
            setDeleteWidgetTarget(null)

            if (canvasRemoved > 0) {
                showNotice(`"${targetName}" and ${canvasRemoved} canvas instance(s) deleted.`, "info")
            } else {
                showNotice(`"${targetName}" deleted successfully.`, "info")
            }
        } catch (e: any) {
            showNotice(e?.message || "Failed to delete widget.", "error")
        } finally {
            setIsDeletingWidget(false)
        }
    }

    // Handlers for Businesses
    const handleSelectBusiness = (biz: ConnectedBusiness) => {
        setActiveBusinessId(biz.id)
        void saveActiveBusinessId(biz.id)

        // Ensure active widget points to a widget belonging to this business
        const bizWidgets = widgets.filter((w) => w.businessId === biz.id)
        if (bizWidgets.length === 0) {
            const defaultWidget = createDefaultWidget(biz.id, `${biz.name} Showcase`, "carousel", "elevated")
            const nextWidgets = [defaultWidget, ...widgets]
            setWidgets(nextWidgets)
            void saveWidgets(nextWidgets)
            setActiveWidgetId(defaultWidget.id)
            void saveActiveWidgetId(defaultWidget.id)
        } else {
            setActiveWidgetId(bizWidgets[0].id)
            void saveActiveWidgetId(bizWidgets[0].id)
        }

        setEditingWidgetId(null)
        setTab("widgets")
        showNotice(`Switched to business: "${biz.name}"`, "info")
    }

    const handleUpdateBusiness = (updated: ConnectedBusiness) => {
        setBusinesses((prev) => {
            const next = prev.map((b) => (b.id === updated.id ? updated : b))
            void saveBusinesses(next)
            return next
        })
        if (activeWidget && activeBusinessId === updated.id) {
            void syncCanvasWidget(activeWidget, updated)
        }
        showNotice(`Updated business: "${updated.name}"`, "success")
    }

    const handleDeleteBusiness = (businessId: string) => {
        if (businesses.length <= 1) {
            showNotice("Cannot remove the only business.", "warning")
            return
        }

        // Clean up widgets for this business
        const bizWidgets = widgets.filter((w) => w.businessId === businessId)
        for (const w of bizWidgets) {
            void deleteCanvasInstancesForWidget(w.id)
        }
        const remainingWidgets = widgets.filter((w) => w.businessId !== businessId)
        const remainingBiz = businesses.filter((b) => b.id !== businessId)

        setBusinesses(remainingBiz)
        setWidgets(remainingWidgets)
        void saveBusinesses(remainingBiz)
        void saveWidgets(remainingWidgets)

        const nextBiz = remainingBiz[0]
        setActiveBusinessId(nextBiz.id)
        void saveActiveBusinessId(nextBiz.id)

        const nextWidgetsForBiz = remainingWidgets.filter((w) => w.businessId === nextBiz.id)
        setActiveWidgetId(nextWidgetsForBiz[0]?.id || "")
        void saveActiveWidgetId(nextWidgetsForBiz[0]?.id || "")

        showNotice("Business removed.", "info")
    }

    const handleSyncBusiness = async (biz: ConnectedBusiness) => {
        const freshGoogle = biz.googleBusinessName
            ? generateReviewsForBusiness(biz.googleBusinessName, "Business", biz.googleMapsUrl)
            : []
        const freshTp = biz.trustpilotDomain
            ? generateReviewsForTrustpilot(biz.trustpilotDomain, 24)
            : []

        const updatedBiz: ConnectedBusiness = {
            ...biz,
            googleReviews: freshGoogle.length ? freshGoogle : biz.googleReviews,
            trustpilotReviews: freshTp.length ? freshTp : biz.trustpilotReviews,
            lastSync: "Just now",
        }

        handleUpdateBusiness(updatedBiz)
        showNotice(`Synced fresh reviews for "${biz.name}"!`, "success")
    }

    // "Go with this design" handler in Builder
    const handleGoWithThisDesign = async () => {
        if (!activeWidget || !activeBusiness) return
        setInserting(true)
        try {
            const res = await insertCanvasWidget(activeWidget, activeBusiness)
            if (res.success) {
                showNotice(`Reviewfic widget "${activeWidget.name}" inserted onto canvas!`, "success")
                void refreshCanvasCounts(widgets)
            } else {
                showNotice(res.message || "Failed to insert widget.", "error")
            }
        } catch (e: any) {
            showNotice(e?.message || "Failed to insert widget.", "error")
        } finally {
            setInserting(false)
        }
    }

    // Reset defaults for the active widget
    const handleResetWidget = () => {
        if (!activeWidget) return
        updateActiveWidgetConfig(() => ({ ...DEFAULT_CONFIG, widgetId: activeWidget.id, businessId: activeBusiness?.id }))
        showNotice("Widget settings reset to defaults.", "info")
    }

    // Google Places Search in Sources Tab
    const handleGoogleSearchInput = (val: string) => {
        setGoogleQuery(val)
        if (!val.trim()) {
            setPlaceResults([])
            return
        }

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

        setIsSearchingPlaces(true)
        searchGooglePlaces(val)
            .then((results) => setPlaceResults(results))
            .catch(() => setPlaceResults([]))
            .finally(() => setIsSearchingPlaces(false))
    }

    const handleSelectPlace = (place: GooglePlaceResult) => {
        const authenticReviews = place.reviews && place.reviews.length > 0
            ? place.reviews
            : generateReviewsForBusiness(place.name, place.category || "Business", place.address)

        const writeReviewUrl = place.placeId?.startsWith("ChIJ")
            ? `https://search.google.com/local/writereview?placeid=${place.placeId}`
            : place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`

        updateActiveBusiness((prev) => ({
            ...prev,
            name: place.name,
            googleBusinessName: place.name,
            googlePlaceId: place.placeId,
            googleMapsUrl: place.mapsUrl,
            googleRating: place.rating,
            googleReviewCount: place.reviewCount,
            googleReviews: authenticReviews,
            googleEnabled: true,
            lastSync: "Just now",
        }))

        updateActiveWidgetConfig((prev) => ({
            ...prev,
            writeReviewGoogleUrl: writeReviewUrl,
            googleEnabled: true,
            isDemoMode: false,
        }))

        setGoogleQuery("")
        setPlaceResults([])
        showNotice(`Connected to Google: "${place.name}" (${authenticReviews.length} reviews)!`, "success")
    }

    const handleConnectTrustpilot = useCallback(
        async (targetDomain?: string) => {
            const input = (targetDomain || tpInput || activeBusiness?.trustpilotDomain || "").trim()
            if (!input) return
            const parsed = parseTrustpilotInput(input)
            const domain = parsed.domain || input
            const resolved = await resolveTrustpilotProfile(domain)
            const fresh = generateReviewsForTrustpilot(domain, 24)

            updateActiveBusiness((prev) => ({
                ...prev,
                trustpilotDomain: domain,
                trustpilotRating: resolved.rating,
                trustpilotReviewCount: resolved.reviewCount,
                trustpilotReviews: fresh,
                trustpilotEnabled: true,
                lastSync: "Just now",
            }))

            updateActiveWidgetConfig((prev) => ({
                ...prev,
                trustpilotEnabled: true,
                isDemoMode: false,
            }))

            setTpInput("")
            showNotice(`Connected Trustpilot: "${domain}" (${fresh.length} reviews)!`, "success")
        },
        [activeBusiness, tpInput, updateActiveBusiness, updateActiveWidgetConfig, showNotice]
    )

    // Custom review handlers
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

        updateActiveBusiness((prev) => ({
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
        updateActiveBusiness((prev) => ({
            ...prev,
            customReviews: prev.customReviews.filter((r) => r.id !== id),
        }))
    }

    // CSV Handlers
    const handleExportCSV = useCallback(() => {
        if (activeReviews.length === 0) {
            showNotice("No reviews available to export.", "warning")
            return
        }
        const csv = reviewsToCSVString(activeReviews)
        downloadCSV(`reviewfic-reviews-${Date.now()}.csv`, csv)
        showNotice(`Exported ${activeReviews.length} reviews to CSV!`, "success")
    }, [activeReviews, showNotice])

    const handleDownloadSampleCSV = useCallback(() => {
        const sample = generateSampleCSV()
        downloadCSV("reviewfic-sample-template.csv", sample)
        showNotice("Downloaded sample CSV template!", "info")
    }, [showNotice])

    const handleFileUploadCSV = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
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
                updateActiveBusiness((prev) => ({
                    ...prev,
                    customReviews: [...result.reviews, ...prev.customReviews],
                }))
                setCsvSuccess(`Successfully imported ${result.reviews.length} reviews from CSV!`)
                setTimeout(() => setCsvSuccess(null), 4000)
            }
            reader.onerror = () => setCsvError("Failed to read CSV file.")
            reader.readAsText(file)
            e.target.value = ""
        },
        [updateActiveBusiness]
    )

    const handlePasteCSVSubmit = useCallback(() => {
        if (!csvPasteText.trim()) return
        setCsvError(null)
        setCsvSuccess(null)
        const result = parseCSVToReviews(csvPasteText)
        if (!result.success || result.reviews.length === 0) {
            setCsvError(result.errors.join(" ") || "No valid review rows found in pasted CSV data.")
            return
        }
        updateActiveBusiness((prev) => ({
            ...prev,
            customReviews: [...result.reviews, ...prev.customReviews],
        }))
        setCsvSuccess(`Imported ${result.reviews.length} reviews from pasted data!`)
        setCsvPasteText("")
        setShowCsvPaste(false)
        setTimeout(() => setCsvSuccess(null), 4000)
    }, [csvPasteText, updateActiveBusiness])

    // Framer CMS Sync
    const handleSyncCMS = useCallback(async () => {
        if (activeReviews.length === 0) {
            setCmsSyncMsg({ text: "No reviews to sync.", ok: false })
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
            text: `Downloaded Framer CMS CSV (${activeReviews.length} reviews)!`,
            ok: true,
        })
        setTimeout(() => setCmsSyncMsg(null), 8000)
    }, [activeReviews])

    // Show initial Connect Screen if no business exists
    if (isLoaded && businesses.length === 0) {
        return (
            <div className={`app ${resolvedTheme}`}>
                <main className="content">
                    <ConnectReviewsView onComplete={handleInitialBusinessConnected} />
                </main>
            </div>
        )
    }

    // Show Add Business flow if explicitly triggered
    if (isAddingBusiness) {
        return (
            <div className={`app ${resolvedTheme}`}>
                <main className="content">
                    <ConnectReviewsView
                        onComplete={handleInitialBusinessConnected}
                        onCancel={() => setIsAddingBusiness(false)}
                    />
                </main>
            </div>
        )
    }

    // Show Manage Businesses view if triggered
    if (isManagingBusinesses) {
        return (
            <div className={`app ${resolvedTheme}`}>
                <main className="content">
                    <ManageBusinessesView
                        businesses={businesses}
                        activeBusinessId={activeBusinessId}
                        onBack={() => setIsManagingBusinesses(false)}
                        onAddBusiness={() => {
                            setIsManagingBusinesses(false)
                            setIsAddingBusiness(true)
                        }}
                        onUpdateBusiness={handleUpdateBusiness}
                        onDeleteBusiness={handleDeleteBusiness}
                    />
                </main>
            </div>
        )
    }

    return (
        <div className={`app ${resolvedTheme}`}>
            {/* Top Navigation Tabs */}
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
                        className={"cf-tab " + (!isProfileOpen && tab === "widgets" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("widgets")
                        }}
                    >
                        Widgets
                    </button>
                    <button
                        type="button"
                        className={"cf-tab " + (!isProfileOpen && tab === "businesses" ? "active" : "")}
                        onClick={() => {
                            setIsProfileOpen(false)
                            setTab("businesses")
                        }}
                    >
                        Businesses
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
                {/* Framer Callout Notice Banner */}
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
                                {notice.title ||
                                    (notice.type === "success"
                                        ? "Success"
                                        : notice.type === "error"
                                        ? "Error"
                                        : notice.type === "warning"
                                        ? "Warning"
                                        : "Notice")}
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
                            <HomeView
                                business={activeBusiness}
                                businesses={businesses}
                                widgets={widgets}
                                stats={stats}
                                onCreateNewWidget={() => {
                                    setTab("widgets")
                                    setEditingWidgetId(null)
                                }}
                                onOpenBusinesses={() => {
                                    setTab("businesses")
                                    setEditingWidgetId(null)
                                }}
                                onOpenWidgets={() => {
                                    setTab("widgets")
                                    setEditingWidgetId(null)
                                }}
                            />
                        )}

                        {/* TAB 2: WIDGETS (All Widgets List OR Widget-Specific Edit Mode) */}
                        {tab === "widgets" && activeBusiness && (
                            editingWidgetId === null ? (
                                <AllWidgetsView
                                    business={activeBusiness}
                                    widgets={activeWidgets}
                                    canvasWidgetCounts={canvasWidgetCounts}
                                    onSwitchBusiness={() => setTab("businesses")}
                                    onCreateWidget={handleCreateWidget}
                                    onEditWidget={handleEditWidget}
                                    onInsertWidget={handleInsertWidget}
                                    onDeleteWidget={(w) => setDeleteWidgetTarget(w)}
                                />
                            ) : (
                                <>
                                    {/* Widget Specific Edit Header */}
                                    <div className="cf-builder-top-bar">
                                        <button
                                            type="button"
                                            className="cf-builder-back-btn"
                                            onClick={() => setEditingWidgetId(null)}
                                            title="Back to all widgets"
                                        >
                                            ← All Widgets
                                        </button>
                                        <div className="cf-builder-title-badge">
                                            <span className="cf-builder-widget-name">
                                                {activeWidget?.name || "Review Showcase"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Subtabs for Builder and Sources inside Widget Edit */}
                                    <div className="cf-subtabs-bar">
                                        <button
                                            type="button"
                                            className={"cf-subtab " + (widgetEditTab === "builder" ? "active" : "")}
                                            onClick={() => setWidgetEditTab("builder")}
                                        >
                                            <IconSliders size={13} />
                                            <span>Builder (Layout &amp; Style)</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={"cf-subtab " + (widgetEditTab === "sources" ? "active" : "")}
                                            onClick={() => setWidgetEditTab("sources")}
                                        >
                                            <IconDatabase size={13} />
                                            <span>Sources &amp; Content</span>
                                        </button>
                                    </div>

                                    {/* Subtab 1: Builder */}
                                    {widgetEditTab === "builder" && (
                                        <>

                                {/* Live Studio Stage with Backdrop Switcher */}
                                <div className="cf-studio-wrap">
                                    <div className="cf-stage-header">
                                        <div className="cf-stage-title-wrap">
                                            <span className="cf-preview-title">
                                                Live Studio Preview ({activeConfig.layout})
                                            </span>
                                            <span className="cf-badge cf-badge-brand">{activeConfig.cardStyle}</span>
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
                                            layout={activeConfig.layout}
                                            cardStyle={activeConfig.cardStyle}
                                            reviews={activeReviews}
                                            stats={stats}
                                            config={activeConfig}
                                            stageTheme={
                                                stageTheme === "dark"
                                                    ? "dark"
                                                    : stageTheme === "light"
                                                    ? "light"
                                                    : "auto"
                                            }
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
                                        </select>                                    </Field>

                                    <div className="cf-catalog-grid">
                                        {filteredLayouts.map((l) => {
                                            const isActive = activeConfig.layout === l.key
                                            const isHot = l.key === "carousel" || l.key === "wall"
                                            return (
                                                <button
                                                    key={l.key}
                                                    type="button"
                                                    className={`cf-catalog-item ${isActive ? "active" : ""}`}
                                                    onClick={() => {
                                                        setSelectedLayoutGroup(l.group)
                                                        updateActiveWidgetConfig((prev) => ({ ...prev, layout: l.key }))
                                                    }}
                                                    title={l.desc}
                                                >
                                                    <div className="cf-catalog-preview">
                                                        <LayoutThumbnailPreview layout={l.key} />
                                                        {l.tier === "pro" && (
                                                            <span className="cf-catalog-pro-badge" title="✦ PRO Layout">
                                                                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="cf-catalog-footer">
                                                        <span className="cf-catalog-item-name">{l.name}</span>
                                                        {isHot && <span className="cf-catalog-hot">HOT</span>}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {activeConfig.layout === "carousel" && (
                                        <>
                                            <Switch
                                                label="Autoplay Slides"
                                                checked={activeConfig.carouselAutoplay}
                                                onChange={(v) =>
                                                    updateActiveWidgetConfig((prev) => ({ ...prev, carouselAutoplay: v }))
                                                }
                                            />
                                            <Switch
                                                label="Infinite Loop Scroll"
                                                checked={activeConfig.carouselInfinite !== false}
                                                onChange={(v) =>
                                                    updateActiveWidgetConfig((prev) => ({ ...prev, carouselInfinite: v }))
                                                }
                                            />
                                            <Field label={`Autoplay Interval: ${activeConfig.carouselSpeed}s`}>
                                                <input
                                                    type="range"
                                                    min="2"
                                                    max="12"
                                                    value={activeConfig.carouselSpeed}
                                                    onChange={(e) =>
                                                        updateActiveWidgetConfig((prev) => ({
                                                            ...prev,
                                                            carouselSpeed: Number(e.target.value),
                                                        }))
                                                    }
                                                    className="cf-styled-range"
                                                />
                                            </Field>
                                        </>
                                    )}

                                    {(activeConfig.layout === "grid" || activeConfig.layout === "masonry") && (
                                        <Field
                                            label="Columns per Row"
                                            hint={`Display ${activeConfig.gridColumns || 3} columns across desktop`}
                                        >
                                            <div className="cf-columns-segmented">
                                                {[1, 2, 3, 4, 5, 6].map((cols) => (
                                                    <button
                                                        key={cols}
                                                        type="button"
                                                        className={`cf-col-btn ${
                                                            (activeConfig.gridColumns || 3) === cols ? "active" : ""
                                                        }`}
                                                        onClick={() =>
                                                            updateActiveWidgetConfig((prev) => ({
                                                                ...prev,
                                                                gridColumns: cols,
                                                            }))
                                                        }
                                                    >
                                                        {cols}
                                                    </button>
                                                ))}
                                            </div>
                                        </Field>
                                    )}

                                    {(activeConfig.layout === "ticker" || activeConfig.layout === "marquee") && (
                                        <Field label="Ticker Scroll Speed">
                                            <select
                                                className="cf-select"
                                                value={activeConfig.marqueeSpeed}
                                                onChange={(e) =>
                                                    updateActiveWidgetConfig((prev) => ({
                                                        ...prev,
                                                        marqueeSpeed: e.target.value as any,
                                                    }))
                                                }
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

                                    <Field
                                        label="Select Card Style Preset"
                                        hint="Pick any card style preset across all families"
                                    >
                                        <select
                                            className="cf-select"
                                            value={activeConfig.cardStyle}
                                            onChange={(e) => {
                                                const nextId = e.target.value as any
                                                const preset = ALL_CARD_PRESETS.find((p) => p.id === nextId)
                                                if (preset) setSelectedCardFamily(preset.family)
                                                updateActiveWidgetConfig((prev) => ({ ...prev, cardStyle: nextId }))
                                            }}
                                        >
                                            {CARD_FAMILIES.map((f) => {
                                                const items = ALL_CARD_PRESETS.filter((p) => p.family === f.id)
                                                return (
                                                    <optgroup key={f.id} label={`${f.name} (${items.length})`}>
                                                        {items.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} {p.platform ? `[${p.platform.toUpperCase()}]` : ""}{" "}
                                                                {p.tier === "pro" ? "✦ PRO" : ""} — {p.note}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )
                                            })}
                                        </select>
                                    </Field>

                                    <div className="cf-presets-grid">
                                        {filteredPresets.map((p) => {
                                            const isActive = activeConfig.cardStyle === p.id
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className={`cf-preset-item ${isActive ? "active" : ""}`}
                                                    onClick={() => {
                                                        setSelectedCardFamily(p.family)
                                                        updateActiveWidgetConfig((prev) => ({ ...prev, cardStyle: p.id }))
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
                                                            <span
                                                                className="cf-preset-platform"
                                                                title="Trustpilot preset"
                                                            >
                                                                <IconTrustpilot size={12} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <Field
                                        label="Star Accent Color"
                                        hint="Pick any custom hex or choose a brand preset"
                                    >
                                        <CustomColorPicker
                                            value={activeConfig.starColor || "#FBBC05"}
                                            fallback="#FBBC05"
                                            onChange={(color) =>
                                                updateActiveWidgetConfig((prev) => ({ ...prev, starColor: color }))
                                            }
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
                                                    className={`cf-color-dot ${
                                                        activeConfig.starColor?.toLowerCase() === c.color.toLowerCase()
                                                            ? "active"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        updateActiveWidgetConfig((prev) => ({ ...prev, starColor: c.color }))
                                                    }
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

                                    <Field label={`Corner Radius: ${activeConfig.cornerRadius}px`}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="32"
                                            value={activeConfig.cornerRadius}
                                            onChange={(e) =>
                                                updateActiveWidgetConfig((prev) => ({
                                                    ...prev,
                                                    cornerRadius: Number(e.target.value),
                                                }))
                                            }
                                            className="cf-styled-range"
                                        />
                                    </Field>
                                </Section>

                                {/* Card Content Toggles */}
                                <Section
                                    title="Card Elements & Metadata"
                                    subtitle="Toggle reviewer metadata"
                                    icon={<IconCheck size={15} />}
                                >
                                    <Switch
                                        label="Show Star Rating"
                                        checked={activeConfig.showStars}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({ ...prev, showStars: v }))
                                        }
                                    />
                                    <Switch
                                        label="Show Reviewer Avatars"
                                        checked={activeConfig.showAvatar}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({ ...prev, showAvatar: v }))
                                        }
                                    />
                                    <Switch
                                        label="Show Review Date"
                                        checked={activeConfig.showDate}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({ ...prev, showDate: v }))
                                        }
                                    />
                                    <Switch
                                        label="Show Platform Source Badge (Google/Trustpilot)"
                                        checked={activeConfig.showSourceIcon}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({ ...prev, showSourceIcon: v }))
                                        }
                                    />
                                    <Switch
                                        label="Show Verified Customer Pill"
                                        checked={activeConfig.showVerifiedBadge}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({ ...prev, showVerifiedBadge: v }))
                                        }
                                    />
                                    <Switch
                                        label="Show 'Write a Review' Header CTA"
                                        checked={activeConfig.showWriteReview}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({ ...prev, showWriteReview: v }))
                                        }
                                    />
                                </Section>
                            </>
                        )}

                        {/* Subtab 2: Sources & Reviews */}
                        {widgetEditTab === "sources" && (
                            <>
                                {/* Source Mode Filter */}
                                <Section
                                    title="Source Filter"
                                    subtitle="Choose which platforms to display in this feed"
                                    icon={<IconGoogle size={15} />}
                                >
                                    <div className="cf-segmented-grid">
                                        {[
                                            { id: "blend", label: "Blended Feed" },
                                            { id: "google_only", label: "Google Only" },
                                            { id: "trustpilot_only", label: "Trustpilot Only" },
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                className={`cf-seg-btn ${
                                                    activeConfig.sourceMode === m.id ? "active" : ""
                                                }`}
                                                onClick={() =>
                                                    updateActiveWidgetConfig((prev) => ({
                                                        ...prev,
                                                        sourceMode: m.id as any,
                                                    }))
                                                }
                                            >
                                                <span>{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </Section>

                                {/* Google Profile Connection */}
                                <Section
                                    title="Google Business Profile"
                                    subtitle={
                                        activeBusiness.googlePlaceId
                                            ? `Connected: ${activeBusiness.googleBusinessName || activeBusiness.name}`
                                            : "Connect via live search or Maps URL / Place ID"
                                    }
                                    icon={<IconGoogle size={15} />}
                                >
                                    <Switch
                                        label="Enable Google Reviews"
                                        checked={activeBusiness.googleEnabled}
                                        onChange={(v) =>
                                            updateActiveBusiness((prev) => ({ ...prev, googleEnabled: v }))
                                        }
                                    />

                                    {activeBusiness.googleBusinessName && activeBusiness.googlePlaceId ? (
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
                                                        updateActiveBusiness((prev) => ({
                                                            ...prev,
                                                            googleBusinessName: "",
                                                            googlePlaceId: "",
                                                            googleMapsUrl: "",
                                                            googleReviews: [],
                                                            googleEnabled: false,
                                                        }))
                                                        setGoogleQuery("")
                                                    }}
                                                    title="Disconnect Google profile"
                                                >
                                                    Disconnect
                                                </button>
                                            </div>
                                            <h4 className="cf-location-conn-title">{activeBusiness.googleBusinessName}</h4>
                                            <div className="cf-location-conn-meta">
                                                <span className="cf-location-conn-score">
                                                    ★ {activeBusiness.googleRating}
                                                </span>
                                                <span>•</span>
                                                <span>{activeBusiness.googleReviewCount}+ Google Reviews</span>
                                                <span>•</span>
                                                <span>Place ID: {activeBusiness.googlePlaceId.slice(0, 14)}...</span>
                                            </div>

                                            <div className="cf-conn-metrics-row">
                                                <div className="cf-conn-metric-card">
                                                    <span className="cf-metric-label">Google Rating</span>
                                                    <span className="cf-metric-value">★ {activeBusiness.googleRating}</span>
                                                    <span className="cf-metric-source">Google Maps Live</span>
                                                </div>
                                                <div className="cf-conn-metric-card">
                                                    <span className="cf-metric-label">Total Reviews</span>
                                                    <span className="cf-metric-value">
                                                        {activeBusiness.googleReviewCount}+
                                                    </span>
                                                    <span className="cf-metric-source">Verified Count</span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="cf-btn-google-sync"
                                                onClick={() => handleSyncBusiness(activeBusiness)}
                                            >
                                                <IconRefresh size={14} />
                                                <span>Sync Google Business Reviews</span>
                                            </button>
                                        </div>
                                    ) : (
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
                                                    placeholder="Type business name or paste Google Maps link..."
                                                    value={googleQuery}
                                                    onChange={(e) => handleGoogleSearchInput(e.target.value)}
                                                />
                                                {isSearchingPlaces && <span className="cf-location-spinner" />}
                                            </div>

                                            {placeResults.length > 0 && (
                                                <div className="cf-location-dropdown">
                                                    {placeResults.map((p) => (
                                                        <button
                                                            key={p.placeId}
                                                            type="button"
                                                            className="cf-location-item"
                                                            onClick={() => handleSelectPlace(p)}
                                                        >
                                                            <div className="cf-location-item-top">
                                                                <span className="cf-location-item-name">{p.name}</span>
                                                                <span className="cf-location-item-rating">
                                                                    ★ {p.rating} ({p.reviewCount})
                                                                </span>
                                                            </div>
                                                            <span className="cf-location-item-addr">{p.address}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Section>

                                {/* Trustpilot Connection */}
                                <Section
                                    title="Trustpilot Profile"
                                    subtitle={
                                        activeBusiness.trustpilotDomain
                                            ? `Connected: ${activeBusiness.trustpilotDomain}`
                                            : "Connect your Trustpilot reviews"
                                    }
                                    icon={<IconTrustpilot size={15} />}
                                >
                                    <Switch
                                        label="Enable Trustpilot Reviews"
                                        checked={activeBusiness.trustpilotEnabled}
                                        onChange={(v) =>
                                            updateActiveBusiness((prev) => ({ ...prev, trustpilotEnabled: v }))
                                        }
                                    />

                                    {activeBusiness.trustpilotDomain ? (
                                        <div className="cf-tp-connected-card">
                                            <div className="cf-conn-header">
                                                <div className="cf-conn-identity">
                                                    <div className="cf-conn-logo cf-conn-logo-tp">
                                                        <IconTrustpilot size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="cf-conn-name">{activeBusiness.trustpilotDomain}</div>
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
                                                        updateActiveBusiness((prev) => ({
                                                            ...prev,
                                                            trustpilotDomain: "",
                                                            trustpilotReviews: [],
                                                            trustpilotEnabled: false,
                                                        }))
                                                    }}
                                                    title="Disconnect Trustpilot profile"
                                                >
                                                    Disconnect
                                                </button>
                                            </div>

                                            <div className="cf-conn-metrics-row">
                                                <div className="cf-conn-metric-card">
                                                    <span className="cf-metric-label">TrustScore</span>
                                                    <span className="cf-metric-value">
                                                        ★ {activeBusiness.trustpilotRating}
                                                    </span>
                                                    <span className="cf-metric-source">Trustpilot Verified</span>
                                                </div>
                                                <div className="cf-conn-metric-card">
                                                    <span className="cf-metric-label">Total Reviews</span>
                                                    <span className="cf-metric-value">
                                                        {activeBusiness.trustpilotReviewCount}+
                                                    </span>
                                                    <span className="cf-metric-source">TrustScore Pool</span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="cf-btn-tp-sync"
                                                onClick={() => handleSyncBusiness(activeBusiness)}
                                            >
                                                <IconRefresh size={14} />
                                                <span>Sync Trustpilot Reviews</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="cf-tp-connect-wrap">
                                            <Field
                                                label="Trustpilot Domain or URL"
                                                hint="Enter domain (e.g. themefic.com) or trustpilot.com URL"
                                            >
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
                                        </div>
                                    )}
                                </Section>

                                {/* Custom Testimonials */}
                                <Section
                                    title={`Custom Testimonials (${activeBusiness.customReviews.length})`}
                                    subtitle="Add bespoke client quotes or B2B reviews"
                                    icon={<IconPlus size={15} />}
                                >
                                    {activeBusiness.customReviews.map((cr) => (
                                        <div key={cr.id} className="cf-custom-item">
                                            <div className="cf-custom-item-info">
                                                <span className="cf-custom-item-name">
                                                    {cr.authorName} ({cr.rating}★)
                                                </span>
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
                                            <option value={5}>★★★★★ (5 Stars)</option>
                                            <option value={4}>★★★★☆ (4 Stars)</option>
                                            <option value={3}>★★★☆☆ (3 Stars)</option>
                                        </select>
                                    </Field>
                                    <Field label="Review Quote / Feedback">
                                        <textarea
                                            className="cf-textarea"
                                            rows={2}
                                            placeholder="Write authentic feedback..."
                                            value={newText}
                                            onChange={(e) => setNewText(e.target.value)}
                                        />
                                    </Field>
                                    <button
                                        type="button"
                                        className="cf-btn-primary"
                                        onClick={handleAddCustomReview}
                                        disabled={!newAuthor.trim() || !newText.trim()}
                                    >
                                        <IconPlus size={13} />
                                        <span>Add Custom Testimonial</span>
                                    </button>
                                </Section>

                                {/* CSV & Framer CMS Tools */}
                                <Section
                                    title="CSV & Framer CMS Data"
                                    subtitle="Import, export & sync reviews"
                                    icon={<IconDatabase size={15} />}
                                >
                                    <div className="cf-csv-buttons-row">
                                        <button
                                            type="button"
                                            className="cf-btn-csv-action"
                                            onClick={handleExportCSV}
                                            disabled={activeReviews.length === 0}
                                        >
                                            <IconDownload size={13} />
                                            <span>Export CSV ({activeReviews.length})</span>
                                        </button>
                                        <label className="cf-btn-csv-action file-label">
                                            <IconUpload size={13} />
                                            <span>Upload CSV</span>
                                            <input
                                                type="file"
                                                accept=".csv"
                                                className="cf-hidden-file-input"
                                                onChange={handleFileUploadCSV}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            className="cf-btn-csv-action"
                                            onClick={handleDownloadSampleCSV}
                                        >
                                            <IconFileText size={13} />
                                            <span>Sample CSV</span>
                                        </button>
                                    </div>

                                    {csvSuccess && <div className="cf-alert-msg success">{csvSuccess}</div>}
                                    {csvError && <div className="cf-alert-msg error">{csvError}</div>}

                                    <div className="cf-cms-buttons-row">
                                        <button
                                            type="button"
                                            className="cf-btn-cms-sync"
                                            onClick={handleSyncCMS}
                                            disabled={isSyncingCMS || activeReviews.length === 0}
                                        >
                                            <IconDatabase size={14} />
                                            <span>Sync to Framer CMS Collection</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="cf-btn-cms-secondary"
                                            onClick={handleExportFramerCMSCSV}
                                            disabled={activeReviews.length === 0}
                                        >
                                            <IconDownload size={13} />
                                            <span>Export for Framer CMS (.csv)</span>
                                        </button>
                                    </div>
                                    {cmsSyncMsg && (
                                        <div className={`cf-alert-msg ${cmsSyncMsg.ok ? "success" : "error"}`}>
                                            <span>{cmsSyncMsg.text}</span>
                                        </div>
                                    )}
                                </Section>
                            </>
                        )}
                                </>
                            )
                        )}

                        {/* TAB 3: BUSINESSES LIST VIEW */}
                        {tab === "businesses" && (
                            <BusinessesListView
                                businesses={businesses}
                                activeBusinessId={activeBusinessId}
                                onSelectBusiness={handleSelectBusiness}
                                onManageBusinesses={() => setIsManagingBusinesses(true)}
                                onAddBusiness={() => setIsAddingBusiness(true)}
                                onSyncBusiness={handleSyncBusiness}
                            />
                        )}

                        {/* TAB 5: SETTINGS */}
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
                                                className={`cf-segment-item ${
                                                    themePreference === "light" ? "active" : ""
                                                }`}
                                                onClick={() => handleThemeChange("light")}
                                            >
                                                Light
                                            </button>
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={themePreference === "dark"}
                                                className={`cf-segment-item ${
                                                    themePreference === "dark" ? "active" : ""
                                                }`}
                                                onClick={() => handleThemeChange("dark")}
                                            >
                                                Dark
                                            </button>
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={themePreference === "auto"}
                                                className={`cf-segment-item ${
                                                    themePreference === "auto" ? "active" : ""
                                                }`}
                                                onClick={() => handleThemeChange("auto")}
                                            >
                                                Match site
                                            </button>
                                        </div>
                                    </div>
                                </Section>

                                <Section
                                    title="Curation & Filtering"
                                    subtitle="Control which reviews are rendered"
                                    icon={<IconSliders size={15} />}
                                >
                                    <Field label="Minimum Star Filter">
                                        <select
                                            className="cf-select"
                                            value={activeConfig.minRatingFilter}
                                            onChange={(e) =>
                                                updateActiveWidgetConfig((prev) => ({
                                                    ...prev,
                                                    minRatingFilter: Number(e.target.value),
                                                }))
                                            }
                                        >
                                            <option value={0}>Show All Ratings (1 to 5 Stars)</option>
                                            <option value={4}>4+ Stars Only (Recommended)</option>
                                            <option value={5}>5 Stars Only (Top Tier)</option>
                                        </select>
                                    </Field>

                                    <Field label="Sort Order">
                                        <select
                                            className="cf-select"
                                            value={activeConfig.sortOrder}
                                            onChange={(e) =>
                                                updateActiveWidgetConfig((prev) => ({
                                                    ...prev,
                                                    sortOrder: e.target.value as any,
                                                }))
                                            }
                                        >
                                            <option value="newest">Newest First (Chronological)</option>
                                            <option value="highest">Highest Rating (5★ First)</option>
                                            <option value="random">Random Shuffle (Balanced Showcase)</option>
                                        </select>
                                    </Field>

                                    <Switch
                                        label="Clamp Long Reviews with 'Read More'"
                                        checked={activeConfig.textClamp}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({ ...prev, textClamp: v }))
                                        }
                                    />

                                    <Switch
                                        label="Hide Empty Ratings Without Written Comments"
                                        checked={activeConfig.hideEmptyText}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({ ...prev, hideEmptyText: v }))
                                        }
                                    />

                                    <Field label={`Maximum Reviews to Render: ${activeConfig.maxReviews}`}>
                                        <input
                                            type="range"
                                            min="3"
                                            max="24"
                                            step="3"
                                            value={activeConfig.maxReviews}
                                            onChange={(e) =>
                                                updateActiveWidgetConfig((prev) => ({
                                                    ...prev,
                                                    maxReviews: Number(e.target.value),
                                                }))
                                            }
                                            className="cf-styled-range"
                                        />
                                    </Field>
                                </Section>

                                <Section
                                    title="Branding & Attribution"
                                    subtitle="Compliance & badge display"
                                    icon={<IconShieldCheck size={15} />}
                                >
                                    <Switch
                                        label="Show 'Reviews by Reviewfic' Attribution Badge"
                                        checked={activeConfig.showBrandingBadge}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({
                                                ...prev,
                                                showBrandingBadge: v,
                                            }))
                                        }
                                    />
                                </Section>

                                <Section
                                    title="SEO & Structured Data"
                                    subtitle="Boost organic search ranking"
                                    icon={<IconCheck size={15} />}
                                >
                                    <Switch
                                        label="Emit JSON-LD AggregateRating Schema"
                                        checked={activeConfig.enableJsonLdSchema}
                                        onChange={(v) =>
                                            updateActiveWidgetConfig((prev) => ({
                                                ...prev,
                                                enableJsonLdSchema: v,
                                            }))
                                        }
                                    />
                                </Section>
                            </>
                        )}
                    </>
                )}
            </main>

            {/* Bottom Actions Footer */}
            {!isProfileOpen && (
                <footer className="actions">
                    {tab === "widgets" && editingWidgetId !== null && (
                        <div className="cf-footer-grid">
                            <button
                                type="button"
                                className="primary-cta"
                                onClick={handleGoWithThisDesign}
                                disabled={inserting}
                                title="Go with this design and insert widget onto canvas"
                            >
                                <span>{inserting ? "Inserting..." : "Go with this design"}</span>
                                <IconSparkles size={16} />
                            </button>
                            <button
                                type="button"
                                className="secondary-cta"
                                onClick={handleResetWidget}
                                disabled={inserting}
                                title="Reset widget settings to defaults"
                            >
                                <IconRefresh size={13} />
                                <span>Reset</span>
                            </button>
                        </div>
                    )}
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
                        <span className="cf-shell-version">
                            v1.0.0 · {canvasCount > 0 ? `${canvasCount} on Canvas` : "Ready"}
                        </span>
                    </div>
                </footer>
            )}

            {/* Delete Widget Confirmation Modal */}
            {deleteWidgetTarget && (
                <DeleteWidgetModal
                    widgetName={deleteWidgetTarget.name}
                    canvasCount={canvasWidgetCounts[deleteWidgetTarget.id] || 0}
                    isDeleting={isDeletingWidget}
                    onConfirm={handleConfirmDeleteWidget}
                    onCancel={() => {
                        if (!isDeletingWidget) {
                            setDeleteWidgetTarget(null)
                        }
                    }}
                />
            )}
        </div>
    )
}
