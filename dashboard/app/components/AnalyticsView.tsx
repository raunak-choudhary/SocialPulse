"use client";
import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import useSWR from 'swr';
import ChartConfig from './ChartConfig'; // Registers Chart.js components

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AnalyticsView() {
  const { data: hourly } = useSWR('/api/dashboard/charts?type=activity_hourly', fetcher);
  const { data: lang } = useSWR('/api/dashboard/charts?type=language_dist', fetcher); // You need to add this case to API

  // Config for Hourly Chart
  const hourlyData = {
    labels: hourly?.labels || [],
    datasets: [{
      label: 'Posts',
      data: hourly?.data || [],
      backgroundColor: '#5b6fff',
      borderRadius: 4,
    }]
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
      
      {/* Hourly Engagement */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-80">
        <h3 className="text-slate-300 font-bold mb-4">Hourly Engagement Pattern</h3>
        <div className="h-64">
          <Bar data={hourlyData} options={chartOptions} />
        </div>
      </div>

      {/* Placeholder for Timeline (implement similarly) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-80 flex items-center justify-center">
        <span className="text-slate-500">Sentiment Timeline Chart (Add API logic)</span>
      </div>
    </div>
  );
}