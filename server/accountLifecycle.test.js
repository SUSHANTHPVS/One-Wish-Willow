import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountLifecycle, RECOVERY_PERIOD_MS, AccountLifecycleError } from './accountLifecycle.js';

const now = new Date('2026-10-31T12:00:00.000Z');

test('scheduling requires a supported action and explicit boolean confirmation', async () => {
  const lifecycle = createAccountLifecycle({
    userModel: { findOneAndUpdate() { assert.fail('Unconfirmed requests must not write to storage'); } },
    ownedModels: [],
  });
  for (const [action, confirmed] of [['delete', false], ['delete', 'true'], ['terminate', undefined], ['other', true]]) {
    await assert.rejects(lifecycle.schedule('user', action, confirmed), error =>
      error instanceof AccountLifecycleError && error.status === 400);
  }
});

test('both actions persist exactly seven days and invalidate old sessions', async () => {
  for (const action of ['delete', 'terminate']) {
    let update;
    const lifecycle = createAccountLifecycle({
      now: () => now, ownedModels: [],
      userModel: {
        async findOneAndUpdate(filter, changes) {
          assert.equal(filter._id, 'user');
          assert.equal(filter.deletionDueAt, null);
          update = changes;
          return { _id: 'user' };
        },
      },
    });
    const result = await lifecycle.schedule('user', action, true);
    assert.equal(new Date(result.deletionDueAt).getTime() - now.getTime(), RECOVERY_PERIOD_MS);
    assert.equal(update.$inc.sessionVersion, 1);
    assert.equal(update.$set.deletionReason, action);
    assert.match(result.message, /Log in within 7 days/);
    assert.match(result.message, /signed out/);
  }
});

test('session validation rejects terminated, deleted, stale and admin sessions', async () => {
  let storedUser = { sessionVersion: 0 };
  const lifecycle = createAccountLifecycle({
    ownedModels: [], userModel: { async findById() { return storedUser; } },
  });
  await lifecycle.verifySession({ id: 'user' });
  for (const user of [null, { deletionDueAt: now }, { deletionInProgress: true }, { sessionVersion: 1 }]) {
    storedUser = user;
    await assert.rejects(lifecycle.verifySession({ id: 'user' }), error => error.status === 401);
  }
  storedUser = { sessionVersion: 1 };
  await lifecycle.verifySession({ id: 'user', sessionVersion: 1 });
  await assert.rejects(lifecycle.verifySession({ id: 'admin', role: 'admin' }), error => error.status === 401);
});

test('login uses a strict deadline and cannot restore accounts claimed for cleanup', async () => {
  let filter;
  let update;
  const lifecycle = createAccountLifecycle({
    now: () => now, ownedModels: [],
    userModel: {
      async findOneAndUpdate(query, changes) {
        filter = query;
        update = changes;
        return { _id: 'user', deletionDueAt: new Date(now.getTime() + 1) };
      },
    },
  });
  const result = await lifecycle.login('user');
  assert.equal(result.restored, true);
  assert.equal(filter.deletionInProgress.$ne, true);
  assert.equal(filter.$or[1].deletionDueAt.$gt, now);
  assert.equal(update.$set.deletionDueAt, null);
});

test('failed data cleanup never deletes the account and exposes the error', async () => {
  let accountDeleted = false;
  const lifecycle = createAccountLifecycle({
    userModel: {
      async findOneAndUpdate() { return { _id: 'user' }; },
      async deleteOne() { accountDeleted = true; },
    },
    ownedModels: [{ field: 'user', model: { async deleteMany() { throw new Error('storage unavailable'); } } }],
  });
  await assert.rejects(lifecycle.deleteExpiredAccount('user'), /storage unavailable/);
  assert.equal(accountDeleted, false);
});
