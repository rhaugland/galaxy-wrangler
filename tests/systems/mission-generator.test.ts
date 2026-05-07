import { generateMissionBoard } from '@/systems/mission-generator';

describe('generateMissionBoard', () => {
  it('generates 5 missions', () => {
    const board = generateMissionBoard(1);
    expect(board).toHaveLength(5);
  });
  it('filters by player level', () => {
    const board = generateMissionBoard(0);
    expect(board.every(m => m.minLevel === 0)).toBe(true);
  });
  it('includes variety of types', () => {
    const board = generateMissionBoard(5);
    const types = new Set(board.map(m => m.type));
    expect(types.size).toBeGreaterThanOrEqual(3);
  });
});
