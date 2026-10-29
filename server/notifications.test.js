import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNotifications } from './notifications.js';

const now = new Date('2026-10-29T12:00:00Z');
const event = { _id: 'event-id', title: 'Study session', date: '2026-10-29', completed: false };
const build = (events = [], wishes = [], timeZone = 'UTC') => buildNotifications({ events, wishes, now, timeZone });

test('empty accounts have no fabricated notifications', () => {
  assert.deepEqual(build(), []);
});

test('only completed wishes create completion alerts with stable keys', () => {
  const wishes = [{ _id: 'wish-id', title: 'Read a book', progress: 100 }, { _id: 'pending', progress: 50 }];
  assert.equal(build([], wishes).length, 1);
  assert.equal(build([], wishes)[0].href, '/wish-list');
  assert.equal(build([], wishes)[0].key, build([], wishes)[0].key);
});

test('deadline notifications reflect real upcoming and overdue events', () => {
  const result = build([
    { ...event, deadline: '2026-10-30T12:00:00Z' },
    { ...event, _id: 'overdue', deadline: '2026-10-29T11:00:00Z' },
    { ...event, _id: 'future', deadline: '2026-11-01T12:00:00Z' },
  ]);
  assert.deepEqual(result.map(item => item.kind), ['event-due', 'event-overdue']);
});

test('completed events and stale deadlines do not generate alerts', () => {
  assert.deepEqual(build([
    { ...event, completed: true, deadline: '2026-10-29T13:00:00Z' },
    { ...event, deadline: '2026-10-01T13:00:00Z' },
  ]), []);
});

test('date-only events use the account browser timezone', () => {
  assert.equal(build([{ ...event, date: '2026-10-30' }], [], 'Pacific/Auckland')[0].kind, 'event-today');
  assert.deepEqual(build([{ ...event, date: '2026-10-30' }]), []);
});

test('changed event deadlines have a new reminder identity', () => {
  const first = build([{ ...event, deadline: '2026-10-29T15:00:00Z' }])[0];
  const second = build([{ ...event, deadline: '2026-10-29T16:00:00Z' }])[0];
  assert.notEqual(first.key, second.key);
});

test('invalid deadlines safely fall back to date-only reminders', () => {
  assert.equal(build([{ ...event, deadline: 'invalid' }])[0].kind, 'event-today');
});