import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface SentimentAggRow {
  _id: string;   // sentiment label
  count: number;
}

interface SentimentChartResult {
  positive: number;
  negative: number;
  neutral: number;
  unknown: number;
  total: number;
}

interface HourlyActivityRow {
  _id: number;   // hour 0–23
  count: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const client = await clientPromise;
  const db = client.db('bigdata');

  try {
    if (type === 'sentiment_dist') {
      // Aggregation for Pie/Bar charts (last 10 minutes)
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const now = new Date(Date.now()).toISOString();

      const stats = await db
        .collection('sentiment')
        .aggregate<SentimentAggRow>([
          { $match: { created_at: { $gte: tenMinsAgo, $lte: now } } },
          { $group: { _id: '$sentiment', count: { $sum: 1 } } },
        ])
        .toArray();

      const result: SentimentChartResult = {
        positive: 0,
        negative: 0,
        neutral: 0,
        unknown: 0,
        total: 0,
      };

      stats.forEach((row) => {
        if (row._id in result) {
          const key = row._id as keyof SentimentChartResult;
          if (key !== 'total') {
            result[key] = row.count;
          }
        }
        result.total += row.count;
      });

      return NextResponse.json(result);
    }

    if (type === 'activity_hourly') {
      // Last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const activity = await db
        .collection('language')
        .aggregate<HourlyActivityRow>([
          // Convert created_at string → Date
          {
            $addFields: {
              convertedDate: { $toDate: '$created_at' },
            },
          },
          // Only last 24 hours
          {
            $match: {
              convertedDate: { $gte: oneDayAgo },
            },
          },
          // Group by hour
          {
            $group: {
              _id: { $hour: '$convertedDate' },
              count: { $sum: 1 },
            },
          },
          // Sort by hour
          { $sort: { _id: 1 } },
        ])
        .toArray();

      // Ensure all 24 hours exist
      const data = new Array<number>(24).fill(0);

      activity.forEach((bucket) => {
        if (bucket._id >= 0 && bucket._id < 24) {
          data[bucket._id] = bucket.count;
        }
      });

      const labels = Array.from({ length: 24 }, (_, i) =>
        `${i.toString().padStart(2, '0')}:00`,
      );

      return NextResponse.json({ labels, data });
    }

    // Default / unknown type
    return NextResponse.json([]);
  } catch (e) {
    console.error('Chart route error:', e);
    return NextResponse.json({ error: 'Chart data failed' }, { status: 500 });
  }
}