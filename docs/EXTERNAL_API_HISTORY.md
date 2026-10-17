# Request history API

Use the owner bearer token with `PATCH /api/external/requests` to append one event:

```json
{
  "requestId": "REQUEST_ID",
  "historyEntry": {
    "id": "email-followup-unique-event-id",
    "type": "email",
    "body": "Follow-up email sent.",
    "createdAt": "2026-10-16T10:30:00-06:00"
  }
}
```

Types: `step_change`, `email`, `followup`, `other`. IDs must contain 1–100 letters, digits, underscores or hyphens. The body must contain 1–2000 characters. Timestamps are ISO 8601 with a timezone, normalized to UTC; omit `createdAt` to use server time. Any human-facing history display should format dates in long US format.

History is returned as a top-level `history` array in owner GET and PATCH responses, separately from notes. Redacted read-only access does not expose history and cannot append events. Repeating an identical event ID is safe; reusing it with different content returns 400. When retrying, preserve the event ID and timestamp. Events append in arrival order, and concurrent updates use Firestore transactions. The same PATCH may include ordinary supported request changes.

No edit, delete, or whole-array replacement operation is provided. A request can hold up to 250 history entries; further appends return 400 without discarding existing entries. Larger histories will require a separate event collection. This does not send emails or schedule follow-ups: the caller records actions performed by its app. The admin modal is unchanged.

Deploy the updated API before using this field.
