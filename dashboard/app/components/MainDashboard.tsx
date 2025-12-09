"use client";
import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MainDashboard() {
  const { data: stats } = useSWR('/api/dashboard/stats', fetcher, { refreshInterval: 5000 });
  const { data: sentiment } = useSWR('/api/dashboard/charts?type=sentiment_dist', fetcher);
  const { data: trends } = useSWR('/api/trends', fetcher); // Uses existing API
  const { data: feed } = useSWR('/api/stream', fetcher, { refreshInterval: 2000 }); // Uses existing API

  // Helper for Sentiment Bars
  const getPercent = (val: number) => sentiment?.total ? ((val / sentiment.total) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      
      {/* 1. Sentiment Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-slate-400 font-bold uppercase text-sm mb-4 tracking-wider">Sentiment Distribution</h2>
        <div className="space-y-4">
          {['positive', 'neutral', 'negative', 'unknown'].map((type) => (
            <div key={type}>
              <div className="flex justify-between text-xs mb-1 uppercase font-semibold text-slate-400">
                <span>{type}</span>
                <span>{getPercent(sentiment?.[type] || 0)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${type === 'positive' ? 'bg-emerald-400' : type === 'neutral' ? 'bg-indigo-400' : 'bg-rose-500'}`} 
                  style={{ width: `${getPercent(sentiment?.[type] || 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Trending Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-slate-400 font-bold uppercase text-sm mb-4 tracking-wider">Trending Entities</h2>
        <div className="space-y-3">
          {trends?.slice(0, 5).map((t: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-slate-200 font-mono truncate">{t.entity.split(':')[1] || t.entity}</span>
              <span className="bg-slate-800 text-blue-400 px-2 py-0.5 rounded text-xs">{t.mentions}</span>
            </div>
          ))}
          {!trends && <div className="text-slate-600 text-sm">Loading trends...</div>}
        </div>
      </section>

      {/* 3. Live Feed Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg md:col-span-2 lg:col-span-1 h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-slate-400 font-bold uppercase text-sm tracking-wider">Live Feed</h2>
          <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
        </div>
        <div className="overflow-y-auto space-y-3 pr-2 flex-1 custom-scrollbar">
          {feed?.map((post: any) => (
            <div key={post.post_id} className="text-xs border-l-2 border-slate-700 pl-3 py-1">
              <div className="flex justify-between text-slate-500 mb-0.5">
                <span>@{post.author}</span>
                {post.toxic && <span className="text-rose-500 font-bold">TOXIC</span>}
              </div>
              <p className="text-slate-300 line-clamp-2">{post.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Stats Footer (Integrated into Grid for Next.js) */}
      <div className="md:col-span-2 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <StatBox label="Total Posts" value={stats?.totalPosts || 0} />
        <StatBox label="Posts/Min" value={stats?.postsPerMin || 0} />
        <StatBox label="Active Topics" value={stats?.activeTopics || 0} />
        <StatBox label="Alerts" value={stats?.alertCount || 0} isAlert />
      </div>

    </div>
  );
}

function StatBox({ label, value, isAlert }: any) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
      <div className="text-slate-500 text-xs uppercase font-bold">{label}</div>
      <div className={`text-2xl font-mono mt-1 ${isAlert ? 'text-amber-500' : 'text-slate-200'}`}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}