const request = require("request-promise-native");
const fs = require("fs");

const TYPES = ["1c","1c-bitrix","a-frame","actionscript","ada","adobe","advancedinstaller","agda","al",
               "alteraquartusii","altium","android","androidstudio","angular","anjuta","ansible","apachecordova",
               "apachehadoop","appbuilder","appceleratortitanium","appcode","appcode+all","appcode+iml","appengine",
               "aptanastudio","arcanist","archive","archives","archlinuxpackages","aspnetcore","assembler","atmelstudio",
               "ats","audio","automationstudio","autotools","backup","ballerina","basercms","basic","batch","bazaar",
               "bazel", "bitrix","bittorrent","blackbox","bloop","bluej","bookdown","bower","bricxcc","buck","c","c++",
               "cake","cakephp","cakephp2","cakephp3","calabash","carthage","ceylon","cfwheels","chefcookbook",
               "chocolatey","clean","clion","clion+all","clion+iml","clojure","cloud9","cmake","cocoapods","cocos2dx",
               "cocoscreator","code","code-java","codeblocks","codecomposerstudio","codeigniter","codeio","codekit",
               "coffeescript","commonlisp","composer","compressed","compressedarchive","compression","concrete5","coq",
               "craftcms","crashlytics","crbasic","crossbar","crystal","csharp","cuda","cvs","d","dart","darteditor",
               "data","database","datarecovery","dbeaver","delphi","diskimage","django","dm","docfx","dotfilessh",
               "dotsettings","dreamweaver","dropbox","drupal","drupal7","drupal8","eagle","easybook","eclipse",
               "eiffelstudio","elasticbeanstalk","elisp","elixir","elm","emacs","ember","ensime","episerver","erlang",
               "espresso","executable","exercism","expressionengine","extjs","fancy","fastlane","finale","firebase",
               "flashbuilder","flask","flex","flexbuilder","floobits","flutter","font","fontforge","forcedotcom",
               "forgegradle","fortran","freepascal","fsharp","fuelphp","fusetools","games","gcov","genero4gl","geth",
               "ggts","gis","git","gitbook","go","godot","gpg","gradle","grails","greenfoot","grunt","gwt","haskell",
               "hexo","hol","homeassistant","hsp","hugo","hyperledgercomposer","iar","iar_ewarm","iarembeddedworkbench",
               "idris","igorpro","images","infer","inforcrm","intellij","intellij+all","intellij+iml","ionic3","jabref",
               "java","java-web","jboss","jboss-4-2-3-ga","jboss-6-x","jdeveloper","jekyll","jetbrains","jetbrains+all",
               "jetbrains+iml","jigsaw","jmeter","joe","joomla","jspm","julia","jupyternotebook","justcode","kate",
               "kdevelop4","keil","kentico","kicad","kirby2","kobalt","kohana","komodoedit","kotlin","labview",
               "labviewnxg","lamp","laravel","latex","lazarus","leiningen","lemonstand","less","liberosoc",
               "librarian-chef","libreoffice","lilypond","linux","lithium","lua","lyx","m2e","macos","magento",
               "magento2","magic-xpa","matlab","maven","mavensmate","mean","mercurial","mercury","metals",
               "metaprogrammingsystem","meteorjs","microsoftoffice","mikroc","moban","modelsim","modx","momentics",
               "monodevelop","mplabx","mule","nanoc","nativescript","ncrunch","nesc","netbeans","nette","nikola","nim",
               "ninja","node","notepadpp","nuxtjs","nwjs","objective-c","ocaml","octobercms","opa","opencart","opencv",
               "openfoam","openframeworks","openframeworks+visualstudio","oracleforms","osx","otto","packer","particle",
               "pawn","perl","perl6","ph7cms","phalcon","phoenix","phpcodesniffer","phpstorm","phpstorm+all",
               "phpstorm+iml","pimcore4","pimcore5","pinegrow","platformio","playframework","plone","polymer",
               "powershell","premake-gmake","prepros","prestashop","processing","progressabl","psoccreator",
               "puppet-librarian","purebasic","purescript","pvs","pycharm","pycharm+all","pycharm+iml","pydev","python","qml","qooxdoo","qt","qtcreator","r","racket","rails","reactnative","red","redcar","redis",
               "rhodesrhomobile","rider","root","ros","ruby","rubymine","rubymine+all","rubymine+iml","rust",
               "salesforce","salesforcedx","sas","sass","sbt","scala","scheme","scons","scrivener","sdcc","seamgen",
               "senchatouch","serverless","shopware","silverstripe","sketchup","slickedit","smalltalk","snapcraft",
               "solidity","soliditytruffle","sonar","sonarqube","sourcepawn","splunk","spreadsheet","standardml",
               "stata","stdlib","stella","stellar","stylus","sublimetext","sugarcrm","svn","swift",
               "swiftpackagemanager","swiftpm","symfony","symphonycms","synology","synopsysvcs","tags",
               "tarmainstallmate","terraform","test","testcomplete","testinfra","tex","text","textmate","textpattern",
               "theos-tweak","tortoisegit","tower","turbogears2","typings","typo3","typo3-composer","umbraco","unity",
               "unrealengine","vaadin","vagrant","valgrind","vapor","venv","vertx","video","vim","virtualenv",
               "virtuoso","visualstudio","visualstudiocode","vivado","vlab","vuejs","vvvv","waf","wakanda","web",
               "webmethods","webstorm","webstorm+all","webstorm+iml","werckercli","windows","wintersmith","wordpress",
               "wyam","xamarinstudio","xcode","xcodeinjection","xilinxise","xilinxvivado","xill","xojo","xtext","y86",
               "yeoman","yii","yii2","zendframework","zephir","zukencr8000"];
const API = "https://www.gitignore.io/api/"

async function retrieveGitignore(formats, callback) {
  const name = formats.filter(f => TYPES.includes(f)).join(",");

  if (name.length > 0) {
    await request.get(API + name).pipe(fs.createWriteStream(".gitignore"));

    return true;
  }

  return false;
}

module.exports = { retrieveGitignore };
