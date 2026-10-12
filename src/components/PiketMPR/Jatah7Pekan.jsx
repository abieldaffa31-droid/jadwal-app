import React, { useState } from 'react';
import { calculateAnnualQuotaStats, formatIndoDate } from './piketUtils';

export default function Jatah7Pekan({
  config,
  allWeeksData = {}
}) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [expandedMember, setExpandedMember] = useState(null);

  const stats = calculateAnnualQuotaStats(config, allWeeksData, selectedYear);
  const memberList = Object.values(stats);

  // F4: Diurutkan dari sisa jatah paling sedikit (yang paling sering absen di atas)
  memberList.sort((a, b) => {
    if (a.remainingCount !== b.remainingCount) {
      return a.remainingCount - b.remainingCount;
    }
    return b.usedCount - a.usedCount;
  });

  const getQuotaBadgeStyle = (remaining, excess) => {
    if (excess > 0) {
      return 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse';
    }
    if (remaining === 0) {
      return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
    }
    if (remaining <= 2) {
      return 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
  };

  return (
    <div className="space-y-6">
      {/* HEADER & SELECTOR TAHUN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
            Ketidakhadiran & Cuti Piket
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            Rekap Jatah 7 Pekan / Tahun ({selectedYear})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Batas maksimal tidak hadir 7 pekan per tahun kalender (libur piket, pulang, kuliah, izin, tanpa kabar).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 px-3 py-2 rounded-xl">
          <span className="text-xs font-bold text-gray-500">Tahun Kalender:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-black text-gray-900 bg-transparent outline-none cursor-pointer"
          >
            <option value="2026">Tahun 2026</option>
            <option value="2027">Tahun 2027</option>
            <option value="2028">Tahun 2028</option>
          </select>
        </div>
      </div>

      {/* INFORMASI ATURAN JATAH (R5, R6, R7) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs font-black text-blue-900 uppercase tracking-wider mb-1">
            📌 Aturan Jatah (R5)
          </div>
          <div className="text-xs text-blue-800 leading-relaxed">
            Maksimal 7 pekan per tahun. Semua alasan memotong kuota. Langkah Bebas piket tidak memotong jatah.
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">
            🏖️ Libur Piket (R6)
          </div>
          <div className="text-xs text-amber-800 leading-relaxed">
            Maksimal 1 orang per minggu. Jika ada lebih dari satu permintaan, yang sisa jatahnya lebih banyak didahulukan.
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="text-xs font-black text-rose-900 uppercase tracking-wider mb-1">
            ⚠️ Jatah Habis (R7)
          </div>
          <div className="text-xs text-rose-800 leading-relaxed">
            Ketidakhadiran setelah jatah 7 pekan habis tetap dicatat dan ditampilkan sebagai <b>"Lebih"</b> untuk evaluasi takmir.
          </div>
        </div>
      </div>

      {/* TABEL REKAP JATAH SEMUA ANGGOTA INTI */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">
            Monitoring Kuota Anggota Inti (Urutan Sisa Terkecil)
          </h3>
          <span className="text-xs text-gray-500 italic">
            Klik baris anggota untuk melihat rincian tanggal & alasan
          </span>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-800 text-white uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left">Nama Anggota</th>
                <th className="py-3 px-4 text-center w-28">Total Kuota</th>
                <th className="py-3 px-4 text-center w-28 text-rose-300">Terpakai</th>
                <th className="py-3 px-4 text-center w-28 text-emerald-300">Sisa Jatah</th>
                <th className="py-3 px-4 text-center w-28 text-amber-300">Kelebihan</th>
                <th className="py-3 px-4 text-center w-36">Status</th>
                <th className="py-3 px-4 text-center w-24">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {memberList.map((m) => {
                const isExpanded = expandedMember === m.name;
                const hasExcess = m.excessCount > 0;

                return (
                  <React.Fragment key={m.name}>
                    <tr
                      onClick={() => setExpandedMember(isExpanded ? null : m.name)}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="py-3 px-4 font-black text-sm text-gray-900">
                        {m.name}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-500">
                        {config.maxLeavePerYear || 7} Pekan
                      </td>
                      <td className="py-3 px-4 text-center font-black text-rose-600">
                        {m.usedCount} Kali
                      </td>
                      <td className="py-3 px-4 text-center font-black text-emerald-700">
                        {m.remainingCount} Pekan
                      </td>
                      <td className="py-3 px-4 text-center font-black">
                        {hasExcess ? (
                          <span className="text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full font-black">
                            +{m.excessCount} Lebih
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] border ${getQuotaBadgeStyle(m.remainingCount, m.excessCount)}`}>
                          {hasExcess ? '🔴 OVER LIMIT' : m.remainingCount === 0 ? '🔴 HABIS' : m.remainingCount <= 2 ? '🟡 MENIPIS' : '🟢 AMAN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-indigo-600 font-bold">
                        {isExpanded ? '▲ Tutup' : '▼ Lihat'}
                      </td>
                    </tr>

                    {/* EXPANDED ROW: RINCIAN RIWAYAT KETIDAKHADIRAN */}
                    {isExpanded && (
                      <tr className="bg-gray-50/90 border-y border-gray-200">
                        <td colSpan={7} className="p-4 pl-8">
                          <div className="space-y-2">
                            <div className="font-extrabold text-xs text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                              <span>📅</span> Riwayat Ketidakhadiran {m.name} di Tahun {selectedYear}:
                            </div>

                            {m.history.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                {m.history.map((h, hIdx) => (
                                  <div key={hIdx} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="font-black text-gray-800">{formatIndoDate(h.date, false)}</span>
                                      <span className="bg-rose-50 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                        {h.reason}
                                      </span>
                                    </div>
                                    {h.substitute && h.substitute !== '-' && (
                                      <div className="text-[10px] text-gray-500 mt-1">
                                        Pengganti: <b className="text-indigo-700">{h.substitute}</b>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic p-2 bg-white rounded-lg border border-gray-200">
                                Belum pernah tidak hadir / jatah masih utuh 100%.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
