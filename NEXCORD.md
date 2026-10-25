# Nexcord Client — development workspace

Nexcord Client is an experimental Discord Android modification based on Revenge Next.

## Goals
- Keep the original Discord appearance as the default.
- Allow optional plugins and themes to significantly change the UI.
- Add a user-controlled Nexcord Bridge integration with Nexcord Toolkit.
- Include a safe recovery path if a plugin causes problems.

## Current status
- Forked Revenge Next; dedicated development branch created.
- Upstream build workflow retained.
- No Discord application APK or Nexcord Bridge integration has been implemented yet.

## Building
Use the existing GitHub Actions Build workflow or run:

```sh
deno install --frozen
deno run build
```

Output: `dist/revenge.bundle` (not an Android APK).

## Safety and distribution
Do not put Discord account tokens, webhook URLs, or other secrets in source control.
The upstream project's licensing and attribution obligations remain in force.
Modified Discord clients are unofficial and may introduce account or compatibility risks.
