
const fs = require('fs');
const axios = require('axios');
const textile = require('textile-js');

const NB_PROJECTS_PER_PAGE = 25;
const CONFIG_FILE = 'config.json';

class Redmine {

  constructor(config) {
    let redmineUrl = config.redmineUrl;
    if (redmineUrl && redmineUrl.endsWith('/')) {
      redmineUrl = redmineUrl.substr(0, redmineUrl.length-1);
    }
    this.redmineUrl = redmineUrl;
    this.user = config.user;
    this.password = config.password;
    this.extension = config.extension || 'md';
    this.excludedProjects = config.excludedProjects || [];
  }

  generateStaticSite(project, page) {
    const sanitizedTitle = this.sanitizeFileName(page.title);
    const projectDir = outputDir + project.identifier;
    const htmlDir = projectDir + '/html';
    initDirectory(htmlDir);

    const htmlContent = textile(page.text);
    const htmlFilePath = `${htmlDir}/${sanitizedTitle}.html`;

    fs.writeFileSync(htmlFilePath, htmlContent);
    console.log(`Generated HTML for ${page.title} at ${htmlFilePath}`);
  }

  backupWikiPage(project, page) {
    const projectDir = outputDir + project.identifier;
    initDirectory(projectDir);
    const sanitizedTitle = this.sanitizeFileName(page.title);
    fs.writeFileSync(projectDir + '/' + sanitizedTitle + '.' + this.extension, page.text);
    if (page.attachments) {
      const attachmentDir = projectDir + '/attachments';
      initDirectory(attachmentDir);
      page.attachments.forEach(attachment => {
        this.getAttachment(attachment, (content) => {
          fs.writeFileSync(attachmentDir + '/' + attachment.filename, content, 'binary');
        });
      });
    }
  }

  sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*]+/g, '_');
  }

  generateStaticSite(project, page) {
    const sanitizedTitle = this.sanitizeFileName(page.title);
    const projectDir = outputDir + project.identifier;
    const htmlDir = projectDir + '/html';
    initDirectory(htmlDir);

    const htmlContent = textile(page.text);
    const htmlFilePath = `${htmlDir}/${sanitizedTitle}.html`;

    fs.writeFileSync(htmlFilePath, htmlContent);
    console.log(`Generated HTML for ${page.title} at ${htmlFilePath}`);
  }

  newRequest(requestPath) {
    const redmineUrl = this.redmineUrl;
    const user = this.user;
    const password = this.password;
    const url = this.redmineUrl + requestPath;
    const auth = this.user ? { username: this.user, password: this.password } : undefined;
    return { url, auth };
  }

  getProjects(callback) {
    let page = 0;
    let projects = [];
    const redmine = this;
    const next = function(projectList) {
      projectList.forEach(project => projects.push(project));
      if (projectList.length === NB_PROJECTS_PER_PAGE) {
        page++;
        redmine.getProjectListPage(page, next);
      }else{
        callback(projects);
      }
    }
    this.getProjectListPage(page, next);
  }

  getProjectListPage(page, callback) {
    const offset = page * NB_PROJECTS_PER_PAGE;
    console.log("requesting projects list (page="+page+")...");
    axios.get(this.newRequest('/projects.json?offset=' + offset).url, { 
      auth: this.newRequest('').auth,
      timeout: 10000, // 10 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Cookie': 'your_cookie_here'
      }
    })
      .then(response => {
        const projects = response.data.projects;
        callback(projects);
      })
      .catch(error => {
        console.log(error);
      });
  }

  getWikiPages(project, callback) {
    axios.get(this.newRequest('/projects/' + project.identifier + '/wiki/index.json').url, { 
      auth: this.newRequest('').auth,
      timeout: 10000, // 10 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Cookie': 'your_cookie_here'
      }
    })
      .then(response => {
        const pages = response.data.wiki_pages;
        callback(pages);
      })
      .catch(error => {
        console.log("[" + project.identifier + "] Cannot parse JSON string: " + error.message);
      });
  }

  getWikiPage(project, pageName, callback) {
    let path = '/projects/'+project.identifier+'/wiki/'+encodeURIComponent(pageName)+'.json';
    path += '?include=attachments';
    console.log("requesting "+path+"...");
    axios.get(this.newRequest(path).url, { 
      auth: this.newRequest('').auth,
      timeout: 10000, // 10 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Cookie': 'your_cookie_here'
      }
    })
      .then(response => {
        const page = response.data.wiki_page;
        callback(page);
      })
      .catch(error => {
        console.error("Request error:", error.message);
      });
  }

  getAttachment(attachment, callback) {
    if (attachment && attachment.id) {
      const req = this.newRequest('/attachments/download/' + attachment.id);
      axios.get(req.url, { 
        responseType: 'arraybuffer', 
        auth: req.auth,
        timeout: 10000, // 10 seconds timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
          'Cookie': 'your_cookie_here'
        }
      })
        .then(response => {
          callback(response.data);
        })
        .catch(error => {
          console.log(error);
        });
    }
  }

}

// Read configuration file
const config = readConfiguration();

// Abort if there is no configuration file
if (!config) {
  console.log('No configuration file found.');
  process.exit(0);
}

// Abort if the redmine url has not been defined
if (!config.redmineUrl) {
  console.log('Cannot found redmine url in '+CONFIG_FILE+'.');
  process.exit(0);
}

const redmine = new Redmine(config);

let outputDir = config.outputDir;
if (outputDir && !outputDir.endsWith('/')) {
  outputDir += '/';
}

// Make sure that the output directory exists
initDirectory(outputDir);

/*
 * Option to run the requests in an insecure mode
 * that does not validate SSL certificates
*/
if (config.insecure == true) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

redmine.getProjects(projects => {
  console.log(projects.length+' projects found.');
  projects.forEach(project => {
    redmine.getWikiPages(project, pages => {
      if (redmine.excludedProjects.includes(project.identifier)) {
        console.log(project.identifier+' project skipped.');
        return;
      }

      if (pages.length > 0) {
        console.log(pages.length+" wiki pages found for project "+project.identifier);
        pages.forEach(page => {
          // Retrieve the wiki page's content
          redmine.getWikiPage(project, page.title, (fullPage) => {
            if (fullPage) {
              // Store the wiki page content and its attachments into the output directory
              redmine.backupWikiPage(project, fullPage);

              // Generate static HTML site from Textile files
              redmine.generateStaticSite(project, fullPage);
            }
          });
        });
      }
    });
  });
});

function readConfiguration() {
  let config = null;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE));
  } catch (e) {
    console.log(e);
  }
  return config;
}

function initDirectory(directory) {
  if (directory) {
    try {
      fs.mkdirSync(directory);
    } catch(e) {
      if ( e.code != 'EEXIST' ) throw e;
    }
  }
}
