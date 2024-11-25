const express = require('express');
const fs = require('fs');
const path = require('path');
const textile = require('textile-js');

const app = express();
const textileDir = './textile_files'; 

app.get('/:file', (req, res) => {
  const fileName = req.params.file;
  const filePath = path.join(textileDir, fileName + '.textile');

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

