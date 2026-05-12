"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSong } from "@/lib/storage";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    const song = createSong(title.trim());
    router.push(`/worknotes/${song.id}`);
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">创建新 Worknote</h1>
      <div className="flex flex-col gap-3">
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="输入歌曲名称"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded text-sm disabled:opacity-50 hover:bg-indigo-700"
          >
            创建
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
