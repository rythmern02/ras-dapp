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
            <span className="text-primary">Rootstock RAS</span>
            <span className="ml-3 text-sm text-muted-foreground">(Reputation & Attestation Service)</span>
          </div>
          <ConnectWallet />
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 animate-fade-in">
        <div className="max-w-3xl text-center space-y-8">
          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance leading-tight">
              Decentralized Proofs & Reputation based on RAS
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Issue, verify, and  leverage on-chain attestations  — now powering a simple reputation layer (RAS).
              Use attestations as reputation signals for gating, badges, and trust scores in your dApps.
            </p>
          </div>

          {/* Key Benefits / Use-case quickcards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-card rounded-md border border-border text-left">
              <p className="text-xs text-muted-foreground">Use-case</p>
              <h3 className="font-semibold">Reputation</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Aggregate attestations into a RAS score — gate features, reward contributors, and build trust.
              </p>
            </div>

            <div className="p-4 bg-card rounded-md border border-border text-left">
              <p className="text-xs text-muted-foreground">What it does</p>
              <h3 className="font-semibold">Badges & Scores</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Convert issued attestations into badges and lightweight reputation metrics that are verifiable on-chain.
              </p>
            </div>

            <div className="p-4 bg-card rounded-md border border-border text-left">
              <p className="text-xs text-muted-foreground">Why RAS</p>
              <h3 className="font-semibold">Composable</h3>
              <p className="text-sm text-muted-foreground mt-2">
                RAS integrates with EAS to enable trusted, portable reputation across dApps and DAOs.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
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

          {/* Small live example card showcasing RAS idea */}
          <div className="mt-6 p-4 rounded-lg border border-border bg-gradient-to-r from-transparent to-card/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sample RAS Signal</p>
                <h4 className="font-semibold">Community Builder Badge</h4>
                <p className="text-sm text-muted-foreground mt-1">Issued: 3 attestations • Score: <span className="font-mono">72</span></p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Trust</div>
                <div className="mt-1 inline-flex items-baseline gap-2">
                  <div className="px-3 py-1 rounded-full bg-green-600 text-white font-semibold">Good</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              How it works: Issue attestations (attendance, contribution, verification). RAS aggregates these signals into a lightweight reputation metric that dApps can read and act on.
            </p>
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
