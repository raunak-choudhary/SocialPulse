"use client";
import React, { useState } from 'react';
import MainDashboard from './components/MainDashboard';
import AnalyticsView from './components/AnalyticsView';
// Import AdvancedView similarly...

export default function Page() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'advanced'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      
      {/* Navigation Bar (matches index.html) */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
             <h1 className="text-xl font-bold font-mono tracking-tighter">
               Social<span className="text-blue-500">●</span>Pulse
             </h1>
          </div>

          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {['dashboard', 'analytics', 'advanced'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            LIVE
          </div>
        </div>
      </nav>

      {/* View Switcher */}
      <main className="max-w-7xl mx-auto py-6">
        {activeTab === 'dashboard' && <MainDashboard />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'advanced' && (
          <div className="p-10 text-center text-slate-500">
            Advanced Data Explorer (Table View) Component Goes Here
          </div>
        )}
      </main>

    </div>
  );
}