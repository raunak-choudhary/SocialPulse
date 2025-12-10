"use client";
import React, { useState } from "react";
import MainDashboard from "./components/MainDashboard";
import AnalyticsView from "./components/AnalyticsView";
import AdvancedView from "./components/AdvancedView";

// 1️⃣ Strongly type tab keys
type TabKey = "dashboard" | "analytics" | "advanced";
const TABS: TabKey[] = ["dashboard", "analytics", "advanced"];

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono tracking-tighter">
              Social<span className="text-blue-500">●</span>Pulse
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-out transform
                  ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/40 scale-[1.03]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 hover:shadow-md hover:shadow-slate-900/60 hover:-translate-y-[1px]"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Live pill */}
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
      </nav>

      {/* View Switcher */}
      <main className="max-w-7xl mx-auto py-6">
        {activeTab === "dashboard" && <MainDashboard />}
        {activeTab === "analytics" && <AnalyticsView />}
        {activeTab === "advanced" && <AdvancedView />}
      </main>
    </div>
  );
}
