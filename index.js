#!/usr/bin/env node

const readline = require("readline");
const { processCommand } = require("./process.js");
const { execute } = require("./execute.js");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const command = process.argv[process.argv.length - 1];
const suggestion = processCommand(command);

if (suggestion.commitMessage) {
  console.log("Write a small summary of your changes: ")
  rl.question("> ", answer => {
    execute(suggestion.commands.map(c => c.replace("$MESSAGE", answer)), rl);
  });
}
