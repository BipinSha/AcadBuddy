const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const input = path.resolve('acadbuddy.WordPress.2026-08-31.xml');
const output = path.resolve('src/_generated');

if (!fs.existsSync(input)) {
  console.log('WordPress export not present; skipping content import.');
  process.exit(0);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const xml = fs.readFileSync(input, 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', cdataPropName: '__cdata', isArray: (name) => name === 'item' });
const data = parser.parse(xml);
const items = data?.rss?.channel?.item || [];

const text = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') return value.__cdata || value['#text'] || '';
  return String(value);
};

const clean = (value) => text(value).replace(/<!--.*?-->/gs, '').replace(/\[[^\]]+\]/g, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const yaml = (value) => JSON.stringify(String(value || ''));
const slugify = (value) => String(value || '').toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const categoryMap = {
  'Academic Tips': 'Academic Tips',
  'Scholarship': 'Scholarships',
  'Study Abroad': 'Study Abroad',
  'Energy': 'Engineering & Energy',
  'Technology': 'Technology',
  'Tutorials': 'Technology'
};

let count = 0;
for (const item of items) {
  const type = text(item['wp:post_type']);
  const status = text(item['wp:status']);
  if (!['post', 'page'].includes(type) || status !== 'publish') continue;

  const title = text(item.title) || 'Untitled';
  const slug = text(item['wp:post_name']) || slugify(title);
  const content = text(item['content:encoded']);
  const date = text(item['wp:post_date']) || text(item.pubDate);
  const rawCategories = Array.isArray(item.category) ? item.category : (item.category ? [item.category] : []);
  const categoryNames = rawCategories.map((c) => typeof c === 'object' ? text(c.__cdata || c['#text']) : text(c)).filter(Boolean).map((name) => categoryMap[name] || name);
  const description = clean(content).slice(0, 180);
  const permalink = `/${slug}/`;
  const safeName = slugify(slug) || `item-${count + 1}`;
  const dir = path.join(output, type === 'page' ? 'pages' : 'articles');
  fs.mkdirSync(dir, { recursive: true });

  const frontmatter = ['---', `title: ${yaml(title)}`, `description: ${yaml(description)}`, `date: ${yaml(date)}`, `permalink: ${yaml(permalink)}`, `legacySlug: ${yaml(slug)}`, `categories: ${JSON.stringify(categoryNames)}`, 'layout: article.njk', '---', ''].join('\n');
  fs.writeFileSync(path.join(dir, `${safeName}.md`), frontmatter + content + '\n', 'utf8');
  count++;
}

console.log(`Imported ${count} published WordPress posts/pages into ${output}`);
