const express = require('express');
const axios = require('axios');
const app = express();

// Utility function to extract image URL from description
const extractImageUrl = (description) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(description, 'text/html');
  const img = doc.querySelector('img');
  return img ? img.src : null;
};

// API endpoint to generate Markdown content
app.get('/', async (req, res) => {
  const { user = 'ksalab', count = '1', markdown = 'false' } = req.query;
  const articleCount = parseInt(count) || 1;

  if (markdown === 'true') {
    try {
      const response = await axios.get(
        `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${user}`
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
  } else {
    res.status(400).send('Markdown not requested');
  }
});

module.exports = app;
