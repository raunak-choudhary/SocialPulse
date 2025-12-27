# Social Pulse
**Real-Time Social Media Analytics with Streaming NLP**

Social Pulse is an end-to-end **real-time big data analytics pipeline** designed to process high-volume social media streams and extract actionable insights using **streaming NLP, machine learning, and distributed systems**.  
The system ingests live data from the **Bluesky Jetstream firehose**, enriches it through multiple NLP stages, and provides analytics-ready storage and dashboards for trend, risk, and sentiment monitoring.

---

## 🚀 Key Highlights
- Processes **550,000+ social media posts** in a single run
- Detects **sentiment, entities, topics, anomalies, rumors, and toxicity** in real time
- **Kafka-based, replay-safe** architecture with idempotent writes
- Modular **microservices-style pipeline** (each NLP stage is independently scalable)
- Supports **real-time dashboards** for monitoring trends and risks

---

## 🧠 Problem Statement
Modern social media platforms generate massive, high-velocity text streams that are impossible to analyze manually.  
Social Pulse addresses this by continuously answering:
- *What* are people talking about?
- *How* do they feel about it?
- *Which topics are trending or anomalous?*
- *Is harmful or misleading content emerging?*

The system is built to be **scalable, fault-tolerant, and replay-safe**, closely mirroring real-world production data pipelines.

---

## 🏗️ System Architecture

**High-level flow:**

Bluesky Jetstream → Kafka → NLP Enrichment Pipeline → MongoDB → Dashboard

### Core Components
1. **Ingestion Layer**
   - Connects to Bluesky Jetstream via WebSocket
   - Assigns a stable `post_id` to every post
   - Stores raw events in MongoDB
   - Publishes events to Kafka (`social_posts`)

2. **Streaming NLP Pipeline (Kafka Topic Chain)**
   Each stage consumes from one topic and produces to the next:

   ```
   social_posts
     → social_posts_enriched
     → social_posts_sentiment
     → social_posts_ner
     → social_posts_topics
     → social_posts_anomaly
     → social_posts_rumor
     → social_posts_summary
     → social_posts_final
   ```

3. **Storage Layer**
   - MongoDB with **separate collections per enrichment stage**
   - All collections keyed by `post_id` using `upsert=True`

4. **Visualization Layer**
   - React / Next.js dashboard
   - Real-time stats, trend analysis, anomaly timelines, and summaries

---

## 🔍 NLP & Analytics Stages

| Stage | Description |
|------|------------|
| Language Detection | Identifies post language for downstream filtering |
| Sentiment Analysis | Positive / Neutral / Negative sentiment (English) |
| Named Entity Recognition | Extracts people, organizations, and locations |
| Topic Modeling | Groups posts into dynamic topics using NMF |
| Anomaly Detection | Detects topic spikes using Isolation Forest |
| Rumor Detection | Zero-shot classification using Transformer models |
| Summarization | Extractive summaries via TextRank |
| Toxicity Detection | Flags harmful content with toxicity scores |

---

## 🛠️ Technology Stack

**Streaming & Storage**
- Apache Kafka
- MongoDB

**NLP & ML**
- Python
- spaCy
- TextBlob
- scikit-learn (NMF, IsolationForest)
- Hugging Face Transformers
- PyTextRank

**Frontend**
- React
- Next.js

**Infrastructure**
- Docker & Docker Compose

---

## 📊 Insights Generated (Single Run)

- **Total posts processed:** 556,147
- **Anomalous posts detected:** 314,984
- **Rumor posts flagged:** 4,288
- **Toxic posts flagged:** 4,277
- **Sentiment distribution:**
  - Neutral: 30.6%
  - Positive: 22.3%
  - Negative: 9.1%
  - Unknown: 38.0%

These insights enable **trust & safety monitoring**, trend discovery, and real-time situational awareness.

---

## ▶️ How to Run the Pipeline

### 1. Start Infrastructure
```bash
docker-compose up
```

### 2. Install Dependencies
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Launch Pipeline Components
Run each service in a separate terminal (or via a launcher script):

```bash
python bluesky_jetstream_to_kafka.py
python enrich_language.py
python enrich_sentiment.py
python enrich_entities.py
python trend_aggregator.py
python enrich_topics.py
python enrich_anomaly.py
python enrich_rumor.py
python enrich_summary.py
python enrich_hate.py
```

---

## 📁 Project Structure (Key Files)

| File | Purpose |
|-----|--------|
| `bluesky_jetstream_to_kafka.py` | Ingests live Bluesky data |
| `enrich_language.py` | Language detection |
| `enrich_sentiment.py` | Sentiment analysis |
| `enrich_entities.py` | Named entity recognition |
| `enrich_topics.py` | Topic modeling |
| `enrich_anomaly.py` | Topic spike detection |
| `enrich_rumor.py` | Rumor classification |
| `enrich_summary.py` | Text summarization |
| `enrich_hate.py` | Toxicity detection |
| `trend_aggregator.py` | Trending entities |

---

## 📈 Scalability & Reliability

- **Replay-safe design** using stable `post_id`
- Kafka enables **horizontal scaling** per stage
- MongoDB collections optimized for high write throughput
- Heavy ML stages can be scaled independently

---

## 🔮 Future Improvements
- Kubernetes-based autoscaling
- Improved multilingual NLP support
- Model A/B testing framework
- Real-time alerting for high-risk events

---

## 👥 Team
- Ritvik Vasantha Kumar  
- Naman Limani  
- Dhruv Topiwala  
- **Raunak Choudhary**  
- Mukesh Durga  

---

## 📌 Course Context
Developed as part of **Big Data Analytics** coursework (Fall 2025).  
This project demonstrates a **production-style streaming analytics system** suitable for real-world social media monitoring.
