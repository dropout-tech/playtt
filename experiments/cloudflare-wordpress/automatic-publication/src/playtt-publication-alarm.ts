type Step = { status: string; jobKey: string; route?: string } | null;
export interface PlayttPublicationStatus {
  state: 'idle' | 'running' | 'pending' | 'blocked' | 'paused';
  attempts: number;
  at: string;
  result?: string;
  jobKey?: string;
  route?: string;
  error?: string;
}
const KEY = 'playtt-publication-status';
const MAX_ATTEMPTS = 6;

// Only pending outbox work schedules another invocation. No idle polling cron.
// Store the attempt before entering PHP so a CPU/memory crash is also bounded.
export class PlayttPublicationAlarm {
  constructor(private storage: DurableObjectStorage, private step: () => Promise<Step>) {}
  async status(): Promise<PlayttPublicationStatus> {
    return await this.storage.get<PlayttPublicationStatus>(KEY) || { state: 'idle', attempts: 0, at: new Date().toISOString() };
  }
  async wake(force = false): Promise<void> {
    const current = await this.status();
    if (['blocked', 'paused'].includes(current.state) && !force) return;
    if (force || current.state === 'idle') await this.storage.put(KEY, { ...current, state: 'pending', attempts: 0 });
    if (force || await this.storage.getAlarm() === null) await this.storage.setAlarm(Date.now() + 1_000);
  }
  async pause(): Promise<void> {
    await this.storage.put(KEY, { ...await this.status(), state: 'paused', at: new Date().toISOString() });
    await this.storage.deleteAlarm();
  }
  async tick(): Promise<void> {
    const previous = await this.status();
    if (previous.state === 'paused') return;
    if (previous.attempts >= MAX_ATTEMPTS) {
      await this.storage.put(KEY, { ...previous, state: 'blocked', at: new Date().toISOString() });
      return;
    }
    const attempts = previous.attempts + 1;
    await this.storage.put(KEY, { state: 'running', attempts, at: new Date().toISOString() });
    try {
      const result = await this.step();
      if (!result) {
        await this.storage.put(KEY, { state: 'idle', attempts: 0, at: new Date().toISOString() });
        return;
      }
      const progressed = ['rendered', 'promoted', 'stale'].includes(result.status);
      const blocked = !progressed && attempts >= MAX_ATTEMPTS;
      await this.storage.put(KEY, {
        state: blocked ? 'blocked' : 'pending', attempts: progressed ? 0 : attempts,
        at: new Date().toISOString(), result: result.status, jobKey: result.jobKey,
        ...(result.route ? { route: result.route } : {}),
      });
      if (!blocked) await this.storage.setAlarm(Date.now() + (progressed ? 1_000 : Math.min(120_000, 5_000 * 2 ** (attempts - 1))));
    } catch (error) {
      await this.storage.put(KEY, {
        state: attempts >= MAX_ATTEMPTS ? 'blocked' : 'pending', attempts,
        at: new Date().toISOString(), error: error instanceof Error ? error.message.slice(0, 240) : 'Publication failed',
      });
      if (attempts < MAX_ATTEMPTS) await this.storage.setAlarm(Date.now() + Math.min(120_000, 5_000 * 2 ** (attempts - 1)));
    }
  }
}
