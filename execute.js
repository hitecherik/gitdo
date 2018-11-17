function execute(commands, rl, confirm = true) {
  console.log("\nThese are the commands we've generated: \n");

  for (let command of commands) {
    console.log(`    ${command}`);
  }

  console.log("");

  rl.question("Should we execute these commands? [Y/n] ", answer => {
    const choice = answer.length == 0 ? 'y' : answer.toLowerCase()[0];

    switch(choice.toLowerCase()[0]) {
      case 'y':
        console.log("Executing...");
        break;

      case 'n':
        console.log("Cancelling...");
        break;

      case 'default':
        console.log(`We couldn't understand "${answer}". Cancelling...`);
        break;
    }

    rl.close();
  });
}

module.exports = { execute };
