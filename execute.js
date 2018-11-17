const exec = require("child_process").exec;

function _execute(commands, callback) {
  const command = commands.join(" && ");

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`There was an error: ${error.toString()}\n`);
    }

    console.log("\n    " + stdout.replace("\n", "\n    "));

    if (stderr.length > 0) {
      console.error(stdout.replace("\n", "\n    "));
    }

    callback();
  });
}

function execute(commands, rl, confirm = true) {
  console.log("\nThese are the commands we've generated: \n");

  for (let command of commands) {
    console.log(`    ${command}`);
  }

  console.log("");

  rl.question("Should we execute these commands? [Y/n] ", answer => {
    const choice = answer.length == 0 ? 'y' : answer.toLowerCase()[0];

    switch(choice) {
      case 'y':
        console.log("Executing...");
        _execute(commands, () => rl.close());
        return;

      case 'n':
        console.log("Cancelling...");
        break;

      default:
        console.log(`We couldn't understand "${answer}". Cancelling...`);
        break;
    }

    rl.close();
  });
}

module.exports = { execute };
