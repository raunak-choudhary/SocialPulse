"use client";

import useSWR from "swr";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip);

interface SentimentPoint {
  hour: number;  // 0–23
  positive: number;
  neutral: number;
  negative: number;
  unknown: number;
}

interface SentimentResponse {
  timeline: SentimentPoint[];
}

const fetcher = (url: string): Promise<SentimentResponse> =>
  fetch(url).then((res) => res.json());

export default function SentimentTimeline() {
  const { data, error } = useSWR<SentimentResponse>(
    "/api/dashboard/sentiment",
    fetcher,
    { refreshInterval: 6000 }
  );

  if (error) return <p className="text-red-400">Failed to load sentiment timeline</p>;
  if (!data) return <p className="text-gray-400">Loading timeline...</p>;

  const labels = data.timeline.map((p) =>
    `${p.hour.toString().padStart(2, "0")}:00`
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Positive",
        data: data.timeline.map((p) => p.positive),
        borderColor: "#4ADE80",
        tension: 0.3
      },
      {
        label: "Neutral",
        data: data.timeline.map((p) => p.neutral),
        borderColor: "#60A5FA",
        tension: 0.3
      },
      {
        label: "Negative",
        data: data.timeline.map((p) => p.negative),
        borderColor: "#F87171",
        tension: 0.3
      },
      {
        label: "Unknown",
        data: data.timeline.map((p) => p.unknown),
        borderColor: "#A78BFA",
        tension: 0.3
      }
    ]
  };

  return (
    <div className="bg-[#0d1117] p-4 rounded-xl border border-gray-800 mt-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-300">Sentiment Timeline (Last 24 Hours)</h2>
      <Line data={chartData} />
    </div>
  );
}
