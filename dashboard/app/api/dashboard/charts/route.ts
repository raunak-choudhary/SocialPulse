import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const client = await clientPromise;
  const db = client.db("bigdata");

  try {
    if (type === 'sentiment_dist') {
      // Aggregation for Pie/Bar charts
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const now = new Date(Date.now()).toISOString();
      const stats = await db.collection("sentiment")
      .aggregate([
        { $match: { created_at: { $gte: tenMinsAgo, $lte: now } } },
        { $group: { _id: "$sentiment", count: { $sum: 1 } } }
      ]).toArray();
      
      const result = { positive: 0, negative: 0, neutral: 0, unknown:0, total: 0 };
      stats.forEach((s: any) => {
        if (s._id in result) result[s._id as keyof typeof result] = s.count;
        result.total += s.count;
      });
      return NextResponse.json(result);
    }

    if (type === 'activity_hourly') {
      // 1. Calculate 24 hours ago
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const activity = await db.collection("toxicity").aggregate([
        // STEP 1: Convert the string "created_at" to a real Date object
        {
          $addFields: {
            convertedDate: { $toDate: "$created_at" }
          }
        },
        // STEP 2: Filter for posts in the last 24 hours
        { 
          $match: { 
            convertedDate: { $gte: oneDayAgo } 
          } 
        },
        // STEP 3: Group by Hour (0-23)
        { 
          $group: { 
            _id: { $hour: "$convertedDate" }, 
            count: { $sum: 1 } 
          } 
        },
        // STEP 4: Sort by hour 0-23
        { $sort: { _id: 1 } }
      ]).toArray();

      // Format for Chart.js (Ensure all 24 hours exist, fill missing with 0)
      const data = new Array(24).fill(0);
      activity.forEach((a: any) => {
        if (a._id >= 0 && a._id < 24) {
          data[a._id] = a.count;
        }
      });
      
      // Generate labels "00:00", "01:00", ... "23:00"
      const labels = Array.from({length: 24}, (_, i) => 
        `${i.toString().padStart(2, '0')}:00`
      );

      return NextResponse.json({ labels, data });
    }
    
    // Add other cases (sentiment_timeline, etc.) as needed based on the same pattern
    return NextResponse.json([]);
  } catch (e) {
    return NextResponse.json({ error: 'Chart data failed' }, { status: 500 });
  }
}