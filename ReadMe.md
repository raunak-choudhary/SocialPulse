
## Ingestion: `bluesky_jetstream_to_kafka.py`

- Opens a WebSocket connection to Bluesky’s Jetstream endpoint and receives a continuous stream of JSON events (posts, identity updates, etc.).[1][2]
- For each incoming message:
  - Parses the JSON into a Python dict.
  - Inserts a copy into MongoDB `bigdata.raw_posts` for raw, immutable archival.
  - Sends the original dict to Kafka topic `social_posts` via a KafkaProducer (JSON-serialized to bytes), so downstream services can consume it.[3][1]
- This script is the “source” of your data pipeline.

***

## Language enrichment: `enrich_language.py`

- KafkaConsumer reads events from `social_posts`.[1][3]
- Filters only normal post “commit” events (Bluesky-specific structure: `kind="commit"`, `operation="create"`, collection `app.bsky.feed.post`).
- Extracts:
  - `author` (DID),
  - `created_at`,
  - `text` string.
- Uses `langdetect` to detect the language code of the post text.
- Builds `enriched_event = {author, created_at, text, lang}`.
- Writes a copy into MongoDB `bigdata.language`.
- Sends `enriched_event` to Kafka topic `social_posts_enriched` for later stages.

***

## Sentiment enrichment: `enrich_sentiment.py`

- KafkaConsumer reads from `social_posts_enriched`.
- For each event:s
  - Gets `text` and `lang`.
  - If `lang == "en"` and text is not empty:
    - Uses TextBlob to compute sentiment polarity (a score from negative to positive).[4][5]
    - Maps polarity into `"positive"`, `"negative"`, or `"neutral"`.
  - Otherwise marks sentiment as `"unknown"`.
- Adds `event["sentiment"] = sentiment`.
- Stores a copy in MongoDB `bigdata.sentiment`.
- Sends the enriched event to Kafka topic `social_posts_sentiment`.

***

## Entity extraction (NER): `enrich_entities.py`

- KafkaConsumer reads from `social_posts_sentiment`.
- Loads spaCy English model `en_core_web_sm` plus its NER component.[5]
- For each event:
  - If `lang == "en"` and text is non-empty:
    - Runs spaCy to detect named entities: people, organizations, locations, dates, etc.
    - Builds `entities = [{"text": ent.text, "label": ent.label_}, ...]`.
  - Otherwise uses empty list.
- Attaches `event["entities"] = entities`.
- Writes a copy into MongoDB `bigdata.entities`.
- Sends the enriched event to Kafka topic `social_posts_ner`.

***

## Topic modeling: `enrich_topics.py`

- KafkaConsumer reads from `social_posts_ner`.
- Batches English posts (e.g., 150 at a time) into `batch_texts` and `batch_events`.
- When the batch is full:
  - Uses NLTK stopwords, CountVectorizer, and TF-IDF to build a document-term matrix.[6][5]
  - Trains NMF (Non-negative Matrix Factorization) with `n_topics` components using scikit-learn.[5]
  - For each document, finds the most likely topic index and extracts the top keywords for each topic.
- For each event in the batch:
  - Adds `event["topic"] = int(topic_id)` and `event["topic_keywords"] = [list of top words]`.
  - Copies into MongoDB `bigdata.topics`.
  - Sends the enriched event to Kafka topic `social_posts_topics`.

***

## Anomaly detection: `enrich_anomaly.py`

- KafkaConsumer reads from `social_posts_topics`.
- Maintains a sliding window (e.g., 200 events) of topics and events.
- After collecting a full window:
  - Builds a pandas DataFrame of topic counts for that window.
  - Uses IsolationForest (from scikit-learn) on the topic frequencies to detect outlier topics (sudden spikes).[5]
- Flags events whose `topic` is in the anomaly set:
  - Adds `event["topic_anomaly"] = True/False`.
  - Logs alerts for anomalous topic spikes.
- Copies each event into MongoDB `bigdata.anomalies`.
- Sends events to Kafka topic `social_posts_anomaly`.

***

## Rumor detection: `enrich_rumor.py`

- KafkaConsumer reads from `social_posts_anomaly`.
- Uses HuggingFace’s zero-shot-classification pipeline with `facebook/bart-large-mnli` (or a distilled variant) to classify each text as `"rumor"` vs `"not rumor"` without custom training.[7][8][6]
  - The model was fine-tuned on MNLI and repurposed for zero-shot classification based on whether the premise (post text) entails a “rumor” label.[9][8]
- For each text:
  - Calls classifier with labels `["rumor", "not rumor"]`.
  - Sets `event["is_rumor"]` based on top label.
  - Stores `event["rumor_score"]` as the confidence score.
- Writes a copy into MongoDB `bigdata.rumor`.
- Sends to Kafka topic `social_posts_rumor`.

***

## Summarization: `enrich_summary.py`

- KafkaConsumer reads from `social_posts_rumor`.
- Loads spaCy + PyTextRank for extractive summarization.[6][5]
- For each event:
  - Runs TextRank over the text to extract the most salient phrase/sentence.
  - For short posts, summary often equals the original post.
  - Sets `event["summary"] = summary`.
- Writes a copy into MongoDB `bigdata.summaries`.
- Sends final enriched events to Kafka topic `social_posts_summary` or `social_posts_final` (depending on your latest wiring).

