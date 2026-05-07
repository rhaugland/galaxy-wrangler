import { SaveManager } from '@/systems/save-system';
import { createDefaultPlayer } from '@/models/player';

class MockStorage {
  private data: string | null = null;
  async get() { return this.data ? JSON.parse(this.data) : null; }
  async set(val: any) { this.data = JSON.stringify(val); }
  async clear() { this.data = null; }
}

describe('SaveManager', () => {
  it('saves and loads player data', async () => {
    const mgr = new SaveManager(new MockStorage());
    const player = createDefaultPlayer();
    player.coins = 42;
    await mgr.save(player);
    const loaded = await mgr.load();
    expect(loaded?.coins).toBe(42);
  });

  it('returns null when no save exists', async () => {
    const mgr = new SaveManager(new MockStorage());
    const loaded = await mgr.load();
    expect(loaded).toBeNull();
  });
});
