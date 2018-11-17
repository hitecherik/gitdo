
class Suggestion {
  constructor(commands, commitMessage = false) {
    this.commands = commands;
    this.commitMessage = commitMessage;
  }
}

function processCommand(command) {
  return new Suggestion([
    "git add -A",
    "git commit -m \"$MESSAGE\""
  ], true);
}

module.exports = { Suggestion, processCommand };
