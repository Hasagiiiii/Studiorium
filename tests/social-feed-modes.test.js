const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const feedSource = readFileSync(path.join(root, 'public/js/views/home-social-feed.js'), 'utf8');
const homeSource = readFileSync(path.join(root, 'public/js/views/home-social.js'), 'utf8');

test('feed exposes explicit supported modes', () => {
  for (const mode of ['for-you', 'discussions', 'trending', 'recent']) {
    assert.match(feedSource, new RegExp(`['\"]${mode}['\"]`));
  }
  assert.match(feedSource, /normalizeFeedMode/);
});

test('feed modes are rendered as navigable tabs instead of decorative buttons', () => {
  assert.match(homeSource, /aria-label="Filtros do feed"/);
  assert.match(homeSource, /\?feed=\$\{value\}/);
  assert.match(homeSource, /social-feed-tab/);
  assert.doesNotMatch(homeSource, /<button class="active" type="button">Para você<\/button>/);
});

test('trending and recent feeds use different ranking strategies', () => {
  assert.match(feedSource, /selectedMode === 'recent'/);
  assert.match(feedSource, /selectedMode === 'trending'/);
  assert.match(feedSource, /activityScore/);
  assert.match(feedSource, /freshnessScore/);
  assert.match(feedSource, /blendedScore/);
});

test('discussion feed is scoped to actual conversations', () => {
  assert.match(feedSource, /entry\.type === 'discussion'/);
  assert.match(homeSource, /tab\('discussions', 'Conversas'\)/);
});

test('home derives the active feed mode from the URL query', () => {
  assert.match(homeSource, /state\.query\?\.get\('feed'\)/);
  assert.match(homeSource, /buildFeed\(mode\)/);
  assert.match(homeSource, /aria-live="polite"/);
});
