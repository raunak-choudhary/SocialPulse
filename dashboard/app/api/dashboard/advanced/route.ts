import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const client = await clientPromise;
    const db = client.db("bigdata");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // ------------------------------
    // 1. TRENDING TOPICS
    // ------------------------------
    if (type === "trending_topics") {
      const docs = await db
        .collection("topics")
        .aggregate([
          { $match: { created_at: { $gte: oneDayAgo, $lte: now } } },
          {
            $group: {
              _id: "$topic",
              count: { $sum: 1 },
              keywords: { $first: "$topic_keywords" }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
        .toArray();

      return NextResponse.json(
        docs.map((d) => ({
          topic_keywords: d.keywords || [],
          count: d.count
        }))
      );
    }

    // ------------------------------
    // 2. ANOMALY TIMELINE (HOURLY)
    // ------------------------------
    if (type === "anomaly_timeline") {
      const timeline = await db
        .collection("anomalies")
        .aggregate([
          { $addFields: { conv: { $toDate: "$created_at" } } },
          { $match: { conv: { $gte: new Date(oneDayAgo) } } },
          {
            $group: {
              _id: { hour: { $hour: "$conv" } },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.hour": 1 } }
        ])
        .toArray();

      const full = Array.from({ length: 24 }, (_, hr) => {
        const found = timeline.find((t) => t._id.hour === hr);
        return { hour: hr, count: found?.count ?? 0 };
      });

      return NextResponse.json(full);
    }

    // ------------------------------
    // 3. ANOMALY FREQUENCY BY TOPIC
    // ------------------------------
    if (type === "anomaly_frequency") {
      const freq = await db
        .collection("anomalies")
        .aggregate([
          { $match: { created_at: { $gte: oneDayAgo, $lte: now } } },
          {
            $group: {
              _id: "$topic",
              count: { $sum: 1 },
              keywords: { $first: "$topic_keywords" }
            }
          },
          { $sort: { count: -1 } }
        ])
        .toArray();

      return NextResponse.json(
        freq.map((f) => ({
          topic_keywords: f.keywords || [],
          count: f.count
        }))
      );
    }

    // ------------------------------
    // 4. ENTITY ANALYTICS (TOP 10)
    // ------------------------------
    if (type === "entities_top") {
      const entities = await db
        .collection("entities")
        .aggregate([
          { $match: { created_at: { $gte: oneDayAgo, $lte: now } } },
          { $unwind: "$entities" },
          {$match: {
            "entities.label": { $in: ["PERSON", "ORG", "GPE", "EVENT", "PRODUCT", "WORK_OF_ART"] }
          }},
          {
            $group: {
              _id: "$entities.text",
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
        .toArray();

      return NextResponse.json(
        entities.map((e) => ({
          entity: e._id,
          count: e.count
        }))
      );
    }

    // ------------------------------
    // 5. HASHTAG ANALYTICS (TOP 20)
    // ------------------------------
    if (type === "hashtags_top") {
      const tags = await db
        .collection("hashtags")
        .aggregate([
          { $match: { created_at: { $gte: oneDayAgo, $lte: now } } },
          { $unwind: "$hashtags" },
          {
            $group: {
              _id: "$hashtags",
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 20 }
        ])
        .toArray();

      return NextResponse.json(
        tags.map((t) => ({
          hashtag: t._id,
          count: t.count
        }))
      );
    }

    // ------------------------------
    // 6. SUMMARY FEED
    // ------------------------------
    if (type === "summaries") {
      const list = await db
        .collection("summaries")
        .find({
          created_at: { $gte: oneDayAgo, $lte: now }
        })
        .sort({ created_at: -1 })
        .limit(30)
        .toArray();

      return NextResponse.json(
        list.map((s) => ({
          summary: s.summary,
          text: s.text,
          sentiment: s.sentiment,
          topic_keywords: s.topic_keywords?.slice(0, 3) || []
        }))
      );
    }

    return NextResponse.json({ error: "Invalid type" });
  } catch (err) {
    console.error("ADVANCED API ERROR:", err);
    return NextResponse.json(
      { error: "Advanced API failed" },
      { status: 500 }
    );
  }
}
