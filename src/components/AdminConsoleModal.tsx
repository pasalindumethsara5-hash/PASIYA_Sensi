import React, { useState } from 'react';
import {
  Crown,
  Download,
  Filter,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  type GamerUser,
  getAllRegisteredUsers,
  removeUserFromRegistry,
} from '../lib/authStore';
import { triggerHaptic } from '../lib/haptics';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [users, setUsers] = useState<GamerUser[]>(() => getAllRegisteredUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'android' | 'ios'>('all');

  if (!isOpen) return null;

  const handleDeleteUser = (id: string, tag: string) => {
    if (confirm(`Remove gamer ${tag} from database?`)) {
      triggerHaptic('action');
      const updated = removeUserFromRegistry(id);
      setUsers(updated);
    }
  };

  const handleExportData = () => {
    triggerHaptic('success');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pasiya_sensi_gamers_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.gamerTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.freeFireUid.includes(searchTerm);
    const matchesPlatform =
      filterPlatform === 'all' || u.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const androidCount = users.filter((u) => u.platform === 'android').length;
  const iosCount = users.filter((u) => u.platform === 'ios').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Owner Admin Console"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl my-auto rounded-2xl bg-[#0B0B0F] border border-[#EAB308]/60 shadow-[0_12px_48px_rgba(234,179,8,0.2)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#23232B] bg-[#14120A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAB308]/20 border border-[#EAB308]/50 flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#EAB308]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Owner Admin Console</h3>
                <span className="text-[10px] font-mono-num font-bold text-[#EAB308] bg-[#EAB308]/20 px-2 py-0.5 rounded border border-[#EAB308]/40">
                  CONFIDENTIAL
                </span>
              </div>
              <p className="text-xs text-[#9A9AA6]">
                Only Pasal/Owner can view registered players &amp; active game devices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 p-4 bg-[#07070A] border-b border-[#23232B] shrink-0">
          <div className="p-2.5 rounded-xl bg-[#111116] border border-[#23232B] text-center">
            <div className="text-[10px] text-[#9A9AA6] uppercase font-mono">Total Players</div>
            <div className="text-lg font-bold text-white mt-0.5">{users.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#111116] border border-[#23232B] text-center">
            <div className="text-[10px] text-[#22C55E] uppercase font-mono">Android</div>
            <div className="text-lg font-bold text-white mt-0.5">{androidCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#111116] border border-[#23232B] text-center">
            <div className="text-[10px] text-[#EF4444] uppercase font-mono">Apple iOS</div>
            <div className="text-lg font-bold text-white mt-0.5">{iosCount}</div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-[#23232B] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#9A9AA6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by GamerTag or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#060609] border border-[#23232B] focus:border-[#EAB308] text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as 'all' | 'android' | 'ios')}
              className="px-2.5 py-1.5 rounded-lg bg-[#060609] border border-[#23232B] text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">All Devices</option>
              <option value="android">Android Only</option>
              <option value="ios">iOS Only</option>
            </select>

            <button
              type="button"
              onClick={handleExportData}
              className="px-3 py-1.5 rounded-lg bg-[#181820] border border-[#2E2E3C] hover:border-[#EAB308] text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#EAB308]" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Player Records List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#9A9AA6]">
              No players found matching your search.
            </div>
          ) : (
            filteredUsers.map((gamer) => (
              <div
                key={gamer.id}
                className="p-3 rounded-xl bg-[#07070A] border border-[#23232B] hover:border-white/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{gamer.gamerTag}</span>
                    {gamer.isOwner && (
                      <span className="text-[9px] font-mono font-bold text-[#EAB308] bg-[#EAB308]/20 px-1.5 py-0.2 rounded border border-[#EAB308]/30">
                        OWNER
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                        gamer.platform === 'ios'
                          ? 'bg-[#EF4444]/20 text-[#EF4444]'
                          : 'bg-[#22C55E]/20 text-[#22C55E]'
                      }`}
                    >
                      {gamer.platform}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9A9AA6] flex flex-wrap items-center gap-3">
                    <span>UID: <strong className="text-white font-mono">{gamer.freeFireUid}</strong></span>
                    {gamer.password && (
                      <span>Pass: <strong className="text-[#FDE047] font-mono bg-yellow-950/40 px-1.5 py-0.5 rounded border border-yellow-700/30">{gamer.password}</strong></span>
                    )}
                    <span>Device: {gamer.deviceModel}</span>
                    <span>Date: {gamer.registeredAt}</span>
                  </div>
                </div>

                {!gamer.isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(gamer.id, gamer.gamerTag)}
                    className="self-end sm:self-auto p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 transition-colors cursor-pointer"
                    title="Remove user"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
