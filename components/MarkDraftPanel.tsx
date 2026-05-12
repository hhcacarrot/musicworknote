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
    <div className="border border-indigo-300 rounded p-3 bg-indigo-50">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">填写 Mark</h4>

      <p className="text-xs text-gray-600 mb-2">
        标记片段：{formatTime(initialStart)} - {formatTime(initialEnd)}
      </p>

      <button
        onClick={() => setShowAdjust(!showAdjust)}
        className="text-xs text-indigo-600 hover:underline mb-2"
      >
        {showAdjust ? "收起调整" : "调整时间"}
      </button>

      {showAdjust && (
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center gap-2 text-xs">
            <label className="shrink-0 w-14">开始时间：</label>
            <input
              className={`w-24 border rounded px-1 text-xs ${
                errors.startTime ? "border-red-400" : "border-gray-300"
              }`}
              value={startStr}
              onChange={(e) => {
                setStartStr(e.target.value);
                setErrors({});
              }}
            />
            {errors.startTime && (
              <span className="text-red-500">{errors.startTime}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="shrink-0 w-14">结束时间：</label>
            <input
              className={`w-24 border rounded px-1 text-xs ${
                errors.endTime ? "border-red-400" : "border-gray-300"
              }`}
              value={endStr}
              onChange={(e) => {
                setEndStr(e.target.value);
                setErrors({});
              }}
            />
            {errors.endTime && (
              <span className="text-red-500">{errors.endTime}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <input
          ref={contentRef}
          className={`w-full border rounded px-2 py-1 text-xs ${
            errors.content ? "border-red-400" : "border-gray-300"
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
          <p className="text-xs text-red-500">{errors.content}</p>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
        >
          保存 Mark
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300"
        >
          取消
        </button>
      </div>
    </div>
  );
}
