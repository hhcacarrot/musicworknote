"use client";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import WaveSurfer from "wavesurfer.js";
import { formatTime } from "@/lib/time";

export type AudioWaveformHandle = {
  pause: () => void;
  seekTo: (time: number) => void;
};

type Props = {
  audioUrl: string | null;
  onTimeUpdate: (time: number) => void;
  onDurationReady: (duration: number) => void;
  onFinish: () => void;
  markingPhase: "idle" | "marking" | "drafting";
  markingStartTime: number | null;
  onStartMarking: () => void;
  onEndMarking: () => void;
  hasAudio: boolean;
};

const AudioWaveform = forwardRef<AudioWaveformHandle, Props>(function AudioWaveform(
  {
    audioUrl,
    onTimeUpdate,
    onDurationReady,
    onFinish,
    markingPhase,
    markingStartTime,
    onStartMarking,
    onEndMarking,
    hasAudio,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [noAudioWarning, setNoAudioWarning] = useState(false);

  useImperativeHandle(ref, () => ({
    pause: () => wsRef.current?.pause(),
    seekTo: (time: number) => {
      wsRef.current?.setTime(time);
      setCurrentTime(time);
    },
  }));

  useEffect(() => {
    if (!containerRef.current || !audioUrl) {
      setIsReady(false);
      return;
    }

    if (wsRef.current) {
      wsRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#a5b4fc",
      progressColor: "#4f46e5",
      height: 100,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      url: audioUrl,
    });

    ws.on("ready", () => {
      const dur = ws.getDuration();
      setDuration(dur);
      setIsReady(true);
      onDurationReady(dur);
    });

    ws.on("timeupdate", (t) => {
      setCurrentTime(t);
      onTimeUpdate(t);
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => {
      setIsPlaying(false);
      onFinish();
    });

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [audioUrl, onTimeUpdate, onDurationReady, onFinish]);

  const togglePlay = () => {
    wsRef.current?.playPause();
  };

  const handleStartMarking = () => {
    if (!hasAudio) {
      setNoAudioWarning(true);
      setTimeout(() => setNoAudioWarning(false), 2000);
      return;
    }
    onStartMarking();
  };

  if (!audioUrl) {
    return (
      <div className="h-[100px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm">
        请先上传音频文件
      </div>
    );
  }

  const isMarking = markingPhase === "marking";

  return (
    <div>
      <div ref={containerRef} className="w-full rounded border border-gray-200" />
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className="px-4 py-1 bg-indigo-600 text-white rounded text-sm disabled:opacity-50"
        >
          {isPlaying ? "暂停" : "播放"}
        </button>
        <span className="text-sm text-gray-600 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        {isMarking ? (
          <button
            onClick={onEndMarking}
            className="px-4 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            结束标记
          </button>
        ) : (
          <button
            onClick={handleStartMarking}
            disabled={markingPhase === "drafting"}
            className="px-4 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50"
          >
            开始标记
          </button>
        )}
      </div>
      {noAudioWarning && (
        <p className="text-xs text-red-500 mt-1">请先上传音频</p>
      )}
      {isMarking && markingStartTime != null && (
        <p className="text-xs text-amber-600 mt-1">
          正在标记：{formatTime(markingStartTime)} 起
        </p>
      )}
    </div>
  );
});

export default AudioWaveform;
