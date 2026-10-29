import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStatistics } from './statistics.js';

const now = new Date('2026-10-29T12:00:00Z');
const user = { createdAt: new Date('2026-10-01T12:00:00Z') };
const source = records => ({ name: 'Wish List', icon: '*', records });

test('empty accounts have no fabricated activity or achievements', () => {
  const result = buildStatistics(user, [source([])], now);
  assert.equal(result.stats.totalWishes, 0);
  assert.equal(result.stats.completionRate, 0);
  assert.equal(result.stats.streakDays, 0);
  assert.equal(result.stats.accountAge, 28);
  assert.equal(result.activity.week.length, 7);
  assert.equal(result.activity.month.length, 30);
  assert.equal(result.activity.year.length, 12);
  assert.ok(result.activity.year.every(bucket => bucket.activity === 0));
});

test('wish completion and activity reflect stored records and refreshes', () => {
  const records = [
    { progress: 100, createdAt: '2026-10-29T10:00:00Z' },
    { progress: 50, createdAt: '2026-10-28T10:00:00Z' },
    { progress: 0, createdAt: '2026-10-27T10:00:00Z' },
  ];
  const result = buildStatistics(user, [source(records)], now);
  assert.equal(result.stats.wishesMet, 1);
  assert.equal(result.stats.inProgress, 1);
  assert.equal(result.stats.pending, 1);
  assert.equal(result.stats.completionRate, 33);
  assert.equal(result.stats.averageProgress, 50);
  assert.equal(result.stats.streakDays, 3);
  records[1].progress = 100;
  assert.equal(buildStatistics(user, [source(records)], now).stats.wishesMet, 2);
});

test('rolling ranges, year boundaries and meditation dates use real timestamps', () => {
  const result = buildStatistics(user, [source([
    { progress: 0, createdAt: '2026-10-23T00:00:00Z' },
    { progress: 0, createdAt: '2026-10-22T23:59:59Z' },
    { progress: 0, createdAt: '2025-11-01T00:00:00Z' },
    { progress: 0, createdAt: 'invalid' },
    { progress: 0, createdAt: '2026-10-30T00:00:00Z' },
  ]), { name: 'Meditation', icon: '*', records: [{ completedAt: '2026-10-29T08:00:00Z', duration: 15 }] }], now);
  assert.equal(result.stats.weekActivity, 2);
  assert.equal(result.stats.monthActivity, 3);
  assert.equal(result.stats.meditationMinutes, 15);
  assert.equal(result.activity.year[0].date, '2025-11');
  assert.equal(result.activity.year[0].activity, 1);
  assert.equal(result.activity.week.at(-1).activity, 1);
});

test('yesterday keeps a streak alive but a missing day breaks it', () => {
  const records = [
    { createdAt: '2026-10-28T10:00:00Z' },
    { createdAt: '2026-10-26T10:00:00Z' },
  ];
  assert.equal(buildStatistics(user, [source(records)], now).stats.streakDays, 1);
});

test('wellness records contribute their own date field to activity', () => {
  const result = buildStatistics(user, [source([]), {
    name: 'Mood', icon: '*', records: [{ date: '2026-10-29T08:00:00Z' }],
  }], now);
  assert.equal(result.stats.todayActivity, 1);
  assert.equal(result.stats.streakDays, 1);
  assert.equal(result.stats.totalRecords, 1);
  assert.equal(result.features[0].name, 'Mood');
});