import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bigdata");
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const now = new Date(Date.now()).toISOString();

    // Parallel execution for speed
    const [totalPosts, topicsCount, alertCount] = await Promise.all([
      db.collection("language").estimatedDocumentCount(),
      db.collection("topics").countDocuments(
        { created_at: { $gte: oneDayAgo, $lte: now }, active: true }),
      db.collection("toxicity").countDocuments({
        created_at: { $gte: tenMinsAgo, $lte: now },
        $or: [{ toxic: true }, { is_rumor: true }, { topic_anomaly: true }] 
      })
    ]);

    // Calculate posts per minute (last 10 mins)
    const recentCount = await db.collection("language").countDocuments({
      created_at: { $gte: tenMinsAgo, $lte: now }
    });

    return NextResponse.json({
      totalPosts,
      postsPerMin: Math.round(recentCount / 10),
      activeTopics: topicsCount,
      alertCount
    });
  } catch (e) {
    return NextResponse.json({ error: 'Stats failed' }, { status: 500 });
  }
}