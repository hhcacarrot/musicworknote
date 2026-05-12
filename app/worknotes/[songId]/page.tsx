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

  // Lyric mark creation state
  const [markingLine, setMarkingLine] = useState<LyricLine | null>(null);
  const [markContent, setMarkContent] = useState("");

  // New mark highlight
  const [highlightedMarkId, setHighlightedMarkId] = useState<string | null>(null);

  // Load data from localStorage
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

  // Cleanup blob URL on unmount
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

  // Lyric operations
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

  // --- Marking state machine ---

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
      setHighlightedMarkId(mark.id);
      setTimeout(() => setHighlightedMarkId(null), 1500);
      setMarkingState({ phase: "idle" });
    },
    [songId],
  );

  const handleCancelDraft = useCallback(() => {
    setMarkingState({ phase: "idle" });
  }, []);

  // --- Lyric Mark operations ---

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
    setHighlightedMarkId(mark.id);
    setTimeout(() => setHighlightedMarkId(null), 1500);
    setMarkingLine(null);
    setMarkContent("");
  };

  const handleUpdateMark = (id: string, data: Partial<Mark>) => {
    const updated = updateMark(id, data);
    if (updated) {
      setMarks((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
  };

  const handleDeleteMark = (id: string) => {
    deleteMark(id);
    setMarks((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSeekTo = (time: number) => {
    audioRef.current?.seekTo(time);
  };

  if (!song) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        加载中...
      </div>
    );
  }

  const hasAudio = duration > 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回
          </Link>
          <h1 className="font-semibold text-gray-800">{song.title}</h1>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
            本地 Demo
          </span>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column — Player + Waveform + Lyric timeline */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto p-4 gap-4">
          {/* Audio upload */}
          <div>
            <label className="inline-block px-4 py-2 bg-gray-600 text-white rounded text-sm cursor-pointer hover:bg-gray-700">
              上传音频
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
            </label>
            {audioUrl && (
              <span className="ml-3 text-xs text-gray-500">
                音频已加载（本地临时预览，刷新后丢失）
              </span>
            )}
          </div>

          {/* Waveform with marking controls */}
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
            <MarkDraftPanel
              startTime={markingState.startTime}
              endTime={markingState.endTime}
              duration={duration}
              onSave={handleSaveDraftMark}
              onCancel={handleCancelDraft}
            />
          )}

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Lyric input + timeline */}
          <LyricPanel
            lyrics={lyrics}
            currentTime={currentTime}
            onSeekTo={handleSeekTo}
            onAddMark={(line) => setMarkingLine(line)}
            onUpdateLine={handleUpdateLine}
            onPasteLyrics={handlePasteLyrics}
            onGenerateTimeline={handleGenerateTimeline}
          />

          {/* Inline lyric mark form */}
          {markingLine && (
            <div className="p-2 border border-indigo-300 rounded bg-indigo-50">
              <p className="text-xs text-gray-600 mb-1">
                为「{markingLine.text}」添加 Mark
              </p>
              <div className="flex gap-1">
                <input
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                  placeholder="输入 Mark 内容"
                  value={markContent}
                  onChange={(e) => setMarkContent(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddLyricMark()
                  }
                  autoFocus
                />
                <button
                  onClick={handleAddLyricMark}
                  className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setMarkingLine(null);
                    setMarkContent("");
                  }}
                  className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column — Mark list */}
        <div className="w-[360px] shrink-0 border-l border-gray-200 overflow-y-auto p-4">
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
