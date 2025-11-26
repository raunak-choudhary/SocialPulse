from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    "social_posts",
    bootstrap_servers=["localhost:9092"],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="jetstream-posts-group",
    enable_auto_commit=True,
)

print("Waiting for Bluesky posts from Jetstream...")

for msg in consumer:
    event = msg.value

    # Only handle normal post events (not likes, follows, deletes, etc.)
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
        print(f"Post by {author} @ {created_at}")
        print(f"Text: {text}")
        print("-" * 40)
