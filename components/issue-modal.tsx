// components/IssueModal.tsx
"use client"

import { useState } from "react"
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { useWallet } from "@/hooks/useWallet";
import { ethers, Signer } from "ethers";

interface IssueModalProps {
  onClose: () => void
}

// Attestation result type from EAS SDK
interface AttestationResult {
  uid: string;
  tx?: {
    hash: string;
  };
  txHash?: string;
}

// --- EAS & Rootstock Configuration ---
const EASContractAddress = '0xc300aeeadd60999933468738c9f5d7e9c0671e1c'; // Rootstock Testnet

// --- DEFAULT VALUES FOR INPUTS ---
// Set defaults to the original reputation schema for easy testing
const DEFAULT_SCHEMA_UID = "0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe";
const DEFAULT_SCHEMA_DATA_STRING = "uint8 score";
// ------------------------------------

export default function IssueModal({ onClose }: IssueModalProps) {
  const { signer, isWrongNetwork, address, connectWallet } = useWallet();
  
  // Custom input states for Schema
  const [schemaUID, setSchemaUID] = useState(DEFAULT_SCHEMA_UID);
  const [schemaDataString, setSchemaDataString] = useState(DEFAULT_SCHEMA_DATA_STRING);

  // Data field states
  const [recipientAddress, setRecipientAddress] = useState("0x742d35Cc6634C0532925a3b844Bc2e7595f42"); // Default for testing
  const [score, setScore] = useState("95"); 

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; uid: string; txHash: string } | null>(null);

  const isReadyToAttest = signer && !isWrongNetwork;


  const handleAttest = async () => {
    if (!isReadyToAttest || !signer) {
        alert("Please connect your wallet and ensure you are on the Rootstock Testnet.");
        connectWallet();
        return;
    }
    
    // Basic validation
    if (!ethers.isAddress(recipientAddress)) {
        setResult({ status: "Failed", uid: "", txHash: "" });
        alert("Invalid recipient address.");
        return;
    }
    if (!schemaUID || !schemaUID.startsWith('0x') || schemaUID.length !== 66) {
        alert("Invalid Schema UID format.");
        return;
    }
    if (!schemaDataString) {
        alert("Schema Data String cannot be empty (e.g., 'uint8 score').");
        return;
    }


    setIsLoading(true);
    setResult(null);

    try {
      // 1. Initialize EAS and connect the signer
      const eas = new EAS(EASContractAddress);
      // Assert signer type for EAS SDK compatibility with Ethers v6
      eas.connect(signer as unknown as Signer); 
      
      let encodedData: string;
      
      // 2. Prepare the data: Dynamically create SchemaEncoder
      const schemaEncoder = new SchemaEncoder(schemaDataString);

      // NOTE: This section now assumes the user is using a schema with a single 'uint8 score' field.
      // For a truly dynamic solution, the UI would need to dynamically render fields based on schemaDataString.
      
      // *** Simplified Data Encoding (Assumes 'uint8 score' data string for this example) ***
      let dataToEncode: { name: string, value: any, type: string }[] = [];
      
      const scoreValue = parseInt(score, 10);
      if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) throw new Error("Invalid score value (must be 0-100).");
      dataToEncode = [{ name: 'score', value: scoreValue, type: 'uint8' }];
      
      encodedData = schemaEncoder.encodeData(dataToEncode);
      // *** END Simplified Data Encoding ***


      // 3. Send the attestation transaction
      const tx = await eas.attest({
        // Use the custom UID from the input
        schema: schemaUID, 
        data: {
          recipient: recipientAddress,
          // Set to 0 for no expiration
          expirationTime: BigInt(0), 
          // Set based on your schema definition
          revocable: true, 
          data: encodedData,
        },
      });

      // Get transaction hash before waiting (transaction response should have hash)
      const txHash = (tx as any)?.hash || "";

      // 4. Wait for the transaction to be mined
      const waitResult = await tx.wait();
      
      // 5. Extract UID - wait() returns the UID string directly
      let attestationUID: string;
      
      if (typeof waitResult === 'string') {
        attestationUID = waitResult;
      } else if (waitResult && typeof waitResult === 'object' && 'uid' in waitResult) {
        attestationUID = (waitResult as AttestationResult).uid;
      } else {
        console.error("Unexpected attestation response structure:", waitResult);
        throw new Error("Transaction confirmed but UID format is unexpected. Check console for response structure.");
      }

      if (!attestationUID || !attestationUID.startsWith('0x')) {
        throw new Error("Invalid UID format received from attestation.");
      }

      setResult({
        status: "Confirmed",
        uid: attestationUID,
        txHash: txHash,
      });

    } catch (error) {
      console.error("Attestation failed:", error);
      const errorMessage = (error as Error).message || "An unknown error occurred.";
      setResult({
        status: "Failed",
        uid: "",
        txHash: "",
      });
      alert(`Attestation failed: ${errorMessage.substring(0, 150)}...`);

    } finally {
      setIsLoading(false);
    }
  };


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
            {/* Wallet Status Check */}
            {!address ? (
                <div className="p-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md text-center">
                    Please connect your wallet to issue an attestation.
                </div>
            ) : isWrongNetwork ? (
                 <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-md text-center">
                    Wallet is connected, but you must switch to **Rootstock Testnet** (Chain ID 31).
                </div>
            ) : null}

            {/* --- CUSTOM SCHEMA INPUTS --- */}
            <div className="space-y-4">
              <div className="space-y-2 animate-slide-up">
                <label htmlFor="schema-uid" className="block text-sm font-medium">Schema UID (0x...)</label>
                <input
                  id="schema-uid"
                  type="text"
                  value={schemaUID}
                  onChange={(e) => setSchemaUID(e.target.value)}
                  placeholder="Paste your Schema UID (e.g., 0xf58b8b21...)"
                  className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-xs"
                />
              </div>

              <div className="space-y-2 animate-slide-up">
                <label htmlFor="schema-data-string" className="block text-sm font-medium">Schema Data String (e.g., 'uint8 score')</label>
                <input
                  id="schema-data-string"
                  type="text"
                  value={schemaDataString}
                  onChange={(e) => setSchemaDataString(e.target.value)}
                  placeholder="Enter the schema data string (e.g., 'string name, uint256 amount')"
                  className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm"
                />
              </div>
            </div>
            {/* ----------------------------- */}


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

            {/* Dynamic Fields (Simplified to only show 'score' based on assumed data string) */}
            <div className="space-y-2 animate-slide-up">
                <label className="block text-sm font-medium">Score (0-100) - Based on default data string</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

            {/* Attest Button */}
            <button
              onClick={handleAttest}
              disabled={isLoading || !isReadyToAttest}
              className={`w-full py-3 rounded-md bg-primary text-primary-foreground font-medium transition-all duration-300 animate-slide-up ${
                (isLoading || !isReadyToAttest) ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
              }`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  Processing Transaction...
                </span>
              ) : (
                "Issue Attestation"
              )}
            </button>

            {/* Result Display */}
            {result && (
              <div className={`p-6 rounded-md border border-border space-y-3 animate-slide-up ${result.status === "Confirmed" ? "bg-green-50/20 border-green-300" : "bg-red-50/20 border-red-300"}`}>
                <div className="flex items-center gap-3">
                  <div className={`text-3xl animate-subtle-pulse ${result.status === "Confirmed" ? 'text-green-600' : 'text-red-600'}`}>
                    {result.status === "Confirmed" ? '✓' : '✗'}
                  </div>
                  <span className="font-medium">Transaction Status: {result.status}</span>
                </div>
                {result.uid && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Attestation UID</p>
                      <p className="text-sm text-card-foreground break-all font-mono">{result.uid}</p>
                      <a 
                          href={`https://explorer.testnet.rootstock.io/ras/attestation/${result.uid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline block pt-2"
                      >
                          View Attestation on RSK Explorer
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

