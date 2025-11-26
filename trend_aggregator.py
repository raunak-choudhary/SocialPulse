from kafka import KafkaConsumer
import json
from collections import Counter, defaultdict
import time
from pymongo import MongoClient

TOPIC = "social_posts_ner"
KAFKA_BOOTSTRAP = "localhost:9092"

consumer = KafkaConsumer(
    TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="trend-aggregation",
    enable_auto_commit=True,
)

entity_counter = Counter()
entity_sentiment = defaultdict(list)
start_time = time.time()

# MongoDB connection
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
trend_coll = db["trend_aggregates"]

print("Tracking entity trends in real time...")

try:
    while True:
        msg = next(consumer)
        event = msg.value
        entities = event.get("entities", [])
        sentiment = event.get("sentiment", "neutral")

        for ent in entities:
            key = f"{ent['label']}:{ent['text']}"
            entity_counter[key] += 1
            entity_sentiment[key].append(sentiment)

        # Every 60 seconds, print and save leaderboard
        if time.time() - start_time > 60:
            print("\n--- Top 10 Entities (last minute) ---")
            leaderboard = []
            for key, count in entity_counter.most_common(10):
                pos = entity_sentiment[key].count('positive')
                tot = len(entity_sentiment[key])
                print(f"{key}: {count} mentions ({pos}/{tot} positive)")
                leaderboard.append({
                    "entity": key,
                    "mentions": count,
                    "positive": pos,
                    "total": tot
                })
            # Save leaderboard snapshot to MongoDB
            trend_coll.insert_one({
                "timestamp": time.time(),
                "leaderboard": leaderboard
            })

            # Reset counters
            entity_counter.clear()
            entity_sentiment.clear()
            start_time = time.time()
except KeyboardInterrupt:
    print("\nAggregator stopped.")
