import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Wish from './models/Wish.js';
import Event from './models/Event.js';
import Notification from './models/Notification.js';
import FitnessEntry from './models/FitnessEntry.js';
import MusicItem from './models/MusicItem.js';
import MentalHealthEntry from './models/MentalHealthEntry.js';
import AddictionEntry from './models/AddictionEntry.js';
import Translation from './models/Translation.js';
import MoodEntry from './models/MoodEntry.js';
import JournalEntry from './models/JournalEntry.js';
import GratitudeEntry from './models/GratitudeEntry.js';
import MeditationSession from './models/MeditationSession.js';
import HabitTracker from './models/HabitTracker.js';
import WaterIntake from './models/WaterIntake.js';
import SleepEntry from './models/SleepEntry.js';
import { createAccountLifecycle, RECOVERY_PERIOD_MS } from './accountLifecycle.js';

dotenv.config();

test('account lifecycle with an isolated MongoDB database and real HTTP handlers', {
  skip: process.env.RUN_ACCOUNT_INTEGRATION !== '1',
  timeout: 90000,
}, async t => {
  const databaseName = `willowtest_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
  const sourceUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/one-wish-willow';
  const parts = /^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/[^?]*)?(\?.*)?$/.exec(sourceUri);
  assert.ok(parts, 'A valid MongoDB connection string is required');
  const uri = `${parts[1]}/${databaseName}${parts[2] || ''}`;
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  let backend;
  try {
    const userModel = connection.model('User', User.schema);
    const definitions = [
      ...[Notification, Wish, Event, FitnessEntry, MusicItem, MentalHealthEntry, AddictionEntry, Translation]
        .map(model => ({ source: model, field: 'user' })),
      ...[MoodEntry, JournalEntry, GratitudeEntry, MeditationSession, HabitTracker, WaterIntake, SleepEntry]
        .map(model => ({ source: model, field: 'userId' })),
    ];
    const ownedModels = definitions.map(({ source, field }) => ({
      model: connection.model(source.modelName, source.schema), field,
    }));
    let currentTime = new Date('2026-10-31T12:00:00.000Z');
    const lifecycle = createAccountLifecycle({ userModel, ownedModels, now: () => currentTime });
    const createUser = () => {
      const id = randomUUID();
      return userModel.create({ username: id, email: `${id}@example.com`, password: 'test-hash' });
    };

    await t.test('termination persists and restores at seven days minus one millisecond', async () => {
      const user = await createUser();
      await lifecycle.schedule(user._id, 'terminate', true);
      await assert.rejects(lifecycle.verifySession({ id: user._id }), error => error.status === 401);
      currentTime = new Date(currentTime.getTime() + RECOVERY_PERIOD_MS - 1);
      const result = await lifecycle.login(user._id);
      assert.equal(result.restored, true);
      assert.equal((await userModel.findById(user._id)).deletionDueAt, null);
      await lifecycle.verifySession({ id: user._id, sessionVersion: 1 });
      await assert.rejects(lifecycle.verifySession({ id: user._id, sessionVersion: 0 }));
    });

    await t.test('exact deadline denies recovery and deletes every owner collection without touching others', async () => {
      const user = await createUser();
      const survivor = await createUser();
      for (const { model, field } of ownedModels) {
        await model.collection.insertMany([{ [field]: user._id }, { [field]: survivor._id }]);
      }
      await lifecycle.schedule(user._id, 'delete', true);
      currentTime = new Date(currentTime.getTime() + RECOVERY_PERIOD_MS);
      await assert.rejects(lifecycle.login(user._id), error => error.status === 410);
      assert.equal(await userModel.findById(user._id), null);
      for (const { model, field } of ownedModels) {
        assert.equal(await model.countDocuments({ [field]: user._id }), 0);
        assert.equal(await model.countDocuments({ [field]: survivor._id }), 1);
      }
    });

    await t.test('new lifecycle instance cleans expired requests after a restart', async () => {
      const user = await createUser();
      await lifecycle.schedule(user._id, 'delete', true);
      currentTime = new Date(currentTime.getTime() + RECOVERY_PERIOD_MS);
      const restarted = createAccountLifecycle({ userModel, ownedModels, now: () => currentTime });
      await restarted.deleteExpiredAccounts();
      assert.equal(await userModel.findById(user._id), null);
    });

    await t.test('cleanup failures stay locked and are retried', async () => {
      const user = await createUser();
      await lifecycle.schedule(user._id, 'terminate', true);
      currentTime = new Date(currentTime.getTime() + RECOVERY_PERIOD_MS);
      const failing = createAccountLifecycle({
        userModel, now: () => currentTime,
        ownedModels: [{ field: 'user', model: { async deleteMany() { throw new Error('temporary storage failure'); } } }],
      });
      await assert.rejects(failing.deleteExpiredAccounts(), AggregateError);
      assert.equal((await userModel.findById(user._id)).deletionInProgress, true);
      await lifecycle.deleteExpiredAccounts();
      assert.equal(await userModel.findById(user._id), null);
    });

    const listener = net.createServer();
    listener.listen(0, '127.0.0.1');
    await once(listener, 'listening');
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    backend = spawn(process.execPath, ['server/index.js'], {
      cwd: process.cwd(),
      env: { ...process.env, MONGODB_URI: uri, PORT: String(port) },
      stdio: 'ignore',
    });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (backend.exitCode !== null) throw new Error('Isolated test backend exited before startup');
      try {
        const response = await fetch(`${base}/api/profile`);
        if (response.status === 401) { ready = true; break; }
      } catch (error) {
        if (error.cause?.code !== 'ECONNREFUSED') throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, 'Isolated backend must become responsive');
    const request = async (route, body, token, method = 'POST') => {
      const response = await fetch(`${base}${route}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, data: await response.json() };
    };

    await t.test('HTTP confirmation, sign-out, incorrect password, recovery and stale tokens', async () => {
      const username = randomUUID();
      const password = 'test-account-password';
      const signup = await request('/api/auth/register', { username, email: `${username}@example.com`, password });
      assert.equal(signup.status, 200);
      const oldToken = signup.data.token;
      assert.equal((await request('/api/profile/account-deletion', { action: 'delete', confirmed: true })).status, 401);
      assert.equal((await request('/api/profile/account-deletion', { action: 'delete', confirmed: false }, oldToken)).status, 400);
      await request('/api/wishes', { title: 'Keep this wish during recovery' }, oldToken);
      const scheduled = await request('/api/profile/account-deletion', { action: 'delete', confirmed: true }, oldToken);
      assert.equal(scheduled.status, 200);
      assert.match(scheduled.data.message, /within 7 days/);
      assert.equal((await request('/api/profile', undefined, oldToken, 'GET')).status, 401);
      assert.equal((await request('/api/auth/login', { usernameOrEmail: username, password: 'wrong' })).status, 400);
      assert.ok((await userModel.findOne({ username })).deletionDueAt);
      const restored = await request('/api/auth/login', { usernameOrEmail: username, password });
      assert.equal(restored.status, 200);
      assert.match(restored.data.message, /cancelled/);
      assert.equal((await request('/api/profile', undefined, restored.data.token, 'GET')).status, 200);
      assert.equal((await request('/api/profile', undefined, oldToken, 'GET')).status, 401);
      const wishes = await request('/api/wishes', undefined, restored.data.token, 'GET');
      assert.equal(wishes.data[0].title, 'Keep this wish during recovery');
      assert.equal((await userModel.findOne({ username })).deletionDueAt, null);
      const terminated = await request('/api/profile/account-deletion', { action: 'terminate', confirmed: true }, restored.data.token);
      assert.equal(terminated.status, 200);
      assert.match(terminated.data.message, /temporarily terminated/);
    });
  } finally {
    if (backend && backend.exitCode === null) {
      const exited = once(backend, 'exit');
      backend.kill();
      await exited;
    }
    try {
      await connection.dropDatabase();
    } finally {
      await connection.close();
    }
  }
});
