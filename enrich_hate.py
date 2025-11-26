import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from kafka import KafkaConsumer, KafkaProducer
import json
from pymongo import MongoClient
import copy
from transformers import pipeline

KAFKA_BOOTSTRAP = "localhost:9092"
CONSUME_TOPIC = "social_posts_summary"
PRODUCE_TOPIC = "social_posts_final"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="hf-hate-detector",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
hate_coll = db["toxicity"]

print("Running hate speech detection (HF pipeline)...")
classifier = pipeline("text-classification", model="unitary/toxic-bert", device=-1)
# For a lighter/faster test: model="distilbert-base-uncased-finetuned-sst-2-english" (labels: POSITIVE/NEGATIVE)

for msg in consumer:
    event = msg.value
    text = event.get("text", "")
    is_toxic = False
    toxicity_score = 0.0

    if text.strip():
        res = classifier(text)
        # Some models return label as "toxic"/"non-toxic" or "LABEL_1"/"LABEL_0"
        label = res[0]['label'].lower()
        is_toxic = "toxic" in label or "negative" in label
        toxicity_score = res[0]['score']

    event["toxic"] = is_toxic
    event["toxicity_score"] = toxicity_score

    print(f"Toxic={is_toxic} | Score={toxicity_score:.2f} | {text[:60]}")
    hate_coll.insert_one(copy.deepcopy(event))
    producer.send(PRODUCE_TOPIC, value=event)
    producer.flush()
