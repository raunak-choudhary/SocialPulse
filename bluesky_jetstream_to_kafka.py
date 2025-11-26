import asyncio
import websockets
from kafka import KafkaProducer
import json
from pymongo import MongoClient
import copy

# Kafka config
KAFKA_TOPIC = 'social_posts'
KAFKA_BOOTSTRAP = 'localhost:9092'
producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# MongoDB config
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
raw_coll = db["raw_posts"]

# Jetstream endpoint (as of Nov 2025)
JETSTREAM_URI = "wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"

async def listen_to_bluesky():
    print("Connecting to Bluesky Jetstream (JSON)...")
    async with websockets.connect(JETSTREAM_URI) as websocket:
        while True:
            try:
                message = await websocket.recv()
                print("Raw from Bluesky:", message[:120])
                data = json.loads(message)
                
                # Insert a deep copy to MongoDB (to avoid mutating original)
                raw_coll.insert_one(copy.deepcopy(data))
                
                # Forward the original (without MongoDB _id) to Kafka
                producer.send(KAFKA_TOPIC, value=data)
                producer.flush()
            except Exception as e:
                print("Error:", e)

if __name__ == "__main__":
    asyncio.run(listen_to_bluesky())
