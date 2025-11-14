"use client"

import { useState } from "react"

interface AttestationResult {
  schema: string
  recipient: string
  attester: string
  score?: string
  issuedOn: string
  status: string
}

interface VerifyModalProps {
  onClose: () => void
}

export default function VerifyModal({ onClose }: VerifyModalProps) {
  const [searchInput, setSearchInput] = useState("")
  const [results, setResults] = useState<AttestationResult[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchInput.trim()) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 600))

    setResults([
      {
        schema: "Reputation Score",
        recipient: "0x742d35Cc6634C0532925a3b844Bc2e7595f42",
        attester: "0x8626f6940E2eb28930DF1c8731AD183f9F9De6ab",
        score: "95",
        issuedOn: "2024-10-27",
        status: "Valid",
      },
      {
        schema: "KYC Verified",
        recipient: "0x742d35Cc6634C0532925a3b844Bc2e7595f42",
        attester: "0x1234567890123456789012345678901234567890",
        issuedOn: "2024-10-20",
        status: "Valid",
      },
    ])
    setIsLoading(false)
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
          className="bg-background border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 border-b border-border px-6 py-4 bg-background flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Verify Attestation</h2>
              <p className="text-sm text-muted-foreground mt-1">Retrieve and confirm attestation data.</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-6">
            {/* Search Input */}
            <div className="flex gap-3 animate-slide-up">
              <input
                type="text"
                placeholder="Enter recipient address or attestation UID"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-3 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className={`px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-all duration-300 ${
                  isLoading ? "opacity-70 cursor-wait" : "hover:opacity-90"
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  "Search"
                )}
              </button>
            </div>

            {/* Results Section */}
            <div className="space-y-4 animate-slide-up">
              {!results && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Enter an address or UID to verify attestations.</p>
                </div>
              )}

              {results && results.length > 0 && (
                <div className="space-y-3">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-md border border-border bg-card hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Schema</p>
                          <p className="font-medium">{result.schema}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <p className="font-medium text-primary">{result.status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Recipient</p>
                          <p className="font-mono text-sm break-all">{result.recipient}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Attester</p>
                          <p className="font-mono text-sm break-all">{result.attester}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Issued On</p>
                          <p className="font-medium">{result.issuedOn}</p>
                        </div>
                        {result.score && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Score</p>
                            <p className="font-medium">{result.score}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results && results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No attestations found for the given query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
