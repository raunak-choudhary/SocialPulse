import json
from kafka import KafkaConsumer, KafkaProducer
from sklearn.feature_extraction.text import CountVectorizer, TfidfTransformer
from sklearn.decomposition import NMF
import pandas as pd
import nltk
from pymongo import MongoClient
import copy

nltk.download('stopwords')
from nltk.corpus import stopwords

KAFKA_BOOTSTRAP = "localhost:9092"
CONSUME_TOPIC = "social_posts_ner"
PRODUCE_TOPIC = "social_posts_topics"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="topic-modeling",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
topics_coll = db["topics"]

print("Running real-time topic modeling...")

# **Batch posts for windowed topic modeling**
batch_texts = []
batch_events = []
WINDOW = 150  # Number of posts per topic batch

for msg in consumer:
    event = msg.value
    if event.get("lang") == "en":
        text = event.get("text", "")
        if text.strip():
            batch_texts.append(text)
            batch_events.append(event)

    if len(batch_texts) >= WINDOW:
        # Preprocess and vectorize
        stop_words = stopwords.words('english')
        count_vect = CountVectorizer(stop_words=stop_words, lowercase=True)
        X_counts = count_vect.fit_transform(batch_texts)
        tfidf_transformer = TfidfTransformer()
        X_tfidf = tfidf_transformer.fit_transform(X_counts)
        
        # Topic model (NMF is simple & interpretable)
        n_topics = 6  # You can adjust this for more/less topics
        nmf = NMF(n_components=n_topics, random_state=42)
        nmf_array = nmf.fit_transform(X_tfidf)
        topic_labels = nmf_array.argmax(axis=1)
        words = count_vect.get_feature_names_out()
        components = nmf.components_

        # Get keywords per topic
        topic_keywords = []
        for i, topic in enumerate(components):
            top_words_idx = topic.argsort()[-10:][::-1]
            topic_keywords.append([words[j] for j in top_words_idx])

        # Publish topic assignments and update batch
        for i, event in enumerate(batch_events):
            event["topic"] = int(topic_labels[i])
            event["topic_keywords"] = topic_keywords[int(topic_labels[i])]
            
            # Insert deepcopy to MongoDB so _id does not mutate original
            topics_coll.insert_one(copy.deepcopy(event))
            
            # Send only the original (no _id) to Kafka
            producer.send(PRODUCE_TOPIC, value=event)
            print(f"Topic {topic_labels[i]} | {event['text'][:60]} | Keywords: {', '.join(topic_keywords[topic_labels[i]])}")

        batch_texts.clear()
        batch_events.clear()
        producer.flush()
