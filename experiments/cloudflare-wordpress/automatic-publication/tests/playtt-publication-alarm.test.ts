import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlayttPublicationAlarm } from '../src/playtt-publication-alarm.js';

function storage() {
  const data = new Map<string, unknown>();
  let alarm: number | null = null;
  return {
    data, clearAlarm() { alarm = null; },
    get: async (key: string) => data.get(key),
    put: async (key: string, value: unknown) => { data.set(key, structuredClone(value)); },
    getAlarm: async () => alarm,
    setAlarm: async (at: number) => { alarm = at; },
    deleteAlarm: async () => { alarm = null; },
  };
}

test('committed jobs continue across recreated handler instances and stop when idle', async () => {
  const disk = storage(); let runs = 0;
  const step = async () => ++runs === 1 ? { status: 'rendered', jobKey: 'job', route: '/about/' } : runs === 2 ? { status: 'promoted', jobKey: 'job' } : null;
  for (let i = 0; i < 3; i++) {
    disk.clearAlarm();
    const handler = new PlayttPublicationAlarm(disk as unknown as DurableObjectStorage, step);
    await handler.tick();
    assert.equal((await handler.status()).attempts, 0);
    assert.equal((await disk.getAlarm()) !== null, i < 2);
  }
  assert.equal(runs, 3);
});

test('maintenance pause survives new requests and already queued alarms until explicit resume', async () => {
  const disk = storage(); let runs = 0;
  const handler = new PlayttPublicationAlarm(disk as unknown as DurableObjectStorage, async () => { runs++; return null; });
  await handler.wake(); assert.equal((await handler.status()).state, 'pending');
  await handler.pause(); await handler.wake(); await handler.tick();
  assert.equal(runs, 0); assert.equal((await handler.status()).state, 'paused'); assert.equal(await disk.getAlarm(), null);
  await handler.wake(true); assert.ok(await disk.getAlarm()); await handler.tick(); assert.equal(runs, 1);
});

test('repeated renderer failure is bounded, persisted and requires explicit retry', async () => {
  const disk = storage(); let runs = 0;
  const step = async () => { runs++; throw new Error('Failed render'); };
  for (let i = 0; i < 8; i++) {
    disk.clearAlarm();
    await new PlayttPublicationAlarm(disk as unknown as DurableObjectStorage, step).tick();
  }
  const handler = new PlayttPublicationAlarm(disk as unknown as DurableObjectStorage, step);
  assert.equal(runs, 6); assert.equal((await handler.status()).state, 'blocked');
  await handler.wake(); assert.equal(await disk.getAlarm(), null);
  await handler.wake(true); assert.equal((await handler.status()).attempts, 0); assert.ok(await disk.getAlarm());
});

test('a process dying during PHP leaves an attempt receipt that prevents endless retries', async () => {
  const disk = storage();
  disk.data.set('playtt-publication-status', { state: 'running', attempts: 6, at: new Date().toISOString() });
  const handler = new PlayttPublicationAlarm(disk as unknown as DurableObjectStorage, async () => { assert.fail('Must not re-enter PHP'); });
  await handler.tick(); assert.equal((await handler.status()).state, 'blocked'); assert.equal(await disk.getAlarm(), null);
});
