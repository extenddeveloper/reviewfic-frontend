import React from "react"
import { IconTrash, IconX } from "../icons"

interface DeleteWidgetModalProps {
    widgetName: string
    canvasCount: number
    onConfirm: () => void
    onCancel: () => void
}

export function DeleteWidgetModal({
    widgetName,
    canvasCount,
    onConfirm,
    onCancel,
}: DeleteWidgetModalProps) {
    return (
        <div className="cf-modal-backdrop" onClick={onCancel}>
            <div className="cf-modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="cf-modal-header">
                    <div className="cf-modal-icon-wrap danger">
                        <IconTrash size={18} />
                    </div>
                    <button type="button" className="cf-modal-close-btn" onClick={onCancel}>
                        <IconX size={14} />
                    </button>
                </div>

                <div className="cf-modal-body">
                    <h3 className="cf-modal-title">Delete Widget</h3>
                    <p className="cf-modal-desc">
                        Are you sure you want to delete <strong className="cf-modal-highlight">"{widgetName}"</strong>? This action cannot be undone.
                    </p>
                    {canvasCount > 0 && (
                        <div className="cf-modal-canvas-warning">
                            ⚠️ This widget currently has <strong>{canvasCount}</strong> active instance(s) on your Framer canvas.
                        </div>
                    )}
                </div>

                <div className="cf-modal-footer">
                    <button type="button" className="cf-modal-btn cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="cf-modal-btn danger" onClick={onConfirm}>
                        Delete Widget
                    </button>
                </div>
            </div>
        </div>
    )
}
