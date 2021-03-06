const { LanguageServiceClient } = require('@google-cloud/language');
const { retrieveGitignore } = require("./gitignore.js");
const fs = require('fs');

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
    return new Suggestion([`git push -u origin $(git rev-parse --abbrev-ref HEAD) && git pull || { git pull --no-edit && git push -u origin $(git rev-parse --abbrev-ref HEAD); }`]);
  },

  pull: function() {
    return new Suggestion(["git pull"]);
  },

  log: function() {
    return new Suggestion(["git log"]);
  },

  diff: function() {
    return new Suggestion(["git diff"]);
  },

  status: function() {
    return new Suggestion(["git status"]);
  },

  stash: function() {
    return new Suggestion(["git stash"]);
  },

  createbranch: function(name) {
    return new Suggestion([`git checkout -b ${name}`]);
  },

  switchbranch: function(name) {
    return new Suggestion(["git fetch --all", `git checkout ${name}`]);
  },

  initrepo: function() {
    return new Suggestion(["git init"]);
  },

  merge: function(branchname) {
    return new Suggestion([`git merge ${branchname}`]);
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

const automl = require('@google-cloud/automl');

const automl_client = new automl.v1beta1.PredictionServiceClient({
  // optional auth parameters.
});

const formattedName = automl_client.modelPath('gitdo-222813', 'us-central1', 'TCN2677408050797652826');

async function predict(text) {
  var results;

  const request = {
    name: formattedName,
    payload: {'textSnippet': {'content': text, 'mimeType': 'text/plain' }},
  };

  await automl_client.predict(request)
    .then(responses => {
      results = responses[0];
    })
    .catch(err => {
      console.error(err);
    });


  return results;
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
          // if (cur.partOfSpeech.tag == "NOUN") {
            if (index in verbNounPairs) {
              verbNounPairs[index].push(token);
            } else {
              verbNounPairs[index] = [];
              verbNounPairs[index].push(token);
            }
          // }
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

let predicted = {};

function getPredictedSuggestion(prediction) {
  let commands = [];
  for (p of prediction.payload) {
    if (predicted[p.displayName] != true && p.classification.score > 0.7) {
      predicted[p.displayName] = true;
      switch (p.displayName) {
        case "log": {
          commands.push(verbCommandDict.log());
          break;
        }
        case "pull": {
          commands.push(verbCommandDict.pull());
          break;
        }
        case "status": {
          commands.push(verbCommandDict.status());
          break;
        }
        case "push": {
          commands.push(verbCommandDict.push());
          break;
        }
        case "stash": {
          commands.push(verbCommandDict.stash());
          break;
        }
        case "diff": {
          commands.push(verbCommandDict.diff());
          break;
        }
      }
    }
  }

  return reduceSuggestions(commands);
}

async function verbNounPairToCommand(verb, nouns, text, file_mapping) {
  verb = verb.toLowerCase();

  switch (verb) {
    case "add" :
      // continues to commit
    case "commit":
      let files = nouns;
      let addedAllImages = false;

      if (nouns.length == 0) {
        files = ["-A"];
      } else if (nouns.indexOf("everything") > -1 || nouns.indexOf("all") > -1) {
        files = ["-A"];
      } else {
        let new_arr = [];
        for (var file of files) {
          if (file in file_mapping) {
            new_arr.push(file_mapping[file])
          } else {
            if (!addedAllImages && (file.toLowerCase() == "images" || file.toLowerCase() == "pictures")) {
              addedAllImages = true;
              fs.readdirSync("./").forEach(file => {
                if (/.+\.(ase|art|bmp|blp|cd5|cit|cpt|cr2|cut|dds|dib|djvu|egt|exif|gif|gpl|grf|icns|ico|iff|jng|jpeg|jpg|jfif|jp2|jps|lbm|max|miff|mng|msp|nitf|ota|pbm|pc1|pc2|pc3|pcf|pcx|pdn|pgm|PI1|PI2|PI3|pict|pct|pnm|pns|ppm|psb|psd|pdd|psp|px|pxm|pxr|qfx|raw|rle|sct|sgi|rgb|int|bw|tga|tiff|tif|vtf|xbm|xcf|xpm|3dv|amf|ai|awg|cgm|cdr|cmx|dxf|e2d|egt|eps|fs|gbr|odg|svg|stl|vrml|x3d|sxd|v2d|vnd|wmf|emf|art|xar|png|webp|jxr|hdp|wdp|cur|ecw|iff|lbm|liff|nrrd|pam|pcx|pgf|sgi|rgb|rgba|bw|int|inta|sid|ras|sun|tga)/.test(file)) {
                  new_arr.push(file);
                }
              });
            } else {
              new_arr.push(file);
            }
          }
        }
        files = new_arr
      }

      return verbCommandDict.commit(files);
    case "push":
      predicted.push = true;
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

    case "create":
      return createSuggestion(nouns);

    case "make":
      return createSuggestion(nouns);

    case "switch":
      return changeBranchSuggestion(nouns);

    case "change":
      return changeBranchSuggestion(nouns);

    case "go":
      return changeBranchSuggestion(nouns);

    case "enter":
      return changeBranchSuggestion(nouns);

    case "ignore":
      if (await retrieveGitignore(nouns.map(n => n.toLowerCase()))) {
        return verbCommandDict.gitignore();
      }

    case "sync":
      predicted.pull = true;
      predicted.push = true;
      return verbCommandDict.sync();

    case "merge":
      return verbCommandDict.merge();

    default:
      if (nouns.filter(n => n.toLowerCase() == "sync").length > 0) {
        predicted.pull = true;
        predicted.push = true;
        return verbCommandDict.sync();
      }

      return new Suggestion([]);
  }
}

function createSuggestion(nouns) {
  suggestions = [];

  let i = 0;
  for (n of nouns) {
    if (n.toLowerCase() == "branch") {
      suggestions.push(verbCommandDict.createbranch(nouns[i + 1]));
      predicted.log = true;
    }

    if (n.toLowerCase() == "repository" || n.toLowerCase() == "repo" || n.toLowerCase() == "project" ) {
      suggestions.push(verbCommandDict.initrepo(nouns[i + 1]));
    }
  }

  return reduceSuggestions(suggestions);
}

function changeBranchSuggestion(nouns) {
  suggestions = [];

  let i = 0;
  for (n of nouns) {
    if (n.toLowerCase() == "branch") {
      suggestions.push(verbCommandDict.switchbranch(nouns[i + 1]));
      predicted.log = true;
    }
  }

  return reduceSuggestions(suggestions);
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
  let text_tokens = text.split(/(,|\.)?( |$)/);

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

  text = new_text.join(" ") + ".";

  const tokensPromise = tokenalyzeSyntax(text);
  const predictedPromise = predict(text);

  const tokens = await tokensPromise;
  verbNounPairs = getVerbNounPairs(tokens);

  let suggestions = [];

  for (verbId in verbNounPairs) {
    nouns = verbNounPairs[verbId].map(noun => noun.text.content);
    const new_suggestion = await verbNounPairToCommand(tokens[verbId].text.content, nouns, text, file_mapping);
    suggestions.push(new_suggestion);
  }

  const predicted = await predictedPromise;
  suggestions.push(getPredictedSuggestion(predicted));

  return reduceSuggestions(suggestions);
}

module.exports = { Suggestion, processCommand };
// stuff
