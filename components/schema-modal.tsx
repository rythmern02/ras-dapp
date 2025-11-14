"use client"

import { useState } from "react"

interface SchemaField {
  id: string
  name: string
  type: string
}

interface SchemaModalProps {
  onClose: () => void
}

export default function SchemaModal({ onClose }: SchemaModalProps) {
  const [schemaName, setSchemaName] = useState("")
  const [fields, setFields] = useState<SchemaField[]>([{ id: "1", name: "score", type: "uint256" }])
  const [deployed, setDeployed] = useState(false)
  const [schemaUID, setSchemaUID] = useState("")

  const addField = () => {
    const newId = Math.random().toString(36).substr(2, 9)
    setFields([...fields, { id: newId, name: "", type: "uint256" }])
  }

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter((f) => f.id !== id))
    }
  }

  const updateField = (id: string, key: "name" | "type", value: string) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)))
  }

  const handleDeploy = () => {
    if (schemaName.trim()) {
      setDeployed(true)
      setSchemaUID("0x" + Math.random().toString(16).substr(2, 40))
      setTimeout(() => setDeployed(false), 5000)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div
          className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 border-b border-border px-6 py-4 bg-background flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Define New Attestation Schema</h2>
              <p className="text-sm text-muted-foreground mt-1">Register the structure for your attestations on Rootstock.</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            {/* Schema Name */}
            <div className="space-y-2 animate-slide-up">
              <label className="block text-sm font-medium">Schema Name</label>
              <input
                type="text"
                placeholder="e.g., Reputation Score"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Schema Fields */}
            <div className="space-y-4 animate-slide-up">
              <label className="block text-sm font-medium">Schema Fields</label>
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex gap-3 items-end animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Field Name"
                        value={field.name}
                        onChange={(e) => updateField(field.id, "name", e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, "type", e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option>uint256</option>
                        <option>string</option>
                        <option>bool</option>
                        <option>bytes32</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeField(field.id)}
                      className="px-3 py-2 rounded-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Field Button */}
              <button
                onClick={addField}
                className="mt-4 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                + Add Field
              </button>
            </div>

            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              disabled={!schemaName.trim()}
              className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 animate-slide-up"
            >
              Deploy Schema
            </button>

            {/* Success Display */}
            {deployed && (
              <div className="p-6 rounded-md border border-border bg-card space-y-3 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✓</div>
                  <span className="font-medium">Schema Deployed Successfully</span>
                </div>
                <div className="text-sm text-muted-foreground break-all font-mono">Schema UID: {schemaUID}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
