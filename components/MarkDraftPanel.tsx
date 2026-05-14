"use client";

import { useState, useRef, useEffect } from "react";
import { formatTime, parseTime } from "@/lib/time";

type Props = {
  startTime: number;
  endTime: number;
  duration: number;
  onSave: (startTime: number, endTime: number, content: string) => void;
  onCancel: () => void;
};

type ValidationErrors = {
  content?: string;
  startTime?: string;
  endTime?: string;
};

export default function MarkDraftPanel({
  startTime: initialStart,
  endTime: initialEnd,
  duration,
  onSave,
  onCancel,
}: Props) {
  const contentRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [startStr, setStartStr] = useState(formatTime(initialStart));
  const [endStr, setEndStr] = useState(formatTime(initialEnd));
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  const resolveStart = () => parseTime(startStr);
  const resolveEnd = () => parseTime(endStr);

  const validate = (): boolean => {
    const e: ValidationErrors = {};
    const st = resolveStart();
    const et = resolveEnd();

    if (isNaN(st) || isNaN(et)) {
      if (isNaN(st)) e.startTime = "时间格式不正确";
      if (isNaN(et)) e.endTime = "时间格式不正确";
    } else {
      if (st >= et) {
        e.startTime = "开始时间必须早于结束时间";
      }
      if (et > duration) {
        e.endTime = "结束时间不能超过音频总时长";
      }
    }
    if (!content.trim()) {
      e.content = "Mark 内容不能为空";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(resolveStart(), resolveEnd(), content.trim());
  };

  return (
    <div className="bg-[#F4FBFD] border border-[#67C7E8]/20 rounded-[14px] p-4">
      <h4 className="text-[14px] font-semibold text-[#1D1D1F] mb-3">填写 Mark</h4>

      <p className="text-[14px] text-[#6E6E73] mb-3 font-mono">
        标记片段：<span className="text-[#0B84A5]">{formatTime(initialStart)} - {formatTime(initialEnd)}</span>
      </p>

      <button
        onClick={() => setShowAdjust(!showAdjust)}
        className="text-xs text-[#0B84A5] hover:text-[#67C7E8] transition-colors mb-3"
      >
        {showAdjust ? "收起调整" : "调整时间"}
      </button>

      {showAdjust && (
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="shrink-0 w-16 text-xs text-[#6E6E73]">开始时间</label>
            <input
              className={`w-28 h-8 border rounded-[10px] px-2 text-xs font-mono outline-none ${
                errors.startTime
                  ? "border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20"
                  : "border-black/[0.08] focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25"
              }`}
              value={startStr}
              onChange={(e) => {
                setStartStr(e.target.value);
                setErrors({});
              }}
            />
            {errors.startTime && (
              <span className="text-xs text-[#FF3B30]">{errors.startTime}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="shrink-0 w-16 text-xs text-[#6E6E73]">结束时间</label>
            <input
              className={`w-28 h-8 border rounded-[10px] px-2 text-xs font-mono outline-none ${
                errors.endTime
                  ? "border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20"
                  : "border-black/[0.08] focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25"
              }`}
              value={endStr}
              onChange={(e) => {
                setEndStr(e.target.value);
                setErrors({});
              }}
            />
            {errors.endTime && (
              <span className="text-xs text-[#FF3B30]">{errors.endTime}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mb-4">
        <input
          ref={contentRef}
          className={`w-full h-10 px-3 border rounded-[10px] text-[14px] outline-none transition-colors ${
            errors.content
              ? "border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20"
              : "border-black/[0.08] focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25"
          }`}
          placeholder="请输入 Mark 内容"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setErrors({});
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        {errors.content && (
          <p className="text-xs text-[#FF3B30]">{errors.content}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="h-9 px-5 bg-[#1D1D1F] text-white text-[14px] font-medium rounded-[10px] hover:bg-black transition-colors"
        >
          保存 Mark
        </button>
        <button
          onClick={onCancel}
          className="h-9 px-4 bg-white border border-black/[0.08] text-[#3A3A3C] text-[14px] font-medium rounded-[10px] hover:bg-[#F2F2F7] transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
