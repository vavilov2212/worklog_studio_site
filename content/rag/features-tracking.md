## Frictionless Tracking

Start logging a deep work session with a single keystroke or click. No complex forms or project setup required — the interface stays out of the way until it's needed.

## Projects, Tasks, and Time Entries

Worklog Studio organizes work around three concepts: a Project contains Tasks, and a Time Entry records a span of time against a Project and Task (or neither, for ad-hoc tracking). Each time entry can carry a free-text comment, and each task has its own description field — so you can capture what you were actually doing or thinking at each stage of the work, not just a task title. This comment/description support is a deliberate design choice: it was the single biggest gap the author found in other time trackers before building Worklog Studio (see the "Why Worklog Studio" content for the full comparison).

## Local-First Storage

All time-tracking data is stored locally on the user's machine in a SQLite database file — there's no account, no server-side sync, and no remote storage of personal data. The app also writes timestamped local backup snapshots of that database file automatically, so a user can recover recent data if something goes wrong (see the troubleshooting content for details).
