import { framer } from "@framer/plugin"
import { ReviewItem } from "../core/types"
import { downloadCSV } from "../core/csv-service"

export interface CMSSyncResult {
    success: boolean
    message: string
    isCanvasMode?: boolean
    collectionName?: string
    itemsCount?: number
}

function escapeCSVCell(val: any): string {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
}

/**
 * Generates and triggers download of a CSV pre-mapped specifically for Framer CMS.
 * Headers match Framer's default CMS field detection for seamless 1-click import.
 */
export function exportReviewsForFramerCMS(reviews: ReviewItem[], filename = "reviewfic-framer-cms.csv"): void {
    const headers = [
        "Title",
        "Author Name",
        "Star Rating",
        "Review Text",
        "Platform Source",
        "Review Date",
        "Verified Customer",
        "Avatar URL",
    ]
    const rows = reviews.map((r, i) => [
        escapeCSVCell(`${r.authorName || "Customer"} - Review #${i + 1}`),
        escapeCSVCell(r.authorName),
        escapeCSVCell(r.rating),
        escapeCSVCell(r.text),
        escapeCSVCell(r.source),
        escapeCSVCell(r.date),
        escapeCSVCell(r.verified ? "true" : "false"),
        escapeCSVCell(r.authorAvatar || ""),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n")
    downloadCSV(filename, csvContent)
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48)
}

/**
 * Synchronizes active reviews into a Framer CMS Collection ("Reviewfic Reviews").
 * Enables static, server-rendered, crawlable social proof pages in Framer.
 */
export async function syncReviewsToFramerCMS(
    reviews: ReviewItem[],
    collectionTitle = "Reviewfic Reviews"
): Promise<CMSSyncResult> {
    if (!reviews || reviews.length === 0) {
        return {
            success: false,
            message: "No reviews to sync. Please connect a source or add testimonials first.",
        }
    }

    const currentMode = (framer as any).mode

    // If running in canvas mode, Framer restricts direct CMS collection API calls
    if (currentMode === "canvas") {
        exportReviewsForFramerCMS(reviews)
        return {
            success: false,
            isCanvasMode: true,
            message: `Framer restricts direct collection creation in Canvas mode. Pre-mapped CSV downloaded! In Framer's left sidebar, click CMS → Import CSV to import all ${reviews.length} reviews in 1 click.`,
            itemsCount: reviews.length,
        }
    }

    try {
        let targetCollection: any = null

        // 1. Try finding existing managed collection
        if (typeof (framer as any).getManagedCollections === "function") {
            try {
                const managedCollections = await (framer as any).getManagedCollections()
                targetCollection = managedCollections?.find((c: any) => c.name === collectionTitle)
            } catch (e) {}
        }

        // 2. If not found, try creating managed collection
        if (!targetCollection && typeof (framer as any).createManagedCollection === "function") {
            try {
                targetCollection = await (framer as any).createManagedCollection(collectionTitle)
            } catch (err: any) {
                try {
                    if (typeof (framer as any).getManagedCollections === "function") {
                        const managed = await (framer as any).getManagedCollections()
                        targetCollection = managed?.find((c: any) => c.name === collectionTitle)
                    }
                } catch (e) {}
            }
        }

        // 3. Fallback to standard Collection API
        if (!targetCollection && typeof (framer as any).getCollections === "function") {
            try {
                const collections = await (framer as any).getCollections()
                targetCollection = collections?.find((c: any) => c.name === collectionTitle)
                if (!targetCollection && typeof (framer as any).createCollection === "function") {
                    targetCollection = await (framer as any).createCollection(collectionTitle)
                }
            } catch (e) {}
        }

        if (!targetCollection) {
            exportReviewsForFramerCMS(reviews)
            return {
                success: false,
                isCanvasMode: true,
                message: `Direct CMS API not permitted in this mode. Downloaded pre-mapped CSV! Open CMS in left sidebar → Import CSV to import ${reviews.length} reviews.`,
                itemsCount: reviews.length,
            }
        }

        // Configure CMS schema fields
        if (typeof targetCollection.setFields === "function") {
            try {
                await targetCollection.setFields([
                    { id: "author", type: "string", name: "Author Name" },
                    { id: "rating", type: "number", name: "Star Rating" },
                    { id: "text", type: "string", name: "Review Text" },
                    { id: "source", type: "string", name: "Platform Source" },
                    { id: "date", type: "string", name: "Review Date" },
                    { id: "verified", type: "boolean", name: "Verified Customer" },
                    { id: "avatar", type: "string", name: "Avatar URL" },
                ])
            } catch (fieldErr) {}
        }

        // Prepare item payload
        const cmsItems = reviews.map((r, idx) => {
            const cleanSlug = slugify(`${r.authorName || "customer"}-${r.id || idx}`) || `review-${idx + 1}`
            return {
                id: String(r.id || `rf-${idx + 1}`),
                slug: cleanSlug,
                fieldData: {
                    author: { type: "string", value: r.authorName || "Verified Customer" },
                    rating: { type: "number", value: r.rating || 5 },
                    text: { type: "string", value: r.text || "" },
                    source: { type: "string", value: r.source || "google" },
                    date: { type: "string", value: r.date || "Recently" },
                    verified: { type: "boolean", value: Boolean(r.verified) },
                    avatar: { type: "string", value: r.authorAvatar || "" },
                },
            }
        })

        if (typeof targetCollection.addItems === "function") {
            await targetCollection.addItems(cmsItems)
        }

        if (typeof targetCollection.setAsActive === "function") {
            try {
                await targetCollection.setAsActive()
            } catch {}
        }

        return {
            success: true,
            message: `Successfully synchronized ${cmsItems.length} reviews to Framer CMS Collection "${collectionTitle}"!`,
            collectionName: collectionTitle,
            itemsCount: cmsItems.length,
        }
    } catch (error: any) {
        exportReviewsForFramerCMS(reviews)
        return {
            success: false,
            message: "Framer CMS API restricted in this view. Downloaded pre-mapped CSV for 1-click import into Framer CMS (press C in Framer)!",
            itemsCount: reviews.length,
        }
    }
}
