import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'violet-vector-db-'));
const databasePath = path.join(tempDir, 'memory.sqlite');

process.env.VECTOR_DB_PATH = databasePath;

const { ServerVectorDB } = await import('../../server/VectorDB');

test('VectorDB should store, search, and delete memories in SQLite', () => {
  ServerVectorDB.initialize();
  ServerVectorDB.deletePlayerMemories('alice');

  ServerVectorDB.addMemory('alice', 'first memory', [1, 0, 0]);
  ServerVectorDB.addMemory('alice', 'second memory', [0.9, 0.1, 0]);
  ServerVectorDB.addMemory('alice', 'third memory', [0, 1, 0]);

  const results = ServerVectorDB.search('alice', [1, 0, 0], 2);
  assert.equal(results.length, 2);
  assert.equal(results[0], 'first memory');
  assert.ok(results.includes('second memory'));

  ServerVectorDB.deletePlayerMemories('alice');
  assert.deepEqual(ServerVectorDB.search('alice', [1, 0, 0], 3), []);
});