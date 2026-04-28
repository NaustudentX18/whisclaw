#!/usr/bin/env node

import { parseArgs } from "util";

type CommandHandler = (args: Record<string, string>) => Promise<void>;

const commands: Record<string, CommandHandler> = {
  start: async () => {
    console.log("Starting WhisClaw gateway and mission control...");
    // Implementation would start services
  },

  stop: async () => {
    console.log("Stopping WhisClaw services...");
    // Implementation would stop services
  },

  status: async () => {
    console.log("WhisClaw Status:");
    console.log("  Gateway: running");
    console.log("  Mission Control: running");
    // Implementation would show actual status
  },

  chat: async (args) => {
    const message = args.message;
    if (!message) {
      console.error("Error: <message> argument required");
      process.exit(1);
    }
    console.log(`Sending: ${message}`);
    // Implementation would send chat message
  },

  config: async () => {
    const editor = process.env.EDITOR || "vi";
    console.log(`Opening config in ${editor}...`);
    // Implementation would open config file in editor
  },

  skills: async (args) => {
    const subcommand = args.list;
    if (subcommand === "list") {
      console.log("Installed Skills:");
      console.log("  - whisper");
      console.log("  - transcription");
      console.log("  - tts");
      // Implementation would list actual skills
    } else {
      console.log("Usage: whisclaw skills list");
    }
  },
};

async function main() {
  const commandName = process.argv[2] || "help";

  if (commandName === "help" || commandName === "--help" || commandName === "-h") {
    console.log("WhisClaw CLI");
    console.log("");
    console.log("Usage: whisclaw <command> [options]");
    console.log("");
    console.log("Commands:");
    console.log("  start          Start WhisClaw gateway and mission control");
    console.log("  stop           Stop WhisClaw services");
    console.log("  status         Show running status");
    console.log("  chat <message> Send direct CLI chat");
    console.log("  config         Open config in $EDITOR");
    console.log("  skills list    List installed skills");
    console.log("");
    console.log("Options:");
    console.log("  -h, --help     Show this help message");
    return;
  }

  const handler = commands[commandName];
  if (!handler) {
    console.error(`Unknown command: ${commandName}`);
    console.error("Run 'whisclaw --help' for usage information.");
    process.exit(1);
  }

  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      message: { type: "string", short: "m" },
      list: { type: "string", short: "l" },
    },
    allowPositionals: true,
  });

  await handler(values as Record<string, string>);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
