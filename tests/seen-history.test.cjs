const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function createApp(stored) {
  const context = {
    exports: {},
    require: name => name === '@angular/core' ? { Component: () => value => value } :
      name === './arc-ranges.model' ? { ARC_RANGES: { 'Wano Country': [893, 1100] } } : {},
    localStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value)
    }
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/app/app.component.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      experimentalDecorators: true
    }
  }).outputText;
  vm.runInNewContext(compiled, context);
  const app = new context.exports.AppComponent();
  app.episodes = Array.from({ length: 1280 }, (_, i) => ({ number: i + 1, seen: false }));
  return app;
}

const through = number => Array.from({ length: number }, (_, i) => i + 1);

test('loads and saves more than 1040 watched episodes', () => {
  const stored = new Map([['seenEpisodes', JSON.stringify(through(1100))]]);
  const app = createApp(stored);
  app.loadSeenEpisodes();
  assert.equal(app.episodes.filter(ep => ep.seen).length, 1100);
  assert.equal(app.episodes[1100].seen, false);
  app.saveSeenEpisodes();
  assert.deepEqual(JSON.parse(stored.get('seenEpisodes')), through(1100));
});

test('preserves history pasted after loading when saving another episode', () => {
  const stored = new Map([['seenEpisodes', JSON.stringify(through(1035))]]);
  const app = createApp(stored);
  app.loadSeenEpisodes();
  stored.set('seenEpisodes', JSON.stringify([...through(1100), 1500]));
  app.episodes[1100].seen = true;
  app.saveSeenEpisodes();
  assert.deepEqual(JSON.parse(stored.get('seenEpisodes')), [...through(1101), 1500]);
  assert.equal(app.episodes[1099].seen, true);
  app.saveSeenEpisodes();
  assert.deepEqual(JSON.parse(stored.get('seenEpisodes')), [...through(1101), 1500]);
});

test('bulk watched and unwatched ranges survive reload without changing surrounding history', () => {
  const stored = new Map();
  const app = createApp(stored);
  app.historyEnd = 1100;
  app.setHistoryRange(true);
  assert.deepEqual(JSON.parse(stored.get('seenEpisodes')), through(1100));
  app.historyStart = 1041;
  app.historyEnd = 1050;
  app.setHistoryRange(false);
  const expected = through(1100).filter(number => number < 1041 || number > 1050);
  assert.deepEqual(JSON.parse(stored.get('seenEpisodes')), expected);
  const reloaded = createApp(stored);
  reloaded.loadSeenEpisodes();
  assert.equal(reloaded.episodes[1040].seen, false);
  reloaded.saveSeenEpisodes();
  assert.deepEqual(JSON.parse(stored.get('seenEpisodes')), expected);
});

test('individual toggle preserves the active arc and updates hide-watched results', () => {
  const stored = new Map([['seenEpisodes', JSON.stringify(through(1040))]]);
  const app = createApp(stored);
  app.loadSeenEpisodes();
  app.activeArc = 'Wano Country';
  app.hideSeenEpisodes = true;
  app.toggleEpisodeSeen(app.episodes[1039]);
  assert.equal(app.episodes[1039].seen, false);
  assert.equal(app.filteredEpisodes[0].number, 1040);
  assert.equal(app.filteredEpisodes.at(-1).number, 1100);
  app.toggleEpisodeSeen(app.episodes[1039]);
  assert.equal(app.filteredEpisodes[0].number, 1041);
  assert.deepEqual(JSON.parse(stored.get('seenEpisodes')), through(1040));
});

test('invalid ranges do not change stored history', () => {
  const stored = new Map([['seenEpisodes', '[1,2,3]']]);
  const app = createApp(stored);
  for (const [start, end] of [[1, null], [null, 10], [0, 10], [10, 1], [1, 2.5], [1, 1281]]) {
    app.historyStart = start;
    app.historyEnd = end;
    assert.equal(app.historyRangeValid, false);
    app.setHistoryRange(true);
    assert.equal(stored.get('seenEpisodes'), '[1,2,3]');
  }
});
