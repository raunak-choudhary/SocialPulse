from kafka import KafkaConsumer, KafkaProducer
import spacy
import json
from pymongo import MongoClient
import copy

# Load spaCy English model (expand for other langs if needed)
nlp = spacy.load("en_core_web_sm")

CONSUME_TOPIC = "social_posts_sentiment"
PRODUCE_TOPIC = "social_posts_ner"
KAFKA_BOOTSTRAP = "localhost:9092"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="entity-enrich-group",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
ent_coll = db["entities"]

print("Consuming posts, extracting entities...")

for msg in consumer:
    event = msg.value
    text = event.get("text", "")

    # Only process English for demo (spaCy model is English here)
    if event.get("lang") == "en" and text.strip():
        doc = nlp(text)
        entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
    else:
        entities = []

    event["entities"] = entities

    # Insert deepcopy to MongoDB so _id does not affect original dict
    ent_coll.insert_one(copy.deepcopy(event))

    print(f"Entities found: {entities} | {text[:60]}")
    producer.send(PRODUCE_TOPIC, value=event)
    producer.flush()
