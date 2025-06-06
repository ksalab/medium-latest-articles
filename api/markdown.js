const { JSDOM } = require('jsdom');
const axios = require('axios');

// Utility function to extract image URL from description
const extractImageUrl = (description) => {
  const { document } = new JSDOM(description).window;
  const img = document.querySelector('img');
  return img ? img.src : null;
};

// Handler for /markdown endpoint
module.exports = async function handler(req, res) {
  const { user = 'ksalab', count = '1' } = req.query;
  const articleCount = parseInt(count) || 1;

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

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(markdown);
  } catch (error) {
    console.error(error);
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send(`Error fetching articles: ${error.message}`);
  }
};
