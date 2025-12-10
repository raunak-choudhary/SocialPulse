import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bigdata");

    // Last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const raw = await db.collection("sentiment").aggregate([
      { $addFields: { convertedDate: { $toDate: "$created_at" } } },

      // Only last 24 hours
      { $match: { convertedDate: { $gt: oneDayAgo } } },

      // Group by hour
      {
        $group: {
          _id: { hour: { $hour: "$convertedDate" } },
          positive: {
            $sum: { $cond: [{ $eq: ["$sentiment", "positive"] }, 1, 0] }
          },
          neutral: {
            $sum: { $cond: [{ $eq: ["$sentiment", "neutral"] }, 1, 0] }
          },
          negative: {
            $sum: { $cond: [{ $eq: ["$sentiment", "negative"] }, 1, 0] }
          },
          unknown: {
            $sum: { $cond: [{ $eq: ["$sentiment", "unknown"] }, 1, 0] }
          }
        }
      },

      { $sort: { "_id.hour": 1 } }
    ]).toArray();

    // Build 24-hour array with empty hours filled
    const timeline = Array.from({ length: 24 }, (_, hr) => {
      const match = raw.find((r) => r._id.hour === hr);
      return {
        hour: hr,
        positive: match?.positive ?? 0,
        neutral: match?.neutral ?? 0,
        negative: match?.negative ?? 0,
        unknown: match?.unknown ?? 0,
      };
    });

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("Sentiment API error:", error);
    return NextResponse.json({ error: "Sentiment timeline failed" }, { status: 500 });
  }
}
