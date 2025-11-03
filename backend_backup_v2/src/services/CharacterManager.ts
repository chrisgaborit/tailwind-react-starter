/**
 * Character Manager - Ensures Character Diversity in Scenarios
 * 
 * Replaces generic names (Alex, Jordan) with diverse character names
 * to avoid repetition and create more engaging scenarios.
 */

import type { StoryboardScene } from '../../../packages/shared/src/types';

export class CharacterManager {
  private static namePools = {
    managers: ['Sarah Chen', 'David Rodriguez', 'Maria Garcia', 'James Wilson', 'Lisa Thompson', 'Michael Brown', 'Priya Patel', 'Ahmed Hassan'],
    team_members: ['Jordan Taylor', 'Emily Chen', 'Marcus Johnson', 'Sophia Williams', 'Kevin Davis', 'Olivia Martinez', 'Wei Zhang', 'Isabella Lopez'],
    departments: ['Marketing', 'Operations', 'Engineering', 'Customer Success', 'Finance', 'HR', 'Product', 'Sales']
  };

  /**
   * Assigns diverse characters to scenario and example scenes
   */
  static assignCharacters(scenes: StoryboardScene[]): StoryboardScene[] {
    const used = new Set<string>();
    return scenes.map((scene, index) => {
      if (scene.pedagogical_purpose === 'scenario' || scene.pedagogical_purpose === 'example') {
        const chars = this.getUniqueCharacters(used);
        used.add(chars.manager);
        used.add(chars.team_member);
        const updated = {
          ...scene,
          onScreenText: this.replace(typeof scene.onScreenText === 'string' ? scene.onScreenText : '', chars),
          narrationScript: this.replace(scene.narrationScript, chars),
          audio: {
            ...scene.audio,
            script: this.replace(scene.audio?.script, chars)
          },
          metadata: { 
            ...scene.metadata, 
            assigned_characters: chars, 
            character_assignment_index: index 
          }
        };
        return updated;
      }
      return scene;
    });
  }

  /**
   * Gets unique characters that haven't been used yet
   */
  private static getUniqueCharacters(used: Set<string>) {
    const availMgr = this.namePools.managers.filter(n => !used.has(n));
    const availTeam = this.namePools.team_members.filter(n => !used.has(n));
    return {
      manager: availMgr.length ? availMgr[Math.floor(Math.random() * availMgr.length)] : this.pick(this.namePools.managers),
      team_member: availTeam.length ? availTeam[Math.floor(Math.random() * availTeam.length)] : this.pick(this.namePools.team_members),
      department: this.pick(this.namePools.departments)
    };
  }

  /**
   * Randomly picks from an array
   */
  private static pick(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Replaces generic names with diverse character names
   */
  private static replace(text?: string, chars?: any) {
    if (!text || !chars) return text;
    return text
      .replace(/\bAlex\b/gi, chars.manager)
      .replace(/\bJordan\b/gi, chars.team_member)
      .replace(/\bSales\b/gi, chars.department)
      .replace(/\bMarketing\b/gi, chars.department)
      .replace(/\bEngineering\b/gi, chars.department);
  }
}
