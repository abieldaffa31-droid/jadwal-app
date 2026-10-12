import React, { useState, useEffect } from 'react';
import {
  DEFAULT_PIKET_MEMBERS,
  DEFAULT_VOLUNTEERS,
  DEFAULT_PLAZA_OFFICER,
  BASE_START_FRIDAY,
  getNearestFriday
} from './piketUtils';
import MingguIni from './MingguIni';
import TabelPutar from './TabelPutar';
import Jatah7Pekan from './Jatah7Pekan';
import KerjaBakti from './KerjaBakti';
import PengaturanPiket from './PengaturanPiket';

export default function PiketMPR({
  cloudData = {},
  onSavePiketCloud,
  setMessage
}) {
  const [subTab, setSubTab] = useState('minggu_ini'); // 'minggu_ini' | 'tabel_putar' | 'jatah' | 'kerja_bakti' | 'pengaturan'
  const [selectedFriday, setSelectedFriday] = useState(() => getNearestFriday());

  // 1. Config state
  const [piketConfig, setPiketConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('piket_config_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      members: DEFAULT_PIKET_MEMBERS,
      volunteers: DEFAULT_VOLUNTEERS,
      fixedPlaza: DEFAULT_PLAZA_OFFICER,
      startDate: BASE_START_FRIDAY,
      maxLeavePerYear: 7,
    };
  });

  // 2. Weeks data state (absences, sidak per Friday)
  const [piketWeeks, setPiketWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('piket_weeks_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // 3. Kerja bakti state (monthly cleanup checklist)
  const [piketKerjaBakti, setPiketKerjaBakti] = useState(() => {
    try {
      const saved = localStorage.getItem('piket_kerjabakti_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Sinkronisasi data dari cloud jika tersedia
  useEffect(() => {
    if (cloudData.piket_config) {
      setPiketConfig(cloudData.piket_config);
      localStorage.setItem('piket_config_v1', JSON.stringify(cloudData.piket_config));
    }
    if (cloudData.piket_weeks) {
      setPiketWeeks(cloudData.piket_weeks);
      localStorage.setItem('piket_weeks_v1', JSON.stringify(cloudData.piket_weeks));
    }
    if (cloudData.piket_kerjabakti) {
      setPiketKerjaBakti(cloudData.piket_kerjabakti);
      localStorage.setItem('piket_kerjabakti_v1', JSON.stringify(cloudData.piket_kerjabakti));
    }
  }, [cloudData]);

  // Handler update week data (sidak & absences)
  const handleUpdateWeekData = (fridayStr, newWeekObj) => {
    const updated = { ...piketWeeks, [fridayStr]: newWeekObj };
    setPiketWeeks(updated);
    localStorage.setItem('piket_weeks_v1', JSON.stringify(updated));
    if (onSavePiketCloud) {
      onSavePiketCloud({ piket_weeks: updated });
    }
  };

  // Handler update config
  const handleUpdateConfig = (newConfig) => {
    setPiketConfig(newConfig);
    localStorage.setItem('piket_config_v1', JSON.stringify(newConfig));
    if (onSavePiketCloud) {
      onSavePiketCloud({ piket_config: newConfig });
    }
  };

  // Handler update kerja bakti
  const handleUpdateKerjaBakti = (monthKey, newRecord) => {
    const updated = { ...piketKerjaBakti, [monthKey]: newRecord };
    setPiketKerjaBakti(updated);
    localStorage.setItem('piket_kerjabakti_v1', JSON.stringify(updated));
    if (onSavePiketCloud) {
      onSavePiketCloud({ piket_kerjabakti: updated });
    }
  };

  const SUB_TABS = [
    { id: 'minggu_ini', label: '📅 Minggu Ini & Sidak' },
    { id: 'tabel_putar', label: '🔄 Tabel Putar (12 Langkah)' },
    { id: 'jatah', label: '📊 Jatah 7 Pekan' },
    { id: 'kerja_bakti', label: '🧹 Kerja Bakti' },
    { id: 'pengaturan', label: '⚙️ Pengaturan' },
  ];

  return (
    <div className="space-y-6">
      {/* SUB-TABS NAVIGATION */}
      <div className="flex justify-center flex-wrap gap-1.5 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-xs">
        {SUB_TABS.map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB CONTENTS */}
      {subTab === 'minggu_ini' && (
        <MingguIni
          selectedFriday={selectedFriday}
          setSelectedFriday={setSelectedFriday}
          config={piketConfig}
          weekData={piketWeeks[selectedFriday] || {}}
          onUpdateWeekData={handleUpdateWeekData}
          setMessage={setMessage}
        />
      )}

      {subTab === 'tabel_putar' && (
        <TabelPutar
          config={piketConfig}
          allWeeksData={piketWeeks}
          selectedFriday={selectedFriday}
          onSelectFriday={(f) => {
            setSelectedFriday(f);
            setSubTab('minggu_ini');
          }}
        />
      )}

      {subTab === 'jatah' && (
        <Jatah7Pekan
          config={piketConfig}
          allWeeksData={piketWeeks}
        />
      )}

      {subTab === 'kerja_bakti' && (
        <KerjaBakti
          kerjaBaktiData={piketKerjaBakti}
          onUpdateKerjaBakti={handleUpdateKerjaBakti}
          setMessage={setMessage}
        />
      )}

      {subTab === 'pengaturan' && (
        <PengaturanPiket
          config={piketConfig}
          onUpdateConfig={handleUpdateConfig}
          setMessage={setMessage}
        />
      )}
    </div>
  );
}
