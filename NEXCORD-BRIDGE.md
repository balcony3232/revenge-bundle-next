# Nexcord Bridge v1

The first milestone is transferring **embed drafts** from Nexcord Client to Nexcord Toolkit.

## Design
- The client defaults to Discord's stock appearance.
- Bridge is opt-in, off by default.
- The user explicitly chooses **Send to Toolkit** for each draft.
- The Toolkit previews and edits the draft before any webhook/bot send.
- No Discord user token, webhook secret, or authentication credential crosses the bridge.
- Payload uses `protocol: "nexcord.bridge"`, `version: 1`, `type: "embed.draft"`.
- The TypeScript validator lives in `src/nexcord/bridge.ts`.

## Pending implementation
1. Pick and implement an Android-supported app-to-app transport, with explicit receiving app identity and safe intent/deep-link handling.
2. Add an opt-in action to the client and receiver to the Toolkit.
3. Add consent/preview UI and tests for malformed and oversized payloads.
4. Investigate Revenge Next themes dependency and add branding to client settings without altering the default Discord UI.

**Status:** schema and validation only. No runtime transport or client UI is wired yet.