***

## Hate/toxicity detection: `enrich_hate.py`

- KafkaConsumer reads from `social_posts_summary`.
- Uses HuggingFace `pipeline("text-classification", model="unitary/toxic-bert", device=-1)` to classify toxicity on CPU.[8][6]
  - `unitary/toxic-bert` is a BERT-based model fine-tuned for toxic content detection.
- For each event:
  - Runs classifier on `text`.
  - Sets `event["toxic"] = True/False` based on label.
  - Records `event["toxicity_score"]` as classifier confidence.
- Writes a copy into MongoDB `bigdata.toxicity`.
- Sends to Kafka topic `social_posts_final` as the final fully enriched record.

***

## Trend aggregation: `trend_aggregator.py`

- KafkaConsumer reads from `social_posts_ner`.
- Continuously aggregates entity mentions over a moving time window (e.g., 60 seconds).
- For each event, for each entity in `event["entities"]`:
  - Increments a counter in `entity_counter["LABEL:TEXT"]`.
  - Tracks sentiment list for each entity.
- Every N seconds:
  - Prints top 10 entities with mention counts and sentiment breakdown.
  - Writes a snapshot document to MongoDB `bigdata.trend_aggregates` with:
    - `timestamp`
    - `leaderboard = [{entity, mentions, positive, total}, ...]`
- This collection powers your leaderboard visualizations in Metabase.

***

## MongoDB: Central storage

All stages write to MongoDB in parallel with Kafka streaming:

- `raw_posts`: raw Bluesky Jetstream JSON.
- `language`: basic cleaned posts with language detection.
- `sentiment`: adds sentiment labels.
- `entities`: adds named entities.
- `topics`: adds topic labels and topic keywords.
- `anomalies`: flags topic spikes.
- `rumor`: flags rumorous posts and scores.
- `summaries`: adds summaries of posts.
- `toxicity` (hate): adds toxicity flags and scores.
- `trend_aggregates`: per-minute entity leaderboards for dashboards.[10][4][5]

MongoDB’s flexible document model lets each stage append fields without strict schema, making it ideal for evolving NLP/ML pipelines.[11][5]

***

## Kafka: The streaming backbone

- Each script is either a Kafka producer, consumer, or both, connected via topics:
  - `social_posts` → `social_posts_enriched` → `social_posts_sentiment` → `social_posts_ner` → `social_posts_topics` → `social_posts_anomaly` → `social_posts_rumor` → `social_posts_summary` → `social_posts_final`.
- Kafka ensures decoupling between stages, replayability, and scalability across machines.[2][12][1]

***

## Models and libraries used

- **langdetect**: quick language detection.
- **TextBlob**: rule+lexicon-based sentiment for English.[4]
- **spaCy**: NER and text processing.[5]
- **NLTK + scikit-learn (NMF)**: topic modeling and anomaly detection (IsolationForest).[10][5]
- **PyTextRank**: extractive summarization using TextRank graph algorithm.
- **HuggingFace Transformers**:
  - `facebook/bart-large-mnli` for zero-shot rumor detection.[9][8][6]
  - `unitary/toxic-bert` for hate/toxicity detection.[8][6]
- **MongoDB**: central document store for each enrichment layer.[11][5]
- **Kafka (kafka-python)**: streaming backbone for producers/consumers.[13][3][1]

| File                          | Purpose                                                  | Kafka Topic (in)       | Kafka Topic (out)      |
| ----------------------------- | -------------------------------------------------------- | ---------------------- | ---------------------- |
| bluesky_jetstream_to_kafka.py | Streams posts from Bluesky to Kafka (social_posts)       | –                      | social_posts           |
| enrich_language.py            | Detects post language, adds"lang"tag                     | social_posts           | social_posts_enriched  |
| enrich_sentiment.py           | Runs sentiment analysis (TextBlob)                       | social_posts_enriched  | social_posts_sentiment |
| enrich_entities.py            | Extracts entities (spaCy NER)                            | social_posts_sentiment | social_posts_ner       |
| enrich_topics.py              | Clusters posts into topics, adds"topic"&"topic_keywords" | social_posts_ner       | social_posts_topics    |
| enrich_anomaly.py             | Flags topic spikes/anomalies (IsolationForest)           | social_posts_topics    | social_posts_anomaly   |
| enrich_rumor.py               | Tags posts as"is_rumor"(keyword or ML)                   | social_posts_anomaly   | social_posts_rumor     |
| enrich_summary.py             | Summarizes posts (PyTextRank/spaCy)                      | social_posts_rumor     | social_posts_summary   |
| enrich_hate.py                | Detects toxicity/hate speech (Detoxify/HF pipeline)      | social_posts_summary   | social_posts_final     |
| trend_aggregator.py           | Prints top-trending entities over rolling window         | social_posts_ner       | (console/log)          |
| trend_aggregator_to_mongo.py  | Stores trending entities/leaderboards into MongoDB       | social_posts_ner       | MongoDB (aggregator)   |


to launch
1.python bluesky_jetstream_to_kafka.py
2.python enrich_language.py
3.python enrich_sentiment.py
4.python enrich_entities.py
5.python trend_aggregator.py
6.python enrich_topics.py
7.python enrich_anomaly.py
8.python enrich_rumor.py
9.python enrich_summary.py
10.python enrich_hate.py