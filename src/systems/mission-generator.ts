import { MissionTemplate } from '@/models/types';
import { MISSION_TEMPLATES } from '@/config/missions';

export function generateMissionBoard(playerLevel: number): MissionTemplate[] {
  const eligible = MISSION_TEMPLATES.filter(m => m.minLevel <= playerLevel);
  const shuffled = eligible.sort(() => Math.random() - 0.5);
  const board: MissionTemplate[] = [];
  const usedTypes = new Set<string>();
  for (const m of shuffled) {
    if (board.length >= 5) break;
    if (usedTypes.size < 3 || !usedTypes.has(m.type)) {
      board.push(m);
      usedTypes.add(m.type);
    }
  }
  return board.length < 5 ? shuffled.slice(0, 5) : board;
}
