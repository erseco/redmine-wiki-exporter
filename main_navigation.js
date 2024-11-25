const fs = require('fs');
const path = require('path');
const textile = require('textile-js');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const outputDir = config.outputDir;

function loadWikiFile(projectDir) {
  const wikiFilePath = path.join(projectDir, 'Wiki.textile');
  if (fs.existsSync(wikiFilePath)) {
    const textileContent = fs.readFileSync(wikiFilePath, 'utf8');
    const htmlContent = textile(textileContent);
    console.log(`Loaded Wiki.textile for project at ${projectDir}`);
    return htmlContent;
  } else {
    console.log(`Wiki.textile not found in ${projectDir}`);
    return null;
  }
}

function navigateProjects() {
  const projects = fs.readdirSync(outputDir);
  projects.forEach(project => {
    const projectDir = path.join(outputDir, project);
    if (fs.lstatSync(projectDir).isDirectory()) {
      loadWikiFile(projectDir);
    }
  });
}

navigateProjects();
