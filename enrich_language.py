from kafka import KafkaConsumer, KafkaProducer
import json
from langdetect import detect
from pymongo import MongoClient
import copy

CONSUME_TOPIC = "social_posts"
PRODUCE_TOPIC = "social_posts_enriched"
KAFKA_BOOTSTRAP = "localhost:9092"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="lang-enrich-group",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
lang_coll = db["language"]

print("Consuming posts, enriching with language detection...")

for msg in consumer:
    event = msg.value

    # Only process commit events for normal posts
    if (
        event.get("kind") == "commit"
        and isinstance(event.get("commit"), dict)
        and event["commit"].get("operation") == "create"
        and event["commit"].get("collection") == "app.bsky.feed.post"
        and "record" in event["commit"]
        and "text" in event["commit"]["record"]
    ):
        author = event.get("did", "unknown")
        text = event["commit"]["record"].get("text", "")
        created_at = event["commit"]["record"].get("createdAt", "unknown time")

        # Detect language
        try:
            lang = detect(text)
        except Exception:
            lang = "und"  # undetermined

        enriched_event = {
            "author": author,
            "created_at": created_at,
            "text": text,
            "lang": lang,
        }

        # Insert a deepcopy to MongoDB to avoid mutating the Kafka version
        lang_coll.insert_one(copy.deepcopy(enriched_event))

        print(f"Lang {lang} | Post: {text[:60]}")
        # Always send the original dict (never a version with _id) to Kafka
        producer.send(PRODUCE_TOPIC, value=enriched_event)
        producer.flush()
