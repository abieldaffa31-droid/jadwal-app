import React, { useState, useEffect, useRef } from 'react';

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
  'SENIN-SUBUH': { k1: 'Raihan', imam: 'Arga', k2: 'Raihan', badal: 'Zufar' },
  'SELASA-SUBUH': { k1: 'Nabiel', imam: 'Pak Hafid', k2: 'Zufar', badal: 'Wildan' },
  'RABU-SUBUH': { k1: 'Wildan', imam: 'Arya', k2: 'Fadel', badal: 'Nurdin' },
  'KAMIS-SUBUH': { k1: 'Nabiel', imam: 'Nazar', k2: 'Mujahid', badal: 'Zufar' },
  'JUM\'AT-SUBUH': { k1: 'Nurdin', imam: 'Nazar', k2: 'Fadel', badal: 'Raihan' },
  'SABTU-SUBUH': { k1: 'Mujahid', imam: 'Nazar', k2: 'Malik', badal: 'Fadel' },
  'AHAD-SUBUH': { k1: 'Malik', imam: 'Pak Zaid', k2: 'Zufar', badal: 'Fadel' }, 
  
  'SENIN-DZUHUR': { adzan: 'Fadel', imam: 'Bpk-bpk', badal: 'Wildan' },
  'SELASA-DZUHUR': { adzan: 'Mujahid', imam: 'Bpk-bpk', badal: 'Fadel' },
  'RABU-DZUHUR': { adzan: 'Fadel', imam: 'Bpk-bpk', badal: 'Nurdin' },
  'KAMIS-DZUHUR': { adzan: 'Nurdin', imam: 'Bpk-bpk', badal: 'Fadel' },
  'JUM\'AT-DZUHUR': { adzan: 'Cahyo', imam: 'Khatib', badal: 'Mujahid' },
  'SABTU-DZUHUR': { adzan: 'Raihan', imam: 'Bpk-bpk', badal: 'Mujahid' },
  'AHAD-DZUHUR': { adzan: 'Nurdin', imam: 'Bpk-bpk', badal: 'Fadel' },
  
  'SENIN-ASHAR': { adzan: 'Nurdin', imam: 'Bpk-bpk', badal: 'Wildan' },
  'SELASA-ASHAR': { adzan: 'Wildan', imam: 'Bpk-bpk', badal: 'Nurdin' },
  'RABU-ASHAR': { adzan: 'Mujahid', imam: 'Bpk-bpk', badal: 'Malik' },
  'KAMIS-ASHAR': { adzan: 'Wildan', imam: 'Bpk-bpk', badal: 'Mujahid' },
  'JUM\'AT-ASHAR': { adzan: 'Malik', imam: 'Bpk-bpk', badal: 'Wildan' },
  'SABTU-ASHAR': { adzan: 'Nabiel', imam: 'Bpk-bpk', badal: 'Raihan' },
  'AHAD-ASHAR': { adzan: 'Malik', imam: 'Bpk-bpk', badal: 'Raihan' },
  
  'SENIN-MAGHRIB': { adzan: 'Malik', imam: 'Cahyo', badal: 'Mujahid' },
  'SELASA-MAGHRIB': { adzan: 'Cahyo', imam: 'Abdur', badal: 'Nabiel' },
  'RABU-MAGHRIB': { adzan: 'Raihan', imam: 'Arya', badal: 'Wildan' },
  'KAMIS-MAGHRIB': { adzan: 'Nabiel', imam: 'Miqdad', badal: 'Nurdin' },
  'JUM\'AT-MAGHRIB': { adzan: 'Nabiel', imam: 'Miqdad', badal: 'Zufar' },
  'SABTU-MAGHRIB': { adzan: 'Zufar', imam: 'Nazar', badal: 'Raihan' },
  'AHAD-MAGHRIB': { adzan: 'Raihan', imam: 'Pak Zaid', badal: 'Zufar' },

  'SENIN-ISYA': { adzan: 'Malik', imam: 'Nazar', badal: 'Nabiel' },
  'SELASA-ISYA': { adzan: 'Zufar', imam: 'Hasim', badal: 'Malik' },
  'RABU-ISYA': { adzan: 'Zufar', imam: 'Abdur', badal: 'Raihan' },
  'KAMIS-ISYA': { adzan: 'Malik', imam: 'Nazar', badal: 'Nabiel' },
  'JUM\'AT-ISYA': { adzan: 'Nurdin', imam: 'Pak Hafid', badal: 'Wildan' },
  'SABTU-ISYA': { adzan: 'Mujahid', imam: 'Arga', badal: 'Wildan' },
  'AHAD-ISYA': { adzan: 'Nabiel', imam: 'Arga', badal: 'Mujahid' },

  'HADITS-SENIN': 'Raihan',
  'MC-SENIN': 'Zufar (s)\nRaihan (m)',
  'HADITS-SELASA': 'Malik',
  'MC-SELASA': 'Malik',
  'HADITS-RABU': 'Wildan',
  'MC-RABU': 'Fadel',
  'HADITS-KAMIS': 'Nurdin',
  'MC-KAMIS': 'Nurdin',
  'HADITS-JUM\'AT': 'Fadel',
  'MC-JUM\'AT': 'Nabiel (j)\nMujahid (m)',
  'HADITS-SABTU': 'Zufar',
  'MC-SABTU': 'Wildan',
  'HADITS-AHAD': '-',
  'MC-AHAD': 'Nabiel (p)\nMujahid (s)'
};

