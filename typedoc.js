/**
 * @file typedoc.js
 * @description TypeDoc configuration for Command Dashboard
 */

module.exports = {
  entryPoints: [
    "./src/types/schemas.ts",
    "./src/lib/hooks.ts",
    "./src/lib/voice.ts",
    "./src/lib/store.ts",
    "./src/lib/gemini.ts",
    "./src/lib/mongodb.ts",
    "./src/components/voice-input.tsx",
    "./src/components/global-voice-commands.tsx"
  ],
  out: "docs/api",
  tsconfig: "tsconfig.json",
  excludePrivate: true,
  excludeProtected: true,
  excludeExternals: true,
  includeVersion: true,
  name: "Command Dashboard API Documentation",
  readme: "none",
  plugin: ["typedoc-plugin-markdown"]
};
