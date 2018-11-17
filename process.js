const { LanguageServiceClient } = require('@google-cloud/language');

let commits = 0;

class Suggestion {
  constructor(commands, commitMessage = false) {
    this.commands = commands;
    this.commitMessage = commitMessage;
  }
}

const verbCommandDict = {
  /* Basics */
  "commit" : function(files) {
    return new Suggestion([
      "git add " + files.join(" "),
      "git commit -m \"$MESSAGE\""
    ], true);
  },

  "push" : function() {
    return new Suggestion([
      "git push -u origin $(git rev-parse --abbrev-ref HEAD)"
    ], false);
  },

  /* Aliases */
  "upload": function () {
    commands = verb_command_dict.commit("-A").commands;
    commnads = commands.concat(verb_command_dict.push());

    return new Suggestion(commands, true);
  }
}

// Creates a client
const client = new LanguageServiceClient("./apikey.json");

function tokenalyzeSyntax(text) {
 // Prepares a document, representing the provided text
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects syntax in the document
  return client.analyzeSyntax({ document });
}

function getVerbNounPairs(tokens) {
  verbNounPairs = {};
  let i = 0;
  tokens.forEach(token => {
    if (token.partOfSpeech.tag == "NOUN") {
      let cur = token;
      let index;
      while (index != (index = cur.dependencyEdge.headTokenIndex)) {
        if (tokens[index].partOfSpeech.tag == "VERB") {
          if (cur.partOfSpeech.tag == "NOUN") {
            if (index in verbNounPairs) {
              verbNounPairs[index].push(token);
            } else {
              verbNounPairs[index] = [];
              verbNounPairs[index].push(token);
            }
          }
        }
        cur = tokens[index];
      }
    } else if (token.partOfSpeech.tag == "VERB") {
      if (!(i in verbNounPairs)) {
        verbNounPairs[i] = [];
      }
    }
    i++;
  });

  return verbNounPairs;
}

function verbNounPairToCommand(verb, nouns) {
  verb = verb.toLowerCase();
  switch (verb) {
    case "commit":
      if (commits++) {
        throw "Too many commits -- you're only allowed to do one per \"git do\"";
      }

      let files = nouns;

      if (nouns.length == 0) {
        files = ["-A"];
      } else if (nouns.length == 1) {
        if (nouns[0].toLowerCase() == "everything") {
          files = ["-A"];
        }
      }

      return verbCommandDict[verb](files);
    case "push":
      return verbCommandDict[verb]();
    default:
      return new sugg.Suggestion([], false);
  }
}

function reduceSuggestions(suggestions) {
  let commands = [];
  let commitMessage = false;

  for (let suggestion of suggestions) {
    commands = commands.concat(suggestion.commands);
    commitMessage = commitMessage || suggestion.commitMessage;
  }

  return new Suggestion(commands, commitMessage);
}

function processCommand(text, callback) {
  text = text + '.';
  tokenalyzeSyntax(text)
    .then(results => {
      const syntax = results[0];
      const tokens = syntax.tokens;

      verbNounPairs = getVerbNounPairs(tokens);

      suggestions = [];

      for (verbId in verbNounPairs) {
        nouns = verbNounPairs[verbId].map(noun => noun.text.content);
        const new_suggestion = verbNounPairToCommand(tokens[verbId].text.content, nouns);
        suggestions.push(new_suggestion);
      }

      callback(reduceSuggestions(suggestions));
    })
    .catch(err => {
      console.error("Error executing:");
      console.error(`    ${err}`);
      process.exit(1);
    });
}

module.exports = { Suggestion, processCommand };
