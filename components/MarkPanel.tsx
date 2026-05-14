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

  const statusPill = (
    label: string,
    value: string,
    current: string,
    onClick: () => void,
  ) => {
    const active = current === value;
    return (
      <button
        onClick={onClick}
        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
          active
            ? "bg-[#1D1D1F] text-white"
            : "text-[#6E6E73] hover:text-[#3A3A3C] hover:bg-[#F2F2F7]"
        }`}
      >
        {label}
      </button>
    );
  };

  const selectBtn = (
    label: string,
    value: string,
    current: string,
    onClick: () => void,
  ) => {
    const active = current === value;
    return (
      <button
        onClick={onClick}
        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
          active
            ? "bg-[#F2F2F7] text-[#1D1D1F]"
            : "text-[#6E6E73] hover:text-[#3A3A3C]"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-[16px] font-semibold text-[#1D1D1F]">Mark 列表</h3>
        <span className="text-xs px-2 py-0.5 bg-[#F2F2F7] text-[#6E6E73] rounded-full font-medium">
          {filtered.length}
        </span>
      </div>

      {/* Status filter — pill segmented */}
      <div className="flex items-center gap-0.5 bg-[#F2F2F7] rounded-full p-0.5 w-fit">
        {statusPill("全部", "all", statusFilter, () => setStatusFilter("all"))}
        {statusPill("待处理", "pending", statusFilter, () => setStatusFilter("pending"))}
        {statusPill("已修改", "modified", statusFilter, () => setStatusFilter("modified"))}
      </div>

      {/* Type filter + Sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#A1A1AA] mr-0.5">类型</span>
          {selectBtn("全部", "all", typeFilter, () => setTypeFilter("all"))}
          {selectBtn("歌词", "lyric_line", typeFilter, () => setTypeFilter("lyric_line"))}
          {selectBtn("时间", "time_range", typeFilter, () => setTypeFilter("time_range"))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#A1A1AA] mr-0.5">排序</span>
          {selectBtn("最近", "createdAt", sortMode, () => setSortMode("createdAt"))}
          {selectBtn("播放", "startTime", sortMode, () => setSortMode("startTime"))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <p className="text-[#A1A1AA] text-[14px] text-center py-8">
          暂无符合条件的 Mark
        </p>
      )}

      {/* Mark cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((mark) => {
          const isHighlighted = mark.id === highlightedMarkId;
          const lyricLine = mark.anchorType === "lyric_line" && mark.anchorId
            ? lyricMap.get(mark.anchorId)
            : null;

          return (
            <div
              key={mark.id}
              className={`border rounded-[14px] p-4 cursor-pointer transition-all ${
                isHighlighted
                  ? "border-[#67C7E8] bg-[#F4FBFD] ring-2 ring-[#67C7E8]/25"
                  : "border-black/[0.06] bg-white hover:border-black/[0.10] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              }`}
              style={isHighlighted ? {} : { boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
              onClick={() => onSeekTo(mark.startTime)}
            >
              {/* Top row: status badge + type label */}
              <div className="flex items-center justify-between mb-2">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(mark);
                  }}
                  className={`text-xs px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors ${
                    mark.status === "pending"
                      ? "bg-[#FFF7E6] text-[#A16207] hover:bg-[#FFEDD5]"
                      : "bg-[#ECFDF3] text-[#027A48] hover:bg-[#D1FAE5]"
                  }`}
                >
                  {MARK_STATUS_LABELS[mark.status]}
                </span>
                <span className="text-xs px-2 py-0.5 bg-[#F2F2F7] text-[#6E6E73] rounded-md">
                  {ANCHOR_TYPE_LABELS[mark.anchorType]}
                </span>
              </div>

              {/* Author + time */}
              <p className="text-[13px] text-[#6E6E73] mb-2">
                {mark.createdBy} · {formatMarkTime(mark.createdAt)}
              </p>

              {/* Content */}
              {editingId === mark.id ? (
                <div className="flex gap-1.5 mb-2">
                  <input
                    className="flex-1 h-8 px-2.5 border border-black/[0.08] rounded-[10px] text-[14px] outline-none focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25"
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
                    className="h-8 px-3 bg-[#1D1D1F] text-white text-xs font-medium rounded-[10px] hover:bg-black transition-colors"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <p className="text-[15px] text-[#1D1D1F] font-medium mb-2 leading-snug">
                  {mark.content}
                </p>
              )}

              {/* Time range */}
              <div className="text-[13px] font-mono text-[#0B84A5] mb-1">
                {formatTime(mark.startTime)} - {formatTime(mark.endTime)}
              </div>

              {/* Associated lyric line */}
              {lyricLine && (
                <p className="text-[13px] text-[#6E6E73] truncate">
                  歌词：<span className="text-[#3A3A3C]">{lyricLine.text}</span>
                </p>
              )}

              {/* Actions */}
              <div
                className="flex items-center gap-3 mt-3 pt-3 border-t border-black/[0.06]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => toggleStatus(mark)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                    mark.status === "pending"
                      ? "bg-[#ECFDF3] text-[#027A48] border-[rgba(2,122,72,0.16)] hover:bg-[#DFF8EA]"
                      : "bg-[#F2F2F7] text-[#6E6E73] border-black/[0.06] hover:bg-[#E5E5EA]"
                  }`}
                >
                  {mark.status === "pending" ? "✓ 标记已修改" : "↺ 标为待处理"}
                </button>
                {editingId !== mark.id && (
                  <button
                    onClick={() => startEdit(mark)}
                    className="text-xs text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                  >
                    编辑
                  </button>
                )}
                <button
                  onClick={() => onDeleteMark(mark.id)}
                  className="text-xs text-[#A1A1AA] hover:text-[#FF3B30] transition-colors ml-auto"
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
