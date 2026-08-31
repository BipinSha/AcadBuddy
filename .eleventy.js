const { EleventyHtmlBasePlugin } = require('@11ty/eleventy');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/robots.txt': 'robots.txt' });
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addFilter('readableDate', (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(new Date(date));
  });

  eleventyConfig.addFilter('limit', (arr, count) => (arr || []).slice(0, count));

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: '_layouts',
      output: '_site'
    },
    templateFormats: ['md', 'njk', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk'
  };
};
