## Installing Worklog Studio

Worklog Studio downloads as a zip archive for both macOS and Windows — there's no installer/setup wizard yet (that's a planned improvement), so after downloading, the user extracts the zip and runs the app directly.

Because the app isn't notarized by Apple or signed with a Windows EV certificate, first launch can trigger OS warnings that look alarming but are expected:

- **macOS**: Gatekeeper will warn that the app is from an "unidentified developer." Right-click the app and choose "Open" (instead of double-clicking), or allow it via System Settings → Privacy & Security.
- **Windows**: SmartScreen will show a "Windows protected your PC" warning. Click "More info," then "Run anyway."

These warnings are a known rough edge, especially for non-technical users, and the author is aware of it — a proper signed installer/setup wizard is a planned future improvement, not yet built.
