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
      waveColor: "#E5E5EA",
      progressColor: "#67C7E8",
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
      <div className="h-[100px] flex flex-col items-center justify-center border-2 border-dashed border-black/[0.12] rounded-[14px] bg-[#FAFAFA] text-[13px] text-[#A1A1AA] px-4 text-center leading-relaxed">
        支持 MP3 / WAV，本地临时预览，刷新后可能丢失
      </div>
    );
  }

  const isMarking = markingPhase === "marking";

  return (
    <div>
      <div className="w-full rounded-[10px] overflow-hidden border border-black/[0.08] bg-[#FAFAFA]" ref={containerRef} />
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#1D1D1F] text-white text-[14px] font-medium rounded-full hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPlaying ? "暂停" : "播放"}
        </button>
        <span className="text-[14px] text-[#1D1D1F] font-mono tabular-nums">
          {formatTime(currentTime)}
        </span>
        <span className="text-[14px] text-[#6E6E73] font-mono tabular-nums">
          / {formatTime(duration)}
        </span>
        <span className="text-black/[0.10]">|</span>
        {isMarking ? (
          <button
            onClick={onEndMarking}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#1D1D1F] text-white text-[14px] font-medium rounded-full hover:bg-black transition-colors"
          >
            结束标记
          </button>
        ) : (
          <button
            onClick={handleStartMarking}
            disabled={markingPhase === "drafting"}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-white border border-black/[0.08] text-[#3A3A3C] text-[14px] font-medium rounded-full hover:bg-[#F2F2F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            开始标记
          </button>
        )}
      </div>
      {noAudioWarning && (
        <p className="text-[13px] text-[#FF3B30] mt-1.5">请先上传音频</p>
      )}
      {isMarking && markingStartTime != null && (
        <p className="text-[13px] text-[#0B84A5] mt-1.5 font-mono">
          正在标记：{formatTime(markingStartTime)} 起
        </p>
      )}
    </div>
  );
});

export default AudioWaveform;
