export type MarkStatus = "pending" | "modified";

export type AnchorType = "lyric_line" | "time_range";

export type SongWorknote = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type LyricLine = {
  id: string;
  songId: string;
  text: string;
  startTime: number;
  endTime: number;
  order: number;
};

export type Mark = {
  id: string;
  songId: string;
  anchorType: AnchorType;
  anchorId?: string | null;
  startTime: number;
  endTime: number;
  content: string;
  status: MarkStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export const MARK_STATUS_LABELS: Record<MarkStatus, string> = {
  pending: "待处理",
  modified: "已修改",
};

export const ANCHOR_TYPE_LABELS: Record<AnchorType, string> = {
  lyric_line: "歌词行",
  time_range: "时间段",
};
