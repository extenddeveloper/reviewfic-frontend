import React, { useState } from "react"
import { ConnectedBusiness, ReviewWidget, ReviewLayout, CardStyle } from "../../core/types"
import {
    IconPlus,
    IconSparkles,
    IconSliders,
    IconTrash,
    IconExternalLink,
    IconGoogle,
    IconTrustpilot,
    IconLayoutCarousel,
    IconLayoutGrid,
    IconLayoutMasonry,
    IconLayoutMarquee,
    IconBadge,
    IconX,
} from "../icons"

const MODAL_LAYOUT_OPTIONS: Array<{
    id: ReviewLayout
    name: string
    icon: React.ReactNode
}> = [
    { id: "carousel", name: "Carousel", icon: <IconLayoutCarousel size={14} /> },
    { id: "grid", name: "Grid", icon: <IconLayoutGrid size={14} /> },
    { id: "masonry", name: "Masonry", icon: <IconLayoutMasonry size={14} /> },
    { id: "ticker", name: "Ticker Marquee", icon: <IconLayoutMarquee size={14} /> },
    { id: "badge", name: "Rating Badge", icon: <IconBadge size={14} /> },
    { id: "spotlight", name: "Spotlight Hero", icon: <IconSparkles size={14} /> },
]

interface AllWidgetsViewProps {
    business: ConnectedBusiness
    widgets: ReviewWidget[]
    canvasWidgetCounts: Record<string, number>
    onSwitchBusiness: () => void
    onCreateWidget: (name: string, layout: ReviewLayout, cardStyle: CardStyle) => void
    onEditWidget: (widget: ReviewWidget) => void
    onInsertWidget: (widget: ReviewWidget) => void
    onDeleteWidget: (widget: { id: string; name: string }) => void
}

