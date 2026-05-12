"use client";

import { useState, useMemo } from "react";
import { formatTime } from "@/lib/time";
import type { Mark, MarkStatus, AnchorType, LyricLine } from "@/lib/types";
import { MARK_STATUS_LABELS, ANCHOR_TYPE_LABELS } from "@/lib/types";

type SortMode = "createdAt" | "startTime";
type StatusFilter = "all" | "pending" | "modified";
type TypeFilter = "all" | "lyric_line" | "time_range";

type Props = {
  marks: Mark[];
  lyrics: LyricLine[];
  highlightedMarkId: string | null;
  onUpdateMark: (id: string, data: Partial<Mark>) => void;
  onDeleteMark: (id: string) => void;
  onSeekTo: (time: number) => void;
};

function formatMarkTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isToday) return `${hh}:${mm}`;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${hh}:${mm}`;
}

export default function MarkPanel({
  marks,
  lyrics,
  highlightedMarkId,
  onUpdateMark,
  onDeleteMark,
  onSeekTo,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("createdAt");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const lyricMap = useMemo(() => {
    const m = new Map<string, LyricLine>();
    lyrics.forEach((l) => m.set(l.id, l));
    return m;
  }, [lyrics]);

  const filtered = useMemo(() => {
    let result = [...marks];
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((m) => m.anchorType === typeFilter);
    }
    if (sortMode === "createdAt") {
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      result.sort((a, b) => a.startTime - b.startTime);
    }
    return result;
  }, [marks, statusFilter, typeFilter, sortMode]);

  const toggleStatus = (mark: Mark) => {
    const next: MarkStatus = mark.status === "pending" ? "modified" : "pending";
    onUpdateMark(mark.id, { status: next });
  };

  const startEdit = (mark: Mark) => {
    setEditingId(mark.id);
    setEditContent(mark.content);
  };

  const saveEdit = (id: string) => {
    if (editContent.trim()) {
      onUpdateMark(id, { content: editContent.trim() });
    }
    setEditingId(null);
  };

  const getStatusColor = (status: MarkStatus) =>
    status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-green-100 text-green-800";

  const filterBtn = (
    label: string,
    value: string,
    current: string,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      className={`text-xs px-2 py-0.5 rounded ${
        current === value
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <h3 className="text-sm font-semibold text-gray-700">
        Mark 列表（{filtered.length}）
      </h3>

      {/* Status filter */}
      <div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">状态</span>
          {filterBtn("全部", "all", statusFilter, () => setStatusFilter("all"))}
          {filterBtn("待处理", "pending", statusFilter, () => setStatusFilter("pending"))}
          {filterBtn("已修改", "modified", statusFilter, () => setStatusFilter("modified"))}
        </div>
      </div>

      {/* Type filter */}
      <div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">类型</span>
          {filterBtn("全部", "all", typeFilter, () => setTypeFilter("all"))}
          {filterBtn("歌词行", "lyric_line", typeFilter, () => setTypeFilter("lyric_line"))}
          {filterBtn("时间段", "time_range", typeFilter, () => setTypeFilter("time_range"))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-1">排序</span>
        {filterBtn("最近创建", "createdAt", sortMode, () => setSortMode("createdAt"))}
        {filterBtn("播放时间", "startTime", sortMode, () => setSortMode("startTime"))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <p className="text-gray-400 text-xs py-4 text-center">
          暂无符合条件的 Mark
        </p>
      )}

      {/* Mark list */}
      <div className="flex flex-col gap-2">
        {filtered.map((mark) => {
          const isHighlighted = mark.id === highlightedMarkId;
          const lyricLine = mark.anchorType === "lyric_line" && mark.anchorId
            ? lyricMap.get(mark.anchorId)
            : null;

          return (
            <div
              key={mark.id}
              className={`border rounded p-2 text-sm cursor-pointer transition-colors ${
                isHighlighted
                  ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => onSeekTo(mark.startTime)}
            >
              {/* Top row: status + type */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(mark.status)}`}
                >
                  {MARK_STATUS_LABELS[mark.status]}
                </span>
                <span className="text-xs text-gray-400">
                  {ANCHOR_TYPE_LABELS[mark.anchorType]}
                </span>
              </div>

              {/* Author + time */}
              <p className="text-xs text-gray-400 mt-1">
                {mark.createdBy} · {formatMarkTime(mark.createdAt)}
              </p>

              {/* Content */}
              {editingId === mark.id ? (
                <div className="mt-1 flex gap-1">
                  <input
                    className="flex-1 border border-gray-300 rounded px-1 text-xs"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(mark.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit(mark.id);
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <p className="text-xs mt-1 text-gray-700">{mark.content}</p>
              )}

              {/* Time range */}
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(mark.startTime)} - {formatTime(mark.endTime)}
              </div>

              {/* Associated lyric line */}
              {lyricLine && (
                <p className="text-xs text-indigo-500 mt-0.5 truncate">
                  歌词：{lyricLine.text}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleStatus(mark)}
                  className="text-xs text-gray-600 hover:underline"
                >
                  {mark.status === "pending" ? "标记已修改" : "标为待处理"}
                </button>
                {editingId !== mark.id && (
                  <button
                    onClick={() => startEdit(mark)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    编辑
                  </button>
                )}
                <button
                  onClick={() => onDeleteMark(mark.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
