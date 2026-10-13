import { framer } from "@framer/plugin"
import { ReviewItem } from "../core/types"

export interface CMSSyncResult {
    success: boolean
    message: string
    collectionName?: string
    itemsCount?: number
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

    try {
        // Request permissions if isAllowedTo is present
        if (typeof (framer as any).isAllowedTo === "function") {
            try {
                await (framer as any).isAllowedTo("createManagedCollection", "getManagedCollections", "getCollections", "createCollection")
            } catch {}
        }

        let targetCollection: any = null

        // 1. Try finding existing managed collection
        if (typeof (framer as any).getManagedCollections === "function") {
            try {
                const managedCollections = await (framer as any).getManagedCollections()
                targetCollection = managedCollections?.find((c: any) => c.name === collectionTitle)
            } catch {}
        }

        // 2. If not found, try creating managed collection
        if (!targetCollection && typeof (framer as any).createManagedCollection === "function") {
            try {
                targetCollection = await (framer as any).createManagedCollection(collectionTitle)
            } catch (err: any) {
                // If it already exists or rejected
                if (typeof (framer as any).getManagedCollections === "function") {
                    const managed = await (framer as any).getManagedCollections()
                    targetCollection = managed?.find((c: any) => c.name === collectionTitle)
                }
            }
        }

        // 3. Fallback to standard Collection API if managed is unavailable
        if (!targetCollection && typeof (framer as any).getCollections === "function") {
            try {
                const collections = await (framer as any).getCollections()
                targetCollection = collections?.find((c: any) => c.name === collectionTitle)
                if (!targetCollection && typeof (framer as any).createCollection === "function") {
                    targetCollection = await (framer as any).createCollection(collectionTitle)
                }
            } catch {}
        }

        if (!targetCollection) {
            return {
                success: false,
                message: "Framer CMS is not available in the current project or requires a CMS plan.",
            }
        }

        // Configure CMS schema fields if setFields is supported
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
            } catch (fieldErr) {
                // Non-fatal if fields already exist
            }
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

        // Upsert items into CMS Collection
        if (typeof targetCollection.addItems === "function") {
            await targetCollection.addItems(cmsItems)
        }

        // Set as active view in Framer UI
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
        return {
            success: false,
            message: error?.message || "Failed to synchronize reviews with Framer CMS.",
        }
    }
}
