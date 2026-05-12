"use client";

import { useRef, useEffect } from "react";
import { formatTime, parseTime } from "@/lib/time";
import type { LyricLine } from "@/lib/types";

type Props = {
  lyrics: LyricLine[];
  currentTime: number;
  onSeekTo: (time: number) => void;
  onAddMark: (line: LyricLine) => void;
  onUpdateLine: (id: string, data: Partial<LyricLine>) => void;
  onPasteLyrics: (text: string) => void;
  onGenerateTimeline: () => void;
};

export default function LyricPanel({
  lyrics,
  currentTime,
  onSeekTo,
  onAddMark,
  onUpdateLine,
  onPasteLyrics,
  onGenerateTimeline,
}: Props) {
  const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeIdx = lyrics.findIndex(
    (l) => currentTime >= l.startTime && currentTime <= l.endTime
  );

  useEffect(() => {
    if (activeIdx >= 0) {
      const line = lyrics[activeIdx];
      const el = lineRefs.current.get(line.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeIdx, lyrics]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <textarea
          className="w-full h-24 border border-gray-300 rounded p-2 text-sm resize-none"
          placeholder="在此粘贴歌词，每行一句..."
          id="lyric-paste-area"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              const area = document.getElementById(
                "lyric-paste-area"
              ) as HTMLTextAreaElement;
              if (area?.value.trim()) {
                onPasteLyrics(area.value);
                area.value = "";
              }
            }}
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs"
          >
            解析歌词
          </button>
          {lyrics.length > 0 && (
            <button
              onClick={onGenerateTimeline}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs"
            >
              生成歌词时间轴
            </button>
          )}
        </div>
      </div>

      {lyrics.length === 0 && (
        <p className="text-gray-400 text-xs">暂无歌词，请粘贴歌词后点击「解析歌词」</p>
      )}

      <div
        ref={scrollContainerRef}
        className="flex flex-col gap-1 max-h-[calc(100vh-480px)] overflow-y-auto"
      >
        {lyrics.map((line, idx) => {
          const isActive = idx === activeIdx;
          return (
            <div
              key={line.id}
              ref={(el) => {
                if (el) lineRefs.current.set(line.id, el);
                else lineRefs.current.delete(line.id);
              }}
              onClick={() => onSeekTo(line.startTime)}
              className={`flex flex-col gap-1 p-2 rounded cursor-pointer text-sm border transition-colors ${
                isActive
                  ? "bg-indigo-100 border-indigo-400 ring-1 ring-indigo-300"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={isActive ? "font-semibold text-indigo-800" : ""}>
                  {idx + 1}. {line.text}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddMark(line);
                  }}
                  className="text-xs text-indigo-600 hover:underline shrink-0 ml-2"
                >
                  + Mark
                </button>
              </div>
              <div className="flex gap-2 text-xs text-gray-500">
                <input
                  className="w-16 border border-gray-300 rounded px-1 text-xs"
                  value={formatTime(line.startTime)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const t = parseTime(e.target.value);
                    if (!isNaN(t)) onUpdateLine(line.id, { startTime: t });
                  }}
                />
                <span>-</span>
                <input
                  className="w-16 border border-gray-300 rounded px-1 text-xs"
                  value={formatTime(line.endTime)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const t = parseTime(e.target.value);
                    if (!isNaN(t)) onUpdateLine(line.id, { endTime: t });
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
