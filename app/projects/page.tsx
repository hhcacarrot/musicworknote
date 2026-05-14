"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SongWorknote } from "@/lib/types";
import { getAllSongs, deleteSong, getMarks, createSong } from "@/lib/storage";

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export default function ProjectsPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<SongWorknote[]>([]);
  const [markCounts, setMarkCounts] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [modalError, setModalError] = useState("");

  const refresh = useCallback(() => {
    const s = getAllSongs();
    setSongs(s);
    const counts: Record<string, number> = {};
    s.forEach((song) => {
      counts[song.id] = getMarks(song.id).length;
    });
    setMarkCounts(counts);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = (id: string) => {
    deleteSong(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
  };

  const openModal = () => {
    setNewTitle("");
    setModalError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewTitle("");
    setModalError("");
  };

  const handleCreate = () => {
    if (!newTitle.trim()) {
      setModalError("请输入歌曲名称");
      return;
    }
    const song = createSong(newTitle.trim());
    closeModal();
    router.push(`/worknotes/${song.id}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Top nav */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
            Music Worknote
          </span>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#1D1D1F] text-white text-[14px] font-medium rounded-full hover:bg-black transition-colors"
          >
            <span className="text-lg leading-none font-light">+</span>
            <span>新建 Worknote</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight">我的 Worknotes</h2>
          <p className="text-[15px] text-[#6E6E73] mt-1.5">
            管理你的歌曲修改记录和创作反馈
          </p>
        </div>

        {/* Empty state */}
        {songs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-[56px] mb-5 opacity-40">🎵</div>
            <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-1.5">
              还没有 Worknote
            </h3>
            <p className="text-[15px] text-[#6E6E73] mb-7 max-w-xs leading-relaxed">
              创建你的第一个歌曲 Worknote，开始记录修改意见
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1.5 h-10 px-5 bg-[#1D1D1F] text-white text-[14px] font-medium rounded-full hover:bg-black transition-colors"
            >
              <span className="text-lg leading-none font-light">+</span>
              <span>新建 Worknote</span>
            </button>
          </div>
        )}

        {/* Card list */}
        {songs.length > 0 && (
          <div className="flex flex-col gap-3">
            {songs.map((song) => (
              <div
                key={song.id}
                className="group relative bg-white border border-black/[0.06] rounded-2xl hover:border-black/[0.10] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all cursor-pointer"
                onClick={() => router.push(`/worknotes/${song.id}`)}
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-[#1D1D1F] truncate pr-4">
                      {song.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete(song.id);
                      }}
                      className="shrink-0 text-[15px] text-[#A1A1AA] hover:text-[#FF3B30] transition-colors opacity-0 group-hover:opacity-100 leading-none"
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[13px] text-[#6E6E73]">
                    <span>{markCounts[song.id] ?? 0} 个 Mark</span>
                    <span className="text-black/[0.10]">·</span>
                    <span>创建于 {new Date(song.createdAt).toLocaleDateString("zh-CN")}</span>
                    <span className="text-black/[0.10]">·</span>
                    <span>最后编辑 {formatRelativeTime(song.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/[0.18]" />
          {/* Modal */}
          <div
            className="relative bg-white rounded-[18px] shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-[420px] max-w-[90vw] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-semibold text-[#1D1D1F]">新建 Worknote</h3>
              <button
                onClick={closeModal}
                className="text-[#A1A1AA] hover:text-[#1D1D1F] text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <label className="block text-[14px] font-medium text-[#3A3A3C] mb-2">
              歌曲名称
            </label>
            <input
              className={`w-full h-11 px-3.5 border rounded-[10px] text-[15px] outline-none transition-colors ${
                modalError
                  ? "border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20"
                  : "border-black/[0.08] focus:border-[#67C7E8] focus:ring-2 focus:ring-[#67C7E8]/25"
              }`}
              placeholder="输入歌曲名称…"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (modalError) setModalError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            {modalError && (
              <p className="text-[13px] text-[#FF3B30] mt-1.5">{modalError}</p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeModal}
                className="h-10 px-4 bg-white border border-black/[0.08] text-[#3A3A3C] text-[14px] font-medium rounded-[10px] hover:bg-[#F2F2F7] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="h-10 px-5 bg-[#1D1D1F] text-white text-[14px] font-medium rounded-[10px] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                创建 Worknote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
