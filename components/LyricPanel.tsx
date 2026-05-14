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
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-[#1D1D1F]">歌词时间轴</h3>
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
            className="h-8 px-3 bg-white border border-black/[0.08] text-[#3A3A3C] text-xs font-medium rounded-[10px] hover:bg-[#F2F2F7] transition-colors"
          >
            解析歌词
          </button>
          {lyrics.length > 0 && (
            <button
              onClick={onGenerateTimeline}
              className="h-8 px-3 bg-[#EAF8FC] text-[#0B84A5] border border-[#67C7E8]/25 text-xs font-medium rounded-[10px] hover:bg-[#DDF3FA] transition-colors"
            >
              生成模拟时间轴
            </button>
          )}
        </div>
      </div>

      {/* Paste area */}
      <textarea
        className="w-full h-24 border border-black/[0.08] rounded-[10px] p-3 text-[15px] resize-none outline-none focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25 transition-colors placeholder:text-[#A1A1AA] bg-white"
        placeholder="在此粘贴歌词，每行一句…"
        id="lyric-paste-area"
      />

      {/* Empty state */}
      {lyrics.length === 0 && (
        <p className="text-[#A1A1AA] text-[14px] text-center py-4">
          暂无歌词，请粘贴歌词后点击「解析歌词」
        </p>
      )}

      {/* Lyric lines */}
      <div
        ref={scrollContainerRef}
        className="flex flex-col gap-0.5 max-h-[calc(100vh-520px)] overflow-y-auto"
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
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                isActive
                  ? "bg-[#EAF8FC] border-l-[3px] border-l-[#67C7E8]"
                  : "hover:bg-[#F2F2F7] border-l-[3px] border-l-transparent"
              }`}
            >
              <span className={`shrink-0 w-6 text-xs text-right font-mono ${
                isActive ? "text-[#0B84A5] font-semibold" : "text-[#A1A1AA]"
              }`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-[15px] leading-snug ${
                    isActive
                      ? "text-[#1D1D1F] font-medium"
                      : "text-[#3A3A3C]"
                  }`}
                >
                  {line.text}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  className={`w-[68px] h-7 border border-transparent rounded-md px-1 text-xs text-center font-mono outline-none bg-transparent hover:bg-[#FAFAFA] focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25 focus:bg-white transition-colors ${
                    isActive ? "text-[#0B84A5]" : "text-[#6E6E73]"
                  }`}
                  value={formatTime(line.startTime)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const t = parseTime(e.target.value);
                    if (!isNaN(t)) onUpdateLine(line.id, { startTime: t });
                  }}
                />
                <span className="text-[#A1A1AA] text-xs select-none">–</span>
                <input
                  className={`w-[68px] h-7 border border-transparent rounded-md px-1 text-xs text-center font-mono outline-none bg-transparent hover:bg-[#FAFAFA] focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25 focus:bg-white transition-colors ${
                    isActive ? "text-[#0B84A5]" : "text-[#6E6E73]"
                  }`}
                  value={formatTime(line.endTime)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const t = parseTime(e.target.value);
                    if (!isNaN(t)) onUpdateLine(line.id, { endTime: t });
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddMark(line);
                  }}
                  className={`h-7 px-2 text-xs rounded-md font-medium transition-all ${
                    isActive
                      ? "text-[#0B84A5] hover:bg-[#67C7E8]/15"
                      : "text-[#A1A1AA] hover:text-[#0B84A5] hover:bg-[#F2F2F7] opacity-0 group-hover:opacity-100"
                  }`}
                >
                  + Mark
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
