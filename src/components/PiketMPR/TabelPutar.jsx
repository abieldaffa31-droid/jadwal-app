import React, { useState } from 'react';
import {
  PIKET_SLOTS,
  formatIndoDate,
  addWeeksToFriday,
  getNearestFriday,
  calculateBaseAssignments
} from './piketUtils';

export default function TabelPutar({
  config,
  allWeeksData = {},
  selectedFriday,
  onSelectFriday
}) {
  const members = config.members || [];
  const baseDate = config.startDate || '2026-10-09';
  const nearestFriday = getNearestFriday();

  // Offset siklus (0 = siklus saat ini, 1 = siklus berikutnya, -1 = siklus lalu)
  const [cycleOffset, setCycleOffset] = useState(0);

  // Buat array 12 Jumat untuk siklus yang dipilih
  const cycleFridays = [];
  const cycleStartWeeks = cycleOffset * 12;
  for (let i = 0; i < 12; i++) {
    const fDate = addWeeksToFriday(baseDate, cycleStartWeeks + i);
    cycleFridays.push(fDate);
  }

  const getSlotClassColor = (slotClass) => {
    switch (slotClass) {
      case 'Berat': return 'bg-red-50 text-red-900 border-red-200';
      case 'Menengah': return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Ringan': return 'bg-blue-50 text-blue-900 border-blue-200';
      default: return 'bg-purple-50 text-purple-900 border-purple-200'; // Bebas
    }
  };

  const getSlotBadgeColor = (slotClass) => {
    switch (slotClass) {
      case 'Berat': return 'bg-red-500 text-white';
      case 'Menengah': return 'bg-amber-500 text-white';
      case 'Ringan': return 'bg-blue-500 text-white';
      default: return 'bg-purple-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & NAVIGASI SIKLUS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
            Matriks Rotasi 12 Langkah
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            Tabel Putar Siklus {cycleOffset >= 0 ? cycleOffset + 1 : cycleOffset}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Setiap pekan, anggota otomatis maju 1 langkah secara adil. Beban poin berputar merata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCycleOffset(prev => prev - 1)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
          >
            ◀ Siklus Sebelumnya
          </button>
          <button
            onClick={() => setCycleOffset(0)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-all cursor-pointer"
          >
            Siklus Awal (Okt 2026)
          </button>
          <button
            onClick={() => setCycleOffset(prev => prev + 1)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
          >
            Siklus Berikutnya ▶
          </button>
        </div>
      </div>

      {/* LEGENDA URUTAN LANGKAH (R2) */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
        <div className="text-xs font-black text-indigo-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>🔄</span> Urutan Langkah Rotasi (Maju 1 Langkah Tiap Jumat):
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          {PIKET_SLOTS.map((s, idx) => (
            <React.Fragment key={s.code}>
              <span className={`px-2 py-1 rounded-md border ${getSlotClassColor(s.class)} flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getSlotBadgeColor(s.class)}`}></span>
                <span>{s.code}</span>
                <span className="text-[10px] opacity-70">({s.points}p)</span>
              </span>
              {idx < PIKET_SLOTS.length - 1 && <span className="text-gray-400">➜</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* GRID TABEL PUTAR SATU SIKLUS PENUH */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="py-3 px-4 text-left font-black uppercase text-[11px] tracking-wider sticky left-0 bg-gray-900 z-10 w-36 shadow-r">
                  Nama Anggota
                </th>
                {cycleFridays.map((friday, idx) => {
                  const isCurrent = friday === nearestFriday;
                  const isSelected = friday === selectedFriday;
                  return (
                    <th
                      key={friday}
                      onClick={() => onSelectFriday && onSelectFriday(friday)}
                      className={`py-3 px-3 text-center min-w-[120px] transition-all cursor-pointer ${isCurrent ? 'bg-indigo-700 text-white font-black' : isSelected ? 'bg-gray-800 text-indigo-300' : 'bg-gray-900'}`}
                      title="Klik untuk buka jadwal Jumat ini"
                    >
                      <div className="text-[10px] opacity-75">Jumat #{idx + 1}</div>
                      <div className="text-xs font-extrabold whitespace-nowrap">
                        {new Date(friday + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>
                      {isCurrent && (
                        <span className="inline-block bg-emerald-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase mt-0.5">
                          Pekan Ini
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {members.map((member, memberIdx) => (
                <tr key={member} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-extrabold text-gray-900 sticky left-0 bg-white shadow-r whitespace-nowrap border-r border-gray-100">
                    {member}
                  </td>
                  {cycleFridays.map((friday) => {
                    const baseAssignments = calculateBaseAssignments(friday, members, baseDate);
                    // Cari slot mana yang dipegang member ini
                    let memberSlot = null;
                    PIKET_SLOTS.forEach(s => {
                      if (baseAssignments[s.code]?.originalMember === member) {
                        memberSlot = baseAssignments[s.code];
                      }
                    });

                    // Cek apakah ada record absen di hari ini
                    const weekItem = allWeeksData[friday] || {};
                    const absence = weekItem.absences?.[member];

                    const slotObj = memberSlot?.slot;
                    const isSelected = friday === selectedFriday;

                    return (
                      <td
                        key={friday}
                        onClick={() => onSelectFriday && onSelectFriday(friday)}
                        className={`py-2 px-2 text-center border-r border-gray-100 transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}
                        title={absence ? `${member} ABSEN: ${absence.reason}` : `${member} bertugas di ${slotObj?.name}`}
                      >
                        {slotObj ? (
                          <div className={`p-1.5 rounded-lg border text-[11px] flex flex-col items-center justify-center ${absence ? 'bg-rose-50 border-rose-300 text-rose-800' : getSlotClassColor(slotObj.class)}`}>
                            <div className="font-extrabold flex items-center gap-1">
                              <span>{slotObj.code}</span>
                              {slotObj.code === 'Kaca' && memberSlot?.kacaSide && (
                                <span className="text-[9px] opacity-75">({memberSlot.kacaSide[0]})</span>
                              )}
                            </div>
                            {absence ? (
                              <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1 rounded mt-0.5">
                                ❌ Absen
                              </span>
                            ) : (
                              <span className="text-[9px] opacity-70">
                                {slotObj.points} poin
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
