"use client"

import { useState } from "react"
import {
  EAS,
  SchemaEncoder,
  Attestation as EASAttestation,
  ZERO_ADDRESS,
  SchemaRegistry,
} from "@ethereum-attestation-service/eas-sdk"
import { useWallet } from "@/hooks/useWallet"
import { ethers, BrowserProvider } from "ethers"

/**
 * Improved VerifyModal
 * - Robust schemaRecord handling (SDK sometimes returns Proxy/Result arrays)
 * - Defensive checks for empty/corrupt data (BUFFER_OVERRUN)
 * - Graceful fallback: show raw hex + attestation snapshot when decode fails
 * - Friendly user messages + useful console logs for debugging
 */

/** === Config (checksummed addresses) === */
const EASContractAddress = ethers.getAddress(
  "0xc300aeeadd60999933468738c9f5d7e9c0671e1c"
) // example - Rootstock Testnet

const SCHEMAREGISTRY_ADDRESS = ethers.getAddress(
  "0x679c62956cd2801ababf80e9d430f18859eea2d5"
) // example - Rootstock Testnet

/** === Types === */
interface AttestationResult {
  uid: string
  schema: string
  recipient: string
  attester: string
  decodedData: Record<string, any>
  rawDataHex?: string
  issuedOn: string
  status: "Valid" | "Revoked" | "Expired"
  // full attestation snapshot for debugging/fallback
  _attestationSnapshot?: Record<string, any>
}

interface VerifyModalProps {
  onClose: () => void
}

/** === Helpers === */
const safeGetAddress = (addr?: string) => {
  try {
    if (!addr) return addr ?? ""
    return ethers.getAddress(addr)
  } catch {
    return addr ?? ""
  }
}

const formatAddress = (addr?: string) => {
  if (!addr) return ""
  const a = String(addr)
  return a.length > 12 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a
}

const formatTimestamp = (maybeTs: bigint | number | string) => {
  try {
    const n =
      typeof maybeTs === "bigint"
        ? Number(maybeTs)
        : typeof maybeTs === "string"
        ? Number(maybeTs)
        : maybeTs
    if (!n || Number.isNaN(n)) return "Unknown"
    return new Date(n * 1000).toLocaleString()
  } catch {
    return "Unknown"
  }
}

