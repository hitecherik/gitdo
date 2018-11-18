const exec = require("child_process").exec;
const { question } = require("readline-sync");


function _execute(commands) {
  const command = commands.join(" && ");

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`There was an error: ${error.toString()}\n`);
    }

    console.log("\n    " + stdout.replace("\n", "\n    "));

    if (stderr.length > 0) {
      console.error(stdout.replace("\n", "\n    "));
    }
  });
}

function execute(commands, confirm = true) {
  console.log("\nThese are the commands we've generated: \n");

  for (let command of commands) {
    console.log(`    ${command}`);
  }

  console.log("");

  const answer = commands ? question("Should we execute these commands? [Y/n] ").toLowerCase() : 'y';
  const choice = answer.length == 0 ? 'y' : answer[0];

  switch(choice) {
    case 'y':
      console.log("Executing...");
      _execute(commands);
      return;

    case 'n':
      console.log("Cancelling...");
      break;

    default:
      console.log(`We couldn't understand "${answer}". Cancelling...`);
      break;
  }
}

module.exports = { execute };
