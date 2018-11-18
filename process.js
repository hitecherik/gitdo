const { LanguageServiceClient } = require('@google-cloud/language');
const { retrieveGitignore } = require("./gitignore.js");

class Suggestion {
  constructor(commands, commitMessage = 0) {
    this.commands = commands;
    this.commitMessage = commitMessage;
  }
}

const verbCommandDict = {
  commit: function(files) {
    return new Suggestion([
      "git add " + files.join(" "),
      "git commit -m \"$MESSAGE\""
    ], 1);
  },

  push: function() {
    return new Suggestion([
      "git push -u origin $(git rev-parse --abbrev-ref HEAD)"
    ]);
  },

  setname: function(name) {
    return new Suggestion([`git config user.name "${name}"`]);
  },

  setemail: function(email) {
    return new Suggestion([`git config user.email ${email}`]);
  },

  gitignore: function() {
    return new Suggestion([`git add .gitignore`]);
  },

  sync: function() {
    return new Suggestion([`git push && git pull || { git pull --no-edit && git push }`]);
  }
}

// Creates a client
const client = new LanguageServiceClient("./apikey.json");

async function tokenalyzeSyntax(text) {
 // Prepares a document, representing the provided text
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects syntax in the document
  var tokens;

  await client.analyzeSyntax({ document })
    .then(results => {
      const syntax = results[0];
      tokens = syntax.tokens;
    })
    .catch(err => console.error(err));

  return tokens;
}

async function tokenalyzeEntities(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  var entities;

  await client
    .analyzeEntities({ document })
    .then(results => {
      entities = results[0].entities;
    })
    .catch(err => {
      console.error('ERROR:', err);
    });

  return entities;
}

function getVerbNounPairs(tokens) {
  verbNounPairs = {};
  let i = 0;
  tokens.forEach(token => {
    if (token.partOfSpeech.tag == "NOUN") {
      if (token.text.content.toLowerCase() == "push") {
        verbNounPairs[i] = [];
      }

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

async function verbNounPairToCommand(verb, nouns, text, file_mapping) {
  verb = verb.toLowerCase();
  switch (verb) {
    case "commit":
      let files = nouns;

      if (nouns.length == 0) {
        files = ["-A"];
      } else if (nouns.length == 1) {
        if (nouns[0].toLowerCase() == "everything") {
          files = ["-A"];
        }
      } else {
        let new_arr = [];
        for (var file of files) {
          if (file in file_mapping) {
            new_arr.push(file_mapping[file])
          } else {
            new_arr.push(file);
          }
        }
        files = new_arr
      }

      return verbCommandDict.commit(files);
    case "push":
      return verbCommandDict.push();
    case "set":
      suggestions = [];

      if (nounsContains(nouns, "email")) {
        var regexEmail = /[a-z0-9\._%+!$&*=^|~#%'`?{}/\-]+@([a-z0-9\-]+\.){1,}([a-z]{2,16})/;
        suggestions.push(verbCommandDict.setemail(text.match(regexEmail)[0]));
      }

      if (nounsContains(nouns, "name")) {
        const entities = await tokenalyzeEntities(text);
        suggestions.push(verbCommandDict.setname(getName(entities)));
      }

      return reduceSuggestions(suggestions);

    case "ignore":
      if (await retrieveGitignore(nouns.map(n => n.toLowerCase()))) {
        return verbCommandDict.gitignore();
      }

    default:
      if (nouns.filter(n => n.toLowerCase() == "sync").length > 0) {
        return verbCommandDict.sync();
      }
      return new Suggestion([], false);
  }
}

function nounsContains(nouns, word) {
  for (var n of nouns) {
    if (n.toLowerCase() == word) {
      return true;
    }
  }

  return false;
}

function getName(entities) {
  for (var e of entities) {
    if (e.type == "PERSON") {
      return e.name;
    }
  }

  throw "Name not found in text.";
}

function reduceSuggestions(suggestions) {
  let commands = [];
  let commitMessage = 0;

  for (let suggestion of suggestions) {
    commands = commands.concat(suggestion.commands);
    commitMessage += suggestion.commitMessage;
  }

  return new Suggestion(commands, commitMessage);
}

async function processCommand(text) {
  text = text + '.';

  let text_tokens = text.split(/,? /);

  let file_mapping = {};
  let new_text = [];
  let i = 0;
  for (t of text_tokens) {
    if (/^[\w,\s-]+\.[A-Za-z]+/.test(t)) {
      let file = "file" + i.toString();
      file_mapping[file] = t;
      i++;
      new_text.push(file);
    } else {
      new_text.push(t);
    }
  }

  text = new_text.join(" ");

  const tokens = await tokenalyzeSyntax(text);

  verbNounPairs = getVerbNounPairs(tokens);

  let suggestions = [];

  for (verbId in verbNounPairs) {
    nouns = verbNounPairs[verbId].map(noun => noun.text.content);
    const new_suggestion = await verbNounPairToCommand(tokens[verbId].text.content, nouns, text, file_mapping);
    suggestions.push(new_suggestion);
  }

  return reduceSuggestions(suggestions);
}

module.exports = { Suggestion, processCommand };
