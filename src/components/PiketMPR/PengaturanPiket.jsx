import React, { useState } from 'react';
import { DEFAULT_PIKET_MEMBERS, DEFAULT_VOLUNTEERS, DEFAULT_PLAZA_OFFICER, BASE_START_FRIDAY } from './piketUtils';

export default function PengaturanPiket({
  config,
  onUpdateConfig,
  setMessage
}) {
  const [members, setMembers] = useState(config.members || DEFAULT_PIKET_MEMBERS);
  const [volunteers, setVolunteers] = useState(config.volunteers || DEFAULT_VOLUNTEERS);
  const [fixedPlaza, setFixedPlaza] = useState(config.fixedPlaza || DEFAULT_PLAZA_OFFICER);
  const [startDate, setStartDate] = useState(config.startDate || BASE_START_FRIDAY);
  const [maxLeave, setMaxLeave] = useState(config.maxLeavePerYear || 7);

  const [newMemberName, setNewMemberName] = useState('');
  const [newVolunteerName, setNewVolunteerName] = useState('');

  // Validasi hari Jumat
  const isFriday = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 5;
  };

  // Tambah anggota inti
  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    if (members.includes(name)) {
      setMessage(`Nama "${name}" sudah terdaftar!`);
      setTimeout(() => setMessage(''), 2500);
      return;
    }
    setMembers([...members, name]);
    setNewMemberName('');
  };

  // Hapus anggota inti (F6: tolak jika < 10)
  const handleRemoveMember = (name) => {
    if (members.length <= 10) {
      setMessage('❌ DITOLAK: Minimal susunan anggota inti adalah 10 orang (R3)!');
      setTimeout(() => setMessage(''), 3500);
      return;
    }
    setMembers(members.filter(m => m !== name));
  };

  // Geser posisi urutan anggota (naik/turun)
  const handleMoveMember = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= members.length) return;
    const updated = [...members];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setMembers(updated);
  };

  // Tambah relawan
  const handleAddVolunteer = () => {
    const name = newVolunteerName.trim();
    if (!name) return;
    if (volunteers.includes(name)) return;
    setVolunteers([...volunteers, name]);
    setNewVolunteerName('');
  };

  // Hapus relawan
  const handleRemoveVolunteer = (name) => {
    setVolunteers(volunteers.filter(v => v !== name));
  };

  // Simpan Pengaturan
  const handleSaveConfig = () => {
    // Validasi tanggal mulai harus hari Jumat (F6)
    if (!isFriday(startDate)) {
      setMessage('❌ Tanggal mulai siklus harus jatuh pada hari JUMAT!');
      setTimeout(() => setMessage(''), 3500);
      return;
    }

    if (members.length < 10) {
      setMessage('❌ Minimal harus ada 10 anggota inti!');
      setTimeout(() => setMessage(''), 3500);
      return;
    }

    const updatedConfig = {
      ...config,
      members,
      volunteers,
      fixedPlaza,
      startDate,
      maxLeavePerYear: Number(maxLeave) || 7,
      updatedAt: Date.now()
    };

    onUpdateConfig(updatedConfig);
    setMessage('✅ Pengaturan Sistem Piket MPR berhasil disimpan!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
            Konfigurasi & Parameter (F6)
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            Pengaturan Sistem Piket
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Atur urutan anggota, petugas tetap plaza, daftar relawan, dan parameter rotasi.
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>💾</span> Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL ANGGOTA INTI (URUTAN TABEL PUTAR) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h3 className="font-black text-sm text-gray-900 uppercase tracking-wide">
                👥 Anggota Inti ({members.length} Orang)
              </h3>
              <p className="text-[11px] text-gray-500">
                Urutan ini menentukan giliran rotasi 12 langkah. Minimal 10 orang (R3).
              </p>
            </div>
            <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
              {members.length} Anggota
            </span>
          </div>

          {/* Form Tambah Anggota */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              placeholder="Nama anggota baru..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold outline-none bg-gray-50 focus:bg-white"
            />
            <button
              onClick={handleAddMember}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
            >
              + Tambah
            </button>
          </div>

          {/* Daftar Anggota dengan Reorder Buttons */}
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto custom-scroll pr-1">
            {members.map((member, idx) => (
              <div key={member} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center font-bold text-gray-400">{idx + 1}.</span>
                  <span className="font-extrabold text-gray-900">{member}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveMember(idx, -1)}
                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Geser Naik"
                  >
                    ▲
                  </button>
                  <button
                    disabled={idx === members.length - 1}
                    onClick={() => handleMoveMember(idx, 1)}
                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Geser Turun"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="ml-1 w-6 h-6 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-black cursor-pointer"
                    title="Hapus Anggota"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL PETUGAS PLAZA, RELAWAN, & PARAMETER SIKLUS */}
        <div className="space-y-6">
          {/* Petugas Plaza & Parameter Rotasi */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-gray-900 uppercase tracking-wide pb-2 border-b border-gray-100">
              ⚙️ Parameter Operasional
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Petugas Tetap Pel Plaza (di luar rotasi):
              </label>
              <input
                type="text"
                value={fixedPlaza}
                onChange={(e) => setFixedPlaza(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white outline-none"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Default: Cahyo (tugas Pel Plaza tetap setiap Jumat).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tanggal Mulai Siklus (Harus Jumat):
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jatah Izin per Tahun (Pekan):
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxLeave}
                  onChange={(e) => setMaxLeave(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-gray-50 focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Daftar Relawan Pengganti */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-black text-sm text-gray-900 uppercase tracking-wide">
                🤝 Relawan Pengganti ({volunteers.length})
              </h3>
              <span className="text-[11px] text-gray-500">
                Diprioritaskan saat ada slot kosong
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newVolunteerName}
                onChange={(e) => setNewVolunteerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddVolunteer()}
                placeholder="Nama relawan baru..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold outline-none bg-gray-50 focus:bg-white"
              />
              <button
                onClick={handleAddVolunteer}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                + Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {volunteers.map(v => (
                <div key={v} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                  <span>{v}</span>
                  <button
                    onClick={() => handleRemoveVolunteer(v)}
                    className="text-emerald-600 hover:text-red-600 font-black cursor-pointer"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
