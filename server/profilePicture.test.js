import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PROFILE_PICTURE_BYTES, normalizeProfilePicture } from './profilePicture.js';

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

test('a valid image is returned as self-contained persistent data, not a local path', () => {
  assert.equal(normalizeProfilePicture(png, 'avatar.png'), png);
  assert.equal(normalizeProfilePicture(png, 'AVATAR.PNG'), png);
});

test('missing data and filenames are rejected', () => {
  assert.throws(() => normalizeProfilePicture(null, 'avatar.png'));
  assert.throws(() => normalizeProfilePicture(png, undefined));
});

test('unsupported and active content cannot be uploaded as an image', () => {
  const svg = `data:image/svg+xml;base64,${Buffer.from('<svg></svg>').toString('base64')}`;
  assert.throws(() => normalizeProfilePicture(svg, 'avatar.svg'));
  const disguised = `data:image/png;base64,${Buffer.from('<script>alert(1)</script>').toString('base64')}`;
  assert.throws(() => normalizeProfilePicture(disguised, 'avatar.png'));
});

test('mismatched extensions and malformed base64 are rejected', () => {
  assert.throws(() => normalizeProfilePicture(png, 'avatar.jpg'));
  assert.throws(() => normalizeProfilePicture('data:image/png;base64,broken!', 'avatar.png'));
  assert.throws(() => normalizeProfilePicture('data:image/png;base64,', 'avatar.png'));
});

test('pictures exceeding the size limit are rejected before persistence', () => {
  const bytes = Buffer.alloc(MAX_PROFILE_PICTURE_BYTES + 1);
  const oversized = `data:image/png;base64,${bytes.toString('base64')}`;
  assert.throws(() => normalizeProfilePicture(oversized, 'avatar.png'), /5MB/);
});