const toDisplayValue = (v: any) => {
  if (v === null || typeof v === "undefined") return String(v)
  if (typeof v === "bigint") return v.toString()
  if (typeof v === "object") {
    if ("toString" in v && typeof v.toString === "function") return v.toString()
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}

/** Try to extract a readable schema string from whatever SchemaRegistry.getSchema returned.
 * The SDK sometimes returns an object with `.schema`, other times a Result array (proxy)
 * where the schema string is at an index (commonly index 3). We search for the first
 * reasonably long string value in the result.
 */
const extractSchemaString = (schemaRecord: any): string => {
  if (!schemaRecord) return ""
  try {
    if (typeof schemaRecord === "string") return schemaRecord
    if (typeof schemaRecord === "object") {
      if ("schema" in schemaRecord && typeof schemaRecord.schema === "string") {
        return schemaRecord.schema
      }
      // If it's a proxy/Result object (array-like)
      // convert values and find the first long-ish string
      const candidateStrings: string[] = []
      for (const k of Object.keys(schemaRecord)) {
        const v = (schemaRecord as any)[k]
        if (typeof v === "string" && v.length > 8) candidateStrings.push(v)
        // also check numeric-indexed keys
        if (!isNaN(Number(k))) {
          const vv = (schemaRecord as any)[Number(k)]
          if (typeof vv === "string" && vv.length > 8) candidateStrings.push(vv)
        }
      }
      // prefer a string containing '(' or 'uint' or 'string' (likely schema)
      const best = candidateStrings.find((s) => /uint|int|string|bytes|\(|,/.test(s))
      if (best) return best
      // fallback to first candidate
      return candidateStrings[0] ?? ""
    }
  } catch (err) {
    console.warn("extractSchemaString error", err)
  }
  return ""
}

/** Safe decode wrapper: attempts decode only if schemaString and data look valid.
 * If decode fails, throw a clear error for the UI to show fallback info.
 */
const safeDecodeWithSchema = (schemaString: string, dataHex: string) => {
  if (!schemaString || schemaString.trim().length === 0) {
    throw new Error("Missing schema string — cannot decode.")
  }
  if (!dataHex || dataHex === "0x" || dataHex.length <= 2) {
    throw new Error("Empty or missing data hex.")
  }

  const encoder = new SchemaEncoder(schemaString)
  // encoder.decodeData may throw (BUFFER_OVERRUN) if schema doesn't match data
  const decoded = encoder.decodeData(dataHex)
  // expected array of {name, value}
  if (!Array.isArray(decoded)) {
    // some encoders might return object — unify to object
    return typeof decoded === "object" ? decoded : {}
  }
  const out: Record<string, any> = {}
  decoded.forEach((d: any, i: number) => {
    const name = d?.name ?? `field_${i}`
    out[name] = toDisplayValue(d?.value)
  })
  return out
}

/** === Component === */
export default function VerifyModal({ onClose }: VerifyModalProps) {
  const { provider, address, isWrongNetwork } = useWallet()
  const [searchInput, setSearchInput] = useState("")
  const [results, setResults] = useState<AttestationResult[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isReadyToSearch = !!provider && !isWrongNetwork

  const decodeAttestation = async (
    attestation: EASAttestation,
    provider: BrowserProvider | ethers.Provider
  ): Promise<AttestationResult> => {
    if (!attestation) throw new Error("Attestation object empty")

    // SchemaRegistry init
    const schemaRegistry = new SchemaRegistry(SCHEMAREGISTRY_ADDRESS)
    try {
      schemaRegistry.connect(provider as unknown as ethers.Provider)
    } catch (err) {
      console.warn("SchemaRegistry connect warning:", err)
    }

    // Attempt to fetch schema record
    let schemaRecord: any = null
    let schemaString = ""
    try {
      schemaRecord = await schemaRegistry.getSchema({ uid: attestation.schema })
      console.debug("schemaRecord", schemaRecord)
      schemaString = extractSchemaString(schemaRecord)
      console.debug("schemaString", schemaString)
    } catch (err) {
      console.warn("Failed to fetch schema record:", err)
      // we'll continue — if no schema we show fallback info
    }

    // Try decode safely, with clear error messages on failure
    let decodedData: Record<string, any> = {}
  

    // determine status
    let status: AttestationResult["status"] = "Valid"
    try {
      const rev = (attestation as any).revocationTime
      if (rev && rev !== 0 && String(rev) !== "0") status = "Revoked"
    } catch {
      // ignore
    }

    const issuedOn = formatTimestamp((attestation as any).time ?? 0)

    return {
      uid: String(attestation.uid ?? ""),
      schema: schemaString || "",
      recipient: safeGetAddress(attestation.recipient as string),
      attester: safeGetAddress(attestation.attester as string),
      decodedData,
      rawDataHex: attestation.data,
      issuedOn,
      status,
      _attestationSnapshot: {
        // include a small normalized snapshot for debugging fallback display
        uid: String(attestation.uid ?? ""),
        recipient: String(attestation.recipient ?? ""),
        attester: String(attestation.attester ?? ""),
        time: (attestation as any).time ?? null,
        revocationTime: (attestation as any).revocationTime ?? null,
        data: attestation.data ?? null,
      },
    }
  }

  const handleSearch = async () => {
    const query = searchInput.trim()
    setErrorMessage(null)
    setResults(null)
    if (!query) {
      setErrorMessage("Please enter an Attestation UID (0x...)")
      return
    }
    if (!query.startsWith("0x") || query.length !== 66) {
      setErrorMessage("Enter a valid 66-character Attestation UID starting with 0x.")
      return
    }
    if (!isReadyToSearch || !provider) {
      setErrorMessage("Connect wallet and ensure Rootstock Testnet is selected.")
      return
    }

    setIsLoading(true)
    try {
      const eas = new EAS(EASContractAddress)
      eas.connect(provider as unknown as ethers.Provider)

      const attestation = await eas.getAttestation(query)
      console.debug("raw attestation", attestation)

      if (!attestation || (attestation as any).recipient === undefined) {
        setErrorMessage("No attestation returned for this UID.")
        return
      }

      // Check ZERO_ADDRESS for recipient
      if ((attestation as any).recipient === ZERO_ADDRESS) {
        setErrorMessage(`No attestation found with UID: ${query}`)
        return
      }

      // If data is missing early, show fallback
      if (!attestation.data || attestation.data === "0x") {
        // show a helpful message: attestation exists but no payload
        const snapshot: AttestationResult = {
          uid: String(attestation.uid ?? ""),
          schema: "",
          recipient: safeGetAddress(attestation.recipient as string),
          attester: safeGetAddress(attestation.attester as string),
          decodedData: {},
          rawDataHex: attestation.data ?? "0x",
          issuedOn: formatTimestamp((attestation as any).time ?? 0),
          status: (attestation as any).revocationTime && (attestation as any).revocationTime !== 0 ? "Revoked" : "Valid",
          _attestationSnapshot: {
            uid: String(attestation.uid ?? ""),
            recipient: String(attestation.recipient ?? ""),
            attester: String(attestation.attester ?? ""),
            time: (attestation as any).time ?? null,
            revocationTime: (attestation as any).revocationTime ?? null,
            data: attestation.data ?? null,
          },
        }
        setResults([snapshot])
        setErrorMessage("Attestation contains no data payload — shown the attestation snapshot.")
        return
      }

      // Try decode + fallback on specific decoding errors
      try {
        const formatted = await decodeAttestation(attestation as EASAttestation, provider)
        setResults([formatted])
      } catch (err: any) {
        console.error("Attestation decoding error:", err)
        // Provide useful fallback to user: show raw hex + schema string (if available)
        const rawHex = (attestation as any).data ?? "0x"
        // attempt to obtain schema string for display (non-throwing)
        let schemaString = ""
        try {
          const schemaRegistry = new SchemaRegistry(SCHEMAREGISTRY_ADDRESS)
          schemaRegistry.connect(provider as unknown as ethers.Provider)
          const schemaRecord = await schemaRegistry.getSchema({ uid: (attestation as any).schema })
          schemaString = extractSchemaString(schemaRecord)
        } catch (fetchErr) {
          console.warn("schema fetch fallback failed", fetchErr)
        }

        const fallback: AttestationResult = {
          uid: String(attestation.uid ?? query),
          schema: schemaString || "",
          recipient: safeGetAddress(attestation.recipient as string),
          attester: safeGetAddress(attestation.attester as string),
          decodedData: {}, // no decoded fields
          rawDataHex: rawHex,
          issuedOn: formatTimestamp((attestation as any).time ?? 0),
          status: (attestation as any).revocationTime && (attestation as any).revocationTime !== 0 ? "Revoked" : "Valid",
          _attestationSnapshot: {
            uid: String(attestation.uid ?? ""),
            recipient: String(attestation.recipient ?? ""),
            attester: String(attestation.attester ?? ""),
            time: (attestation as any).time ?? null,
            revocationTime: (attestation as any).revocationTime ?? null,
            data: rawHex,
          },
        }

        // user-friendly error plus fallback results
        setResults([fallback])
      }
    } catch (err: any) {
      console.error("Attestation retrieval error:", err)
      const msg = err?.message ?? String(err)
      if (msg.includes("BUFFER_OVERRUN") || msg.includes("buffer")) {
        setErrorMessage("Data corrupted: could not decode the attestation payload.")
      } else {
        setErrorMessage(`Verification failed: ${msg.substring(0, 240)}`)
      }
    } finally {
      setIsLoading(false)
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
          className="bg-background border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 border-b border-border px-6 py-4 bg-background flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Verify Attestation</h2>
              <p className="text-sm text-muted-foreground mt-1">Retrieve and confirm attestation data from Rootstock.</p>
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
            {!address ? (
              <div className="p-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md text-center">
                Connect your wallet to enable verification on Rootstock Testnet.
              </div>
            ) : isWrongNetwork ? (
              <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-md text-center">
                Please switch to <strong>Rootstock Testnet</strong> (Chain ID 31) to search.
              </div>
            ) : null}

            {/* Search */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter Attestation UID (e.g., 0x...)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-3 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !isReadyToSearch}
                className={`px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-all duration-300 ${
                  isLoading ? "opacity-70 cursor-wait" : "hover:opacity-90"
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  "Verify UID"
                )}
              </button>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-md text-center">
                {errorMessage}
              </div>
            )}

            {/* Results */}
            <div className="space-y-4">
              {!results && !isLoading && !errorMessage && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Search by Attestation UID to verify a claim.</p>
                </div>
              )}

              {results && results.length > 0 && (
                <div className="space-y-3">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-md border border-border bg-card hover:shadow-md transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <p className={`font-bold ${result.status === "Valid" ? "text-green-600" : "text-red-600"}`}>
                            {result.status}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Issued On</p>
                          <p className="font-medium text-sm">{result.issuedOn}</p>
                        </div>

                        <div className="md:col-span-2 lg:col-span-1">
                          <p className="text-xs text-muted-foreground mb-1">Schema Definition</p>
                          <p className="text-sm font-mono break-all text-primary">{result.schema || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Recipient</p>
                          <p className="font-mono text-sm break-all">{formatAddress(result.recipient)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Attester</p>
                          <p className="font-mono text-sm break-all">{formatAddress(result.attester)}</p>
                        </div>
                      </div>

                      {/* Decoded fields or raw fallback */}
                      <div className="mt-4 pt-4 border-t border-dashed border-border/50">
                        <p className="text-xs text-muted-foreground mb-2 font-bold">Decoded Data Fields</p>

                        {Object.keys(result.decodedData).length === 0 ? (
                          <>
                            <div className="text-sm text-muted-foreground mb-2">No decoded fields available.</div>

                            <div className="p-3 bg-secondary rounded-md">
                              <p className="text-xs text-muted-foreground mb-1">Raw Data (hex)</p>
                              <pre className="font-mono text-sm break-all max-h-40 overflow-auto">{result.rawDataHex}</pre>
                            </div>

                            {/* Attestation snapshot for debugging */}
                            <div className="mt-3 p-3 bg-secondary/80 rounded-md">
                              <p className="text-xs text-muted-foreground mb-1 font-bold">Attestation Snapshot</p>
                              <pre className="text-sm font-mono break-all max-h-40 overflow-auto">
                              
                              </pre>
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(result.decodedData).map(([k, v]) => (
                              <div key={k} className="p-3 bg-secondary rounded-md">
                                <p className="text-xs text-muted-foreground capitalize">{k}</p>
                                <p className="font-medium text-sm break-all">{toDisplayValue(v)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <a
                        href={`https://explorer.testnet.rsk.co/ras/attestation/${result.uid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-sm hover:underline block pt-4 text-right"
                      >
                        View Full Record on RSK Explorer
                      </a>
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
