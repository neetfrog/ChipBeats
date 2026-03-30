import { SequencerState } from '../types';

export interface ProjectExport {
  version: string;
  timestamp: string;
  name: string;
  bpm: number;
  patterns: SequencerState['patterns'];
  instruments: SequencerState['instruments'];
  masterVolume: number;
  masterCompressor: boolean;
  reverbEnabled: boolean;
  chainedPatternIds: string[];
}

/**
 * Export current sequencer state as JSON
 */
export function exportProject(state: SequencerState, name: string = 'ChipBeat Project'): string {
  const project: ProjectExport = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    name,
    bpm: state.bpm,
    patterns: state.patterns,
    instruments: state.instruments,
    masterVolume: state.masterVolume,
    masterCompressor: state.masterCompressor,
    reverbEnabled: state.reverbEnabled,
    chainedPatternIds: state.chainedPatternIds,
  };
  return JSON.stringify(project, null, 2);
}

/**
 * Download project as JSON file
 */
export function downloadProject(state: SequencerState, filename: string = 'chipbeat_project.json') {
  const json = exportProject(state, filename.replace('.json', ''));
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import project from JSON
 */
export function importProject(json: string): ProjectExport {
  try {
    const project = JSON.parse(json) as ProjectExport;
    // Validate project structure
    if (!project.patterns || !project.instruments) {
      throw new Error('Invalid project structure');
    }
    return project;
  } catch (e) {
    throw new Error(`Failed to import project: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

/**
 * Load project file from user
 */
export function loadProjectFile(): Promise<ProjectExport> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project = importProject(text);
        resolve(project);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}
