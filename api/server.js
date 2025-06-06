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
app.get(['/', '/markdown'], async (req, res, next) => {
  const { user = 'ksalab', count = '1', markdown = 'false' } = req.query;
  const articleCount = parseInt(count) || 1;

  if (markdown === 'true' || req.path === '/markdown') {
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
        markdown += `**Published**: ${new Date(article.pubDate).toDateString()}\n`;
        if (tags) markdown += `**Tags**: ${tags}\n`;
        markdown += `${article.description.replace(/[\r\n]+/g, ' ').replace(/<[^>]+>/g, '').slice(0, 150)}...\n\n`;
      });

      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.send(markdown);
    } catch (error) {
      res.status(500).set('Content-Type', 'text/plain').send(`Error fetching articles: ${error.message}`);
    }
  } else {
    next(); // Pass to next handler (Vercel will serve index.html)
  }
});

module.exports = app;
