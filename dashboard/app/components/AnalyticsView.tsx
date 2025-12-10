"use client";

import React from "react";
import useSWR from "swr";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

// -----------------------------
// TYPES
// -----------------------------
interface SentimentPoint {
  hour: number;
  positive: number;
  neutral: number;
  negative: number;
  unknown: number;
}

interface SentimentResponse {
  timeline: SentimentPoint[];
}

interface BasicDistResponse {
  labels: string[];
  data: number[];
}

// -----------------------------
// Fetcher
// -----------------------------
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ======================================================================
// MAIN COMPONENT
// ======================================================================
export default function AnalyticsView() {
  // HOURLY ENGAGEMENT
  const { data: hourly } = useSWR(
    "/api/dashboard/charts?type=activity_hourly",
    fetcher,
    { refreshInterval: 8000 }
  );

  // SENTIMENT TIMELINE
  const { data: sentiment } = useSWR<SentimentResponse>(
    "/api/dashboard/charts?type=sentiment_timeline",
    fetcher,
    { refreshInterval: 6000 }
  );

  // TOPIC DISTRIBUTION (last 24h)
  const { data: topicDist } = useSWR<BasicDistResponse>(
    "/api/dashboard/charts?type=topic_dist",
    fetcher,
    { refreshInterval: 12000 }
  );

  // LANGUAGE DISTRIBUTION (last 24h)
  const { data: langDist } = useSWR<BasicDistResponse>(
    "/api/dashboard/charts?type=language_dist",
    fetcher,
    { refreshInterval: 12000 }
  );

  // ======================================================================
  // HOURLY ENGAGEMENT DATA
  // ======================================================================
  const hourlyData = {
    labels: hourly?.labels || [],
    datasets: [
      {
        label: "Post Count",
        data: hourly?.data || [],
        backgroundColor: "rgba(96, 165, 250, 0.35)",
        borderColor: "#60A5FA",
        borderWidth: 2,
        hoverBackgroundColor: "rgba(96, 165, 250, 0.75)",
        hoverBorderColor: "#93C5FD",
        borderRadius: 6,
      },
    ],
  };

  const hourlyOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#CBD5E1",
          font: { size: 12 },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "#1e293b" },
      },
      x: {
        ticks: { color: "#94a3b8" },
        grid: { display: false },
      },
    },
    animation: {
      duration: 900,
      easing: "easeOutQuart",
    },
  };

  // ======================================================================
  // SENTIMENT TIMELINE
  // ======================================================================
  const sentimentTimeline = sentiment?.timeline || [];
  const sentimentLabels = sentimentTimeline.map((p) =>
    `${p.hour.toString().padStart(2, "0")}:00`
  );

  const sentimentData = {
    labels: sentimentLabels,
    datasets: [
      {
        label: "Positive",
        data: sentimentTimeline.map((p) => p.positive),
        borderColor: "#4ADE80",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Neutral",
        data: sentimentTimeline.map((p) => p.neutral),
        borderColor: "#60A5FA",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Negative",
        data: sentimentTimeline.map((p) => p.negative),
        borderColor: "#F87171",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Unknown",
        data: sentimentTimeline.map((p) => p.unknown),
        borderColor: "#A78BFA",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const sentimentOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#CBD5E1" } },
      tooltip: {
        enabled: true,
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "#1e293b" },
      },
    },
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
  };

  // ======================================================================
  // TOPIC DISTRIBUTION (PIE) — with REAL TOPIC NAMES
  // ======================================================================
  const topicPieData = {
    labels: topicDist?.labels || [],
    datasets: [
      {
        data: topicDist?.data || [],
        backgroundColor: [
          "#3B82F6", // blue
          "#8B5CF6", // purple
          "#EC4899", // pink
          "#F97316", // orange
          "#06B6D4", // cyan
          "#F59E0B", // amber
          "#6366F1", // indigo
          "#0EA5E9", // sky
          "#FB7185", // rose
          "#A855F7", // violet
        ],
        borderWidth: 0,
      },
    ],
  };

  const topicPieOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#CBD5E1", boxWidth: 12 },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        padding: 10,
      },
    },
    animation: {
      duration: 900,
      easing: "easeOutBack",
    },
  };

  // ======================================================================
  // LANGUAGE DISTRIBUTION (PIE)
  // ======================================================================
  const langPieData = {
    labels: langDist?.labels || [],
    datasets: [
      {
        data: langDist?.data || [],
        backgroundColor: [
          "#F97316", // orange
          "#3B82F6", // blue
          "#EC4899", // pink
          "#22C55E", // green
          "#EAB308", // yellow
          "#06B6D4", // cyan
          "#A855F7", // purple
          "#F43F5E", // rose
          "#0EA5E9", // sky
          "#FB923C", // light orange
        ],
        borderWidth: 0,
      },
    ],
  };

  const langPieOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#CBD5E1", boxWidth: 12 },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        padding: 10,
      },
    },
    animation: {
      duration: 900,
      easing: "easeOutBack",
    },
  };

  // ======================================================================
  // RENDER PAGE
  // ======================================================================
  return (
    <div className="p-6 space-y-6">
      {/* ROW 1: Hourly + Sentiment Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Engagement Pattern */}
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6 h-[500px]">
          <h3 className="text-gray-300 font-semibold mb-4">
            Hourly Engagement Pattern
          </h3>
          <div className="h-[420px]">
            <Bar data={hourlyData} options={hourlyOptions} />
          </div>
        </div>

        {/* Sentiment Timeline */}
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6 h-[500px]">
          <h3 className="text-gray-300 font-semibold mb-4">
            Sentiment Timeline
          </h3>
          <div className="h-[420px]">
            <Line data={sentimentData} options={sentimentOptions} />
          </div>
        </div>
      </div>

      {/* ROW 2: Topic & Language Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Distribution Pie */}
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6 h-[420px]">
          <h3 className="text-gray-300 font-semibold mb-4">
            Topic Distribution (Last 24 Hours)
          </h3>
          <div className="h-[340px]">
            {topicDist && topicDist.data.length > 0 ? (
              <Pie data={topicPieData} options={topicPieOptions} />
            ) : (
              <p className="text-gray-500 text-sm">
                Waiting for topic data…
              </p>
            )}
          </div>
        </div>

        {/* Language Distribution Pie */}
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6 h-[420px]">
          <h3 className="text-gray-300 font-semibold mb-4">
            Language Distribution
          </h3>
          <div className="h-[340px]">
            {langDist && langDist.data.length > 0 ? (
              <Pie data={langPieData} options={langPieOptions} />
            ) : (
              <p className="text-gray-500 text-sm">
                Waiting for language data…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
