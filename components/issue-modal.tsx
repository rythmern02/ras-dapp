"use client"

import { useState } from "react"

interface IssueModalProps {
  onClose: () => void
}

export default function IssueModal({ onClose }: IssueModalProps) {
  const [selectedSchema, setSelectedSchema] = useState("reputation-score")
  const [recipientAddress, setRecipientAddress] = useState("0x742d35Cc6634C0532925a3b844Bc2e7595f42")
  const [score, setScore] = useState("95")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ status: string; uid: string } | null>(null)

  const schemas = [
    { id: "reputation-score", name: "Reputation Score" },
    { id: "kyc-verified", name: "KYC Verified" },
  ]

  const handleAttest = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsLoading(false)
    setResult({
      status: "Confirmed",
      uid: "0x" + Math.random().toString(16).substr(2, 40),
    })
    setTimeout(() => setResult(null), 4000)
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
              <h2 className="text-2xl font-bold">Issue New Attestation</h2>
              <p className="text-sm text-muted-foreground mt-1">Certify data on-chain for a recipient.</p>
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
            {/* Schema Selection */}
            <div className="space-y-2 animate-slide-up">
              <label className="block text-sm font-medium">Select Schema</label>
              <select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                {schemas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Address */}
            <div className="space-y-2 animate-slide-up">
              <label className="block text-sm font-medium">Recipient Address</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm"
              />
            </div>

            {/* Dynamic Fields Based on Schema */}
            {selectedSchema === "reputation-score" && (
              <div className="space-y-2 animate-slide-up">
                <label className="block text-sm font-medium">Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            )}

            {selectedSchema === "kyc-verified" && (
              <div className="space-y-2 animate-slide-up">
                <label className="block text-sm font-medium">Verification Status</label>
                <select className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                  <option>Verified</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
              </div>
            )}

            {/* Attest Button */}
            <button
              onClick={handleAttest}
              disabled={isLoading}
              className={`w-full py-3 rounded-md bg-primary text-primary-foreground font-medium transition-all duration-300 animate-slide-up ${
                isLoading ? "opacity-70 cursor-wait" : "hover:opacity-90"
              }`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                "Issue Attestation"
              )}
            </button>

            {/* Result Display */}
            {result && (
              <div className="p-6 rounded-md border border-border bg-card space-y-3 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="text-3xl animate-subtle-pulse">✓</div>
                  <span className="font-medium">Transaction Status: {result.status}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Attestation UID</p>
                  <p className="text-sm text-card-foreground break-all font-mono">{result.uid}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
