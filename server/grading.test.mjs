import assert from 'node:assert/strict';
import test from 'node:test';
import { gradeOutput, normalizeOutput } from './grading.mjs';

test('normalizes Windows line endings without accepting extra output', () => {
  assert.equal(normalizeOutput('one\r\ntwo\r\n'), 'one\ntwo');
  const graded = gradeOutput({ exitCode: 0, output: 'one\ntwo\n', error: '' }, [
    { id: '1', description: 'output', expectedOutput: 'one\ntwo' }
  ]);
  assert.equal(graded.success, true);
  assert.equal(gradeOutput({ exitCode: 0, output: 'one\ntwo\nextra', error: '' }, [
    { id: '1', description: 'output', expectedOutput: 'one\ntwo' }
  ]).success, false);
});
