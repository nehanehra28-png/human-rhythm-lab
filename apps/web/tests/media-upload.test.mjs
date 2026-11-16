import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaBlocksSave } from '../lib/media-upload.mjs';

test('a successful image upload cannot hide a failed video replacement', () => {
  assert.equal(mediaBlocksSave({ video: 'failed', infographic: 'uploaded' }), true);
  assert.equal(mediaBlocksSave({ video: 'uploaded', infographic: 'failed' }), true);
});

test('saving waits until both file transfers have completed', () => {
  assert.equal(mediaBlocksSave({ video: 'uploading', infographic: 'uploaded' }), true);
  assert.equal(mediaBlocksSave({ video: 'uploaded', infographic: 'uploading' }), true);
  assert.equal(mediaBlocksSave({ video: 'uploaded', infographic: 'uploaded' }), false);
});

test('text-only saves and explicitly retained existing media remain available', () => {
  assert.equal(mediaBlocksSave({ video: 'idle', infographic: 'idle' }), false);
  assert.equal(mediaBlocksSave({ video: 'saved', infographic: 'idle' }), false);
});
