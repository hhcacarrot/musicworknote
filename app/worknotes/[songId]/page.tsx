"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { SongWorknote, LyricLine, Mark } from "@/lib/types";
import { LOCAL_USER_NAME } from "@/lib/constants";
import {
  getSong,
  getLyricLines,
  saveLyricLines,
  getMarks,
  saveMark,
  updateMark,
  deleteMark,
  updateSong,
} from "@/lib/storage";
import { generateId } from "@/lib/utils";
import AudioWaveform, { type AudioWaveformHandle } from "@/components/AudioWaveform";
import LyricPanel from "@/components/LyricPanel";
import MarkPanel from "@/components/MarkPanel";
import MarkDraftPanel from "@/components/MarkDraftPanel";

type MarkingState =
  | { phase: "idle" }
  | { phase: "marking"; startTime: number }
  | { phase: "drafting"; startTime: number; endTime: number };

export default function WorknotePage() {
  const params = useParams();
  const router = useRouter();
  const songId = params.songId as string;

  const [song, setSong] = useState<SongWorknote | null>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<AudioWaveformHandle>(null);

  const [markingState, setMarkingState] = useState<MarkingState>({ phase: "idle" });

  const [markingLine, setMarkingLine] = useState<LyricLine | null>(null);
  const [markContent, setMarkContent] = useState("");

  const [highlightedMarkId, setHighlightedMarkId] = useState<string | null>(null);

  useEffect(() => {
    const s = getSong(songId);
    if (!s) {
      router.push("/projects");
      return;
    }
    setSong(s);
    setLyrics(getLyricLines(songId));
    setMarks(getMarks(songId));
  }, [songId, router]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setMarkingState({ phase: "idle" });
  };

  const handlePasteLyrics = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const lyricLines: LyricLine[] = lines.map((text, i) => ({
      id: generateId(),
      songId,
      text,
      startTime: 0,
      endTime: 0,
      order: i,
    }));
    setLyrics(lyricLines);
    saveLyricLines(songId, lyricLines);
  };

  const handleGenerateTimeline = () => {
    if (lyrics.length === 0 || duration === 0) return;
    const segment = duration / lyrics.length;
    const updated = lyrics.map((line, i) => ({
      ...line,
      startTime: i * segment,
      endTime: (i + 1) * segment,
    }));
    setLyrics(updated);
    saveLyricLines(songId, updated);
  };

  const handleUpdateLine = (id: string, data: Partial<LyricLine>) => {
    setLyrics((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...data } : l));
      saveLyricLines(songId, next);
      return next;
    });
  };

  const handleStartMarking = useCallback(() => {
    setMarkingState({ phase: "marking", startTime: currentTime });
  }, [currentTime]);

  const handleEndMarking = useCallback(() => {
    setMarkingState((prev) => {
      if (prev.phase !== "marking") return prev;
      let endTime = currentTime;
      if (endTime <= prev.startTime) {
        endTime = prev.startTime + 5;
      }
      if (endTime > duration) {
        endTime = duration;
      }
      audioRef.current?.pause();
      return { phase: "drafting", startTime: prev.startTime, endTime };
    });
  }, [currentTime, duration]);

  const handleAudioFinish = useCallback(() => {
    setMarkingState((prev) => {
      if (prev.phase === "marking") {
        const endTime = duration;
        return {
          phase: "drafting",
          startTime: prev.startTime,
          endTime: endTime > prev.startTime ? endTime : prev.startTime + 5,
        };
      }
      return prev;
    });
  }, [duration]);

  const newMarkBase = () => ({
    createdBy: LOCAL_USER_NAME,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSaveDraftMark = useCallback(
    (startTime: number, endTime: number, content: string) => {
      const mark: Mark = {
        id: generateId(),
        songId,
        anchorType: "time_range",
        anchorId: null,
        startTime,
        endTime,
        content,
        status: "pending",
        ...newMarkBase(),
      };
      saveMark(mark);
      setMarks((prev) => [mark, ...prev]);
      updateSong(songId, {});
      setHighlightedMarkId(mark.id);
      setTimeout(() => setHighlightedMarkId(null), 1500);
      setMarkingState({ phase: "idle" });
    },
    [songId],
  );

  const handleCancelDraft = useCallback(() => {
    setMarkingState({ phase: "idle" });
  }, []);

  const handleAddLyricMark = () => {
    if (!markingLine || !markContent.trim()) return;
    const mark: Mark = {
      id: generateId(),
      songId,
      anchorType: "lyric_line",
      anchorId: markingLine.id,
      startTime: markingLine.startTime,
      endTime: markingLine.endTime,
      content: markContent.trim(),
      status: "pending",
      ...newMarkBase(),
    };
    saveMark(mark);
    setMarks((prev) => [mark, ...prev]);
    updateSong(songId, {});
    setHighlightedMarkId(mark.id);
    setTimeout(() => setHighlightedMarkId(null), 1500);
    setMarkingLine(null);
    setMarkContent("");
  };

  const handleUpdateMark = (id: string, data: Partial<Mark>) => {
    const updated = updateMark(id, data);
    if (updated) {
      setMarks((prev) => prev.map((m) => (m.id === id ? updated : m)));
      updateSong(songId, {});
    }
  };

  const handleDeleteMark = (id: string) => {
    deleteMark(id);
    setMarks((prev) => prev.filter((m) => m.id !== id));
    updateSong(songId, {});
  };

  const handleSeekTo = (time: number) => {
    audioRef.current?.seekTo(time);
  };

  if (!song) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#A1A1AA] text-[15px]">
        加载中...
      </div>
    );
  }

  const hasAudio = duration > 0;

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F7]">
      {/* Header */}
      <header className="flex items-center px-6 h-14 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] shrink-0">
        <Link
          href="/projects"
          className="text-[14px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors mr-5"
        >
          ← 返回
        </Link>
        <h1 className="text-xl font-semibold text-[#1D1D1F] truncate tracking-tight">
          {song.title}
        </h1>
        <span className="ml-3 text-xs px-2.5 py-0.5 bg-[#F2F2F7] text-[#6E6E73] rounded-full">
          本地 Demo
        </span>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column — Player + Lyric */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 p-6 overflow-y-auto">
          {/* Player card */}
          <div
            className="bg-white border border-black/[0.06] rounded-2xl p-5"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
          >
            <h3 className="text-[14px] font-semibold text-[#1D1D1F] mb-3">音频</h3>

            {/* Upload area */}
            <div className="mb-4">
              <label className="inline-flex items-center gap-2 h-9 px-4 bg-white border border-black/[0.08] text-[#3A3A3C] text-[14px] font-medium rounded-[10px] hover:bg-[#F2F2F7] transition-colors cursor-pointer">
                上传音频
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </label>
              {audioUrl && (
                <span className="ml-3 text-[13px] text-[#A1A1AA]">
                  本地临时预览，刷新后丢失
                </span>
              )}
            </div>

            {/* Waveform + controls */}
            <AudioWaveform
              ref={audioRef}
              audioUrl={audioUrl}
              onTimeUpdate={setCurrentTime}
              onDurationReady={setDuration}
              onFinish={handleAudioFinish}
              markingPhase={markingState.phase}
              markingStartTime={
                markingState.phase === "marking" ? markingState.startTime : null
              }
              onStartMarking={handleStartMarking}
              onEndMarking={handleEndMarking}
              hasAudio={hasAudio}
            />

            {/* Mark draft panel */}
            {markingState.phase === "drafting" && (
              <div className="mt-4 pt-4 border-t border-black/[0.06]">
                <MarkDraftPanel
                  startTime={markingState.startTime}
                  endTime={markingState.endTime}
                  duration={duration}
                  onSave={handleSaveDraftMark}
                  onCancel={handleCancelDraft}
                />
              </div>
            )}
          </div>

          {/* Lyric panel card */}
          <div
            className="bg-white border border-black/[0.06] rounded-2xl p-5"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
          >
            <LyricPanel
              lyrics={lyrics}
              currentTime={currentTime}
              onSeekTo={handleSeekTo}
              onAddMark={(line) => setMarkingLine(line)}
              onUpdateLine={handleUpdateLine}
              onPasteLyrics={handlePasteLyrics}
              onGenerateTimeline={handleGenerateTimeline}
            />
          </div>

          {/* Inline lyric mark form */}
          {markingLine && (
            <div className="bg-[#F4FBFD] border border-[#67C7E8]/25 rounded-2xl p-4">
              <p className="text-[14px] text-[#3A3A3C] mb-2.5">
                为「{markingLine.text}」添加 Mark
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-10 px-3 border border-black/[0.08] rounded-[10px] text-[15px] outline-none focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25 transition-colors"
                  placeholder="输入 Mark 内容"
                  value={markContent}
                  onChange={(e) => setMarkContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLyricMark()}
                  autoFocus
                />
                <button
                  onClick={handleAddLyricMark}
                  className="h-10 px-4 bg-[#1D1D1F] text-white text-[14px] font-medium rounded-[10px] hover:bg-black transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setMarkingLine(null);
                    setMarkContent("");
                  }}
                  className="h-10 px-4 bg-white border border-black/[0.08] text-[#3A3A3C] text-[14px] rounded-[10px] hover:bg-[#F2F2F7] transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column — Mark panel */}
        <div className="w-[400px] shrink-0 border-l border-black/[0.06] bg-white overflow-y-auto p-5">
          <MarkPanel
            marks={marks}
            lyrics={lyrics}
            highlightedMarkId={highlightedMarkId}
            onUpdateMark={handleUpdateMark}
            onDeleteMark={handleDeleteMark}
            onSeekTo={handleSeekTo}
          />
        </div>
      </div>
    </div>
  );
}
