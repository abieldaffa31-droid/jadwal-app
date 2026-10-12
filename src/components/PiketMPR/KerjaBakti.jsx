import React, { useState } from 'react';
import { formatIndoDate } from './piketUtils';

export default function KerjaBakti({
  kerjaBaktiData = {},
  onUpdateKerjaBakti,
  setMessage
}) {
  const currentMonthKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  const monthRecord = kerjaBaktiData[selectedMonth] || {
    date: `${selectedMonth}-15`,
    areas: {
      kipas: false,
      dapur: false,
      gudang_ramadan: false,
      gudang_lt3: false,
    },
    note: ''
  };

  const AREAS_CONFIG = [
    {
      id: 'kipas',
      title: 'Kipas Angin & Sarang Laba-Laba',
      freq: 'Bulanan',
      desc: 'Pembersihan bilah kipas angin dinding/plafon dan jaring laba-laba seluruh ruangan masjid.',
      active: true,
    },
    {
      id: 'dapur',
      title: 'Areal Dapur & Jemuran',
      freq: 'Bulanan',
      desc: 'Pembersihan wastafel, kompor, penataan rak piring, dan kerapian area jemuran takmir.',
      active: true,
    },
    {
      id: 'gudang_ramadan',
      title: 'Gudang Utara & Selatan (H-1 Ramadan)',
      freq: 'Tahunan (H-1 Ramadan)',
      desc: 'Penataan karpet cadangan, sound system tambahan, dan logistik jelang bulan Ramadhan.',
      active: true, // dapat diaktifkan menjelang Ramadan
    },
    {
      id: 'gudang_lt3',
      title: 'Gudang Lt.3 (Prospek)',
      freq: 'Prospektif',
      desc: 'Penataan berkala material dan arsip takmir lantai 3.',
      active: true,
    },
  ];

  const handleToggleArea = (areaId) => {
    const updatedAreas = {
      ...(monthRecord.areas || {}),
      [areaId]: !monthRecord.areas?.[areaId]
    };
    const updatedRecord = { ...monthRecord, areas: updatedAreas };
    onUpdateKerjaBakti(selectedMonth, updatedRecord);
    setMessage('Status area kerja bakti diperbarui!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleDateChange = (newDate) => {
    const updatedRecord = { ...monthRecord, date: newDate };
    onUpdateKerjaBakti(selectedMonth, updatedRecord);
  };

  const handleCopyMessage = () => {
    const indoDate = formatIndoDate(monthRecord.date, true);
    let msg = `*PEMBERITAHUAN KERJA BAKTI BULANAN TAKMIR MPR*\n`;
    msg += `📅 Pelaksanaan: ${indoDate || 'Segera diumumkan'}\n\n`;
    msg += `*FOKUS AREA KERJA BAKTI:*\n`;

    AREAS_CONFIG.forEach(a => {
      const isDone = monthRecord.areas?.[a.id];
      msg += `• ${a.title}: ${isDone ? '✅ [SELESAI]' : '⏳ [AGENDA]'}\n`;
    });

    msg += `\nMohon kehadiran seluruh takmir untuk menjaga kenyamanan dan kebersihan rumah Allah.\n`;
    msg += `Jazaakumullahu khayran wa baarakallahu fiikum.`;

    navigator.clipboard.writeText(msg);
    setMessage('📋 Pesan kerja bakti berhasil disalin!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & SELECTOR BULAN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
            Agenda Bulanan (R11)
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            Kerja Bakti Bulanan Masjid
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pembersihan area besar yang tidak tercakup dalam piket harian/Jumat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 px-3 py-2 rounded-xl">
            <span className="text-xs font-bold text-gray-500">Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="text-xs font-black text-gray-900 bg-transparent outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleCopyMessage}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>📋</span> Salin Pesan WA
          </button>
        </div>
      </div>

      {/* PENGATURAN TANGGAL PELAKSANAAN */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="text-xs font-black text-indigo-950 uppercase tracking-wider">
            📅 Tanggal Rencana Pelaksanaan Bulan Ini:
          </div>
          <div className="text-sm font-black text-indigo-800 mt-0.5">
            {formatIndoDate(monthRecord.date, true) || 'Belum diatur'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-900">Ubah Tanggal:</span>
          <input
            type="date"
            value={monthRecord.date || ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-bold bg-white outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* CHECKLIST 4 AREA KERJA BAKTI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AREAS_CONFIG.map((area) => {
          const isDone = !!monthRecord.areas?.[area.id];

          return (
            <div
              key={area.id}
              onClick={() => handleToggleArea(area.id)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${isDone ? 'bg-emerald-50/80 border-emerald-500 shadow-xs' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isDone ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {area.freq}
                  </span>
                  <h4 className="text-base font-black text-gray-900 mt-2">
                    {area.title}
                  </h4>
                </div>

                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm transition-all ${isDone ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-400 border border-gray-300'}`}>
                  {isDone ? '✓' : ''}
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {area.desc}
              </p>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[11px] font-bold">
                <span className={isDone ? 'text-emerald-700' : 'text-gray-400'}>
                  Status: {isDone ? 'SELESAI BERSIH' : 'BELUM DIKERJAKAN'}
                </span>
                <span className="text-indigo-600">Klik untuk ubah</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
