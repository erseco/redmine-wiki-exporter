const express = require('express');
const fs = require('fs');
const path = require('path');
const textile = require('textile-js');

const app = express();
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const textileDir = config.outputDir;

app.get('/', (req, res) => {
  fs.readdir(textileDir, (err, files) => {
    if (err) {
      res.status(500).send('Error reading directory');
      return;
    }
    const fileList = files.map(file => `<li><a href="/${path.basename(file, '.textile')}">${file}</a></li>`).join('');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Available Files</title></head>
      <body>
        <h1>Available Files</h1>
        <ul>${fileList}</ul>
      </body>
      </html>
    `);
  });
});

app.get('/:file', (req, res) => {
  const fileName = req.params.file;
  const filePath = path.join(textileDir, fileName);

  if (fs.existsSync(filePath)) {
    const textileContent = fs.readFileSync(filePath, 'utf8');
    const htmlContent = textile(textileContent);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>${fileName}</title></head>
      <body>${htmlContent}</body>
      </html>
    `);
  } else {
    res.status(404).send('File not found');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