export function AllWidgetsView({
    business,
    widgets,
    canvasWidgetCounts,
    onSwitchBusiness,
    onCreateWidget,
    onEditWidget,
    onInsertWidget,
    onDeleteWidget,
}: AllWidgetsViewProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [newWidgetName, setNewWidgetName] = useState("")
    const [newWidgetLayout, setNewWidgetLayout] = useState<ReviewLayout>("carousel")

    const handleOpenCreate = () => {
        setNewWidgetName(`Showcase ${widgets.length + 1}`)
        setNewWidgetLayout("carousel")
        setIsCreating(true)
    }

    const handleSubmitCreate = (e: React.FormEvent) => {
        e.preventDefault()
        const name = newWidgetName.trim() || `Showcase ${widgets.length + 1}`
        onCreateWidget(name, newWidgetLayout, "elevated")
        setIsCreating(false)
    }

    return (
        <div className="cf-widgets-container">
            {/* Top Bar with Active Business & Switcher */}
            <div className="cf-widgets-biz-bar">
                <div className="cf-widgets-biz-info">
                    <span className="cf-widgets-biz-label">BUSINESS</span>
                    <span className="cf-widgets-biz-name">{business.name}</span>
                </div>
                <button
                    type="button"
                    className="cf-widgets-switch-biz-btn"
                    onClick={onSwitchBusiness}
                >
                    Switch Business →
                </button>
            </div>

            {/* Header: All Widgets */}
            <div className="cf-widgets-header">
                <div>
                    <h2 className="cf-widgets-title">All Widgets</h2>
                    <p className="cf-widgets-subtitle">
                        All review widgets configured for this business are shown here.
                    </p>
                </div>
                {widgets.length > 0 && (
                    <button
                        type="button"
                        className="cf-widgets-add-btn"
                        onClick={handleOpenCreate}
                    >
                        <IconPlus size={14} /> Add New
                    </button>
                )}
            </div>

            {/* Empty State */}
            {widgets.length === 0 ? (
                <div className="cf-widgets-empty-state">
                    <div className="cf-widgets-empty-icon-wrap">
                        <IconSparkles size={28} />
                    </div>
                    <h3 className="cf-widgets-empty-title">No review widgets yet</h3>
                    <p className="cf-widgets-empty-desc">
                        Create your first widget with custom layout and styles to insert onto your canvas.
                    </p>
                    <button
                        type="button"
                        className="cf-widgets-empty-cta-btn"
                        onClick={handleOpenCreate}
                    >
                        <IconPlus size={15} /> Add New Widget
                    </button>
                </div>
            ) : (
                <div className="cf-widgets-list">
                    {widgets.map((widget, index) => {
                        const count = canvasWidgetCounts[widget.id] || 0
                        const layoutName = widget.config.layout.charAt(0).toUpperCase() + widget.config.layout.slice(1)
                        const styleName = widget.config.cardStyle.charAt(0).toUpperCase() + widget.config.cardStyle.slice(1)

                        return (
                            <div key={widget.id} className="cf-widget-item-card">
                                <div className="cf-widget-item-info">
                                    <div className="cf-widget-item-top">
                                        <h4
                                            className="cf-widget-item-name"
                                            onClick={() => onEditWidget(widget)}
                                            title="Click to edit widget"
                                        >
                                            {widget.name || `Widget #${index + 1}`}
                                        </h4>
                                        <div className="cf-widget-item-tags">
                                            <span className="cf-widget-tag layout">{layoutName}</span>
                                            <span className="cf-widget-tag style">{styleName}</span>
                                            {count > 0 ? (
                                                <span className="cf-widget-tag canvas-live">
                                                    ● {count} on Canvas
                                                </span>
                                            ) : (
                                                <span className="cf-widget-tag canvas-draft">Draft</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="cf-widget-item-actions">
                                    <button
                                        type="button"
                                        className="cf-widget-action-btn edit"
                                        onClick={() => onEditWidget(widget)}
                                        title="Customize layout & styles"
                                    >
                                        <IconSliders size={13} />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="cf-widget-action-btn insert"
                                        onClick={() => onInsertWidget(widget)}
                                        title="Go with this design / Insert to canvas"
                                    >
                                        <IconSparkles size={13} />
                                        <span>Insert</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="cf-widget-action-btn delete"
                                        onClick={() => onDeleteWidget({ id: widget.id, name: widget.name })}
                                        title={`Delete ${widget.name}`}
                                    >
                                        <IconTrash size={13} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create New Widget Modal */}
            {isCreating && (
                <div className="cf-modal-backdrop" onClick={() => setIsCreating(false)}>
                    <div className="cf-modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleSubmitCreate}>
                            <div className="cf-modal-header">
                                <h3 className="cf-modal-title">Create New Widget</h3>
                                <button
                                    type="button"
                                    className="cf-modal-close-btn"
                                    onClick={() => setIsCreating(false)}
                                    aria-label="Close modal"
                                >
                                    <IconX size={14} />
                                </button>
                            </div>
                            <div className="cf-modal-body">
                                <div className="cf-form-group">
                                    <label className="cf-form-label">Widget Name</label>
                                    <input
                                        type="text"
                                        className="cf-form-input"
                                        placeholder="e.g. Hero Social Proof Carousel"
                                        value={newWidgetName}
                                        onChange={(e) => setNewWidgetName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="cf-form-group">
                                    <label className="cf-form-label">Widget Layout</label>
                                    <div className="cf-modal-layouts-grid">
                                        {MODAL_LAYOUT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                className={`cf-modal-layout-chip ${newWidgetLayout === opt.id ? "active" : ""}`}
                                                onClick={() => setNewWidgetLayout(opt.id)}
                                            >
                                                <span className="cf-modal-layout-icon">{opt.icon}</span>
                                                <span className="cf-modal-layout-name">{opt.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="cf-modal-footer">
                                <button
                                    type="button"
                                    className="secondary-cta cf-modal-footer-btn"
                                    onClick={() => setIsCreating(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="primary-cta cf-modal-footer-btn">
                                    Create &amp; Customize →
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
