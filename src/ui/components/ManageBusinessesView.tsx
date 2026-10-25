import React, { useState } from "react"
import { ConnectedBusiness } from "../../core/types"
import { IconPlus, IconTrash } from "../icons"

interface ManageBusinessesViewProps {
    businesses: ConnectedBusiness[]
    activeBusinessId: string
    onBack: () => void
    onAddBusiness: () => void
    onUpdateBusiness: (updated: ConnectedBusiness) => void
    onDeleteBusiness: (businessId: string) => void
}

export function ManageBusinessesView({
    businesses,
    activeBusinessId,
    onBack,
    onAddBusiness,
    onUpdateBusiness,
    onDeleteBusiness,
}: ManageBusinessesViewProps) {
    const [editingBizId, setEditingBizId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editGoogle, setEditGoogle] = useState("")
    const [editTp, setEditTp] = useState("")

    const handleStartEdit = (biz: ConnectedBusiness) => {
        setEditingBizId(biz.id)
        setEditName(biz.name)
        setEditGoogle(biz.googleMapsUrl || biz.googleBusinessName || "")
        setEditTp(biz.trustpilotDomain || "")
    }

    const handleSaveEdit = (biz: ConnectedBusiness) => {
        const updated: ConnectedBusiness = {
            ...biz,
            name: editName.trim() || biz.name,
            googleBusinessName: editName.trim() || biz.googleBusinessName || biz.name,
            googleMapsUrl: editGoogle.trim() || biz.googleMapsUrl,
            trustpilotDomain: editTp.trim() || biz.trustpilotDomain,
            trustpilotEnabled: Boolean(editTp.trim()),
            lastSync: "Just now",
        }
        onUpdateBusiness(updated)
        setEditingBizId(null)
    }

    return (
        <div className="cf-manage-container">
            <button type="button" className="cf-manage-back-btn" onClick={onBack}>
                ← Back to widgets
            </button>

            <div className="cf-manage-header">
                <h2 className="cf-manage-title">Your businesses</h2>
                <p className="cf-manage-subtitle">
                    Each business has its own Google & Trustpilot profiles, reviews and widgets.
                </p>
            </div>

            <div className="cf-manage-list">
                {businesses.map((biz) => {
                    const isActive = biz.id === activeBusinessId
                    const isEditing = editingBizId === biz.id

                    return (
                        <div key={biz.id} className="cf-manage-card">
                            <div className="cf-manage-card-top">
                                <div className="cf-manage-card-info">
                                    <h4 className="cf-manage-biz-title">{biz.name}</h4>
                                    <div className="cf-manage-badges">
                                        {isActive && <span className="cf-manage-badge active">ACTIVE</span>}
                                        {biz.googleEnabled && <span className="cf-manage-badge google">GOOGLE</span>}
                                        {biz.trustpilotEnabled && <span className="cf-manage-badge trustpilot">TRUSTPILOT</span>}
                                    </div>
                                </div>

                                <div className="cf-manage-card-actions">
                                    {isEditing ? (
                                        <button
                                            type="button"
                                            className="cf-manage-btn"
                                            onClick={() => setEditingBizId(null)}
                                        >
                                            Close
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="cf-manage-btn"
                                            onClick={() => handleStartEdit(biz)}
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="cf-manage-btn danger"
                                        onClick={() => onDeleteBusiness(biz.id)}
                                        disabled={businesses.length <= 1}
                                        title={businesses.length <= 1 ? "At least one business is required" : "Remove business"}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Edit Form */}
                            {isEditing && (
                                <div className="cf-manage-edit-form">
                                    <div className="cf-manage-form-group">
                                        <label className="cf-manage-form-label">DISPLAY NAME</label>
                                        <input
                                            type="text"
                                            className="cf-manage-form-input"
                                            placeholder="e.g. Nike Paris"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    </div>

                                    <div className="cf-manage-form-group">
                                        <label className="cf-manage-form-label">GOOGLE BUSINESS (NAME OR MAPS URL)</label>
                                        <input
                                            type="text"
                                            className="cf-manage-form-input"
                                            placeholder="https://www.google.com/maps/search/?api=1&query=..."
                                            value={editGoogle}
                                            onChange={(e) => setEditGoogle(e.target.value)}
                                        />
                                    </div>

                                    <div className="cf-manage-form-group">
                                        <label className="cf-manage-form-label">TRUSTPILOT PAGE URL</label>
                                        <input
                                            type="text"
                                            className="cf-manage-form-input"
                                            placeholder="trustpilot.com/review/yourbusiness.com"
                                            value={editTp}
                                            onChange={(e) => setEditTp(e.target.value)}
                                        />
                                    </div>

                                    <div className="cf-manage-form-actions">
                                        <button
                                            type="button"
                                            className="cf-manage-save-btn"
                                            onClick={() => handleSaveEdit(biz)}
                                        >
                                            Save changes
                                        </button>
                                        <button
                                            type="button"
                                            className="cf-manage-cancel-btn"
                                            onClick={() => setEditingBizId(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Add a business dashed button */}
                <button
                    type="button"
                    className="cf-manage-add-dashed-box"
                    onClick={onAddBusiness}
                >
                    <IconPlus size={15} />
                    <span>Add a business</span>
                </button>
            </div>
        </div>
    )
}
