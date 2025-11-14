"use client"

import { useState } from "react"
import SchemaModal from "@/components/schema-modal"
import IssueModal from "@/components/issue-modal"
import VerifyModal from "@/components/verify-modal"
import ConnectWallet from "@/components/ConnectWallet"

type ModalType = null | "schema" | "issue" | "verify"

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isHovered, setIsHovered] = useState<string | null>(null)

  const buttons = [
    { id: "issue", label: "Issue Attestation", variant: "primary" as const },
    { id: "schema", label: "Schema Setup", variant: "secondary" as const },
    { id: "verify", label: "Verify Attestation", variant: "secondary" as const },
  ]

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-primary">Rootstock</span>
          </div>
          <ConnectWallet />

          
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 animate-fade-in">
        <div className="max-w-2xl text-center space-y-8">
          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance leading-tight">
              Rootstock Attestations: Your Decentralized Trust Layer.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">Issue, Verify, & Leverage On-Chain Proofs</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {buttons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveModal(btn.id as ModalType)}
                onMouseEnter={() => setIsHovered(btn.id)}
                onMouseLeave={() => setIsHovered(null)}
                className={`px-8 py-3.5 rounded-md font-medium transition-all duration-300 text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-[0.98] ${
                  btn.variant === "primary"
                    ? `bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 ${
                        isHovered === btn.id ? "scale-[1.02]" : ""
                      }`
                    : `bg-card text-card-foreground border border-border hover:bg-secondary hover:border-border/80 hover:shadow-md ${
                        isHovered === btn.id ? "scale-[1.02]" : ""
                      }`
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle Background Grid Animation */}
      <div className="fixed inset-0 -z-10 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            animation: "moveGrid 20s linear infinite",
          }}
        />
      </div>

      {activeModal === "schema" && <SchemaModal onClose={() => setActiveModal(null)} />}
      {activeModal === "issue" && <IssueModal onClose={() => setActiveModal(null)} />}
      {activeModal === "verify" && <VerifyModal onClose={() => setActiveModal(null)} />}

      <style>{`
        @keyframes moveGrid {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
      `}</style>
    </main>
  )
}