const ALL_POSSIBLE_NAMES = [...FLEXIBLE_POOL, 'Bpk-bpk', 'Cahyo', 'Nazar', 'Pak Hafid', 'Pak Zaid', 'Arya', 'Abdur', 'Arga', 'Hasim', 'Khatib', 'Miqdad', '-'];

export default function JadwalApp() {
  const [activeTab, setActiveTab] = useState('jadwal');
  const [unavailability, setUnavailability] = useState({});
  const [selectedPerson, setSelectedPerson] = useState(FLEXIBLE_POOL[0]);
  const [schedule, setSchedule] = useState(IMAGE_SCHEDULE_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingImam, setIsDownloadingImam] = useState(false);
  const [message, setMessage] = useState('');
  
  const scheduleRef = useRef(null);
  const imamScheduleRef = useRef(null);

  useEffect(() => {
    const savedSchedule = localStorage.getItem('jadwal_v11');
    const savedUnavail = localStorage.getItem('unavail_v11');
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    if (savedUnavail) setUnavailability(JSON.parse(savedUnavail));
  }, []);

  const handleUnavailChange = (day, time) => {
    const key = `${selectedPerson}-${day}-${time}`;
    const newUnavail = { ...unavailability, [key]: !unavailability[key] };
    setUnavailability(newUnavail);
    localStorage.setItem('unavail_v11', JSON.stringify(newUnavail));
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
  };

  const updateCell = (cellKey, field, value) => {
    const newSched = { ...schedule };
    if (typeof newSched[cellKey] === 'string') {
        newSched[cellKey] = value;
    } else {
        newSched[cellKey] = { ...newSched[cellKey], [field]: value };
    }
    setSchedule(newSched);
    localStorage.setItem('jadwal_v11', JSON.stringify(newSched));
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

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let newSched = { ...schedule };
      let taskCounts = {};
      FLEXIBLE_POOL.forEach(p => taskCounts[p] = 0);

      DAYS.forEach(day => {
        TIMES.forEach(time => {
          const key = `${day}-${time}`;
          const currentSlot = schedule[key];
          let assigned = []; 

          if (time === 'SUBUH') {
             let k1 = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
             newSched[key].k1 = k1; assigned.push(k1);
             let k2 = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
             newSched[key].k2 = k2; assigned.push(k2);
             
             const patenImamSubuh = ['Nazar', 'Pak Hafid', 'Arya', 'Pak Zaid'];
             if (!patenImamSubuh.includes(currentSlot.imam)) {
                 let imam = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
                 newSched[key].imam = imam; assigned.push(imam);
             }
             
             let badal = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
             newSched[key].badal = badal; assigned.push(badal);
          } else {
             if (!(day === "JUM'AT" && time === "DZUHUR")) {
                 let adzan = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
                 newSched[key].adzan = adzan; assigned.push(adzan);
             }
             const isPatenImam = ['Bpk-bpk', 'Cahyo', 'Arga', 'Miqdad', 'Nazar', 'Pak Zaid', 'Hasim', 'Pak Hafid', 'Abdur', 'Khatib'].includes(currentSlot.imam);
             if (!isPatenImam) {
                 let imam = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
                 newSched[key].imam = imam; assigned.push(imam);
             }
             let badal = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
             newSched[key].badal = badal; assigned.push(badal);
          }
        });
      });

      setSchedule(newSched);
      localStorage.setItem('jadwal_v11', JSON.stringify(newSched));
      setIsGenerating(false);
      setMessage('Jadwal berhasil digenerate total!');
      setTimeout(() => setMessage(''), 3000);
    }, 500);
  };

  const handlePatch = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let newSched = { ...schedule };
      let patchedCount = 0;
      
      let taskCounts = {};
      FLEXIBLE_POOL.forEach(p => taskCounts[p] = 0);
      Object.keys(newSched).forEach(key => {
        const cell = newSched[key];
        if (typeof cell === 'object') {
          Object.values(cell).forEach(person => {
            if (FLEXIBLE_POOL.includes(person)) {
              taskCounts[person] = (taskCounts[person] || 0) + 1;
            }
          });
        }
      });

      DAYS.forEach(day => {
        TIMES.forEach(time => {
          const key = `${day}-${time}`;
          const currentSlot = { ...newSched[key] };
          
          let assigned = Object.values(currentSlot);

          ['k1', 'k2', 'adzan', 'imam', 'badal'].forEach(role => {
            if (currentSlot[role]) {
              const person = currentSlot[role];
              
              if (FLEXIBLE_POOL.includes(person) && !isAvailable(person, day, time)) {
                 assigned = assigned.filter(p => p !== person); 
                 
                 let replacement = getLeastUsedPerson(taskCounts, FLEXIBLE_POOL, day, time, assigned);
                 
                 currentSlot[role] = replacement;
                 assigned.push(replacement);
                 patchedCount++;
              }
            }
          });
          
          newSched[key] = currentSlot;
        });
      });

      setSchedule(newSched);
      localStorage.setItem('jadwal_v11', JSON.stringify(newSched));
      setIsGenerating(false);
      
      if (patchedCount > 0) {
          setMessage(`Berhasil menambal ${patchedCount} jadwal yang bentrok!`);
      } else {
          setMessage('Tidak ada jadwal bentrok yang perlu ditambal.');
      }
      setTimeout(() => setMessage(''), 4000);
    }, 500);
  };

  const handleDownload = async () => {
    if (!scheduleRef.current) return;
    setIsDownloading(true);
    try {
      if (!window.html2canvas) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      const canvas = await window.html2canvas(scheduleRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = `Jadwal_Utama.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadImam = async () => {
    if (!imamScheduleRef.current) return;
    setIsDownloadingImam(true);
    try {
      if (!window.html2canvas) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      const canvas = await window.html2canvas(imamScheduleRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = `Jadwal_Khusus_Imam.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error(error);
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

  const CellInput = ({ value, onChange, className }) => (
    <div className={`relative w-full h-full ${className}`}>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 appearance-none bg-transparent text-center font-bold text-[11px] md:text-[11.5px] leading-tight outline-none cursor-pointer hover:bg-black/10 flex items-center justify-center m-0 p-0"
          style={{ WebkitAppearance: 'none', MozAppearance: 'none', textOverflow: '' }}
        >
          {ALL_POSSIBLE_NAMES.map(n => <option key={n} value={n} className="text-black bg-white">{n}</option>)}
        </select>
    </div>
  );

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
        <div className="flex justify-center space-x-2 mb-6">
            <button 
              className={`px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'jadwal' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('jadwal')}
            >📅 Tabel Jadwal</button>
            <button 
              className={`px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'ketersediaan' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('ketersediaan')}
            >⚙️ Set Ketersediaan</button>
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
                <button 
                  onClick={() => {
                    setSchedule(IMAGE_SCHEDULE_STATE);
                    localStorage.setItem('jadwal_v11', JSON.stringify(IMAGE_SCHEDULE_STATE));
                    setMessage('Reset selesai!');
                    setTimeout(() => setMessage(''), 3000);
                  }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  ↩️ Reset Manual
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
                  {isGenerating ? 'Menyusun...' : '🔄 Rombak & Generate Total'}
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
                                    <div className="bg-[#c4b5fd]"><CellInput value={cellData.k1} onChange={(v) => updateCell(key, 'k1', v)} /></div>
                                    <div className="bg-[#60a5fa]"><CellInput value={cellData.imam} onChange={(v) => updateCell(key, 'imam', v)} /></div>
                                    <div className="bg-[#fde047]"><CellInput value={cellData.k2} onChange={(v) => updateCell(key, 'k2', v)} /></div>
                                    <div className="bg-[#bfdbfe] italic"><CellInput value={cellData.badal} onChange={(v) => updateCell(key, 'badal', v)} /></div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={key} className="grid grid-cols-2 gap-[2px] bg-[#1f2937] border border-[#1f2937] min-h-[70px]">
                                  <div className="bg-[#22d3ee]"><CellInput value={cellData.adzan} onChange={(v) => updateCell(key, 'adzan', v)} /></div>
                                  <div className="grid grid-rows-2 gap-[2px] bg-[#1f2937]">
                                      <div className="bg-[#60a5fa]"><CellInput value={cellData.imam} onChange={(v) => updateCell(key, 'imam', v)} /></div>
                                      <div className="bg-[#bfdbfe] italic"><CellInput value={cellData.badal} onChange={(v) => updateCell(key, 'badal', v)} /></div>
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
                        <div className="bg-[#fecdd3] font-bold flex items-center justify-center p-2 text-[10px] md:text-[11px] text-center border border-[#1f2937] min-h-[60px] leading-tight">HADITS<br/>SUBUH</div>
                        {DAYS.map(day => (
                            <div key={`hadits-${day}`} className="bg-[#fecdd3] flex items-center justify-center p-1 border border-[#1f2937] min-h-[60px]">
                                <CellInput value={schedule[`HADITS-${day}`]} onChange={(v) => updateCell(`HADITS-${day}`, null, v)} />
                            </div>
                        ))}

                        <div className="bg-[#ffedd5] font-bold flex items-center justify-center p-2 text-[11px] border border-[#1f2937] min-h-[70px]">MC</div>
                        {DAYS.map(day => (
                            <div key={`mc-${day}`} className="bg-[#ffedd5] p-1 border border-[#1f2937] relative min-h-[70px]">
                                <textarea 
                                    value={schedule[`MC-${day}`]} 
                                    onChange={(e) => updateCell(`MC-${day}`, null, e.target.value)}
                                    className="absolute inset-0 w-full h-full bg-transparent text-center font-bold text-[10.5px] md:text-[11px] outline-none resize-none flex items-center justify-center p-1 hover:bg-black/5 leading-tight"
                                />
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
            </div>

            {/* AREA STATISTIK */}
            <div className="mt-10 pt-6 border-t-2 border-gray-100">
                <h3 className="font-bold mb-4 text-xl flex items-center gap-2">📊 Statistik Tugas Mingguan</h3>
                <div className="overflow-x-auto custom-scroll">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="py-3 px-4 text-left font-bold text-gray-600 text-sm">Nama</th>
                                <th className="py-3 px-4 text-center font-bold text-blue-600 text-sm">Imam</th>
                                <th className="py-3 px-4 text-center font-bold text-cyan-600 text-sm">Adzan (Inc. Subuh)</th>
                                <th className="py-3 px-4 text-center font-bold text-indigo-500 text-sm">Badal</th>
                                <th className="py-3 px-4 text-center font-bold text-pink-500 text-sm">Hadits</th>
                                <th className="py-3 px-4 text-center font-bold text-orange-500 text-sm">MC</th>
                                <th className="py-3 px-4 text-center font-bold text-gray-800 text-sm">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FLEXIBLE_POOL.map(name => (
                                <tr key={name} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                    <td className="py-2 px-4 font-bold text-gray-700 text-sm">{name}</td>
                                    <td className="py-2 px-4 text-center font-semibold text-gray-600">{stats[name].imam}</td>
                                    <td className="py-2 px-4 text-center font-semibold text-gray-600">{stats[name].adzan}</td>
                                    <td className="py-2 px-4 text-center font-semibold text-gray-600">{stats[name].badal}</td>
                                    <td className="py-2 px-4 text-center font-semibold text-gray-600">{stats[name].hadits}</td>
                                    <td className="py-2 px-4 text-center font-semibold text-gray-600">{stats[name].mc}</td>
                                    <td className="py-2 px-4 text-center font-bold text-gray-900">{stats[name].total}</td>
                                </tr>
                            ))}
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
      </div>
    </div>
  );
}
