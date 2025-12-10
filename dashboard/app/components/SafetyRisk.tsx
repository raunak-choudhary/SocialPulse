"use client";
import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { ShieldAlert, AlertOctagon } from 'lucide-react';

interface Post {
  sentiment: string;
  toxicity_score: number;
  toxic: boolean;
  is_rumor: boolean;
  text: string;
}

export default function SafetyRisk({ posts }: { posts: Post[] }) {

  // 1. Rumor Gauge Data
  const rumorRatio = useMemo(() => {
    if (!posts.length) return 0;
    const rumors = posts.filter(p => p.is_rumor).length;
    return (rumors / posts.length) * 100;
  }, [posts]);

  const gaugeData = [
    { name: 'Rumors', value: rumorRatio, color: '#f97316' }, // Orange
    { name: 'Clean', value: 100 - rumorRatio, color: '#1e293b' }, // Slate-800
  ];

  // 2. Toxicity Heatmap Data
  // Mapping Sentiment Label to an X-axis integer since we don't have raw polarity score
  const scatterData = useMemo(() => {
    return posts.map((p, i) => ({
      id: i,
      x: p.sentiment === 'positive' ? 1 : p.sentiment === 'negative' ? -1 : 0, // Sentiment Axis
      y: p.toxicity_score, // Toxicity Axis (0 to 1)
      z: 1, // Point size
      text: p.text.substring(0, 30) + '...',
      isToxic: p.toxic
    }));
  }, [posts]);

  return (
    <div className="grid grid-cols-1 gap-6 h-full">
      
      {/* A. RUMOR GAUGE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-between relative overflow-hidden">
        <div className="w-full flex justify-between items-start z-10">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-orange-400" /> 
            Misinformation Level
          </h2>
        </div>
        
        <div className="h-32 w-full mt-4 relative flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="80%" // Move center down to create semi-circle
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Percentage */}
          <div className="absolute bottom-0 left-0 right-0 text-center pb-2">
            <span className="text-3xl font-bold text-white">{rumorRatio.toFixed(0)}%</span>
            <p className="text-[10px] text-slate-500 uppercase">Stream Ratio</p>
          </div>
        </div>
      </div>

      {/* B. TOXICITY SCATTER PLOT */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 min-h-[250px] flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" /> 
            Toxicity vs. Sentiment
          </h2>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Sentiment" 
                domain={[-1.2, 1.2]} 
                ticks={[-1, 0, 1]}
                tickFormatter={(val) => val === -1 ? 'Neg' : val === 1 ? 'Pos' : 'Neu'}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Toxicity" 
                domain={[0, 1]} 
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 50]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-800 border border-slate-700 p-2 rounded text-xs text-slate-200 shadow-xl">
                        <p className="font-bold mb-1">{data.isToxic ? "⚠️ TOXIC" : "Clean"}</p>
                        <p>Score: {data.y.toFixed(2)}</p>
                        <p className="italic text-slate-400 mt-1">&quot;{data.text}&quot;</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Reference line for Toxicity Threshold usually 0.5 */}
              <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="3 3" />
              
              <Scatter name="Posts" data={scatterData}>
                 {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.y > 0.5 ? '#ef4444' : '#3b82f6'} fillOpacity={0.6} />
                 ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}