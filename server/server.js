/**
 * server.js — Deenice GSM Arena Proxy
 * Fetches phone specs from GSM Arena and returns standardized JSON.
 * Use responsibly — respect GSM Arena robots.txt and terms of use.
 */

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const { URL } = require('url');

const app = express();
app.use(cors());
app.use(helmet());

// simple in-memory cache (1 hour)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// validate GSMArena URL
function isValidGsmArenaUrl(raw) {
  try {
    const u = new URL(raw);
    return u.hostname.includes('gsmarena.com');
  } catch {
    return false;
  }
}

// fetch page HTML
async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: {
      'User-Agent':
        process.env.SCRAPER_USER_AGENT ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  return res.data;
}

// parse specs
function parseGsmArenaHtml(html, sourceUrl) {
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('h1.specs-phone-name-title').text().trim();
  let image =
    $('meta[property="og:image"]').attr('content') ||
    $('div.specs-photo img').attr('src');
  if (image && image.startsWith('//')) image = 'https:' + image;

  const specs = {};
  $('div#specs-list table').each((i, table) => {
    $(table)
      .find('tr')
      .each((j, row) => {
        const key = $(row).find('th').text().trim();
        const val = $(row).find('td').text().trim();
        if (key && val) specs[key] = val;
      });
  });

  return {
    sourceUrl,
    title,
    image,
    specs,
    scrapedAt: new Date().toISOString(),
  };
}

// API endpoint
app.get('/api/parse', async (req, res) => {
  const { url } = req.query;
  if (!url || !isValidGsmArenaUrl(url))
    return res.status(400).json({ error: 'Invalid or missing GSM Arena URL.' });

  const cacheKey = `gsm:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ cached: true, data: cached });

  try {
    const html = await fetchHtml(url);
    const data = parseGsmArenaHtml(html, url);
    cache.set(cacheKey, data);
    res.json({ cached: false, data });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch/parse URL', details: err.message });
  }
});

// health check
app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ GSM Proxy running on port ${PORT}`));
