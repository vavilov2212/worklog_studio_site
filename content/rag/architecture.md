## Desktop App Architecture

The Worklog Studio desktop app is built with Flutter and Dart, which is what lets a single codebase ship native builds for both macOS and Windows. State management uses the BLoC pattern, with dependency injection via get_it/injectable. Data is stored locally in a SQLite database (via sqflite) — there is no backend server or cloud sync for the desktop app today. The app integrates with the OS at a few points: a system tray/menu bar presence (via window_manager and tray_manager), and a native auto-updater (Sparkle) that checks for and installs new versions.

## Landing Page & AI Chat Assistant Architecture

This landing page is a Next.js (App Router) + React + TypeScript site, styled with Tailwind CSS, deployed on Vercel. The AI chat assistant on this page is a retrieval-augmented generation (RAG) system: visitor questions are embedded and matched against a small, hand-authored knowledge base (this same set of markdown content) using cosine similarity, and Google's Gemini model generates the answer from only the matched content — it does not answer from general knowledge, and it will say it doesn't know rather than guess if nothing relevant is found.
