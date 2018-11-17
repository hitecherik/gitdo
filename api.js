// Imports the Google Cloud client library
const language = require('@google-cloud/language');

// Creates a client
const client = new language.LanguageServiceClient();

/**
 * TODO(developer): Uncomment the following line to run this code.
 */
// const text = 'Your text to analyze, e.g. Hello, world!';

// Prepares a document, representing the provided text
const document = {
  content: text,
  type: 'PLAIN_TEXT',
};

// Detects syntax in the document
client
  .analyzeSyntax({document: document})
  .then(results => {
    const syntax = results[0];

    console.log('Tokens:');
    syntax.tokens.forEach(part => {
      console.log(`${part.partOfSpeech.tag}: ${part.text.content}`);
      console.log(`Morphology:`, part.partOfSpeech);
    });
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
