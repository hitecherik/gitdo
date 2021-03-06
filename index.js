#!/usr/bin/env node

const { processCommand } = require("./process.js");
const { execute } = require("./execute.js");
const { question } = require("readline-sync");


async function main() {
  const command = process.argv[process.argv.length - 1];
  let suggestion;

  if (command.toLowerCase().includes("git-do") || command.toLowerCase().includes("index.js")) {
    console.error("Please enter an input.");
    process.exit(1);
  }

  try {
    suggestion = await processCommand(command);
  } catch (e) {
    console.error("Error executing:");
    console.error(`    ${e}`);
    process.exit(1);
  }

  if (suggestion.commands.length == 0) {
    console.error("We couldn't recognize your command -- perhaps try being more explicit?");
    process.exit(1);
  }

  if (suggestion.commitMessage) {
    const quantified = suggestion.commitMessage == 1 ? "a small summary" : "small summaries";
    console.log(`Write ${quantified} of your changes: `);

    let messages = [];

    for (let i = 0; i < suggestion.commitMessage; i++) {
      messages.push(question(`${i + 1} > `));
    }

    execute(suggestion.commands.map(c => {
      if (c.includes("$MESSAGE")) {
        return c.replace("$MESSAGE", messages.shift());
      }

      return c;
    }));
  } else {
    execute(suggestion.commands);
  }
}

main();
