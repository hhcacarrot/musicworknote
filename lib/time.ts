export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${secs.toFixed(1).padStart(4, "0")}`;
}

export function parseTime(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  const colonParts = trimmed.split(":");
  if (colonParts.length === 2) {
    return parseInt(colonParts[0], 10) * 60 + parseFloat(colonParts[1]);
  }
  return parseFloat(trimmed);
}
