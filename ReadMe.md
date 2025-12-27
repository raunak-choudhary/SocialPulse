# Social Pulse
**Real-Time Social Media Analytics with Streaming NLP**

Social Pulse is an end-to-end real-time big data analytics pipeline designed to process high-volume social media streams and extract actionable insights using streaming NLP, machine learning, and distributed systems.  
The system ingests live data from the Bluesky Jetstream firehose, enriches it through multiple NLP stages, and provides analytics-ready storage and dashboards for trend, risk, and sentiment monitoring.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Highlights](#key-highlights)
3. [Problem Statement](#problem-statement)
4. [System Architecture](#system-architecture)
5. [NLP and Analytics Pipeline](#nlp-and-analytics-pipeline)
6. [Technology Stack](#technology-stack)
7. [Insights Generated](#insights-generated)
8. [How to Run the Pipeline](#how-to-run-the-pipeline)
9. [Project Structure](#project-structure)
10. [Scalability and Reliability](#scalability-and-reliability)
11. [Future Improvements](#future-improvements)
12. [Team](#team)
13. [Course Context](#course-context)

---

## Project Overview
Modern social media platforms generate massive, high-velocity text streams that are impossible to analyze manually. Social Pulse continuously ingests live social media data and transforms it into structured, analytics-ready insights in real time.

The pipeline mirrors production-grade streaming systems and focuses on fault tolerance, scalability, and replay-safe processing.

---

## Key Highlights
- Processes more than 550,000 social media posts in a single run
- Real-time detection of sentiment, entities, topics, anomalies, rumors, and toxicity
- Kafka-based replay-safe streaming architecture
- Modular microservices-style pipeline where each NLP stage scales independently
- Real-time dashboards for monitoring trends and risk signals

---

## Problem Statement
The goal of Social Pulse is to continuously answer:
- What topics are people discussing?
- How do users feel about these topics?
- Which trends are emerging or behaving anomalously?
- Is harmful, toxic, or misleading content spreading?

The system is designed to handle firehose-scale data while remaining fault-tolerant and operationally reliable.

---

## System Architecture
High-level flow:

Bluesky Jetstream → Kafka → NLP Enrichment Pipeline → MongoDB → Dashboard

### Core Components
**Ingestion Layer**
- Connects to the Bluesky Jetstream WebSocket
- Assigns a stable `post_id` to every post
- Stores raw events in MongoDB
- Publishes compact events to Kafka (`social_posts`)

**Streaming Processing Layer**
- Implemented as a chain of Kafka topics
- Each stage consumes from one topic and produces to the next

**Storage Layer**
- MongoDB with separate collections per enrichment stage
- All collections keyed by `post_id` using idempotent upserts

**Visualization Layer**
- React and Next.js dashboard
- Real-time metrics, anomaly timelines, and topic summaries

---

## NLP and Analytics Pipeline
Kafka topic chain:

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

### Processing Stages
- Language Detection
- Sentiment Analysis
- Named Entity Recognition
- Topic Modeling
- Anomaly Detection
- Rumor Classification
- Summarization
- Toxicity Detection

---

## Technology Stack
**Streaming and Storage**
- Apache Kafka
- MongoDB

**NLP and Machine Learning**
- Python
- spaCy
- TextBlob
- scikit-learn
- Hugging Face Transformers
- PyTextRank

**Frontend**
- React
- Next.js

**Infrastructure**
- Docker
- Docker Compose

---

## Insights Generated
Single pipeline execution results:
- Total posts processed: 556,147
- Anomalous posts detected: 314,984
- Rumor posts flagged: 4,288
- Toxic posts flagged: 4,277

Sentiment distribution:
- Neutral: 30.6%
- Positive: 22.3%
- Negative: 9.1%
- Unknown: 38.0%

---

## How to Run the Pipeline
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

## Project Structure
| File | Description |
|-----|------------|
| bluesky_jetstream_to_kafka.py | Ingests live Bluesky data |
| enrich_language.py | Language detection |
| enrich_sentiment.py | Sentiment analysis |
| enrich_entities.py | Named entity recognition |
| enrich_topics.py | Topic modeling |
| enrich_anomaly.py | Topic spike detection |
| enrich_rumor.py | Rumor classification |
| enrich_summary.py | Text summarization |
| enrich_hate.py | Toxicity detection |
| trend_aggregator.py | Trending entities |

---

## Scalability and Reliability
- Replay-safe processing using stable `post_id`
- Horizontal scaling via Kafka consumers
- Independent scaling for computationally expensive ML stages
- MongoDB schema optimized for high write throughput

---

## Future Improvements
- Kubernetes-based autoscaling
- Improved multilingual NLP support
- Model A/B testing framework
- Real-time alerting for high-risk events

---

## Team
- **Raunak Choudhary**
- Ritvik Vasantha Kumar
- Naman Limani
- Dhruv Topiwala
- Mukesh Durga

---

## Course Context
Developed as part of the Big Data Analytics course (Fall 2025).  
The project demonstrates a production-style streaming analytics system suitable for real-world social media monitoring.
