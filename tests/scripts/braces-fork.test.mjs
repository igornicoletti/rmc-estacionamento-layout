import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const braces = require('braces');
const { flatten } = require('braces/lib/utils');

test('local braces fork preserves ordinary compile and expansion', () => {
  assert.deepEqual(braces('a/{b,c}/d'), ['a/(b|c)/d']);
  assert.deepEqual(braces('a/{b,c}/d', { expand: true }), ['a/b/d', 'a/c/d']);
  assert.equal(braces.stringify('a/{b,c}/d'), 'a/{b,c}/d');
});

test('nested patterns are rejected before recursive AST walkers exhaust the stack', () => {
  const pattern = '{a,'.repeat(200) + 'z' + '}'.repeat(200);
  for (const invoke of [
    () => braces.parse(pattern),
    () => braces.compile(pattern),
    () => braces.expand(pattern),
    () => braces.stringify(pattern),
  ]) {
    assert.throws(invoke, { name: 'RangeError', message: /nesting exceeds 100 levels/ });
  }
});

test('direct deeply nested AST and array inputs are also bounded', () => {
  const root = { type: 'root', nodes: [] };
  let node = root;
  for (let i = 0; i < 200; i++) {
    const child = { type: 'brace', open: true, close: true, commas: 1, nodes: [] };
    node.nodes.push(child);
    node = child;
  }
  node.nodes.push({ type: 'text', value: 'x' });
  assert.throws(() => braces.compile(root), /nesting exceeds 100 levels/);
  assert.throws(() => braces.expand(root), /nesting exceeds 100 levels/);
  assert.throws(() => braces.stringify(root), /nesting exceeds 100 levels/);

  let nested = 'x';
  for (let i = 0; i < 200; i++) nested = [nested];
  assert.throws(() => flatten(nested), /nesting exceeds 100 levels/);
});
