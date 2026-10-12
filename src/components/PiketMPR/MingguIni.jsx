import React, { useState } from 'react';
import {
  PIKET_SLOTS,
  ABSENCE_REASONS,
  SIDAK_STATUSES,
  formatIndoDate,
  addWeeksToFriday,
  resolveWeeklySchedule,
  generateWhatsAppMessage
} from './piketUtils';

export default function MingguIni({
  selectedFriday,
  setSelectedFriday,
  config,
  weekData,
  onUpdateWeekData,
  setMessage
}) {
  const [absenceModal, setAbsenceModal] = useState(null); // { slotCode, originalMember }
  const [selectedReason, setSelectedReason] = useState('libur piket');
  const [customSubstitute, setCustomSubstitute] = useState('');
  const [showWaModal, setShowWaModal] = useState(false);

  // Kalkulasi jadwal pekan yang dipilih
  const currentWeekInfo = resolveWeeklySchedule(selectedFriday, config, weekData);
  const { assignments, absences, plazaOfficer } = currentWeekInfo;

  // Hitung ringkasan status
  let countSelesai = 0;
  let countKosong = 0;
  PIKET_SLOTS.forEach(s => {
    if (s.code === 'Bebas') return;
    const a = assignments[s.code];
    if (a?.status === 'Selesai') countSelesai++;
    if (!a?.assignedMember) countKosong++;
  });
  const countTidakHadir = Object.keys(absences).length;
  const countLiburPiket = Object.values(absences).filter(a => a.reason === 'libur piket').length;

  // Toggle status sidak: Belum -> Selesai -> Ulang -> Belum
  const toggleSidak = (slotCode) => {
    const current = assignments[slotCode]?.status || 'Belum';
    let next = 'Selesai';
    if (current === 'Belum') next = 'Selesai';
    else if (current === 'Selesai') next = 'Ulang';
    else next = 'Belum';

    const newSidak = { ...(weekData.sidak || {}), [slotCode]: next };
    onUpdateWeekData(selectedFriday, { ...weekData, sidak: newSidak });
    setMessage(`Status ${assignments[slotCode]?.slot.name} diubah: ${next.toUpperCase()}`);
    setTimeout(() => setMessage(''), 2000);
  };

  // Simpan ketidakhadiran
  const handleSaveAbsence = () => {
    if (!absenceModal) return;
    const { originalMember } = absenceModal;
    const newAbsences = { ...(weekData.absences || {}) };
    
    newAbsences[originalMember] = {
      reason: selectedReason,
      substitute: customSubstitute || null,
      updatedAt: Date.now()
    };

    onUpdateWeekData(selectedFriday, { ...weekData, absences: newAbsences });
    setAbsenceModal(null);
    setMessage(`❌ ${originalMember} dicatat tidak hadir (${selectedReason})`);
    setTimeout(() => setMessage(''), 3000);
  };

  // Batalkan ketidakhadiran (Hadir kembali)
  const handleRemoveAbsence = (memberName) => {
    const newAbsences = { ...(weekData.absences || {}) };
    delete newAbsences[memberName];
    onUpdateWeekData(selectedFriday, { ...weekData, absences: newAbsences });
    setMessage(`✅ ${memberName} kembali bertugas`);
    setTimeout(() => setMessage(''), 2500);
  };

  // Reset jadwal pekan ini
  const handleResetWeek = () => {
    if (window.confirm(`Yakin ingin mereset seluruh catatan piket untuk Jumat, ${formatIndoDate(selectedFriday)}?`)) {
      onUpdateWeekData(selectedFriday, {});
      setMessage('Jadwal pekan ini berhasil direset ke rotasi awal.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Salin pesan WhatsApp
  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage(currentWeekInfo);
    navigator.clipboard.writeText(text);
    setMessage('📋 Pesan WhatsApp berhasil disalin!');
    setTimeout(() => setMessage(''), 3000);
  };

  const getSidakBadgeStyle = (status) => {
    switch (status) {
      case 'Selesai': return 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
      case 'Ulang': return 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-sm font-black';
      default: return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200';
    }
  };

  const getClassBadgeStyle = (cls) => {
    switch (cls) {
      case 'Berat': return 'bg-red-100 text-red-800 border-red-200';
      case 'Menengah': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ringan': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER NAVIGASI JUMAT & AKSI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
            Piket Jumat MPR
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            {formatIndoDate(selectedFriday, true)}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Rotasi berjalan otomatis. Klik status sidak atau tandai jika ada yang berhalangan hadir.
          </p>
        </div>

        {/* Kontrol Navigasi Pekan */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedFriday(addWeeksToFriday(selectedFriday, -1))}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
            title="Pekan Sebelumnya"
          >
            ◀ Pekan Lalu
          </button>
          
          <input
            type="date"
            value={selectedFriday}
            onChange={(e) => e.target.value && setSelectedFriday(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 bg-white outline-none cursor-pointer"
          />

          <button
            onClick={() => setSelectedFriday(addWeeksToFriday(selectedFriday, 1))}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
            title="Pekan Berikutnya"
          >
            Pekan Depan ▶
          </button>

          <button
            onClick={() => setShowWaModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ml-1"
          >
            <span>📋</span> Salin Pesan WA
          </button>

          <button
            onClick={handleResetWeek}
            className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 font-bold rounded-lg text-xs transition-all cursor-pointer"
            title="Kembalikan pekan ini ke kondisi awal"
          >
            Reset
          </button>
        </div>
      </div>

      {/* STATS COUNTER RINGKASAN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Tugas Selesai</div>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">{countSelesai} / 11</div>
          </div>
          <span className="text-3xl">✅</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Slot Kosong</div>
            <div className="text-2xl font-black text-amber-900 mt-0.5">{countKosong}</div>
          </div>
          <span className="text-3xl">⚠️</span>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Tidak Hadir</div>
            <div className="text-2xl font-black text-rose-900 mt-0.5">{countTidakHadir} Orang</div>
          </div>
          <span className="text-3xl">❌</span>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Libur Piket</div>
            <div className="text-2xl font-black text-indigo-900 mt-0.5">{countLiburPiket} Orang</div>
          </div>
          <span className="text-3xl">🏖️</span>
        </div>
      </div>

      {/* TABEL SLOT PIKET JUMAT INI */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">
            Daftar Pembagian Tugas & Status Sidak
          </h3>
          <span className="text-xs text-gray-500 italic">
            Klik tombol status untuk mengubah sidak (Belum / Selesai / Ulang)
          </span>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-800 text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4 text-left">Area Tugas</th>
                <th className="py-3 px-4 text-center w-28">Kategori</th>
                <th className="py-3 px-4 text-left">Petugas Pelaksana</th>
                <th className="py-3 px-4 text-center w-36">Status Sidak</th>
                <th className="py-3 px-4 text-center w-36">Aksi Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {PIKET_SLOTS.map((slot) => {
                if (slot.code === 'Bebas') return null;

                const item = assignments[slot.code];
                const original = item?.originalMember;
                const assigned = item?.assignedMember;
                const isAbsent = original && !!absences[original];
                const isSub = item?.isSubstitute;

                return (
                  <tr key={slot.code} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-gray-400">{slot.order}</td>
                    
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-gray-900 text-sm">{slot.name}</div>
                      {slot.code === 'Kaca' && (
                        <div className="text-[11px] font-bold text-indigo-600 mt-0.5">
                          Sisi aktif: <span className="underline">{item?.kacaSide}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold border ${getClassBadgeStyle(slot.class)}`}>
                        {slot.class} ({slot.points}p)
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {assigned ? (
                        <div className="flex flex-col">
                          <span className={`font-black text-sm ${isSub ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {assigned}
                          </span>
                          {isSub && original && (
                            <span className="text-[11px] text-amber-700 font-bold">
                              Menggantikan <span className="line-through">{original}</span> ({absences[original]?.reason})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          (KOSONG)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleSidak(slot.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${getSidakBadgeStyle(item?.status)}`}
                        title="Klik untuk ubah: Belum -> Selesai -> Ulang"
                      >
                        {item?.status === 'Selesai' && '✅ '}
                        {item?.status === 'Ulang' && '⚠️ '}
                        {item?.status || 'Belum'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {original && (
                        isAbsent ? (
                          <button
                            onClick={() => handleRemoveAbsence(original)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-lg text-[11px] font-bold border border-gray-300 transition-all cursor-pointer"
                          >
                            Batal Absen
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setAbsenceModal({ slotCode: slot.code, originalMember: original });
                              setSelectedReason('libur piket');
                              setCustomSubstitute('');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-300 transition-all cursor-pointer shadow-2xs"
                          >
                            Tandai Absen
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Slot Tetap Pel Plaza */}
              <tr className="bg-gray-50/70 border-t-2 border-gray-200">
                <td className="py-3 px-4 text-center font-bold text-gray-400">12</td>
                <td className="py-3 px-4">
                  <div className="font-extrabold text-gray-900 text-sm">Pel Plaza</div>
                  <div className="text-[10px] text-gray-500 font-bold">Petugas Tetap di Luar Rotasi</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700">
                    Tetap
                  </span>
                </td>
                <td className="py-3 px-4 font-black text-sm text-gray-900">
                  {plazaOfficer}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-gray-400 font-bold">—</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-gray-400 font-bold">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FOOTER BARIS BEBAS PIKET */}
        <div className="p-4 bg-indigo-50/80 border-t border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
            <span className="text-xl">🏖️</span>
            <span>Anggota Yang Sedang Bebas Piket Pekan Ini:</span>
            <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-black text-xs">
              {assignments['Bebas']?.assignedMember || assignments['Bebas']?.originalMember || '-'}
            </span>
          </div>
          <div className="text-[11px] text-indigo-700 font-medium">
            *Langkah Bebas berputar setiap pekan mengikuti rotasi 12 langkah.
          </div>
        </div>
      </div>

      {/* MODAL CATAT KETIDAKHADIRAN */}
      {absenceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 mb-4 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  Pencatatan Izin / Libur
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-1">
                  {absenceModal.originalMember}
                </h3>
              </div>
              <button
                onClick={() => setAbsenceModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center transition-colors cursor-pointer"
              >✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pilih Alasan Ketidakhadiran:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {ABSENCE_REASONS.map((r) => (
                    <label
                      key={r.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedReason === r.id ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-900' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 text-xs'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="absence_reason"
                          checked={selectedReason === r.id}
                          onChange={() => setSelectedReason(r.id)}
                          className="accent-indigo-600"
                        />
                        <span>{r.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Potong jatah</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pilih / Rekomendasi Pengganti (Opsional):
                </label>
                <select
                  value={customSubstitute}
                  onChange={(e) => setCustomSubstitute(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 bg-white outline-none"
                >
                  <option value="">-- Pengganti Otomatis Sesuai Aturan R8 --</option>
                  <optgroup label="Relawan">
                    {(config.volunteers || []).map(v => (
                      <option key={v} value={v}>{v} (Relawan)</option>
                    ))}
                  </optgroup>
                  <optgroup label="Anggota Lain">
                    {(config.members || []).filter(m => m !== absenceModal.originalMember).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-gray-500 mt-1 italic">
                  *Jika dikosongkan, sistem memilih otomatis: Pemegang Media ➔ Anggota Bebas ➔ Relawan ➔ Pemegang Kaca.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAbsenceModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAbsence}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-sm cursor-pointer"
                >
                  Simpan Tidak Hadir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SALIN FORMAT PESAN WHATSAPP */}
      {showWaModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>📋</span> Format Pesan Grup WhatsApp
              </h3>
              <button
                onClick={() => setShowWaModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center transition-colors cursor-pointer"
              >✕</button>
            </div>

            <textarea
              readOnly
              rows={14}
              value={generateWhatsAppMessage(currentWeekInfo)}
              className="w-full p-3 font-mono text-xs bg-gray-50 border border-gray-300 rounded-xl outline-none resize-none leading-relaxed text-gray-800"
            />

            <div className="flex justify-between items-center gap-2 mt-4 pt-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-500 italic">
                Format resmi sesuai standar grup Takmir MPR.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWaModal(false)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={handleCopyWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>📋</span> Salin Teks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
