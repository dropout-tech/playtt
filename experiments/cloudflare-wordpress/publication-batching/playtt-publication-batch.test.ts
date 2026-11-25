import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectPublicationBatch, MAX_PLAYTT_PUBLICATION_BATCH, type PublicationCandidate } from '../src/playtt-publication-batch.js';

const job = (version: number, upsert: string[] = [], remove: string[] = [], all = false, committed = true): PublicationCandidate => ({ key: 'job-' + version, version, committed, changes: { all, upsert, remove } });

test('multiple page edits and a shared change retain every affected route at the newest committed snapshot', () => {
  assert.deepEqual(selectPublicationBatch([job(2, ['/about/']), job(3, ['/class/']), job(4, [], [], true)], 1), {
    key: 'job-4', changes: { all: true, upsert: ['/about/', '/class/'], remove: [] },
  });
});

test('withdrawal and later republishing follow edit order, including a newly created then withdrawn page', () => {
  assert.deepEqual(selectPublicationBatch([job(2, ['/new/', '/about/']), job(3, [], ['/new/', '/about/']), job(4, ['/about/'])], 1), {
    key: 'job-4', changes: { all: false, upsert: ['/about/'], remove: ['/new/'] },
  });
});

test('a failed or unfinished commit is a barrier; later content cannot silently skip its publication intent', () => {
  assert.deepEqual(selectPublicationBatch([job(2, ['/about/']), job(3, ['/class/'], [], false, false), job(4, ['/partner/'])], 1), {
    key: 'job-2', changes: { all: false, upsert: ['/about/'], remove: [] },
  });
  assert.deepEqual(selectPublicationBatch([job(3, [], [], false, false), job(4)], 1), { key: 'job-3' });
});

test('already published jobs retain the existing receipt and cleanup path', () => {
  assert.deepEqual(selectPublicationBatch([job(2), job(4)], 3), { key: 'job-2' });
  assert.equal(selectPublicationBatch([], 0), null);
});

test('a batch has the same visible route membership as applying all edits in order', () => {
  const routes = ['/about/', '/new/', '/class/'];
  // Exhaust all three edits over three routes: no-op, publish, or withdraw.
  for (let scenario = 0; scenario < 729; scenario++) {
    let code = scenario;
    const jobs: PublicationCandidate[] = [], expected = new Set(['/about/', '/class/']);
    for (let i = 0; i < 3; i++) {
      const route = routes[code % 3]; code = Math.floor(code / 3);
      const action = code % 3; code = Math.floor(code / 3);
      if (action === 1) expected.add(route);
      if (action === 2) expected.delete(route);
      jobs.push(job(i + 2, action === 1 ? [route] : [], action === 2 ? [route] : [], i === 1));
    }
    const batch = selectPublicationBatch(jobs, 1)!;
    const actual = new Set(['/about/', '/class/']);
    for (const route of batch.changes!.remove) actual.delete(route);
    for (const route of batch.changes!.upsert) actual.add(route);
    assert.deepEqual([...actual].sort(), [...expected].sort());
  }
});

test('out-of-order, duplicate and excessive windows are rejected', () => {
  for (const jobs of [[job(3), job(2)], [job(2), job(2)], Array.from({ length: MAX_PLAYTT_PUBLICATION_BATCH + 1 }, (_, i) => job(i + 1))]) {
    assert.throws(() => selectPublicationBatch(jobs, 0), /bounded and strictly ordered/);
  }
});
