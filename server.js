const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Utility function to extract image URL from description
const extractImageUrl = (description) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(description, 'text/html');
  const img = doc.querySelector('img');
  return img ? img.src : null;
};

// API endpoint to generate Markdown content
app.get('/medium/:username/:articleIndex/markdown', async (req, res) => {
  const { username, articleIndex } = req.params;
  const articleCount = parseInt(articleIndex) || 1;

  try {
    const response = await axios.get(
      `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${username}`
    );
    const articles = response.data.items.slice(0, articleCount);

    // Generate Markdown content
    let markdown = '# Latest Medium Articles\n\n';
    articles.forEach(article => {
      const tags = article.categories?.length > 0
        ? article.categories.map(tag => `\`${tag}\``).join(' ')
        : '';
      const image = extractImageUrl(article.description);
      markdown += `### [${article.title}](${article.link})\n`;
      // Comment out image to avoid CORS issues
      // if (image) markdown += `![${article.title}](${image})\n`;
      markdown += `**Published**: ${new Date(article.pubDate).toLocaleDateString()}\n`;
      if (tags) markdown += `**Tags**: ${tags}\n`;
      markdown += `${article.description.replace(/<[^>]+>/g, '').slice(0, 150)}...\n\n`;
    });

    res.set('Content-Type', 'text/markdown');
    res.send(markdown);
  } catch (error) {
    res.status(500).send('Error fetching articles');
  }
});

// Serve React app for other routes
app.get('*', (res, req) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
