import type { SongWorknote, LyricLine, Mark } from "./types";
import { LOCAL_USER_NAME } from "./constants";
import { generateId } from "./utils";

const MIGRATED_KEY = "mwn_migrated_v2";

const KEYS = {
  songs: "mwn_songs",
  lyrics: (songId: string) => `mwn_lyrics_${songId}`,
  marks: (songId: string) => `mwn_marks_${songId}`,
};

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Migration: clean up track data (v1) + add createdBy/createdAt (v2)
export function migrateStorage(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY)) return;

  const songs = read<SongWorknote>(KEYS.songs);
  const now = new Date().toISOString();

  for (const song of songs) {
    // v1: Remove old track storage key
    localStorage.removeItem(`mwn_tracks_${song.id}`);

    // v1: Clean up marks — remove track_time_range marks, strip trackId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawMarks = read<any>(KEYS.marks(song.id));
    const cleaned = rawMarks
      .filter((m: { anchorType?: string }) => m.anchorType !== "track_time_range")
      .map((m: { trackId?: unknown; createdBy?: unknown; createdAt?: unknown }) => {
        const { trackId, ...rest } = m;
        return {
          ...rest,
          createdBy: rest.createdBy ?? LOCAL_USER_NAME,
          createdAt: rest.createdAt ?? now,
        };
      });
    write(KEYS.marks(song.id), cleaned);
  }

  localStorage.setItem(MIGRATED_KEY, "1");
}

// Songs

export function getAllSongs(): SongWorknote[] {
  migrateStorage();
  return read<SongWorknote>(KEYS.songs).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getSong(id: string): SongWorknote | undefined {
  return read<SongWorknote>(KEYS.songs).find((s) => s.id === id);
}

export function createSong(title: string): SongWorknote {
  migrateStorage();
  const songs = read<SongWorknote>(KEYS.songs);
  const now = new Date().toISOString();
  const song: SongWorknote = { id: generateId(), title, createdAt: now, updatedAt: now };
  songs.push(song);
  write(KEYS.songs, songs);
  return song;
}

export function updateSong(id: string, data: Partial<SongWorknote>): SongWorknote | undefined {
  const songs = read<SongWorknote>(KEYS.songs);
  const idx = songs.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  songs[idx] = { ...songs[idx], ...data, updatedAt: new Date().toISOString() };
  write(KEYS.songs, songs);
  return songs[idx];
}

export function deleteSong(id: string): void {
  const songs = read<SongWorknote>(KEYS.songs).filter((s) => s.id !== id);
  write(KEYS.songs, songs);
  localStorage.removeItem(KEYS.lyrics(id));
  localStorage.removeItem(KEYS.marks(id));
}

// Lyrics

export function getLyricLines(songId: string): LyricLine[] {
  return read<LyricLine>(KEYS.lyrics(songId)).sort((a, b) => a.order - b.order);
}

export function saveLyricLines(songId: string, lines: LyricLine[]): void {
  write(KEYS.lyrics(songId), lines);
}

export function updateLyricLine(id: string, data: Partial<LyricLine>): LyricLine | undefined {
  const songs = read<SongWorknote>(KEYS.songs);
  for (const song of songs) {
    const lines = read<LyricLine>(KEYS.lyrics(song.id));
    const idx = lines.findIndex((l) => l.id === id);
    if (idx !== -1) {
      lines[idx] = { ...lines[idx], ...data };
      write(KEYS.lyrics(song.id), lines);
      return lines[idx];
    }
  }
  return undefined;
}

// Marks

export function getMarks(songId: string): Mark[] {
  return read<Mark>(KEYS.marks(songId)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveMark(mark: Mark): void {
  const marks = read<Mark>(KEYS.marks(mark.songId));
  marks.push(mark);
  write(KEYS.marks(mark.songId), marks);
}

export function updateMark(id: string, data: Partial<Mark>): Mark | undefined {
  const songs = read<SongWorknote>(KEYS.songs);
  for (const song of songs) {
    const marks = read<Mark>(KEYS.marks(song.id));
    const idx = marks.findIndex((m) => m.id === id);
    if (idx !== -1) {
      marks[idx] = { ...marks[idx], ...data, updatedAt: new Date().toISOString() };
      write(KEYS.marks(song.id), marks);
      return marks[idx];
    }
  }
  return undefined;
}

export function deleteMark(id: string): void {
  const songs = read<SongWorknote>(KEYS.songs);
  for (const song of songs) {
    const marks = read<Mark>(KEYS.marks(song.id));
    const filtered = marks.filter((m) => m.id !== id);
    if (filtered.length !== marks.length) {
      write(KEYS.marks(song.id), filtered);
      return;
    }
  }
}
