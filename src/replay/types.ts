export interface ReplayMeta {
  file: string;
  map_name: string;
  game_version: string;
  base_build: number | null;
  duration_seconds: number | null;
  speed: string;
}

export interface ReplayPlayer {
  pid: number;
  name: string;
  race: string;
  result: string;
  team: number | null;
}

export interface ReplayExportData {
  meta: ReplayMeta;
  players: ReplayPlayer[];
  timeline: unknown[];
  samples: unknown[];
  composition: unknown[];
  units: unknown[];
}

export interface EditorDocument {
  schema: string;
  title: string;
  markdown: string;
  data: ReplayExportData;
  timeline_view: unknown;
}
