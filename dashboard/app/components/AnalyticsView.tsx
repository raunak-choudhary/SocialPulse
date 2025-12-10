"use client";
import React from 'react';
import { Bar } from 'react-chartjs-2';
import useSWR from 'swr';
import ChartConfig from './ChartConfig'; // Registers Chart.js components
import SentimentTimeline from "./sentiment/SentimentTimeline";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AnalyticsView() {
  const { data: hourly } = useSWR('/api/dashboard/charts?type=activity_hourly', fetcher);
  const { data: lang } = useSWR('/api/dashboard/charts?type=language_dist', fetcher);

  // Config for Hourly Chart
  const hourlyData = {
    labels: hourly?.labels || [],
    datasets: [
      {
        label: 'Posts',
        data: hourly?.data || [],
        backgroundColor: '#5b6fff',
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartConfig />

      {/* Hourly Engagement Pattern */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-80">
        <h3 className="text-slate-300 font-bold mb-4">Hourly Engagement Pattern</h3>
        <div className="h-64">
          <Bar data={hourlyData} options={chartOptions} />
        </div>
      </div>

      {/* Sentiment Timeline Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 col-span-1 lg:col-span-2">
        <SentimentTimeline />
      </div>
    </div>
  );
}
