from kafka import KafkaConsumer, KafkaProducer
import json
from textblob import TextBlob
from pymongo import MongoClient
import copy

CONSUME_TOPIC = "social_posts_enriched"
PRODUCE_TOPIC = "social_posts_sentiment"
KAFKA_BOOTSTRAP = "localhost:9092"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="sentiment-enrich-group",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
sent_coll = db["sentiment"]

print("Consuming enriched posts, adding sentiment scores...")

for msg in consumer:
    event = msg.value
    text = event.get("text", "")
    lang = event.get("lang", "und")

    # Apply sentiment only to English (for this demo)
    if lang == "en" and text.strip():
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        if polarity > 0.1:
            sentiment = "positive"
        elif polarity < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"
    else:
        sentiment = "unknown"

    event["sentiment"] = sentiment

    # Insert a deep copy into MongoDB to avoid mutating original
    sent_coll.insert_one(copy.deepcopy(event))

    print(f"Sentiment {sentiment} | Lang {lang} | {text[:60]}")
    producer.send(PRODUCE_TOPIC, value=event)
    producer.flush()
