class Suggestion {
  constructor(commands, commitMessage = false) {
    this.commands = commands;
    this.commitMessage = commitMessage;
  }
}

const { LanguageServiceClient } = require('@google-cloud/language');

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
      "git push"
    ], true);
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

function processSyntax(text) {
  tokenalyze_syntax(text).then(result => {
    console.log(getVerbNounPairs(result[0].tokens));
  })
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
  console.log("RUNNING func");
  switch (verb) {
    case "commit":
      return verbCommandDict[verb](nouns);
    case "push":
      return verbCommandDict[verb]();
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
  tokenalyzeSyntax(text)
    .then(results => {
      const syntax = results[0];
      const tokens = syntax.tokens;

      verbNounPairs = getVerbNounPairs(tokens);

      suggestions = [];

      for (verbId in verbNounPairs) {
        nouns = verbNounPairs[verbId].map(noun => noun.text.content);
        console.log(nouns);
        const new_suggestion = verbNounPairToCommand(tokens[verbId].text.content, nouns);
        suggestions.push(new_suggestion);
      }

      callback(reduceSuggestions(suggestions));
    })
    .catch(err => console.error(err));
}

module.exports = { Suggestion, processCommand };
