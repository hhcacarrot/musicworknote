"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SongWorknote, Mark } from "@/lib/types";
import { getAllSongs, deleteSong, getMarks } from "@/lib/storage";

export default function ProjectsPage() {
  const [songs, setSongs] = useState<SongWorknote[]>([]);
  const [markCounts, setMarkCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const s = getAllSongs();
    setSongs(s);
    const counts: Record<string, number> = {};
    s.forEach((song) => {
      counts[song.id] = getMarks(song.id).length;
    });
    setMarkCounts(counts);
  }, []);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`确定删除「${title}」吗？此操作不可恢复。`)) {
      deleteSong(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Music Worknote</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          创建新 Worknote
        </Link>
      </div>

      {songs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-2">暂无 Worknote 项目</p>
          <Link
            href="/projects/new"
            className="text-indigo-600 hover:underline text-sm"
          >
            创建第一个 Worknote
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {songs.map((song) => (
          <div
            key={song.id}
            className="flex items-center justify-between border border-gray-200 rounded p-4 hover:border-indigo-300 transition-colors"
          >
            <Link
              href={`/worknotes/${song.id}`}
              className="flex-1 min-w-0"
            >
              <h2 className="font-semibold text-gray-800 truncate">
                {song.title}
              </h2>
              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                <span>
                  创建于 {new Date(song.createdAt).toLocaleDateString("zh-CN")}
                </span>
                <span>{markCounts[song.id] ?? 0} 个 Mark</span>
              </div>
            </Link>
            <button
              onClick={() => handleDelete(song.id, song.title)}
              className="ml-4 text-xs text-red-500 hover:underline shrink-0"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
