"use client"

import { useState } from "react"
import { SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import { useWallet } from "@/hooks/useWallet"; // Assumes useWallet hook is available
import { ethers, Signer } from "ethers";

interface SchemaField {
  id: string
  name: string
  type: string
}

interface SchemaModalProps {
  onClose: () => void
}

// --- EAS & Rootstock Configuration ---
// Schema Registry contract address on RSK Testnet
const SCHEMA_REGISTRY_ADDRESS = '0x679c62956cd2801ababf80e9d430f18859eea2d5';

// ZERO_ADDRESS means no custom resolver is used
const RESOLVER_ADDRESS = ethers.ZeroAddress;
// ------------------------------------

export default function SchemaModal({ onClose }: SchemaModalProps) {
  const { signer, isWrongNetwork, address, connectWallet } = useWallet();
  
  const [schemaName, setSchemaName] = useState("");
  // Initial field: Must be present for the schema string logic to work
  const [fields, setFields] = useState<SchemaField[]>([{ id: "1", name: "score", type: "uint256" }]);
  const [isRevocable, setIsRevocable] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; uid: string; txHash: string } | null>(null);

  const isReadyToDeploy = signer && !isWrongNetwork && schemaName.trim() && fields.every(f => f.name.trim() && f.type.trim());

  const addField = () => {
    const newId = Math.random().toString(36).substr(2, 9)
    setFields([...fields, { id: newId, name: "", type: "uint256" }])
  }

  const removeField = (id: string) => {
    // Prevent removing the last field to ensure a valid schema structure
    if (fields.length > 1) {
      setFields(fields.filter((f) => f.id !== id))
    }
  }

  const updateField = (id: string, key: "name" | "type", value: string) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)))
  }
  
  // Helper to generate the schema string, e.g., "uint256 score, string name"
  const generateSchemaString = (): string => {
    return fields
      .map(f => `${f.type.trim()} ${f.name.trim()}`)
      .filter(s => {
        const parts = s.split(' ');
        // Ensure both type and name are non-empty and there are two parts
        return parts.length === 2 && parts[0] && parts[1];
      }) 
      .join(', ');
  }


  const handleDeploy = async () => {
    if (!isReadyToDeploy || !signer) {
        alert("Please connect your wallet and ensure you are on the Rootstock Testnet.");
        connectWallet();
        return;
    }

    const schemaString = generateSchemaString();
    if (!schemaString) {
        alert("Schema must contain at least one valid field (type and name).");
        return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // 1. Initialize Schema Registry directly with its contract address
      const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
      
      // 2. Connect the signer to the Schema Registry
      schemaRegistry.connect(signer as unknown as Signer);
      
      // 3. Register the schema on-chain
      const tx = await schemaRegistry.register({
          schema: schemaString,
          resolverAddress: RESOLVER_ADDRESS,
          revocable: isRevocable,
      });

      // Get transaction hash before waiting
      const txHash = (tx as any)?.hash || "";

      // 4. Wait for the transaction to be mined
      // According to EAS SDK, wait() returns the Schema UID string directly (not an object)
      const waitResult = await tx.wait();
      
      // 5. Extract Schema UID - wait() returns the UID string directly
      let schemaUID: string;
      
      if (typeof waitResult === 'string') {
        // wait() returns the UID string directly
        schemaUID = waitResult;
      } else if (waitResult && typeof waitResult === 'object' && 'uid' in waitResult) {
        // Fallback: if it's an object with uid property
        schemaUID = (waitResult as any).uid;
      } else {
        console.error("Unexpected schema registration response structure:", waitResult);
        throw new Error("Transaction confirmed but Schema UID format is unexpected. Check console for response structure.");
      }

      if (!schemaUID || !schemaUID.startsWith('0x')) {
        throw new Error("Invalid Schema UID format received from registration.");
      }

      setResult({
        status: "Confirmed",
        uid: schemaUID,
        txHash: txHash,
      });

    } catch (error) {
      console.error("Schema Deployment failed:", error);
      const errorMessage = (error as Error).message || "An unknown error occurred.";
      setResult({
        status: "Failed",
        uid: "",
        txHash: "",
      });
      alert(`Schema deployment failed: ${errorMessage.substring(0, 150)}...`);

    } finally {
      setIsLoading(false);
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
             {/* Wallet Status Check */}
            {!address ? (
                <div className="p-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md text-center">
                    Please connect your wallet to register a schema.
                </div>
            ) : isWrongNetwork ? (
                 <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-md text-center">
                    Wallet is connected, but you must switch to **Rootstock Testnet** (Chain ID 31).
                </div>
            ) : null}

            {/* Schema Name (Used for descriptive indexing/logging only) */}
            <div className="space-y-2 animate-slide-up">
              <label className="block text-sm font-medium">Schema Description (Internal reference)</label>
              <input
                type="text"
                placeholder="e.g., Reputation Score"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            
             {/* Schema Fields Summary (Live Preview) */}
            <div className="p-4 bg-secondary border border-border rounded-md text-sm font-mono break-all">
                <span className="text-muted-foreground">Schema String:</span> {generateSchemaString() || "No fields defined (e.g., uint256 score, string name)."}
            </div>


            {/* Schema Fields Builder */}
            <div className="space-y-4 animate-slide-up">
              <label className="block text-sm font-medium">Schema Fields (Solidity Types)</label>
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex gap-3 items-end animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-1">
                       <label className="block text-xs text-muted-foreground mb-1">Field Name</label>
                      <input
                        type="text"
                        placeholder="Field Name"
                        value={field.name}
                        onChange={(e) => updateField(field.id, "name", e.target.value.toLowerCase().replace(/\s/g, ''))}
                        className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                    <div className="flex-1">
                       <label className="block text-xs text-muted-foreground mb-1">Solidity Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, "type", e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option>uint256</option>
                        <option>uint8</option>
                        <option>address</option>
                        <option>string</option>
                        <option>bool</option>
                        <option>bytes32</option>
                      </select>
                    </div>
                    {/* Only show remove button if there is more than one field */}
                    {fields.length > 1 && (
                        <button
                          onClick={() => removeField(field.id)}
                          className="px-3 py-2 rounded-md border border-border text-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          ✕
                        </button>
                    )}
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
            
            {/* Options */}
            <div className="flex items-center gap-2 pt-4">
                 <input
                    type="checkbox"
                    id="revocable"
                    checked={isRevocable}
                    onChange={(e) => setIsRevocable(e.target.checked)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="revocable" className="text-sm font-medium">Attestations are revocable (Recommended)</label>
            </div>

            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              disabled={!isReadyToDeploy || isLoading}
              className={`w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 animate-slide-up`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  Sending Schema Transaction...
                </span>
              ) : (
                "Deploy Schema to Rootstock"
              )}
            </button>

            {/* Result Display */}
            {result && (
              <div className={`p-6 rounded-md border space-y-3 animate-slide-up ${result.status === "Confirmed" ? "bg-green-50/20 border-green-300" : "bg-red-50/20 border-red-300"}`}>
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${result.status === "Confirmed" ? 'text-green-600' : 'text-red-600'}`}>
                    {result.status === "Confirmed" ? '✓' : '✗'}
                  </div>
                  <span className="font-medium">Schema Status: {result.status}</span>
                </div>
                {result.uid && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Schema UID (Copy this for attestation!)</p>
                      <p className="text-sm text-card-foreground break-all font-mono">{result.uid}</p>
                      <a 
                          href={`https://explorer.testnet.rsk.co/ras/schema/${result.uid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline block pt-2"
                      >
                          View Schema on RSK Explorer
                      </a>
                    </div>
                )}
                 {result.txHash && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Transaction Hash</p>
                      <p className="text-sm text-card-foreground break-all font-mono">{result.txHash}</p>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}