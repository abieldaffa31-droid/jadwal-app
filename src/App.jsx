import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { getSupabase } from './supabaseClient';

const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', "JUM'AT", 'SABTU', 'AHAD'];
const TIMES = ['SUBUH', 'DZUHUR', 'ASHAR', 'MAGHRIB', 'ISYA'];

const FLEXIBLE_POOL = [
  'Septian', 'Raihan', 'Nafhan', 'Yusuf', 'Malik', 'Nabiel', 
  'Mujahid', 'Nurdin', 'Zufar', 'Fadel', 'Wildan'
];

const DAY_THEMES = {
  'SENIN': { header: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-300/50', cell: 'bg-gradient-to-b from-blue-50/80 to-white border-blue-100' },
  'SELASA': { header: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-purple-300/50', cell: 'bg-gradient-to-b from-purple-50/80 to-white border-purple-100' },
  'RABU': { header: 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-pink-300/50', cell: 'bg-gradient-to-b from-pink-50/80 to-white border-pink-100' },
  'KAMIS': { header: 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-300/50', cell: 'bg-gradient-to-b from-orange-50/80 to-white border-orange-100' },
  'JUM\'AT': { header: 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-300/50', cell: 'bg-gradient-to-b from-emerald-50/80 to-white border-emerald-100' },
  'SABTU': { header: 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-300/50', cell: 'bg-gradient-to-b from-cyan-50/80 to-white border-cyan-100' },
  'AHAD': { header: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-300/50', cell: 'bg-gradient-to-b from-amber-50/80 to-white border-amber-100' },
};

const IMAGE_SCHEDULE_STATE = {
  'SENIN-SUBUH': { k1: 'Raihan', imam: 'Arga', k2: 'Raihan', badal: 'Fadel' },
  'SELASA-SUBUH': { k1: 'Nafhan', imam: 'Pak Hafid', k2: 'Wildan', badal: 'Nabiel' },
  'RABU-SUBUH': { k1: 'Yusuf', imam: 'Arya', k2: 'Wildan', badal: 'Yusuf' },
  'KAMIS-SUBUH': { k1: 'Fadel', imam: 'Nazar', k2: 'Mujahid', badal: 'Raihan' },
  'JUM\'AT-SUBUH': { k1: 'Zufar', imam: 'Nazar', k2: 'Yusuf', badal: 'Mujahid' },
  'SABTU-SUBUH': { k1: 'Nafhan', imam: 'Nazar', k2: 'Zufar', badal: 'Wildan' },
  'AHAD-SUBUH': { k1: 'Nabiel', imam: 'Pak Zaid', k2: 'Fadel', badal: 'Nafhan' }, 
  
  'SENIN-DZUHUR': { adzan: 'Mujahid', imam: 'Bpk-bpk', badal: 'Yusuf' },
  'SELASA-DZUHUR': { adzan: 'Nafhan', imam: 'Bpk-bpk', badal: 'Wildan' },
  'RABU-DZUHUR': { adzan: 'Yusuf', imam: 'Bpk-bpk', badal: 'Nafhan' },
  'KAMIS-DZUHUR': { adzan: 'Mujahid', imam: 'Bpk-bpk', badal: 'Wildan' },
  'JUM\'AT-DZUHUR': { adzan: 'Cahyo', imam: 'Khatib', badal: 'Nazar' },
  'SABTU-DZUHUR': { adzan: 'Nafhan', imam: 'Bpk-bpk', badal: 'Zufar' },
  'AHAD-DZUHUR': { adzan: 'Yusuf', imam: 'Bpk-bpk', badal: 'Zufar' },
  
  'SENIN-ASHAR': { adzan: 'Mujahid', imam: 'Bpk-bpk', badal: 'Yusuf' },
  'SELASA-ASHAR': { adzan: 'Nafhan', imam: 'Bpk-bpk', badal: 'Mujahid' },
  'RABU-ASHAR': { adzan: 'Wildan', imam: 'Bpk-bpk', badal: 'Mujahid' },
  'KAMIS-ASHAR': { adzan: 'Mujahid', imam: 'Bpk-bpk', badal: 'Nabiel' },
  'JUM\'AT-ASHAR': { adzan: 'Fadel', imam: 'Bpk-bpk', badal: 'Nabiel' },
  'SABTU-ASHAR': { adzan: 'Nabiel', imam: 'Bpk-bpk', badal: 'Raihan' },
  'AHAD-ASHAR': { adzan: 'Zufar', imam: 'Bpk-bpk', badal: 'Fadel' },
  
  'SENIN-MAGHRIB': { adzan: 'Mujahid', imam: 'Cahyo', badal: 'Nabiel' },
  'SELASA-MAGHRIB': { adzan: 'Raihan', imam: 'Abdur', badal: 'Nabiel' },
  'RABU-MAGHRIB': { adzan: 'Fadel', imam: 'Arya', badal: 'Nafhan' },
  'KAMIS-MAGHRIB': { adzan: 'Nabiel', imam: 'Miqdad', badal: 'Fadel' },
  'JUM\'AT-MAGHRIB': { adzan: 'Raihan', imam: 'Miqdad', badal: 'Fadel' },
  'SABTU-MAGHRIB': { adzan: 'Wildan', imam: 'Nazar', badal: 'Raihan' },
  'AHAD-MAGHRIB': { adzan: 'Fadel', imam: 'Pak Zaid', badal: 'Zufar' },

  'SENIN-ISYA': { adzan: 'Raihan', imam: 'Nazar', badal: 'Nafhan' },
  'SELASA-ISYA': { adzan: 'Cahyo', imam: 'Hasim', badal: 'Zufar' },
  'RABU-ISYA': { adzan: 'Zufar', imam: 'Abdur', badal: 'Raihan' },
  'KAMIS-ISYA': { adzan: 'Wildan', imam: 'Nazar', badal: 'Yusuf' },
  'JUM\'AT-ISYA': { adzan: 'Fadel', imam: 'Pak Hafid', badal: 'Zufar' },
  'SABTU-ISYA': { adzan: 'Nafhan', imam: 'Arga', badal: 'Wildan' },
  'AHAD-ISYA': { adzan: 'Nabiel', imam: 'Arga', badal: 'Yusuf' },

  'HADITS-SENIN': 'Yusuf',
  'MC-SENIN': 'Yusuf (s)\nRaihan (m)',
  'HADITS-SELASA': 'Malik',
  'MC-SELASA': 'Nafhan',
  'HADITS-RABU': 'Wildan',
  'MC-RABU': 'Fadel',
  'HADITS-KAMIS': 'Fadel',
  'MC-KAMIS': 'Mujahid',
  'HADITS-JUM\'AT': 'Zufar',
  'MC-JUM\'AT': 'Nabiel (j)\nYusuf (m)',
  'HADITS-SABTU': 'Nafhan',
  'MC-SABTU': 'Wildan',
  'HADITS-AHAD': '-',
  'MC-AHAD': 'Nabiel (p)\nMujahid (s)',

  'POSTER-SENIN': 'Nafhan (s)\nRaihan (m)',
  'POSTER-SELASA': 'Nabiel',
  'POSTER-RABU': 'Nafhan',
  'POSTER-KAMIS': 'Wildan',
  'POSTER-JUM\'AT': 'Raihan (j)\nWildan (m)',
  'POSTER-SABTU': '-(p)\nNabiel (m)',
  'POSTER-AHAD': 'Raihan (p)',

  'STREAMER-SENIN': 'Nabiel (s)\nWildan (m)',
  'STREAMER-SELASA': 'Nafhan (m)',
  'STREAMER-RABU': 'AAW/Arga/Nabil (m)',
  'STREAMER-KAMIS': 'Nafhan (s)',
  'STREAMER-JUM\'AT': 'Wildan (s)\nZufar (m)',
  'STREAMER-SABTU': '-(p)\nNafhan (m)',
  'STREAMER-AHAD': 'Zufar (p)\nYusuf (s)',

  'PIKET-SENIN': 'Fadel | Raihan',
  'PIKET-SELASA': 'Nabiel',
  'PIKET-RABU': 'Zufar',
  'PIKET-KAMIS': 'Mujahid',
  'PIKET-JUM\'AT': 'Wildan',
  'PIKET-SABTU': 'Yusuf',
  'PIKET-AHAD': 'Nafhan'
};

const ALL_POSSIBLE_NAMES = [...FLEXIBLE_POOL, 'Bpk-bpk', 'Cahyo', 'Nazar', 'Pak Hafid', 'Pak Zaid', 'Arya', 'Abdur', 'Arga', 'Hasim', 'Khatib', 'Miqdad', 'AAW/Arga/Nabil', '-'];

// Slot yang DIKUNCI — tidak akan berubah saat Generate / Patch
const LOCKED_CELLS = {
  'SENIN-SUBUH':    { imam: 'Arga' },
  'RABU-MAGHRIB':   { imam: 'Arya' },
  "JUM'AT-DZUHUR": { badal: 'Nazar' },
  'SELASA-ISYA':    { adzan: 'Cahyo' },
};

// Helper: terapkan LOCKED_CELLS ke schedule manapun
const applyLocks = (sched) => {
  const result = { ...sched };
  Object.entries(LOCKED_CELLS).forEach(([key, roles]) => {
    if (result[key]) {
      result[key] = { ...result[key], ...roles };
    }
  });
  return result;
};

export default function JadwalApp() {
  const [activeTab, setActiveTab] = useState('jadwal');
  const [unavailability, setUnavailability] = useState({});
  const [selectedPerson, setSelectedPerson] = useState(FLEXIBLE_POOL[0]);
  const [schedule, setSchedule] = useState(IMAGE_SCHEDULE_STATE);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingImam, setIsDownloadingImam] = useState(false);
  const [message, setMessage] = useState('');

  // Supabase Cloud States
  const [cloudStatus, setCloudStatus] = useState('offline'); // 'offline' | 'connected'
  
  const scheduleRef = useRef(null);
  const imamScheduleRef = useRef(null);
  const fileInputRef = useRef(null);
  const cloudSaveTimerRef = useRef(null);

  const pushHistory = (currentSched) => {
    setHistory(prev => [...prev.slice(-30), currentSched]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    setRedoStack(prev => [schedule, ...prev]);
    setHistory(newHistory);
    setSchedule(previous);
    localStorage.setItem('jadwal_v14', JSON.stringify(previous));
    saveToCloud(previous, unavailability, true);
    setMessage('↩️ Undo berhasil');
    setTimeout(() => setMessage(''), 2500);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    const newRedo = redoStack.slice(1);
    setHistory(prev => [...prev, schedule]);
    setRedoStack(newRedo);
    setSchedule(next);
    localStorage.setItem('jadwal_v14', JSON.stringify(next));
    saveToCloud(next, unavailability, true);
    setMessage('↪️ Redo berhasil');
    setTimeout(() => setMessage(''), 2500);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, redoStack, schedule, unavailability]);

  const saveToCloud = (newSchedule, newUnavail, instant = false) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    const doSave = async () => {
      try {
        const payload = {
          id: 'default',
          schedule: newSchedule || schedule,
          unavailability: newUnavail || unavailability,
          updated_at: new Date().toISOString(),
        };
        await supabase.from('jadwal_takmir').upsert(payload);
      } catch (e) {
        console.error('Cloud save error:', e);
      }
    };

    if (instant) {
      doSave();
    } else {
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
      cloudSaveTimerRef.current = setTimeout(doSave, 1500);
    }
  };

  useEffect(() => {
    const supabase = getSupabase();
    let subscription = null;
    let pollInterval = null;

    const applyFromCloud = (data) => {
      if (!data?.schedule) return;
      const merged = applyLocks({ ...IMAGE_SCHEDULE_STATE, ...data.schedule });
      setSchedule(merged);
      localStorage.setItem('jadwal_v14', JSON.stringify(merged));
      if (data.unavailability && Object.keys(data.unavailability).length > 0) {
        setUnavailability(data.unavailability);
        localStorage.setItem('unavail_v11', JSON.stringify(data.unavailability));
      }
    };

    const fetchLatestFromCloud = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from('jadwal_takmir')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (data?.schedule) {
          setCloudStatus('connected');
          applyFromCloud(data);
        }
      } catch (e) {
        console.error('Supabase fetch error:', e);
      }
    };

    if (supabase) {
      setCloudStatus('connected');

      // CLOUD IS PRIMARY SOURCE OF TRUTH — fetch cloud FIRST immediately
      fetchLatestFromCloud().then(() => {
        // Hanya setelah cloud berhasil, mulai polling & realtime
        pollInterval = setInterval(fetchLatestFromCloud, 5000);
      });

      // Realtime push subscription
      subscription = supabase
        .channel('admin:jadwal_takmir_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal_takmir' }, (payload) => {
          if (payload.new?.schedule) applyFromCloud(payload.new);
        })
        .subscribe();

      // Sync saat kembali ke tab/focus
      const handleFocus = () => fetchLatestFromCloud();
      window.addEventListener('focus', handleFocus);

      return () => {
        if (subscription) supabase.removeChannel(subscription);
        if (pollInterval) clearInterval(pollInterval);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      // FALLBACK: Offline, pakai localStorage saja
      setCloudStatus('offline');
      const savedSchedule = localStorage.getItem('jadwal_v14');
      const savedUnavail = localStorage.getItem('unavail_v11');
      let currentSched = IMAGE_SCHEDULE_STATE;
      if (savedSchedule) {
        try { currentSched = applyLocks({ ...IMAGE_SCHEDULE_STATE, ...JSON.parse(savedSchedule) }); } catch (e) {}
      }
      setSchedule(currentSched);
      if (savedUnavail) {
        try { setUnavailability(JSON.parse(savedUnavail)); } catch (e) {}
      }
    }
  }, []);

  const handleUnavailChange = (day, time) => {
    const key = `${selectedPerson}-${day}-${time}`;
    const newUnavail = { ...unavailability, [key]: !unavailability[key] };
    setUnavailability(newUnavail);
    localStorage.setItem('unavail_v11', JSON.stringify(newUnavail));
    saveToCloud(schedule, newUnavail);
  };

  const selectAllUnavail = (value) => {
    let newUnavail = { ...unavailability };
    DAYS.forEach(day => {
      TIMES.forEach(time => {
        newUnavail[`${selectedPerson}-${day}-${time}`] = value;
      });
    });
    setUnavailability(newUnavail);
    localStorage.setItem('unavail_v11', JSON.stringify(newUnavail));
    saveToCloud(schedule, newUnavail);
  };

  const updateCell = (cellKey, field, value) => {
    pushHistory(schedule);
    const newSched = { ...schedule };
    if (field === null || typeof newSched[cellKey] === 'string' || newSched[cellKey] === undefined) {
        newSched[cellKey] = value;
    } else {
        newSched[cellKey] = { ...newSched[cellKey], [field]: value };
    }
    setSchedule(newSched);
    localStorage.setItem('jadwal_v14', JSON.stringify(newSched));
    saveToCloud(newSched, unavailability);
  };

  const handleShareLink = () => {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(schedule)));
      const shareUrl = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
      navigator.clipboard.writeText(shareUrl);
      setMessage('Link Sync disalin! Buka link ini di browser/laptop lain untuk menyinkronkan jadwal.');
      setTimeout(() => setMessage(''), 5000);
    } catch (e) {
      setMessage('Gagal menyalin link sync');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleExportData = () => {
    const backupData = {
      schedule,
      unavailability,
      version: 'v14',
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Jadwal_Takmir_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Backup data JSON berhasil di-download!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.schedule) {
          pushHistory(schedule);
          setSchedule(imported.schedule);
          localStorage.setItem('jadwal_v14', JSON.stringify(imported.schedule));
        }
        if (imported.unavailability) {
          setUnavailability(imported.unavailability);
          localStorage.setItem('unavail_v11', JSON.stringify(imported.unavailability));
        }
        setMessage('Data berhasil di-restore dari backup JSON!');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage('Gagal membaca file JSON backup!');
        setTimeout(() => setMessage(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const isPersonAssigned = (person, day, time) => {
      const cell = schedule[`${day}-${time}`];
      if (!cell) return false;
      return Object.values(cell).includes(person);
  };

  const isAvailable = (person, day, time) => !unavailability[`${person}-${day}-${time}`];

  const getLeastUsedPerson = (counts, pool, day, time, assignedThisSlot) => {
    const availablePool = pool.filter(p => isAvailable(p, day, time) && !assignedThisSlot.includes(p));
    if (availablePool.length === 0) return pool[Math.floor(Math.random() * pool.length)]; 
    availablePool.sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
    const minCount = counts[availablePool[0]] || 0;
    const candidates = availablePool.filter(p => (counts[p] || 0) === minCount);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    counts[chosen] = (counts[chosen] || 0) + 1;
    return chosen;
  };

  // Fitur 1: cek apakah person bertabrakan dengan unavailability di slot tertentu
  const hasConflict = (personName, day, time) => {
    if (!personName || !FLEXIBLE_POOL.includes(personName)) return false;
    return !!unavailability[`${personName}-${day}-${time}`];
  };

  // Fitur 2: hitung distribusi adzan & badal per orang
  const computeDistribution = (sched) => {
    const dist = {};
    FLEXIBLE_POOL.forEach(p => { dist[p] = { adzan: 0, badal: 0, k1k2: 0, total: 0 }; });
    Object.keys(sched).forEach(key => {
      const cell = sched[key];
      if (typeof cell !== 'object' || cell === null) return;
      ['adzan', 'badal', 'k1', 'k2'].forEach(role => {
        const person = cell[role];
        if (dist[person]) {
          if (role === 'adzan') { dist[person].adzan++; dist[person].total++; }
          else if (role === 'badal') { dist[person].badal++; dist[person].total++; }
          else { dist[person].k1k2++; dist[person].total++; }
        }
      });
    });
    return dist;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    pushHistory(schedule);
    setTimeout(() => {
      let newSched = { ...schedule };
      let taskCounts = {};
      FLEXIBLE_POOL.forEach(p => taskCounts[p] = 0);

      // Helper: cek apakah role pada slot ini dikunci
      const isRoleLocked = (day, time, role) => {
        const k = `${day}-${time}`;
        return LOCKED_CELLS[k] && LOCKED_CELLS[k][role] !== undefined;
      };

      DAYS.forEach(day => {
        TIMES.forEach(time => {
          const key = `${day}-${time}`;
          const currentSlot = schedule[key];
          let assigned = [];

          // Tambahkan locked persons ke assigned agar tidak dobel
          const locks = LOCKED_CELLS[key] || {};
          Object.values(locks).forEach(p => { if (p && !assigned.includes(p)) assigned.push(p); });

          if (time === 'SUBUH') {
             if (!isRoleLocked(day, time, 'k1')) {
               let k1 = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
               newSched[key].k1 = k1; assigned.push(k1);
             } else { assigned.push(newSched[key].k1); }

             if (!isRoleLocked(day, time, 'k2')) {
               let k2 = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
               newSched[key].k2 = k2; assigned.push(k2);
             } else { assigned.push(newSched[key].k2); }

             if (!isRoleLocked(day, time, 'imam')) {
               const patenImamSubuh = ['Nazar', 'Pak Hafid', 'Arya', 'Pak Zaid', 'Arga'];
               if (!patenImamSubuh.includes(currentSlot.imam)) {
                 let imam = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
                 newSched[key].imam = imam; assigned.push(imam);
               } else { assigned.push(newSched[key].imam); }
             } else { assigned.push(newSched[key].imam); }

             if (!isRoleLocked(day, time, 'badal')) {
               let badal = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
               newSched[key].badal = badal; assigned.push(badal);
             }
          } else {
             if (!isRoleLocked(day, time, 'adzan')) {
               if (!(day === "JUM'AT" && time === "DZUHUR")) {
                 let adzan = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
                 newSched[key].adzan = adzan; assigned.push(adzan);
               } else { assigned.push(newSched[key].adzan); }
             } else { assigned.push(newSched[key].adzan); }

             if (!isRoleLocked(day, time, 'imam')) {
               const isPatenImam = ['Bpk-bpk', 'Cahyo', 'Arga', 'Miqdad', 'Nazar', 'Pak Zaid', 'Hasim', 'Pak Hafid', 'Abdur', 'Khatib', 'Arya'].includes(currentSlot.imam);
               if (!isPatenImam) {
                 let imam = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
                 newSched[key].imam = imam; assigned.push(imam);
               } else { assigned.push(newSched[key].imam); }
             } else { assigned.push(newSched[key].imam); }

             if (!isRoleLocked(day, time, 'badal')) {
               let badal = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
               newSched[key].badal = badal; assigned.push(badal);
             }
          }
        });
      });

      // Paksa terapkan semua locked values di akhir (jaminan tidak overwrite)
      Object.entries(LOCKED_CELLS).forEach(([key, roles]) => {
        if (newSched[key]) {
          Object.entries(roles).forEach(([role, person]) => {
            newSched[key] = { ...newSched[key], [role]: person };
          });
        }
      });

      setSchedule(newSched);
      localStorage.setItem('jadwal_v14', JSON.stringify(newSched));
      saveToCloud(newSched, unavailability, true);
      setIsGenerating(false);
      setMessage('Jadwal berhasil digenerate! Slot yang dikunci tetap dipertahankan.');
      setTimeout(() => setMessage(''), 3000);
    }, 500);
  };

  const handlePatch = () => {
    setIsGenerating(true);
    pushHistory(schedule);
    setTimeout(() => {
      try {
        let newSched = { ...schedule };
        let patchedCount = 0;
        let balancedCount = 0;

        // ── 1. Fix conflicts (Unavailability) ──
        DAYS.forEach(day => {
          TIMES.forEach(time => {
            const key = `${day}-${time}`;
            const currentSlot = { ...newSched[key] };
            let assigned = Object.values(currentSlot);

            ['k1', 'k2', 'adzan', 'imam', 'badal'].forEach(role => {
              if (currentSlot[role]) {
                const person = currentSlot[role];
                const isLocked = LOCKED_CELLS[key] && LOCKED_CELLS[key][role] !== undefined;
                if (!isLocked && FLEXIBLE_POOL.includes(person) && !isAvailable(person, day, time)) {
                  assigned = assigned.filter(p => p !== person);
                  const counts = computeDistribution(newSched);
                  const availableCandidates = FLEXIBLE_POOL.filter(p => isAvailable(p, day, time) && !assigned.includes(p));
                  if (availableCandidates.length > 0) {
                    availableCandidates.sort((a, b) => (counts[a]?.total || 0) - (counts[b]?.total || 0));
                    const replacement = availableCandidates[0];
                    currentSlot[role] = replacement;
                    assigned.push(replacement);
                    patchedCount++;
                  }
                }
              }
            });
            newSched[key] = currentSlot;
          });
        });

        // ── 2. Identify active members & underutilized members ──
        const activeMembers = FLEXIBLE_POOL.filter(p =>
          DAYS.some(d => TIMES.some(t => isAvailable(p, d, t)))
        );

        if (activeMembers.length > 1) {
          // Total slots = 70. Target per active member = ~7-8 slots
          const targetTotal = Math.floor(70 / activeMembers.length);

          activeMembers.forEach(targetMember => {
            // A. Allocate Subuh Adzan (Target: 2 Subuh Adzan per active member)
            let currentSubuhAdzan = 0;
            DAYS.forEach(day => {
              const key = `${day}-SUBUH`;
              if (newSched[key]?.k1 === targetMember || newSched[key]?.k2 === targetMember) {
                currentSubuhAdzan++;
              }
            });

            if (currentSubuhAdzan < 2) {
              const candidateDays = DAYS.filter(day => {
                const key = `${day}-SUBUH`;
                const slot = newSched[key];
                if (!slot || !isAvailable(targetMember, day, 'SUBUH')) return false;
                const alreadyAssigned = Object.values(slot);
                return !alreadyAssigned.includes(targetMember);
              });

              for (const day of candidateDays) {
                if (currentSubuhAdzan >= 2) break;
                const key = `${day}-SUBUH`;
                const slot = { ...newSched[key] };
                const counts = computeDistribution(newSched);

                for (const role of ['k1', 'k2']) {
                  if (currentSubuhAdzan >= 2) break;
                  if (LOCKED_CELLS[key] && LOCKED_CELLS[key][role]) continue;
                  const owner = slot[role];
                  if (owner && FLEXIBLE_POOL.includes(owner) && (counts[owner]?.total || 0) > targetTotal) {
                    slot[role] = targetMember;
                    currentSubuhAdzan++;
                    balancedCount++;
                    break;
                  }
                }
                newSched[key] = slot;
              }
            }

            // B. Allocate remaining tasks (Balanced between Adzan and Badal)
            const allSlots = [];
            DAYS.forEach(day => {
              TIMES.forEach(time => {
                allSlots.push({ day, time, key: `${day}-${time}` });
              });
            });

            for (const { day, time, key } of allSlots) {
              const currentDistNow = computeDistribution(newSched)[targetMember] || { adzan: 0, badal: 0, k1k2: 0, total: 0 };
              const myAdzan = currentDistNow.adzan + currentDistNow.k1k2;
              const myBadal = currentDistNow.badal;
              const myTotal = myAdzan + myBadal;

              if (myTotal >= targetTotal) break;
              if (!isAvailable(targetMember, day, time)) continue;

              const slot = { ...newSched[key] };
              const alreadyAssigned = Object.values(slot);
              if (alreadyAssigned.includes(targetMember)) continue;

              const counts = computeDistribution(newSched);

              // Utamakan Adzan jika Adzan < Badal, atau sebaliknya
              const rolesToTry = myAdzan <= myBadal 
                ? (time === 'SUBUH' ? ['k1', 'k2', 'badal'] : ['adzan', 'badal'])
                : (time === 'SUBUH' ? ['badal', 'k1', 'k2'] : ['badal', 'adzan']);

              for (const role of rolesToTry) {
                if (LOCKED_CELLS[key] && LOCKED_CELLS[key][role]) continue;
                const owner = slot[role];
                if (!owner || !FLEXIBLE_POOL.includes(owner)) continue;

                const ownerTotal = counts[owner]?.total || 0;
                if (ownerTotal > targetTotal) {
                  slot[role] = targetMember;
                  balancedCount++;
                  break;
                }
              }
              newSched[key] = slot;
            }
          });
        }

        // ── 3. Apply locks & Save ──
        newSched = applyLocks(newSched);
        setSchedule(newSched);
        localStorage.setItem('jadwal_v14', JSON.stringify(newSched));
        saveToCloud(newSched, unavailability, true);

        if (patchedCount > 0 && balancedCount > 0) {
          setMessage(`✅ ${patchedCount} bentrok diperbaiki + ${balancedCount} slot berhasil diseimbangkan!`);
        } else if (patchedCount > 0) {
          setMessage(`✅ ${patchedCount} jadwal bentrok berhasil ditambal!`);
        } else if (balancedCount > 0) {
          setMessage(`⚖️ ${balancedCount} slot berhasil disesuaikan untuk takmir aktif!`);
        } else {
          setMessage('ℹ️ Jadwal sudah optimal & seimbang.');
        }
        setTimeout(() => setMessage(''), 5000);
      } catch (err) {
        console.error('Patch error:', err);
        setMessage('⚠️ Terjadi kendala saat menambal jadwal.');
        setTimeout(() => setMessage(''), 4000);
      } finally {
        setIsGenerating(false);
      }
    }, 400);
  };


  const handleDownload = async () => {
    if (!scheduleRef.current) return;
    setIsDownloading(true);
    setMessage('');
    try {
      const dataUrl = await toPng(scheduleRef.current, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = 'Jadwal_Utama.png';
      link.href = dataUrl;
      link.click();
      setMessage('Download Jadwal Utama berhasil!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Gagal download: ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadImam = async () => {
    if (!imamScheduleRef.current) return;
    setIsDownloadingImam(true);
    setMessage('');
    try {
      const dataUrl = await toPng(imamScheduleRef.current, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = 'Jadwal_Khusus_Imam.png';
      link.href = dataUrl;
      link.click();
      setMessage('Download Tabel Imam berhasil!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Gagal download: ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsDownloadingImam(false);
    }
  };

  const calculateStats = () => {
    let stats = {};
    FLEXIBLE_POOL.forEach(name => stats[name] = { imam: 0, adzan: 0, badal: 0, hadits: 0, mc: 0, total: 0 });
    
    Object.keys(schedule).forEach(key => {
      const cell = schedule[key];
      
      if (key.startsWith('HADITS-')) {
          if (stats[cell]) {
              stats[cell].hadits++;
              stats[cell].total++;
          }
      } else if (key.startsWith('MC-')) {
          FLEXIBLE_POOL.forEach(person => {
              if (cell && cell.includes(person)) {
                  stats[person].mc++;
                  stats[person].total++;
              }
          });
      } else if (typeof cell === 'object') {
        ['imam', 'adzan', 'k1', 'k2', 'badal'].forEach(role => {
          const person = cell[role];
          if (stats[person]) {
            if (role === 'imam') stats[person].imam++;
            else if (role === 'badal') stats[person].badal++;
            else stats[person].adzan++;
            stats[person].total++;
          }
        });
      }
    });
    return stats;
  };

  const stats = calculateStats();

  // Fitur 1: CellInput dengan conflict warning
  const CellInput = ({ value, onChange, className, day, time }) => {
    const conflict = day && time ? hasConflict(value, day, time) : false;
    return (
      <div
        className={`relative w-full h-full ${className}`}
        title={conflict ? `⚠️ ${value} ditandai SIBUK di waktu ini!` : ''}
      >
        {conflict && (
          <div className="absolute inset-0 border-2 border-red-500 bg-red-100/60 pointer-events-none z-10 rounded-[1px]" />
        )}
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 appearance-none bg-transparent text-center font-bold text-[11px] md:text-[11.5px] leading-tight outline-none cursor-pointer hover:bg-black/10 flex items-center justify-center m-0 p-0"
          style={{ WebkitAppearance: 'none', MozAppearance: 'none', textOverflow: '', color: conflict ? '#b91c1c' : undefined }}
        >
          {['AAW/Arga/Nabil', ...ALL_POSSIBLE_NAMES].map(n => <option key={n} value={n} className="text-black bg-white">{n}</option>)}
        </select>
      </div>
    );
  };

  // Dropdown dengan 2 baris nama + suffix untuk MC/POSTER/STREAMER
  const MultiSelectCell = ({ value, onChange, className }) => {
    const lines = value ? value.split('\n') : [];
    
    const parseLine = (line) => {
      if (!line || line.trim() === '-') return { name: '-', suffix: '' };
      const match = line.match(/\s*\(([^)]+)\)$/);
      if (match) {
        const suffix = `(${match[1]})`;
        const name = line.replace(match[0], '').trim();
        return { name, suffix };
      }
      return { name: line.trim(), suffix: '' };
    };

    const p1 = parseLine(lines[0]);
    const p2 = parseLine(lines[1]);

    const handleChange = (index, field, val) => {
      const currentP1 = { ...p1 };
      const currentP2 = { ...p2 };
      
      if (index === 0) {
        currentP1[field] = val;
      } else {
        currentP2[field] = val;
      }

      const buildLine = (p) => {
        if (!p.name || p.name === '-') return '';
        return p.suffix ? `${p.name} ${p.suffix}` : p.name;
      };

      const l1 = buildLine(currentP1);
      const l2 = buildLine(currentP2);

      const result = [l1, l2].filter(Boolean).join('\n');
      onChange(result);
    };

    const suffixes = ['', '(s)', '(m)', '(j)', '(p)'];

    return (
      <div className={`flex flex-col w-full h-full justify-center ${className}`}>
        {/* Baris 1 */}
        <div className="flex items-center justify-center gap-[2px] h-1/2 hover:bg-black/5 relative py-0.5">
          <select
            value={p1.name}
            onChange={(e) => handleChange(0, 'name', e.target.value)}
            className="appearance-none bg-transparent text-center font-bold text-[11px] md:text-[11.5px] leading-tight outline-none cursor-pointer w-auto px-1 m-0"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            {['AAW/Arga/Nabil', ...ALL_POSSIBLE_NAMES].map(n => <option key={n} value={n} className="text-black bg-white">{n}</option>)}
          </select>
          <select
            value={p1.suffix}
            onChange={(e) => handleChange(0, 'suffix', e.target.value)}
            className="appearance-none bg-transparent text-center text-[10px] text-gray-500 leading-tight outline-none cursor-pointer w-auto px-0.5 m-0 font-semibold"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            {suffixes.map(s => <option key={s} value={s} className="text-black bg-white">{s || '-'}</option>)}
          </select>
        </div>
        {/* Baris 2 */}
        <div className="flex items-center justify-center gap-[2px] h-1/2 hover:bg-black/5 relative border-t border-black/5 py-0.5">
          <select
            value={p2.name}
            onChange={(e) => handleChange(1, 'name', e.target.value)}
            className="appearance-none bg-transparent text-center font-bold text-[11px] md:text-[11.5px] leading-tight outline-none cursor-pointer w-auto px-1 m-0"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            {['AAW/Arga/Nabil', ...ALL_POSSIBLE_NAMES].map(n => <option key={n} value={n} className="text-black bg-white">{n}</option>)}
          </select>
          <select
            value={p2.suffix}
            onChange={(e) => handleChange(1, 'suffix', e.target.value)}
            className="appearance-none bg-transparent text-center text-[10px] text-gray-500 leading-tight outline-none cursor-pointer w-auto px-0.5 m-0 font-semibold"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            {suffixes.map(s => <option key={s} value={s} className="text-black bg-white">{s || '-'}</option>)}
          </select>
        </div>
      </div>
    );
  };

  // Fitur 2: Panel distribusi adzan & badal
  const DistributionPanel = () => {
    const dist = computeDistribution(schedule);
    const people = FLEXIBLE_POOL;
    const adzanVals = people.map(p => dist[p].adzan);
    const badalVals = people.map(p => dist[p].badal);
    const avgAdzan = adzanVals.reduce((a, b) => a + b, 0) / people.length;
    const avgBadal = badalVals.reduce((a, b) => a + b, 0) / people.length;

    const getColor = (val, avg) => {
      const diff = Math.abs(val - avg);
      if (diff <= 1) return 'bg-emerald-100 text-emerald-800';
      if (diff <= 2) return 'bg-amber-100 text-amber-800';
      return 'bg-red-100 text-red-800';
    };

    return (
      <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-wide">📊 Distribusi Tugas (Adzan & Badal)</span>
          <span className="ml-auto text-xs text-gray-400">Hijau = merata · Kuning = sedikit miring · Merah = tidak merata</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center">
            <thead>
              <tr className="bg-gray-100 text-gray-600 font-bold">
                <th className="px-3 py-2 text-left">Nama</th>
                <th className="px-3 py-2">Adzan</th>
                <th className="px-3 py-2">Badal</th>
                <th className="px-3 py-2">K1/K2</th>
                <th className="px-3 py-2 font-extrabold">Total</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p, i) => (
                <tr key={p} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 text-left font-bold text-gray-800">{p}</td>
                  <td className="px-2 py-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${getColor(dist[p].adzan, avgAdzan)}`}>
                      {dist[p].adzan}
                    </span>
                  </td>
                  <td className="px-2 py-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${getColor(dist[p].badal, avgBadal)}`}>
                      {dist[p].badal}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-gray-500 font-semibold">{dist[p].k1k2}</td>
                  <td className="px-2 py-1 font-extrabold text-gray-800">{dist[p].total}</td>
                </tr>
              ))}
              <tr className="bg-gray-200 font-bold text-gray-600">
                <td className="px-3 py-1.5 text-left text-xs">Rata-rata</td>
                <td className="px-2 py-1">{avgAdzan.toFixed(1)}</td>
                <td className="px-2 py-1">{avgBadal.toFixed(1)}</td>
                <td className="px-2 py-1">—</td>
                <td className="px-2 py-1">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ====== TAB INFO UMUM (PUBLIC VIEW) ======
  const PublicView = () => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [clock, setClock] = useState(new Date());
    const [ptLoading, setPtLoading] = useState(true);
    const [ptError, setPtError] = useState(null);

    useEffect(() => {
      const t = setInterval(() => setClock(new Date()), 1000);
      return () => clearInterval(t);
    }, []);

    useEffect(() => {
      const fetch_ = async () => {
        setPtLoading(true);
        try {
          const now = new Date();
          const d = now.getDate().toString().padStart(2, '0');
          const m = (now.getMonth() + 1).toString().padStart(2, '0');
          const y = now.getFullYear();
          // Sinduadi, Mlati, Sleman, Yogyakarta — metode KEMENAG RI / Alhabib (Fajr 20°, Isha 18° + Ihtiyati 2m)
          const res = await fetch(
            `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=-7.7613&longitude=110.3698&method=20&tune=0,2,0,2,2,2,0,2,0`
          );
          const data = await res.json();
          if (data.code === 200) setPrayerTimes(data.data.timings);
          else setPtError('Gagal memuat jadwal sholat');
        } catch (e) {
          setPtError('Tidak ada koneksi internet untuk waktu sholat');
        }
        setPtLoading(false);
      };
      fetch_();
    }, []);

    const dayMap = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', "JUM'AT", 'SABTU'];
    const dayLabelMap = { 'AHAD': 'Ahad', 'SENIN': 'Senin', 'SELASA': 'Selasa', 'RABU': 'Rabu', 'KAMIS': 'Kamis', "JUM'AT": "Jum'at", 'SABTU': 'Sabtu' };
    const today = dayMap[clock.getDay()];

    const PRAYERS = [
      { key: 'SUBUH',   label: 'Subuh',   apiKey: 'Fajr',    color: 'from-indigo-900 to-blue-900',   icon: '🌙' },
      { key: 'DZUHUR',  label: 'Dzuhur',  apiKey: 'Dhuhr',   color: 'from-amber-500 to-orange-500',  icon: '☀️' },
      { key: 'ASHAR',   label: 'Ashar',   apiKey: 'Asr',     color: 'from-orange-500 to-red-500',    icon: '🌤️' },
      { key: 'MAGHRIB', label: 'Maghrib', apiKey: 'Maghrib', color: 'from-purple-700 to-indigo-800', icon: '🌆' },
      { key: 'ISYA',    label: 'Isya',    apiKey: 'Isha',    color: 'from-slate-800 to-gray-900',    icon: '⭐' },
    ];

    // Parse nama dengan suffix tertentu dari nilai MC/Streamer
    const parseSuffix = (val, sfx) => {
      if (!val) return null;
      for (const line of val.split('\n')) {
        if (line.includes(`(${sfx})`)) return line.replace(new RegExp(`\\s*\\(${sfx}\\)`, 'g'), '').trim();
      }
      const first = val.split('\n')[0]?.trim();
      return first && !first.match(/\([a-zp]\)/) ? first : null;
    };

    // Ambil data tugas per sholat
    const getDuty = (pKey) => {
      const cell = schedule[`${today}-${pKey}`];
      if (!cell || typeof cell !== 'object') return null;

      if (pKey === 'SUBUH') {
        const isAhad = today === 'AHAD';
        return {
          rows: [
            { label: 'Adzan K1', value: cell.k1 },
            { label: 'Adzan K2', value: cell.k2 },
            { label: 'Imam', value: cell.imam },
            { label: 'Badal', value: cell.badal },
            isAhad
              ? { label: 'MC Subuh', value: parseSuffix(schedule[`MC-${today}`], 'p') || schedule[`MC-${today}`] }
              : { label: 'Hadits', value: schedule[`HADITS-${today}`] },
          ].filter(r => r.value && r.value !== '-'),
        };
      }

      if (pKey === 'DZUHUR' || pKey === 'ISYA') {
        return {
          rows: [
            { label: 'Adzan', value: cell.adzan },
            { label: 'Imam', value: cell.imam },
            { label: 'Badal', value: cell.badal },
          ].filter(r => r.value && r.value !== '-'),
        };
      }

      if (pKey === 'ASHAR') {
        const base = [
          { label: 'Adzan', value: cell.adzan },
          { label: 'Imam', value: cell.imam },
          { label: 'Badal', value: cell.badal },
        ];
        if (today === 'SENIN' || today === 'KAMIS') {
          const mc = parseSuffix(schedule[`MC-${today}`], 's');
          const st = parseSuffix(schedule[`STREAMER-${today}`], 's');
          if (mc) base.push({ label: 'MC Sore', value: mc });
          if (st) base.push({ label: 'Streamer Sore', value: st });
        }
        return { rows: base.filter(r => r.value && r.value !== '-') };
      }

      if (pKey === 'MAGHRIB') {
        const mc  = parseSuffix(schedule[`MC-${today}`], 'm') || schedule[`MC-${today}`];
        const st  = parseSuffix(schedule[`STREAMER-${today}`], 'm') || schedule[`STREAMER-${today}`];
        return {
          rows: [
            { label: 'Adzan', value: cell.adzan },
            { label: 'Imam', value: cell.imam },
            { label: 'Badal', value: cell.badal },
            { label: 'MC Malam', value: mc },
            { label: 'Streamer', value: st },
          ].filter(r => r.value && r.value !== '-'),
        };
      }

      return null;
    };

    // Tentukan sholat berikutnya (dengan jeda 10 menit setelah azan)
    const getNextPrayer = () => {
      if (!prayerTimes) return null;
      const nowMins = clock.getHours() * 60 + clock.getMinutes();
      for (const p of PRAYERS) {
        const t = prayerTimes[p.apiKey];
        if (!t) continue;
        const [h, m] = t.split(':').map(Number);
        const pMins = h * 60 + m;
        if (pMins + 10 > nowMins) {
          const minsLeft = pMins - nowMins;
          return { ...p, time: t, minsLeft: Math.max(0, minsLeft), isOngoing: minsLeft <= 0 };
        }
      }
      return { ...PRAYERS[0], time: prayerTimes[PRAYERS[0].apiKey], minsLeft: null, tomorrow: true };
    };

    const next = getNextPrayer();

    const timeStr = clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = clock.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const DutyCard = ({ rows, light }) => (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
        {rows.map(r => (
          <div key={r.label} className={`rounded-xl p-2.5 text-center ${ light ? 'bg-white/15' : 'bg-gray-50 border border-gray-100' }`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${ light ? 'text-white/60' : 'text-gray-400' }`}>{r.label}</div>
            <div className={`font-extrabold text-sm leading-tight ${ light ? 'text-white' : 'text-gray-800' }`}>{r.value}</div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="max-w-2xl mx-auto">

        {/* Jam & Tanggal */}
        <div className="bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-2xl p-6 mb-5 text-center shadow-xl">
          <div className="text-6xl md:text-7xl font-extrabold tracking-tight tabular-nums">{timeStr}</div>
          <div className="text-base md:text-lg font-semibold text-teal-100 mt-2 capitalize">{dateStr}</div>
          <div className="text-sm text-teal-200/70 mt-1">Sinduadi, Mlati, Sleman — Yogyakarta</div>
        </div>

        {/* Sholat Berikutnya */}
        {ptLoading ? (
          <div className="text-center py-8 text-gray-400 font-semibold">⏳ Memuat jadwal sholat...</div>
        ) : ptError ? (
          <div className="text-center py-6 text-red-500 font-semibold bg-red-50 rounded-xl border border-red-200">{ptError}</div>
        ) : next && (
          <div className={`bg-gradient-to-br ${next.color} text-white rounded-2xl p-5 mb-5 shadow-xl`}>
            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
              {next.tomorrow ? '🌙 Waktu Sholat Selanjutnya (Besok)' : next.isOngoing ? '🕌 Waktu Sholat' : '⏰ Waktu Sholat Berikutnya'}
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-extrabold flex items-center gap-2">
                  {next.icon} {next.label}
                </div>
                <div className="text-3xl font-bold opacity-80 mt-1">{next.time} WIB</div>
              </div>
              {next.isOngoing ? (
                <div className="text-right bg-white/20 rounded-xl px-4 py-2">
                  <div className="text-xs opacity-70 font-bold uppercase mb-1">Status</div>
                  <div className="text-lg font-extrabold">🕌 Berlangsung</div>
                </div>
              ) : next.minsLeft != null ? (
                <div className="text-right bg-white/15 rounded-xl px-4 py-2">
                  <div className="text-xs opacity-60 font-bold uppercase">lagi</div>
                  <div className="text-2xl font-extrabold tabular-nums">
                    {Math.floor(next.minsLeft / 60) > 0
                      ? `${Math.floor(next.minsLeft / 60)}j ${next.minsLeft % 60}m`
                      : `${next.minsLeft} menit`}
                  </div>
                </div>
              ) : null}
            </div>
            {(() => { const d = getDuty(next.key); return d && <DutyCard rows={d.rows} light />; })()}
          </div>
        )}

        {/* Semua Jadwal Sholat Hari Ini */}
        <div className="space-y-3 mb-5">
          {PRAYERS.map(p => {
            const timeDisplay = prayerTimes?.[p.apiKey] ? `${prayerTimes[p.apiKey]} WIB` : '—';
            const isNext = next?.key === p.key && !next?.tomorrow;
            const duty = getDuty(p.key);
            return (
              <div key={p.key} className={`rounded-2xl border ${ isNext ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50' : 'border-gray-200 bg-white' } p-4 shadow-sm transition-all`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.icon}</span>
                    <span className="font-extrabold text-gray-900 text-xl">{p.label}</span>
                    {isNext && (
                      <span className="text-[11px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Berikutnya</span>
                    )}
                    {today === 'SENIN' || today === 'KAMIS' ? (
                      p.key === 'ASHAR' && <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">+ Kajian Sore</span>
                    ) : null}
                  </div>
                  <span className="text-xl font-extrabold text-gray-800 tabular-nums">{timeDisplay}</span>
                </div>
                {duty && <DutyCard rows={duty.rows} />}
              </div>
            );
          })}
        </div>

        {/* Piket Hari Ini */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">🧹 Piket Hari Ini ({dayLabelMap[today]})</div>
          <div className="text-3xl font-extrabold text-emerald-800">{schedule[`PIKET-${today}`] || '—'}</div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-2 md:p-6 pb-20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@1,800&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
        .font-inter-bold-italic { font-family: 'Inter', sans-serif; font-weight: 800; font-style: italic; }
        
        .custom-scroll::-webkit-scrollbar { height: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #c5c5c5; border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-8 mt-4">
            <h1 className="text-5xl md:text-6xl font-inter-bold-italic text-gray-900 tracking-tight">New Regiem</h1>
            <p className="text-xl md:text-2xl font-bold text-gray-500 mt-2">Schedule Generator v01</p>
        </div>


        {/* TABS NAVIGATION */}
        <div className="flex justify-center flex-wrap gap-2 mb-6">
            <button 
              className={`px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'jadwal' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('jadwal')}
            >📅 Tabel Jadwal</button>
            <button 
              className={`px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'ketersediaan' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('ketersediaan')}
            >⚙️ Set Ketersediaan</button>
            <button 
              className={`px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'publik' ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('publik')}
            >🕌 Info Umum</button>
        </div>

        {/* TAB 1: KETERSEDIAAN */}
        {activeTab === 'ketersediaan' && (
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-2">Pengaturan Waktu Sibuk</h2>
            <p className="text-gray-600 mb-6 text-sm">Pilih nama, lalu centang kotak pada waktu dimana orang tersebut TIDAK BISA bertugas. Jika kotak bertuliskan &quot;Sedang Bertugas&quot;, Anda tetap bisa mengkliknya untuk menandai bentrok.</p>
            
            <div className="flex flex-col gap-6">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Orang:</label>
                <select 
                  className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-0 outline-none font-bold bg-white"
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                >
                  {FLEXIBLE_POOL.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => selectAllUnavail(true)} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition">Tandai Semua Sibuk</button>
                  <button onClick={() => selectAllUnavail(false)} className="flex-1 bg-green-50 text-green-600 border border-green-200 py-2 rounded-lg font-bold text-sm hover:bg-green-100 transition">Kosongkan Semua</button>
                </div>
              </div>
              
              <div className="w-full overflow-x-auto custom-scroll pb-4">
                <div className="min-w-[700px] border border-gray-300 rounded-lg overflow-hidden">
                   <div className="grid grid-cols-8 text-center bg-gray-100">
                     <div className="font-bold p-3 border-r border-b border-gray-300 flex items-center justify-center text-sm text-gray-600">WAKTU</div>
                     {DAYS.map(day => <div key={day} className="font-bold p-3 border-r border-b border-gray-300 uppercase text-sm text-gray-600">{day}</div>)}
                     
                     {TIMES.map(time => (
                       <React.Fragment key={time}>
                         <div className="bg-gray-50 font-bold p-3 border-r border-b border-gray-300 flex items-center justify-center text-sm text-gray-700">{time}</div>
                         {DAYS.map(day => {
                           const currentlyAssigned = isPersonAssigned(selectedPerson, day, time);
                           const isBusy = unavailability[`${selectedPerson}-${day}-${time}`];
                           
                           return (
                             <div 
                               key={`${day}-${time}`} 
                               onClick={() => handleUnavailChange(day, time)}
                               className="p-2 border-r border-b border-gray-200 flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition"
                             >
                               {currentlyAssigned ? (
                                  <div className={`px-3 py-1.5 rounded-full border text-[11px] font-bold flex flex-col items-center transition-all ${isBusy ? 'bg-red-100 border-red-400 text-red-700 line-through opacity-80' : 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 hover:shadow-sm'}`}>
                                      <span>{isBusy ? '❌ SIBUK' : '✔ BISA'}</span>
                                      <span className={`text-[9px] px-2 rounded mt-0.5 no-underline ${isBusy ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>Sedang Bertugas</span>
                                  </div>
                               ) : (
                                  isBusy ? (
                                    <div className="text-red-500 font-bold text-sm flex items-center gap-1">❌ <span className="hidden sm:inline">Sibuk</span></div>
                                  ) : (
                                    <div className="text-gray-700 font-bold text-sm flex items-center gap-1">✔ <span className="hidden sm:inline">BISA</span></div>
                                  )
                               )}
                             </div>
                           )
                         })}
                       </React.Fragment>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JADWAL */}
        {activeTab === 'jadwal' && (
          <div className="bg-white shadow-xl border border-gray-200 rounded-xl p-4 md:p-6 mb-6">
            
            <div className="flex flex-wrap justify-end items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                {message && <span className="text-sm text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-2 rounded-lg">{message}</span>}
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md text-sm flex items-center gap-2"
                >
                  {isDownloading ? '⏳ Memproses...' : '📸 Download PNG Ultra HD'}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImportData} 
                  accept=".json" 
                  className="hidden" 
                />
                <button 
                  onClick={handleShareLink}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                  title="Salin link yang berisi data jadwal ini untuk dibuka di HP/browser lain"
                >
                  🔗 Salin Link Sync
                </button>
                <button 
                  onClick={handleExportData}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                  title="Download file backup JSON untuk dipindah ke laptop/browser lain"
                >
                  💾 Backup JSON
                </button>
                <button 
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className={`px-4 py-2.5 rounded-lg border font-bold text-sm flex items-center gap-1.5 transition-all ${history.length > 0 ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 shadow-sm cursor-pointer' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
                  title="Undo perubahan jadwal terakhir (Shortcut: Ctrl+Z)"
                >
                  ↩️ Undo {history.length > 0 ? `(${history.length})` : ''}
                </button>
                <button 
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className={`px-4 py-2.5 rounded-lg border font-bold text-sm flex items-center gap-1.5 transition-all ${redoStack.length > 0 ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800 shadow-sm cursor-pointer' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
                  title="Redo perubahan jadwal (Shortcut: Ctrl+Y atau Ctrl+Shift+Z)"
                >
                  ↪️ Redo {redoStack.length > 0 ? `(${redoStack.length})` : ''}
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-700 font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                  title="Upload file backup JSON dari laptop/browser lain"
                >
                  📂 Restore JSON
                </button>
                <button 
                  onClick={() => {
                    pushHistory(schedule);
                    setSchedule(IMAGE_SCHEDULE_STATE);
                    localStorage.setItem('jadwal_v14', JSON.stringify(IMAGE_SCHEDULE_STATE));
                    saveToCloud(IMAGE_SCHEDULE_STATE, unavailability, true);
                    setMessage('Reset selesai!');
                    setTimeout(() => setMessage(''), 3000);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  🔄 Reset Manual
                </button>
                
                <button 
                  onClick={handlePatch}
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md text-sm flex items-center gap-2"
                >
                  🛠️ Tambal Jadwal Bentrok
                </button>
                
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md text-sm flex items-center gap-2"
                >
                  {isGenerating ? 'Menyusun...' : '🎲 Rombak & Generate Total'}
                </button>
            </div>

            {/* TABEL JADWAL UTAMA */}
            <div className="w-full overflow-x-auto custom-scroll pb-6">
                <div ref={scheduleRef} className="bg-white p-4" style={{ minWidth: '1000px' }}>
                  <div className="border-4 border-[#1f2937] bg-[#1f2937] p-[2px] mb-4 shadow-sm rounded-sm">
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-[2px]">
                      
                      <div className="bg-[#cbd5e1] font-bold flex items-center justify-center p-2 text-[12px] border border-[#1f2937]">WAKTU</div>
                      {DAYS.map(day => (
                        <div key={day} className="bg-[#94a3b8] font-bold flex items-center justify-center p-2 uppercase text-[12px] border border-[#1f2937]">
                          {day}
                        </div>
                      ))}

                      {TIMES.map(time => (
                        <React.Fragment key={time}>
                          <div className="bg-[#c7d2fe] font-bold flex items-center justify-center p-2 text-[12px] border border-[#1f2937]">
                            {time}
                          </div>

                          {DAYS.map(day => {
                            const key = `${day}-${time}`;
                            const cellData = schedule[key];

                            if (time === 'SUBUH') {
                               return (
                                 <div key={key} className="grid grid-cols-2 grid-rows-2 gap-[2px] bg-[#1f2937] border border-[#1f2937] min-h-[70px]">
                                     <div className="bg-[#c4b5fd]"><CellInput value={cellData.k1} onChange={(v) => updateCell(key, 'k1', v)} day={day} time={time} /></div>
                                     <div className="bg-[#60a5fa]"><CellInput value={cellData.imam} onChange={(v) => updateCell(key, 'imam', v)} day={day} time={time} /></div>
                                     <div className="bg-[#fde047]"><CellInput value={cellData.k2} onChange={(v) => updateCell(key, 'k2', v)} day={day} time={time} /></div>
                                     <div className="bg-[#bfdbfe] italic"><CellInput value={cellData.badal} onChange={(v) => updateCell(key, 'badal', v)} day={day} time={time} /></div>
                                 </div>
                               );
                             } else {
                               return (
                                 <div key={key} className="grid grid-cols-2 gap-[2px] bg-[#1f2937] border border-[#1f2937] min-h-[70px]">
                                   <div className="bg-[#22d3ee]"><CellInput value={cellData.adzan} onChange={(v) => updateCell(key, 'adzan', v)} day={day} time={time} /></div>
                                   <div className="grid grid-rows-2 gap-[2px] bg-[#1f2937]">
                                       <div className="bg-[#60a5fa]"><CellInput value={cellData.imam} onChange={(v) => updateCell(key, 'imam', v)} day={day} time={time} /></div>
                                       <div className="bg-[#bfdbfe] italic"><CellInput value={cellData.badal} onChange={(v) => updateCell(key, 'badal', v)} day={day} time={time} /></div>
                                   </div>
                                 </div>
                               )
                             }
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="border-4 border-[#1f2937] bg-[#1f2937] p-[2px] rounded-sm">
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-[2px]">
                        <div className="bg-[#fecdd3] font-bold flex items-center justify-center p-2 text-[10px] md:text-[11px] text-center border border-[#1f2937] min-h-[48px] leading-tight">HADITS<br/>SUBUH</div>
                        {DAYS.map(day => (
                            <div key={`hadits-${day}`} className="bg-[#fecdd3] flex items-center justify-center p-1 border border-[#1f2937] min-h-[48px]">
                                <CellInput value={schedule[`HADITS-${day}`]} onChange={(v) => updateCell(`HADITS-${day}`, null, v)} />
                            </div>
                        ))}

                        <div className="bg-[#ffedd5] font-bold flex items-center justify-center p-2 text-[11px] border border-[#1f2937] min-h-[48px]">MC</div>
                        {DAYS.map(day => (
                            <div key={`mc-${day}`} className="bg-[#ffedd5] p-0.5 border border-[#1f2937] flex items-center justify-center min-h-[48px]">
                                <MultiSelectCell value={schedule[`MC-${day}`]} onChange={(v) => updateCell(`MC-${day}`, null, v)} />
                            </div>
                        ))}

                        <div className="bg-[#ffedd5] font-bold flex items-center justify-center p-2 text-[11px] border border-[#1f2937] min-h-[48px]">POSTER</div>
                        {DAYS.map(day => (
                            <div key={`poster-${day}`} className="bg-[#ffedd5] p-0.5 border border-[#1f2937] flex items-center justify-center min-h-[48px]">
                                <MultiSelectCell value={schedule[`POSTER-${day}`]} onChange={(v) => updateCell(`POSTER-${day}`, null, v)} />
                            </div>
                        ))}

                        <div className="bg-[#ffedd5] font-bold flex items-center justify-center p-2 text-[11px] border border-[#1f2937] min-h-[48px]">STREAMER</div>
                        {DAYS.map(day => (
                            <div key={`streamer-${day}`} className="bg-[#ffedd5] p-0.5 border border-[#1f2937] flex items-center justify-center min-h-[48px]">
                                <MultiSelectCell value={schedule[`STREAMER-${day}`]} onChange={(v) => updateCell(`STREAMER-${day}`, null, v)} />
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* BARIS PIKET (SEPARATE GREEN SECTION) */}
                  <div className="mt-2 bg-[#1f2937] p-[2px] rounded-sm">
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-[2px]">
                        <div className="bg-[#15803d] text-white font-black flex items-center justify-center p-2 text-[12px] uppercase tracking-wider">PIKET</div>
                        {DAYS.map(day => (
                            <div key={`piket-${day}`} className="bg-[#22c55e] text-black font-bold p-0.5 flex items-center justify-center min-h-[42px]">
                                <textarea 
                                    value={schedule[`PIKET-${day}`] || ''} 
                                    onChange={(e) => updateCell(`PIKET-${day}`, null, e.target.value)}
                                    className="w-full h-full bg-transparent text-center font-bold text-[11px] outline-none resize-none p-1 hover:bg-black/10 leading-tight text-black"
                                    style={{ display: 'grid', placeContent: 'center', textAlign: 'center' }}
                                />
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* KETERANGAN WARNA (LEGEND) */}
                  <div className="mt-4 pt-2 flex items-center gap-3 text-black">
                    <span className="font-extrabold text-[13px] tracking-tight">Keterangan Warna:</span>
                    <div className="border-2 border-black bg-black p-[1px] inline-block shadow-sm">
                        <div className="grid grid-cols-4 gap-[1px] text-center font-bold text-[11px] text-black">
                            <div className="bg-[#22d3ee] px-5 py-1 min-w-[100px] flex items-center justify-center">Adzan</div>
                            <div className="bg-[#60a5fa] px-4 py-1 min-w-[80px] flex items-center justify-center">IMAM</div>
                            <div className="bg-[#bfdbfe] px-4 py-1 min-w-[80px] italic flex items-center justify-center">BADAL</div>
                            <div className="bg-[#c4b5fd] px-4 py-1 min-w-[120px] flex items-center justify-center">Adzan Subuh K1</div>

                            <div className="bg-[#ffedd5] px-4 py-1 flex items-center justify-center">MC</div>
                            <div className="bg-[#ffedd5] px-4 py-1 flex items-center justify-center">MEDIA</div>
                            <div className="bg-[#22c55e] px-4 py-1 flex items-center justify-center">PIKET</div>
                            <div className="bg-[#fde047] px-4 py-1 flex items-center justify-center">Adzan Subuh K2</div>
                        </div>
                    </div>
                  </div>
                </div>
            </div>


            {/* AREA STATISTIK */}
            <div className="mt-6 pt-6 border-t-2 border-gray-100">
                <div className="bg-gray-800 text-white px-4 py-2.5 rounded-t-xl flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-wide">📊 Statistik Tugas Mingguan</span>
                  <span className="ml-auto text-xs text-gray-400">Hijau = merata · Kuning = sedikit miring · Merah = tidak merata</span>
                </div>
                <div className="overflow-x-auto custom-scroll">
                    <table className="min-w-full bg-white border border-gray-200 rounded-b-xl">
                        <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="py-3 px-4 text-left font-bold text-gray-600 text-sm">Nama</th>
                                <th className="py-3 px-4 text-center font-bold text-blue-600 text-sm">Imam</th>
                                <th className="py-3 px-4 text-center font-bold text-cyan-600 text-sm">Adzan (inc. K1/K2)</th>
                                <th className="py-3 px-4 text-center font-bold text-indigo-500 text-sm">Badal</th>
                                <th className="py-3 px-4 text-center font-bold text-gray-800 text-sm">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                              const dist = computeDistribution(schedule);
                              const totalVals = FLEXIBLE_POOL.map(p => dist[p].total);
                              const avgTotal = totalVals.reduce((a,b) => a+b,0) / FLEXIBLE_POOL.length;
                              const colorClass = (val, avg) => {
                                const diff = Math.abs(val - avg);
                                if (diff <= 1) return 'bg-emerald-100 text-emerald-800';
                                if (diff <= 2) return 'bg-amber-100 text-amber-800';
                                return 'bg-red-100 text-red-800';
                              };
                              return (
                                <>
                                  {FLEXIBLE_POOL.map((name, i) => (
                                    <tr key={name} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/40`}>
                                      <td className="py-2 px-4 font-bold text-gray-700 text-sm">{name}</td>
                                      <td className="py-2 px-4 text-center font-semibold text-gray-600 text-sm">{stats[name].imam}</td>
                                      <td className="py-2 px-4 text-center font-semibold text-gray-600 text-sm">{dist[name].adzan + dist[name].k1k2}</td>
                                      <td className="py-2 px-4 text-center font-semibold text-gray-600 text-sm">{dist[name].badal}</td>
                                      <td className="py-2 px-4 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${colorClass(dist[name].total, avgTotal)}`}>
                                          {dist[name].total}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="bg-gray-200 font-bold text-gray-600 text-xs">
                                    <td className="py-2 px-4">Rata-rata</td>
                                    <td className="py-2 px-4 text-center">—</td>
                                    <td className="py-2 px-4 text-center">—</td>
                                    <td className="py-2 px-4 text-center">—</td>
                                    <td className="py-2 px-4 text-center">{avgTotal.toFixed(1)}</td>
                                  </tr>
                                </>
                              );
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AREA TABEL KHUSUS IMAM & BADAL */}
            <div className="mt-12 pt-8 border-t-2 border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">
                       <span role="img" aria-label="imam">🕌</span> Tabel Khusus Imam & Badal
                    </h3>
                    <button 
                      onClick={handleDownloadImam}
                      disabled={isDownloadingImam}
                      className="px-5 py-2.5 rounded-lg bg-[#00a3bf] hover:bg-[#0089a1] text-white font-bold transition-all shadow-md text-sm flex items-center gap-2"
                    >
                      {isDownloadingImam ? '⏳ Memproses...' : '📥 Download Tabel Imam'}
                    </button>
                </div>
                
                <div className="w-full overflow-x-auto custom-scroll pb-6">
                    <div ref={imamScheduleRef} className="bg-[#f8fafc] p-6 md:p-10 rounded-[2rem] border border-gray-200 shadow-sm" style={{ minWidth: '950px' }}>
                        
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">JADWAL IMAM & BADAL</h2>
                            <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Masjid Pogung Raya</p>
                        </div>
                        
                        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 md:gap-3">
                            <div className="flex items-end justify-center pb-2">
                                <span className="text-gray-400 font-extrabold text-[11px] tracking-wider uppercase">WAKTU</span>
                            </div>
                            
                            {DAYS.map(day => (
                                <div key={day} className={`${DAY_THEMES[day].header} rounded-2xl shadow-lg p-4 flex items-center justify-center text-white font-extrabold text-[13px] tracking-wider uppercase`}>
                                    {day}
                                </div>
                            ))}

                            {TIMES.map(time => (
                                <React.Fragment key={time}>
                                    <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center p-3 text-gray-500 font-extrabold text-[11px] uppercase border border-gray-100">
                                        {time}
                                    </div>
                                    
                                    {DAYS.map(day => {
                                        const imamName = schedule[`${day}-${time}`]?.imam || '-';
                                        const badalName = schedule[`${day}-${time}`]?.badal || '-';
                                        const isPaten = ['Bpk-bpk', 'Cahyo', 'Arga', 'Miqdad', 'Nazar', 'Pak Zaid', 'Hasim', 'Pak Hafid', 'Abdur', 'Khatib'].includes(imamName);
                                        
                                        return (
                                            <div key={day} className={`rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm border border-gray-100 ${DAY_THEMES[day].cell} transition-all hover:-translate-y-1 hover:shadow-md`}>
                                                <span className={`text-[14px] font-extrabold mb-1 ${isPaten ? 'text-gray-900' : 'text-blue-900'}`}>
                                                    {imamName}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-500 italic">
                                                    Badal: {badalName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

          </div>
        )}

        {/* TAB 3: INFO UMUM (PUBLIC VIEW) */}
        {activeTab === 'publik' && (
          <div className="py-2">
            <PublicView />
          </div>
        )}

      </div>
    </div>
  );
}
