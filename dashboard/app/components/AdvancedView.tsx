"use client";

import React from "react";
import useSWR from "swr";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { TrendingUp } from "lucide-react";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

// ---------- Types ----------
interface TrendingTopic {
  topic_keywords: string[];
  count?: number; 
  mentions?: number; 
}

interface AnomalyPoint {
  hour: number;
  count: number;
}

interface AnomalyTopicFrequency {
  topic_keywords: string[];
  count: number;
}

interface EntityCount {
  entity: string;
  count: number;
}

interface HashtagCount {
  hashtag: string;
  count: number;
}

interface SummaryItem {
  summary: string;
  text: string;
  sentiment: string;
  topic_keywords: string[];
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdvancedView() {
  // TRENDING TOPICS
  const { data: trendingTopics } = useSWR<TrendingTopic[]>(
    "/api/dashboard/advanced?type=trending_topics",
    fetcher,
    { refreshInterval: 8000 }
  );

  // ANOMALY TIMELINE
  const { data: anomalyTimeline } = useSWR<AnomalyPoint[]>(
    "/api/dashboard/advanced?type=anomaly_timeline",
    fetcher,
    { refreshInterval: 8000 }
  );

  // ANOMALY FREQUENCY
  const { data: anomalyFrequency } = useSWR<AnomalyTopicFrequency[]>(
    "/api/dashboard/advanced?type=anomaly_frequency",
    fetcher,
    { refreshInterval: 8000 }
  );

  // ENTITY ANALYTICS
  const { data: entityCounts } = useSWR<EntityCount[]>(
    "/api/dashboard/advanced?type=entities_top",
    fetcher,
    { refreshInterval: 12000 }
  );

  // HASHTAG ANALYTICS
  const { data: hashtags } = useSWR<HashtagCount[]>(
    "/api/dashboard/advanced?type=hashtags_top",
    fetcher,
    { refreshInterval: 15000 }
  );

  // SUMMARY FEED
  const { data: summaries } = useSWR<SummaryItem[]>(
    "/api/dashboard/advanced?type=summaries",
    fetcher,
    { refreshInterval: 20000 }
  );

  // ---------- Chart Data Builders ----------

  const anomalyLineData = {
    labels: (anomalyTimeline ?? []).map((point) => `${point.hour}:00`),
    datasets: [
      {
        label: "Anomaly Count",
        data: (anomalyTimeline ?? []).map((point) => point.count),
        borderColor: "#f87171",
        backgroundColor: "rgba(248,113,113,0.2)",
      },
    ],
  };

  const anomalyBarData = {
    labels: (anomalyFrequency ?? []).map((topic) =>
      topic.topic_keywords.slice(0, 3).join(", ")
    ),
    datasets: [
      {
        label: "Spike Count",
        data: (anomalyFrequency ?? []).map((topic) => topic.count),
        backgroundColor: "#fb923c",
      },
    ],
  };

  const entityData = {
    labels: (entityCounts ?? []).map((entity) => entity.entity),
    datasets: [
      {
        label: "Mentions",
        data: (entityCounts ?? []).map((entity) => entity.count),
        backgroundColor: "#60a5fa",
      },
    ],
  };

  const hashtagData = {
    labels: (hashtags ?? []).map((tag) => tag.hashtag),
    datasets: [
      {
        label: "Hashtag Frequency",
        data: (hashtags ?? []).map((tag) => tag.count),
        backgroundColor: "#a855f7",
      },
    ],
  };

  // ---------- Render ----------

  return (
    <div className="space-y-10 p-6">
      {/* TRENDING TOPICS (CHIPS) */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-blue-400 font-mono font-bold uppercase text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Trending Topics
        </h2>

        <div className="flex flex-wrap gap-2">
          {(trendingTopics ?? []).map((topic, index) => {
            const mentions = topic.count ?? topic.mentions ?? 0;

            return (
                <span
                key={index}
                className="px-3 py-1 bg-slate-800 text-emerald-300 border border-slate-700 rounded-full text-xs font-mono hover:bg-slate-700 transition-colors cursor-default"
                title={`${mentions} mentions`}
                >
                {topic.topic_keywords.slice(0, 3).join(", ")}
                </span>
            );
         })}

          {!trendingTopics && (
            <p className="text-slate-500 text-xs">Loading topics...</p>
          )}
        </div>
      </section>

      {/* TOPIC ANOMALIES */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-orange-400 font-mono font-bold uppercase text-sm mb-4">
            Topic Anomaly Timeline
          </h2>
          <div className="h-[320px]">
            {anomalyTimeline ? (
              <Line data={anomalyLineData} />
            ) : (
              <p className="text-slate-500 text-sm">Loading timeline...</p>
            )}
          </div>
        </div>

        {/* Anomaly Frequency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-orange-400 font-mono font-bold uppercase text-sm mb-4">
            Anomaly Frequency by Topic
          </h2>
          <div className="h-[320px]">
            {anomalyFrequency ? (
              <Bar data={anomalyBarData} />
            ) : (
              <p className="text-slate-500 text-sm">Loading anomalies...</p>
            )}
          </div>
        </div>
      </section>

      {/* ENTITY ANALYTICS */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-purple-400 font-bold font-mono uppercase text-sm mb-4">
          Entity Analytics
        </h2>

        <div className="h-[350px]">
          {entityCounts ? (
            <Bar data={entityData} />
          ) : (
            <p className="text-slate-500">Loading entities...</p>
          )}
        </div>
      </section>

      {/* HASHTAG ANALYTICS */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-pink-400 font-bold font-mono uppercase text-sm mb-4">
          Hashtag Analytics
        </h2>

        <div className="h-[350px]">
          {hashtags ? (
            <Bar data={hashtagData} />
          ) : (
            <p className="text-slate-500">Loading hashtags...</p>
          )}
        </div>
      </section>

      {/* SUMMARY FEED */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-emerald-400 font-mono font-bold uppercase text-sm mb-4">
          Daily Summaries (Last 24 Hours)
        </h2>

        <div className="space-y-4">
          {(summaries ?? []).map((summaryItem, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <p className="text-slate-300 text-sm">{summaryItem.summary}</p>

              <div className="flex justify-between mt-2 text-xs">
                <span className="text-blue-400">
                  {summaryItem.topic_keywords.slice(0, 3).join(", ")}
                </span>
                <span
                  className={
                    summaryItem.sentiment === "positive"
                      ? "text-green-400"
                      : summaryItem.sentiment === "negative"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }
                >
                  {summaryItem.sentiment}
                </span>
              </div>
            </div>
          ))}

          {!summaries && (
            <p className="text-slate-500 text-sm">Loading summaries...</p>
          )}
        </div>
      </section>
    </div>
  );
}
