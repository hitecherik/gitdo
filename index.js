#!/usr/bin/env node

const readline = require("readline");
const { processCommand } = require("./process.js");
const { execute } = require("./execute.js");


async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const command = process.argv[process.argv.length - 1];
  let suggestion;

  try {
    suggestion = await processCommand(command);
  } catch (e) {
    console.error("Error executing:");
    console.error(`    ${e}`);
    process.exit(1);
  }

  const suggestion = await processCommand(command);

  if (suggestion.commitMessage) {
    console.log("Write a small summary of your changes: ");

    rl.question("> ", answer => {
      execute(suggestion.commands.map(c => c.replace("$MESSAGE", answer)), rl);
    });
  } else {
    execute(suggestion.commands, rl);
  }
}

main();
