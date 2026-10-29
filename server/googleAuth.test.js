import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createGoogleAuthHandler } from './googleAuth.js';

const secret = 'test-signing-key-not-for-production';
const clientId = 'test-client.apps.googleusercontent.com';
const profile = { sub: 'google-subject', email: 'person@gmail.com', email_verified: true, given_name: 'Person' };

function fixture({ existing, claims = profile, configured = true, verificationFails = false } = {}) {
  const saved = [];
  const verification = [];
  class User {
    constructor(fields) {
      Object.assign(this, { _id: 'account-id' }, fields);
    }
    static findOne(filter) {
      if (filter.googleId) return Promise.resolve(existing?.googleId === filter.googleId ? existing : null);
      return { collation: async () => existing || null };
    }
    async save() { saved.push(this); }
  }
  if (existing) existing.save = async () => saved.push(existing);
  const handler = createGoogleAuthHandler({
    userModel: User,
    clientId: configured ? clientId : '',
    jwtSecret: secret,
    googleClient: {
      async verifyIdToken(options) {
        verification.push(options);
        if (verificationFails) throw new Error('invalid credential');
        return { getPayload: () => claims };
      },
    },
  });
  const invoke = async body => {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ body }, response);
    return response;
  };
  return { invoke, saved, verification };
}

test('Google setup and malformed credentials fail closed', async () => {
  assert.equal((await fixture({ configured: false }).invoke({ credential: 'token' })).statusCode, 503);
  assert.equal((await fixture().invoke({ credential: { forged: true } })).statusCode, 400);
});

test('invalid or unverified Google credentials never create a session', async () => {
  const invalid = fixture({ verificationFails: true });
  assert.equal((await invalid.invoke({ credential: 'token' })).statusCode, 401);
  assert.equal(invalid.saved.length, 0);
  assert.equal((await fixture({ claims: { ...profile, email_verified: false } }).invoke({ credential: 'token' })).statusCode, 401);
});

test('new Google accounts require explicit terms acceptance', async () => {
  const result = fixture();
  assert.equal((await result.invoke({ credential: 'token' })).statusCode, 403);
  assert.equal((await result.invoke({ credential: 'token', termsAccepted: 'true' })).statusCode, 403);
  assert.equal(result.saved.length, 0);
});

test('verified Google signup creates an account and the normal application session', async () => {
  const result = fixture();
  const response = await result.invoke({ credential: 'token', termsAccepted: true });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(result.verification[0], { idToken: 'token', audience: clientId });
  assert.equal(result.saved[0].googleId, profile.sub);
  assert.equal(result.saved[0].email, profile.email);
  assert.equal(bcrypt.getRounds(result.saved[0].password), 10);
  assert.equal(jwt.verify(response.data.token, secret).id, 'account-id');
  assert.equal(response.data.user.password, undefined);
});

test('existing Gmail accounts link without duplicating accounts or changing passwords', async () => {
  const existing = { _id: 'existing-id', username: 'original', email: profile.email, password: 'original-hash' };
  const result = fixture({ existing });
  const response = await result.invoke({ credential: 'token' });
  assert.equal(response.statusCode, 200);
  assert.equal(existing.googleId, profile.sub);
  assert.equal(existing.password, 'original-hash');
  assert.equal(jwt.verify(response.data.token, secret).id, 'existing-id');
});

test('non-authoritative third-party email cannot take over an existing password account', async () => {
  const existing = { _id: 'existing-id', email: 'person@example.com', username: 'original' };
  const result = fixture({ existing, claims: { ...profile, email: existing.email } });
  assert.equal((await result.invoke({ credential: 'token', termsAccepted: true })).statusCode, 409);
  assert.equal(result.saved.length, 0);
  assert.equal(existing.googleId, undefined);
});

test('returning Google accounts use the stable Google subject, not a mutable email', async () => {
  const existing = { _id: 'existing-id', username: 'original', email: 'updated@example.com', googleId: profile.sub };
  const result = fixture({ existing });
  assert.equal((await result.invoke({ credential: 'token' })).statusCode, 200);
  assert.equal(existing.email, 'updated@example.com');
  assert.equal(result.saved.length, 1);
});