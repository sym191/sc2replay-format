export interface IconRegistry {
  has(name: string): boolean;
  getUrl(name: string): string | null;
  list(): string[];
}

export interface IconTokenMeta {
  name: string;
}
