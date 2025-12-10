import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface SentimentAggRow {
  _id: string;
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
  _id: number;
  count: number;
}

interface BasicDistRow {
  _id: string | number | null;
  count: number;
}

interface SentimentTimelineRow {
  _id: { hour: number };
  positive: number;
  neutral: number;
  negative: number;
  unknown: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const client = await clientPromise;
  const db = client.db('bigdata');

  try {
    /**
     * SENTIMENT DISTRIBUTION — last 10 minutes
     */
    if (type === 'sentiment_dist') {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const stats = await db
        .collection('sentiment')
        .aggregate<SentimentAggRow>([
          { $match: { created_at: { $gte: tenMinsAgo, $lte: now } } },
          { $group: { _id: '$sentiment', count: { $sum: 1 } } }
        ])
        .toArray();

      const result: SentimentChartResult = {
        positive: 0,
        negative: 0,
        neutral: 0,
        unknown: 0,
        total: 0
      };

      stats.forEach(row => {
        if (row._id in result) {
          const key = row._id as keyof SentimentChartResult;
          if (key !== 'total') result[key] = row.count;
        }
        result.total += row.count;
      });

      return NextResponse.json(result);
    }

    /**
     * HOURLY ENGAGEMENT — last 24 hours
     */
    if (type === 'activity_hourly') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const activity = await db
        .collection('language')
        .aggregate<HourlyActivityRow>([
          { $addFields: { convertedDate: { $toDate: '$created_at' } } },
          { $match: { convertedDate: { $gte: oneDayAgo } } },
          {
            $group: {
              _id: { $hour: '$convertedDate' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
        .toArray();

      const data = new Array<number>(24).fill(0);
      activity.forEach(bucket => {
        if (bucket._id >= 0 && bucket._id < 24) data[bucket._id] = bucket.count;
      });

      const labels = Array.from({ length: 24 }, (_, i) =>
        `${i.toString().padStart(2, '0')}:00`
      );

      return NextResponse.json({ labels, data });
    }

    /**
     * LANGUAGE DISTRIBUTION — last 24 hours
     */
    if (type === 'language_dist') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const langAgg = await db
        .collection('language')
        .aggregate<BasicDistRow>([
          { $match: { created_at: { $gte: oneDayAgo, $lte: now } } },
          { $group: { _id: '$lang', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
        .toArray();

      const labels = langAgg.map(row =>
        row._id === null || row._id === '' ? 'unknown' : String(row._id)
      );
      const data = langAgg.map(row => row.count);

      return NextResponse.json({ labels, data });
    }

    /**
     * TOPIC DISTRIBUTION — FIXED (uses topic_keywords, NOT Topic 1/2/3)
     */
    if (type === 'topic_dist') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const topicAgg = await db
        .collection('topics')
        .aggregate([
          { $match: { created_at: { $gte: oneDayAgo, $lte: now } } },
          {
            $group: {
              _id: '$topic',
              count: { $sum: 1 },
              keywords: { $first: '$topic_keywords' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
        .toArray();

      const labels = topicAgg.map(row => {
        if (Array.isArray(row.keywords) && row.keywords.length > 0) {
          return row.keywords.slice(0, 3).join(', ');
        }
        return `Topic ${row._id}`;
      });

      const data = topicAgg.map(row => row.count);

      return NextResponse.json({ labels, data });
    }

    /**
     * SENTIMENT TIMELINE — 24h grouped by hour
     */
    if (type === 'sentiment_timeline') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const raw = await db
        .collection('sentiment')
        .aggregate<SentimentTimelineRow>([
          { $addFields: { convertedDate: { $toDate: '$created_at' } } },
          { $match: { convertedDate: { $gt: oneDayAgo } } },
          {
            $group: {
              _id: { hour: { $hour: '$convertedDate' } },
              positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] }},
              neutral:  { $sum: { $cond: [{ $eq: ['$sentiment', 'neutral'] }, 1, 0] }},
              negative: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] }},
              unknown:  { $sum: { $cond: [{ $eq: ['$sentiment', 'unknown'] }, 1, 0] }},
            }
          },
          { $sort: { '_id.hour': 1 } }
        ])
        .toArray();

      const timeline = Array.from({ length: 24 }, (_, hr) => {
        const match = raw.find(r => r._id.hour === hr);
        return {
          hour: hr,
          positive: match?.positive ?? 0,
          neutral: match?.neutral ?? 0,
          negative: match?.negative ?? 0,
          unknown: match?.unknown ?? 0
        };
      });

      return NextResponse.json({ timeline });
    }

    return NextResponse.json([]);
  } catch (e) {
    console.error('Chart route error:', e);
    return NextResponse.json({ error: 'Chart data failed' }, { status: 500 });
  }
}
