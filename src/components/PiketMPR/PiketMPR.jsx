import React, { useState, useEffect, useMemo, useRef } from 'react';
import './piket.css';

/* ===== CONSTANTS ===== */
const SL = {
  VS: { n: 'Vakum Selatan', lt: 'Lt.1', k: 'b', wa: 'Lt.1 Vacuum Selatan' },
  VT: { n: 'Vakum Tengah', lt: 'Lt.1', k: 'b', wa: 'Lt.1 Vacuum Tengah' },
  VU: { n: 'Vakum Utara', lt: 'Lt.1', k: 'b', wa: 'Lt.1 Vacuum Utara' },
  WC3: { n: 'WC Jongkok', lt: 'Lt.1', k: 'b', wa: 'Lt.1 WC Jongkok' },
  WC2: { n: 'WC Duduk', lt: 'Lt.1', k: 'b', wa: 'Lt.1 WC Duduk' },
  T4: { n: 'T4 Wudhu Barat & Timur', lt: 'Lt.1', k: 'm', wa: 'Lt.1 T4 Wudhu Barat dan Lt.1 T4 Wudhu Timur' },
  GEN: { n: 'Vakum & Panaskan Genset', lt: 'Lt.2', k: 'r', wa: 'Lt.2 Vakum & Panaskan Genset' },
  L2: { n: 'WC & T4 Wudhu', lt: 'Lt.2', k: 'r', wa: 'Lt.2 WC & T4 Wudhu' },
  L3: { n: 'WC & T4 Wudhu', lt: 'Lt.3', k: 'r', wa: 'Lt.3 WC & T4 Wudhu' },
  MED: { n: 'Media, Sekre, Mihrab & Rak Buku', lt: '', k: 'r', wa: 'R. Media, Sekre, Mihrab & Rak Buku' },
  KACA: { n: 'Kaca', lt: 'Lt.1', k: 'r', wa: 'Lt.1 Kaca' },
  BEBAS: { n: 'Tugas dari koordinator', lt: '', k: 'f' }
};

const CODE = {
  VS: 'VS', VT: 'VT', VU: 'VU', WC3: 'Jongkok', WC2: 'Duduk', T4: 'T4',
  GEN: 'Gen', L2: 'WC Lt2', L3: 'WC Lt3', MED: 'Media', KACA: 'Kaca', BEBAS: 'Manual'
};

const KL = { b: 'Berat', m: 'Menengah', r: 'Ringan', f: 'Manual' };
const BASE = ['VS', 'GEN', 'WC3', 'L2', 'VT', 'T4', 'WC2', 'L3', 'VU', 'MED'];
const ORDER = ['VS', 'VT', 'VU', 'WC3', 'WC2', 'T4', 'GEN', 'L2', 'L3', 'MED', 'KACA'];
const KACA_SIDES = ['Selatan', 'Timur', 'Utara'];
const ABS = {
  libur: 'Libur piket',
  pulang: 'Pulang',
  kuliah: 'Agenda kuliah (KKN, dll)',
  lain: 'Izin lain',
  tanpa: 'Tanpa kabar',
  riwayat: 'Tidak hadir'
};

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const AREAS = [
  { id: 'kipas', n: 'Kipas angin & sarang laba-laba', when: 'bulanan' },
  { id: 'dapur', n: 'Areal dapur & jemuran', when: 'bulanan' },
  { id: 'gudang', n: 'Gudang Utara & Selatan', when: 'ramadan' },
  { id: 'gudang3', n: 'Gudang Lt.3', when: 'prospek' }
];

function seqFor(n) {
  if (n < 10) return null;
  const s = [...BASE];
  if (n >= 11) s.push('KACA');
  while (s.length < n) s.push('BEBAS');
  return s;
}

/* ===== DATES (UTC-SAFE) ===== */
const D = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const iso = d => d.toISOString().slice(0, 10);
const addDays = (s, n) => {
  const d = D(s);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
const weeksBetween = (a, b) => Math.round((D(b) - D(a)) / (7 * 864e5));
const fmtLong = s => {
  const d = D(s);
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const fmtShort = s => {
  const d = D(s);
  return `${d.getUTCDate()} ${MON3[d.getUTCMonth()]}`;
};
const monthKey = s => s.slice(0, 7);

function todayISO() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function upcomingFriday() {
  const t = todayISO();
  const dow = D(t).getUTCDay();
  return addDays(t, (5 - dow + 7) % 7);
}

function relTime(isoStr) {
  const m = Math.round((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return m + ' menit lalu';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' jam lalu';
  const d = new Date(isoStr);
  return d.getDate() + ' ' + MON3[d.getMonth()] + ' ' + String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0');
}

const stable = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const same = (a, b) => stable(a || {}) === stable(b || {});

const DEFAULT_CONFIG = {
  eras: [
    {
      from: '2026-10-16',
      members: [
        { name: 'Malik', start: 1 },
        { name: 'Nurdin', start: 2 },
        { name: 'Fadel', start: 3 },
        { name: 'Nafhan', start: 4 },
        { name: 'Yusuf', start: 5 },
        { name: 'Mujahid', start: 6 },
        { name: 'Amrul', start: 7 },
        { name: 'Septian', start: 8 },
        { name: 'Wildan', start: 9 },
        { name: 'Zufar', start: 10 },
        { name: 'Raihan', start: 11 },
        { name: 'Nabiel', start: 12 }
      ]
    }
  ],
  plaza: 'Cahyo',
  relawan: ['Hilal', 'Lalu', 'Imam'],
  jatahPekan: 7,
  maxLiburPerMinggu: 1,
  ramadanH1: ''
};

const DEFAULT_WEEKS = {
  '2026-10-16': {
    manual: {
      'Nabiel': 'Sarang Laba-Laba Lt.1'
    }
  }
};

export default function PiketMPR({
  cloudData = {},
  onSavePiketCloud,
  setMessage
}) {
  const [tab, setTab] = useState('minggu');
  const [week, setWeek] = useState('2026-10-16');
  const [openSlot, setOpenSlot] = useState(null);
  const [month, setMonth] = useState(() => monthKey(upcomingFriday()));
  const [toastData, setToastData] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  // Form sheet state
  const [sheetAbsType, setSheetAbsType] = useState('libur');
  const [sheetCand, setSheetCand] = useState('');

  // Draft config untuk tab Pengaturan
  const [draft, setDraft] = useState(null);
  const [newMemName, setNewMemName] = useState('');

  // 1. Config state
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('piket_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.eras?.length &&
          parsed.eras[0]?.from === '2026-10-16' &&
          parsed.eras[0]?.members?.[0]?.name === 'Malik' &&
          parsed.eras[0]?.members?.[9]?.name === 'Zufar' &&
          parsed.eras[0]?.members?.[11]?.name === 'Nabiel'
        ) {
          return parsed;
        }
      }
    } catch (e) {}
    localStorage.setItem('piket_config_v1', JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  });

  // 2. Weeks state (absen, over, minta, liburSub, status, manual)
  const [weeks, setWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('piket_weeks_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_WEEKS,
            ...parsed,
            '2026-10-16': {
              ...DEFAULT_WEEKS['2026-10-16'],
              ...(parsed['2026-10-16'] || {})
            }
          };
        }
      }
    } catch (e) {}
    localStorage.setItem('piket_weeks_v1', JSON.stringify(DEFAULT_WEEKS));
    return DEFAULT_WEEKS;
  });

  // 3. Kerja bakti state
  const [bakti, setBakti] = useState(() => {
    try {
      const saved = localStorage.getItem('piket_kerjabakti_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // 4. Log state (history for undo/redo)
  const [log, setLog] = useState(() => {
    try {
      const saved = localStorage.getItem('piket_log_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Cloud Sync listener
  useEffect(() => {
    if (cloudData.piket_config?.eras?.length) {
      setConfig(cloudData.piket_config);
      localStorage.setItem('piket_config_v1', JSON.stringify(cloudData.piket_config));
    }
    if (cloudData.piket_weeks) {
      setWeeks(cloudData.piket_weeks);
      localStorage.setItem('piket_weeks_v1', JSON.stringify(cloudData.piket_weeks));
    }
    if (cloudData.piket_kerjabakti) {
      setBakti(cloudData.piket_kerjabakti);
      localStorage.setItem('piket_kerjabakti_v1', JSON.stringify(cloudData.piket_kerjabakti));
    }
    if (cloudData.piket_log) {
      setLog(cloudData.piket_log);
      localStorage.setItem('piket_log_v1', JSON.stringify(cloudData.piket_log));
    }
  }, [cloudData]);

  // Toast helper
  const toastTimeoutRef = useRef(null);
  const showToast = (msg, act = null) => {
    setToastData({ msg, act });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastData(null), act ? 6000 : 2600);
  };

  // Helper simpan data (LocalStorage + Supabase Cloud + Log)
  const save = (path, mutate, label) => {
    const lab = label || (path.startsWith('weeks/') ? `Perubahan jadwal ${fmtShort(path.replace('weeks/', ''))}` : path.startsWith('kerjabakti/') ? `Kerja bakti ${path.replace('kerjabakti/', '')}` : 'Pengaturan');

    let beforeData = null;
    let afterData = null;

    if (path === 'config/main') {
      setConfig(prev => {
        const cur = prev ? structuredClone(prev) : structuredClone(DEFAULT_CONFIG);
        beforeData = structuredClone(cur);
        const next = mutate(cur) || cur;
        afterData = structuredClone(next);
        if (same(beforeData, afterData)) return prev;

        localStorage.setItem('piket_config_v1', JSON.stringify(next));
        if (onSavePiketCloud) onSavePiketCloud({ piket_config: next });
        return next;
      });
    } else if (path.startsWith('weeks/')) {
      const wKey = path.replace('weeks/', '');
      setWeeks(prev => {
        const cur = prev[wKey] ? structuredClone(prev[wKey]) : {};
        beforeData = structuredClone(cur);
        const nextW = mutate(cur) || cur;
        afterData = structuredClone(nextW);
        if (same(beforeData, afterData)) return prev;

        const next = { ...prev, [wKey]: nextW };
        localStorage.setItem('piket_weeks_v1', JSON.stringify(next));
        if (onSavePiketCloud) onSavePiketCloud({ piket_weeks: next });
        return next;
      });
    } else if (path.startsWith('kerjabakti/')) {
      const mKey = path.replace('kerjabakti/', '');
      setBakti(prev => {
        const cur = prev[mKey] ? structuredClone(prev[mKey]) : {};
        beforeData = structuredClone(cur);
        const nextB = mutate(cur) || cur;
        afterData = structuredClone(nextB);
        if (same(beforeData, afterData)) return prev;

        const next = { ...prev, [mKey]: nextB };
        localStorage.setItem('piket_kerjabakti_v1', JSON.stringify(next));
        if (onSavePiketCloud) onSavePiketCloud({ piket_kerjabakti: next });
        return next;
      });
    }

    if (beforeData && afterData && !same(beforeData, afterData)) {
      const logId = new Date().toISOString().replace(/[^0-9]/g, '') + Math.random().toString(36).slice(2, 6);
      const logEntry = {
        path,
        before: beforeData,
        after: afterData,
        label: lab,
        at: new Date().toISOString(),
        undone: false
      };
      setLog(prevLog => {
        const updatedLog = { ...prevLog, [logId]: logEntry };
        localStorage.setItem('piket_log_v1', JSON.stringify(updatedLog));
        if (onSavePiketCloud) onSavePiketCloud({ piket_log: updatedLog });
        return updatedLog;
      });

      showToast(`${lab} tersimpan`, {
        label: 'Urungkan',
        fn: () => undoLog(logId, false)
      });
    }
  };

  const undoLog = (id, redo = false) => {
    const e = log[id];
    if (!e) {
      showToast('Riwayat tidak ditemukan');
      return;
    }
    const from = redo ? e.before : e.after;
    const to = redo ? e.after : e.before;

    if (e.path === 'config/main') {
      setConfig(prev => {
        if (!same(prev, from)) {
          showToast(redo ? 'Tidak bisa diulang: data ini sudah berubah lagi.' : 'Tidak bisa diurungkan: data sudah diubah lagi.');
          return prev;
        }
        const next = structuredClone(to || {});
        localStorage.setItem('piket_config_v1', JSON.stringify(next));
        if (onSavePiketCloud) onSavePiketCloud({ piket_config: next });
        return next;
      });
    } else if (e.path.startsWith('weeks/')) {
      const wKey = e.path.replace('weeks/', '');
      setWeeks(prev => {
        const cur = prev[wKey] || {};
        if (!same(cur, from)) {
          showToast(redo ? 'Tidak bisa diulang: data ini sudah berubah lagi.' : 'Tidak bisa diurungkan: data sudah diubah lagi.');
          return prev;
        }
        const next = { ...prev, [wKey]: structuredClone(to || {}) };
        localStorage.setItem('piket_weeks_v1', JSON.stringify(next));
        if (onSavePiketCloud) onSavePiketCloud({ piket_weeks: next });
        return next;
      });
    } else if (e.path.startsWith('kerjabakti/')) {
      const mKey = e.path.replace('kerjabakti/', '');
      setBakti(prev => {
        const cur = prev[mKey] || {};
        if (!same(cur, from)) {
          showToast(redo ? 'Tidak bisa diulang: data ini sudah berubah lagi.' : 'Tidak bisa diurungkan: data sudah diubah lagi.');
          return prev;
        }
        const next = { ...prev, [mKey]: structuredClone(to || {}) };
        localStorage.setItem('piket_kerjabakti_v1', JSON.stringify(next));
        if (onSavePiketCloud) onSavePiketCloud({ piket_kerjabakti: next });
        return next;
      });
    }

    setLog(prevLog => {
      const updatedLog = { ...prevLog, [id]: { ...e, undone: !redo } };
      localStorage.setItem('piket_log_v1', JSON.stringify(updatedLog));
      if (onSavePiketCloud) onSavePiketCloud({ piket_log: updatedLog });
      return updatedLog;
    });

    showToast(redo ? `Diulang: ${e.label}` : `Diurungkan: ${e.label}`, {
      label: redo ? 'Urungkan lagi' : 'Ulangi',
      fn: () => undoLog(id, !redo)
    });
  };

  // Keyboard shortcut Ctrl+Z / Cmd+Z untuk undo
  useEffect(() => {
    const handleKeyDown = (ev) => {
      if (!(ev.ctrlKey || ev.metaKey) || ev.key.toLowerCase() !== 'z' || ev.shiftKey) return;
      const t = ev.target;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;

      const last = Object.entries(log)
        .filter(([, e]) => !e.undone)
        .sort((a, b) => (a[1].at < b[1].at ? 1 : -1))[0];
      if (last) {
        ev.preventDefault();
        undoLog(last[0], false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [log]);

  /* ===== ROTATION CALCULATIONS ===== */
  const eraFor = (date) => {
    const eras = (config?.eras || []).filter(e => e.from <= date).sort((a, b) => (a.from < b.from ? 1 : -1));
    return eras[0] || null;
  };

  const plannedWeek = (date) => {
    const era = eraFor(date);
    if (!era) return null;
    const n = era.members.length;
    const seq = seqFor(n);
    if (!seq) return null;
    const idx = weeksBetween(era.from, date);
    if (idx < 0) return null;
    const byPerson = {};
    const bySlot = {};
    const bebas = [];
    era.members.forEach(m => {
      const step = ((m.start - 1 + idx) % n + n) % n;
      const key = seq[step];
      byPerson[m.name] = key;
      if (key === 'BEBAS') bebas.push(m.name);
      else bySlot[key] = m.name;
    });
    return { era, n, seq, idx, byPerson, bySlot, bebas, kaca: KACA_SIDES[((idx % 3) + 3) % 3] };
  };

  const slotName = (k, v) => (k === 'KACA' ? `Kaca ${v ? v.kaca : ''} Lt.1` : `${SL[k].n}${SL[k].lt ? ' ' + SL[k].lt : ''}`);

  /* ===== JATAH 7 PEKAN & LIBUR PLAN ===== */
  const JATAH = () => config?.jatahPekan ?? 7;
  const MAXLIBUR = () => config?.maxLiburPerMinggu ?? 1;

  const recordedAbs = (name, y, before) => {
    const L = [];
    Object.keys(weeks).forEach(d => {
      if (d.slice(0, 4) !== y || (before && d >= before)) return;
      const t = (weeks[d].absen || {})[name];
      if (t) L.push({ date: d, type: t });
    });
    return L;
  };

  const liburPlanMemo = useMemo(() => {
    const out = {};
    const used = {};
    Object.keys(weeks).sort().forEach(d => {
      const req = weeks[d].minta || [];
      if (!req.length) return;
      const y = d.slice(0, 4);
      used[y] = used[y] || {};
      const scored = req.map(r => ({
        ...r,
        sisa: JATAH() - recordedAbs(r.name, y, d).length - (used[y][r.name] || 0)
      }));
      const elig = scored.filter(r => r.sisa > 0).sort((a, b) => b.sisa - a.sisa || (a.at < b.at ? -1 : 1));
      const approved = elig.slice(0, MAXLIBUR());
      const minA = approved.length ? Math.min(...approved.map(x => x.sisa)) : 0;
      const rejected = scored.filter(r => !approved.includes(r)).map(r => ({
        ...r,
        why: r.sisa <= 0
          ? 'jatah 7 pekan sudah habis'
          : r.sisa < minA
          ? 'kalah prioritas, sisa jatahnya lebih sedikit'
          : 'kuota libur minggu ini sudah dipakai yang minta lebih dulu'
      }));
      approved.forEach(r => {
        used[y][r.name] = (used[y][r.name] || 0) + 1;
      });
      out[d] = { approved, rejected };
    });
    return out;
  }, [weeks, config]);

  const jatahInfo = (name, y) => {
    const plan = liburPlanMemo;
    const L = recordedAbs(name, y)
      .concat(
        Object.keys(plan)
          .filter(d => d.slice(0, 4) === y && plan[d].approved.some(r => r.name === name))
          .map(d => ({ date: d, type: 'libur' }))
      )
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    return {
      base: JATAH(),
      list: L,
      used: L.length,
      sisa: Math.max(0, JATAH() - L.length),
      lebih: Math.max(0, L.length - JATAH())
    };
  };

  const weekView = (date) => {
    const p = plannedWeek(date);
    if (!p) return null;
    const w = weeks[date] || {};
    const over = { ...(w.over || {}) };
    const absen = w.absen || {};
    const lp = liburPlanMemo[date] || { approved: [], rejected: [] };
    const libur = lp.approved.map(r => r.name);
    libur.forEach(n => {
      const sub = (w.liburSub || {})[n];
      if (!sub) return;
      if (!(sub.slot in over)) over[sub.slot] = sub.sub || '';
      if (sub.from && !(sub.from in over)) over[sub.from] = '';
    });
    const rows = ORDER.filter(k => k in p.bySlot).map(k => {
      const planned = p.bySlot[k];
      const has = Object.prototype.hasOwnProperty.call(over, k);
      const actual = has ? over[k] : planned;
      return { k, planned, actual, changed: actual !== planned, status: (w.status || {})[k] || '' };
    });
    return { ...p, rows, absen, w, libur, rejected: lp.rejected };
  };

  /* ===== CANDIDATES ALGORITHM ===== */
  const candidates = (v, k) => {
    const busy = new Set(v.rows.map(r => r.actual).filter(Boolean));
    const away = new Set(Object.keys(v.absen).concat(v.libur));
    const heavy = SL[k].k !== 'r';
    const out = [];
    const add = o => {
      if (!out.some(x => x.name === o.name)) out.push(o);
    };
    const holder = key => {
      const r = v.rows.find(x => x.k === key);
      return r && r.actual && !away.has(r.actual) && key !== k ? r.actual : null;
    };

    const manual = v.bebas.filter(n => !away.has(n) && !busy.has(n));
    if (!heavy) {
      manual.forEach(n =>
        add({
          name: n,
          from: null,
          label: `${n} (tugas dari koordinator)`,
          note: 'Pengganti pertama untuk slot ringan: minggu ini dia tidak pegang slot tetap.'
        })
      );
    }
    if (!heavy && holder('KACA')) {
      add({
        name: holder('KACA'),
        from: 'KACA',
        label: `${holder('KACA')} (pegang Kaca)`,
        note: 'Pengganti pertama untuk slot ringan. Slot Kaca dikosongkan minggu ini.'
      });
    }
    if (heavy && holder('MED')) {
      add({
        name: holder('MED'),
        from: 'MED',
        label: `${holder('MED')} (pegang Media)`,
        note: 'Pengganti pertama. Minggu depannya dia pegang Kaca, jadi tidak kena berat dua kali. Slot Media dikosongkan.'
      });
    }
    (config.relawan || []).forEach(n => {
      if (busy.has(n) || away.has(n)) return;
      add({ name: n, from: null, label: `${n} (relawan)`, note: 'Sukarela.' });
    });
    if (heavy) {
      manual.forEach(n =>
        add({
          name: n,
          from: null,
          label: `${n} (tugas dari koordinator)`,
          note: 'Minggu ini tidak pegang slot tetap, tapi minggu depannya dia pegang Vakum Selatan, jadi kena berat dua minggu berturut-turut.'
        })
      );
    }
    v.era.members
      .map(m => m.name)
      .forEach(n => {
        if (busy.has(n) || away.has(n)) return;
        add({ name: n, from: null, label: n, note: 'Sukarela.' });
      });
    if (heavy && holder('KACA')) {
      add({
        name: holder('KACA'),
        from: 'KACA',
        label: `${holder('KACA')} (pegang Kaca)`,
        note: 'Minggu depannya dia pegang Vakum Selatan, jadi kena berat dua minggu berturut-turut. Slot Kaca dikosongkan.'
      });
    }
    if (heavy && holder('L3')) {
      add({
        name: holder('L3'),
        from: 'L3',
        label: `${holder('L3')} (pegang WC Lt.3)`,
        note: 'Pilihan terakhir: berat dua minggu berturut-turut. Slot WC Lt.3 dikosongkan.'
      });
    }
    return out;
  };

  /* ===== ACTION HANDLERS ===== */
  const cycleStatus = (k) => {
    const cur = ((weeks[week] || {}).status || {})[k] || '';
    const nx = { '': 'selesai', selesai: 'ulang', ulang: '' }[cur];
    save(
      'weeks/' + week,
      w => {
        w.status = w.status || {};
        if (nx) w.status[k] = nx;
        else delete w.status[k];
        return w;
      },
      `Status ${slotName(k, plannedWeek(week))}: ${nx || 'belum'}, ${fmtShort(week)}`
    );
  };

  const handleToggleOpen = (k, v) => {
    if (openSlot === k) {
      setOpenSlot(null);
    } else {
      setOpenSlot(k);
      const r = v.rows.find(x => x.k === k);
      const holder = r?.actual;
      const c = candidates(v, k);
      const ringan = SL[k].k === 'r';
      const ji = holder ? jatahInfo(holder, week.slice(0, 4)) : null;
      const already = holder && (v.w.minta || []).some(m => m.name === holder);
      const canLibur = holder && ji?.sisa > 0 && !already;
      const hasMan = c.length > 0 && /tugas dari koordinator/.test(c[0].label);

      setSheetAbsType(canLibur ? 'libur' : 'pulang');
      if (ringan && holder && !hasMan) {
        setSheetCand('__kosong');
      } else if (c.length > 0) {
        setSheetCand(`${c[0].name}|${c[0].from || ''}`);
      } else {
        setSheetCand('');
      }
    }
  };

  const applySub = (k, v) => {
    const r = v.rows.find(x => x.k === k);
    const holder = r?.actual;
    if (!sheetCand) {
      showToast('Pilih pengganti dulu');
      return;
    }
    const [sub, from] = sheetCand === '__kosong' ? ['', ''] : sheetCand.split('|');

    save(
      'weeks/' + week,
      w => {
        w.over = w.over || {};
        w.absen = w.absen || {};
        if (sheetAbsType === 'libur') {
          w.minta = (w.minta || []).filter(m => m.name !== holder);
          w.minta.push({ name: holder, at: new Date().toISOString() });
          w.liburSub = w.liburSub || {};
          w.liburSub[holder] = { slot: k, sub, from: from || null };
        } else {
          if (holder && sheetAbsType) w.absen[holder] = sheetAbsType;
          w.over[k] = sub;
          if (from) w.over[from] = '';
        }
        if (w.status) delete w.status[k];
        return w;
      },
      `${holder ? holder + ' tidak hadir di ' : 'Isi '}${slotName(k, v)}, ${fmtShort(week)}`
    );
    setOpenSlot(null);
  };

  const cancelLibur = (n) => {
    save(
      'weeks/' + week,
      w => {
        w.minta = (w.minta || []).filter(m => m.name !== n);
        if (w.liburSub) delete w.liburSub[n];
        return w;
      },
      `Batal libur ${n}, ${fmtShort(week)}`
    );
    showToast('Libur dibatalkan');
  };

  const resetWeek = () => {
    save('weeks/' + week, () => ({}), `Minggu ${fmtShort(week)} dikembalikan ke jadwal awal`);
    setConfirmReset(false);
  };

  /* ===== WHATSAPP GENERATOR ===== */
  const waText = (v) => {
    const L = [
      fmtLong(week),
      '',
      `"_Mohon diselesaikan sebelum sholat Jum'at_"`,
      `"_Jangan tidur dulu sebelum menyelesaikan pekerjaannya_"`,
      `"_*Mohon berikan REACTION pada pesan ini apabila sudah mengerjakan piket (TIDAK MEMBERI REACTION = BELUM PIKET)*_"` ,
      ''
    ];
    [['VS', 'VT', 'VU'], ['WC3', 'WC2', 'T4'], ['KACA'], ['GEN'], ['L2'], ['L3'], ['MED']].forEach(g => {
      const rs = g.map(k => v.rows.find(r => r.k === k)).filter(Boolean);
      if (!rs.length) return;
      rs.forEach(r => L.push(`- *${r.k === 'KACA' ? `Lt.1 Kaca ${v.kaca}` : SL[r.k].wa}:* _${r.actual || '(kosong)'}_`));
      L.push('');
    });
    L.push(`- *Pel Plaza:* _${config.plaza || ''}_`, '');

    const away = Object.entries(v.absen)
      .map(([n, t]) => `${n} (${(ABS[t] || t).toLowerCase()})`)
      .concat(v.libur.map(n => `${n} (libur piket)`));
    const man = v.bebas.filter(n => !away.some(a => a.startsWith(n + ' ')) && !v.rows.some(r => r.actual === n));
    if (man.length) {
      const idxPlaza = L.indexOf(`- *Pel Plaza:* _${config.plaza || ''}_`);
      if (idxPlaza !== -1) {
        L.splice(
          idxPlaza,
          0,
          ...man.map(n => `- *Tugas tambahan:* _${n}${(v.w.manual || {})[n] ? ` (${(v.w.manual || {})[n]})` : ''}_`),
          ''
        );
      }
    }

    if (away.length) L.push(`*Tidak hadir:* ${away.join(', ')}`);
    L.push(
      '',
      'AKAN DILAKUKAN SIDAK KEBERSIHAN',
      'APABILA SUDAH PIKET NAMUN *TIDAK MEMBERI REACTION* & PADA SAAT SIDAK *TEMPAT MASIH KOTOR* , YANG BERSANGKUTAN *WAJIB MEMBERSIHKAN ULANG* .',
      '',
      '‼️ JANGAN LUPA BERI REACTION PADA PESAN DI ATAS APABILA SUDAH PIKET‼️',
      '',
      '_Jazakumullahu Khairan_'
    );
    return L.join('\n');
  };

  const baktiWA = (mk, b, ramHere) => {
    const [y, m] = mk.split('-').map(Number);
    const L = [
      `*KERJA BAKTI ${MONTHS[m - 1].toUpperCase()} ${y}*`,
      b.tanggal ? fmtLong(b.tanggal) : '(tanggal menyusul)',
      '',
      'Area yang dibersihkan:'
    ];
    let i = 1;
    AREAS.filter(a => a.when === 'bulanan' || (a.when === 'ramadan' && ramHere)).forEach(a =>
      L.push(`${i++}. ${a.n}`)
    );
    L.push('', 'Semua anggota diharapkan hadir.', '', '_Jazakumullahu Khairan_');
    return L.join('\n');
  };

  const copyToClipboard = (text, successMsg = 'Pesan disalin') => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(successMsg))
        .catch(() => showToast('Gagal menyalin'));
    } else {
      showToast('Clipboard API tidak didukung');
    }
  };

  /* ===== SUB-VIEW: MINGGU INI ===== */
  const renderMingguIni = () => {
    const date = week;
    const v = weekView(date);
    const nav = (
      <div className="weeknav">
        <button className="btn sm" onClick={() => { setWeek(addDays(date, -7)); setOpenSlot(null); }} aria-label="Minggu sebelumnya">←</button>
        <span className="d">{fmtShort(date)} {date.slice(0, 4)}</span>
        <button className="btn sm" onClick={() => { setWeek(addDays(date, 7)); setOpenSlot(null); }} aria-label="Minggu berikutnya">→</button>
        {date !== upcomingFriday() && (
          <button className="btn ghost sm" onClick={() => { setWeek(upcomingFriday()); setOpenSlot(null); }}>Jumat terdekat</button>
        )}
      </div>
    );

    if (!v) {
      return (
        <div>
          <div className="sh">
            <div>
              <div className="eyebrow">Jadwal piket</div>
              <h2>{fmtLong(date)}</h2>
              <p>Tanggal ini sebelum tabel putar dimulai ({fmtLong(config?.eras?.[0]?.from || '2026-10-09')}).</p>
            </div>
            {nav}
          </div>
        </div>
      );
    }

    const filled = v.rows.filter(r => r.actual).length;
    const done = v.rows.filter(r => r.status === 'selesai').length;
    const away = Object.keys(v.absen).concat(v.libur);
    const cyc = Math.floor(v.idx / v.n) + 1;
    const step = (v.idx % v.n) + 1;
    const absList = Object.entries(v.absen);

    return (
      <div>
        <div className="sh">
          <div>
            <div className="eyebrow">Jadwal piket · siklus {cyc}, minggu {step} dari {v.n}</div>
            <h2>{fmtLong(date)}</h2>
            <p>Klik status untuk menandai Selesai atau Ulang setelah sidak. Tombol "Tidak hadir" dipakai untuk libur piket, pulang, agenda kuliah, atau izin lain. Setiap ketidakhadiran memotong 1 dari jatah 7 pekan.</p>
          </div>
          {nav}
        </div>

        <div className="summary">
          <div className="sm-i">
            <div className="v num">{done}/{filled}</div>
            <div className="l">slot selesai</div>
          </div>
          <div className="sm-i">
            <div className="v num">{v.rows.length - filled}</div>
            <div className="l">slot kosong</div>
          </div>
          <div className="sm-i">
            <div className="v num">{away.length}</div>
            <div className="l">tidak hadir</div>
          </div>
          <div className="sm-i">
            <div className="v" style={{ fontSize: '18px', paddingTop: '4px' }}>{v.libur.join(', ') || '–'}</div>
            <div className="l">libur piket</div>
          </div>
        </div>

        {v.rejected.length > 0 && (
          <div className="notice warn" style={{ marginBottom: '12px' }}>
            {v.rejected.map(r => `Libur piket ${r.name} tidak disetujui: ${r.why}. `).join(' ')} Yang tidak disetujui tetap piket sesuai jadwal.
          </div>
        )}

        <div className="panel roster">
          {v.rows.map(r => {
            const s = SL[r.k];
            const isOpen = openSlot === r.k;
            const tag = r.changed && r.actual ? <span className="tag acc">pengganti</span> : null;
            const stLabel = { selesai: 'Selesai', ulang: 'Ulang', '': 'Belum' }[r.status || ''];

            return (
              <div key={r.k} className="row">
                <div className="slot">
                  <b>{slotName(r.k, v)}</b>
                  <span>
                    <span className={`tag ${s.k}`}>{KL[s.k]}</span>
                    {r.k === 'KACA' ? ' bergilir Selatan → Timur → Utara' : ''}
                  </span>
                </div>

                <div className="who">
                  {r.actual ? (
                    <>
                      {r.changed && r.planned ? <span className="was">{r.planned}</span> : null}
                      <span>{r.actual}</span>
                      {tag}
                    </>
                  ) : (
                    <>
                      {r.planned ? <span className="was">{r.planned}</span> : null}
                      <span className="empty">kosong</span>
                    </>
                  )}
                </div>

                <div className="acts">
                  {r.actual && (
                    <button
                      className={`st ${r.status}`}
                      onClick={() => cycleStatus(r.k)}
                      aria-label={`Status ${slotName(r.k, v)}: ${stLabel}`}
                    >
                      {stLabel}
                    </button>
                  )}
                  <button
                    className="btn sm ghost"
                    onClick={() => handleToggleOpen(r.k, v)}
                    aria-expanded={isOpen}
                  >
                    {r.actual ? 'Tidak hadir' : 'Isi'}
                  </button>
                </div>

                {isOpen && renderSheet(v, r)}
              </div>
            );
          })}

          {/* Bebas bergilir / Tugas dari koordinator (Manual) */}
          {v.bebas.map(n => {
            if (Object.keys(v.absen).includes(n) || v.libur.includes(n)) return null;
            const usedAt = v.rows.find(r => r.actual === n);
            const task = (v.w.manual || {})[n] || '';
            const isOpenMan = openSlot === 'M:' + n;

            return (
              <div key={`bebas-${n}`} className="row">
                <div className="slot">
                  <b>Tugas dari koordinator</b>
                  <span>
                    <span className="tag f">Manual</span> ditentukan tiap minggu
                  </span>
                </div>
                <div className="who">
                  <span>{n}</span>
                  {usedAt ? (
                    <span className="tag acc">mengganti {slotName(usedAt.k, v)}</span>
                  ) : task ? (
                    <span className="mut" style={{ fontSize: '13px' }}>{task}</span>
                  ) : (
                    <span className="empty">belum ditentukan</span>
                  )}
                </div>
                <div className="acts">
                  {!usedAt && (
                    <button
                      className="btn sm ghost"
                      onClick={() => setOpenSlot(isOpenMan ? null : 'M:' + n)}
                      aria-expanded={isOpenMan}
                    >
                      {task ? 'Ubah' : 'Tentukan'}
                    </button>
                  )}
                </div>

                {isOpenMan && (
                  <div className="sheet">
                    <h4>Tugas {n} minggu ini</h4>
                    <p className="mut" style={{ fontSize: '13px', margin: 0 }}>
                      Kalau ada slot yang kosong karena orangnya tidak hadir, {n} jadi pengganti pertama. Kalau tidak ada, tulis tugasnya di sini, misalnya Kaca sisi lain atau bantu area yang paling kotor.
                    </p>
                    <input
                      type="text"
                      id="manTask"
                      defaultValue={task}
                      placeholder="contoh: Kaca Timur Lt.1"
                      style={{ width: '100%' }}
                    />
                    <div className="rowflex">
                      <button
                        className="btn pri"
                        onClick={() => {
                          const t = document.getElementById('manTask')?.value.trim();
                          save(
                            'weeks/' + week,
                            w => {
                              w.manual = w.manual || {};
                              if (t) w.manual[n] = t;
                              else delete w.manual[n];
                              return w;
                            },
                            `Tugas manual ${n}, ${fmtShort(week)}`
                          );
                          setOpenSlot(null);
                        }}
                      >
                        Simpan
                      </button>
                      <button className="btn ghost" onClick={() => setOpenSlot(null)}>
                        Batal
                      </button>
                    </div>

                    {(() => {
                      const ji = jatahInfo(n, date.slice(0, 4));
                      const can = ji.sisa > 0;
                      return (
                        <div className="rowflex" style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                          <label htmlFor="manAbs" className="mut" style={{ fontSize: '13px' }}>
                            Tidak hadir
                          </label>
                          <select id="manAbs">
                            {can && <option value="libur">Libur piket (maks {MAXLIBUR()} orang/minggu)</option>}
                            <option value="pulang">Pulang</option>
                            <option value="kuliah">Agenda kuliah (KKN, dll)</option>
                            <option value="lain">Izin lain</option>
                            <option value="tanpa">Tanpa kabar</option>
                          </select>
                          <span className={`tag ${ji.sisa ? '' : 'warn'}`}>
                            sisa {ji.sisa} dari {ji.base} pekan
                          </span>
                          <button
                            className="btn sm"
                            onClick={() => {
                              const t = document.getElementById('manAbs')?.value;
                              save(
                                'weeks/' + week,
                                w => {
                                  if (t === 'libur') {
                                    w.minta = (w.minta || []).filter(m => m.name !== n);
                                    w.minta.push({ name: n, at: new Date().toISOString() });
                                  } else {
                                    w.absen = w.absen || {};
                                    w.absen[n] = t;
                                  }
                                  if (w.manual) delete w.manual[n];
                                  return w;
                                },
                                `${n} tidak hadir, ${fmtShort(week)}`
                              );
                              setOpenSlot(null);
                            }}
                          >
                            Catat
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}

          {v.libur.map(n => {
            const sub = (v.w.liburSub || {})[n];
            return (
              <div key={`libur-${n}`} className="row libur">
                <div className="slot">
                  <b>Libur piket</b>
                  <span>Memotong 1 jatah{sub && sub.sub ? ` · diganti ${sub.sub}` : ''}</span>
                </div>
                <div className="who">
                  <span>{n}</span>
                  <span className="tag">sisa {jatahInfo(n, date.slice(0, 4)).sisa} pekan</span>
                </div>
                <div className="acts">
                  <button className="btn sm ghost" onClick={() => cancelLibur(n)}>Batalkan</button>
                </div>
              </div>
            );
          })}

          {v.rejected.map(r => (
            <div key={`rej-${r.name}`} className="row">
              <div className="slot">
                <b>Libur piket ditolak</b>
                <span>{r.why}</span>
              </div>
              <div className="who"><span>{r.name}</span></div>
              <div className="acts">
                <button className="btn sm ghost" onClick={() => cancelLibur(r.name)}>Hapus permintaan</button>
              </div>
            </div>
          ))}

          <div className="row">
            <div className="slot">
              <b>Pel Plaza</b>
              <span>Tugas tetap</span>
            </div>
            <div className="who"><span>{config.plaza || ''}</span></div>
            <div className="acts"></div>
          </div>
        </div>

        {absList.length > 0 && (
          <p className="mut" style={{ fontSize: '13px', margin: '10px 2px 0' }}>
            Tidak hadir: {absList.map(([n, t]) => `${n} (${(ABS[t] || t).toLowerCase()})`).join(', ')}. Masing-masing memotong 1 pekan.
          </p>
        )}

        {(absList.length > 0 || v.libur.length > 0 || v.rejected.length > 0 || Object.keys(v.w.over || {}).length > 0) && (
          <div style={{ margin: '8px 2px 0' }}>
            {confirmReset ? (
              <div className="notice warn" style={{ margin: '12px 0' }}>
                Semua libur, ketidakhadiran, pengganti, dan status minggu ini akan dihapus.{' '}
                <button className="btn sm pri" style={{ marginLeft: '6px' }} onClick={resetWeek}>Ya, kembalikan</button>{' '}
                <button className="btn sm ghost" onClick={() => setConfirmReset(false)}>Batal</button>
              </div>
            ) : (
              <button className="btn ghost sm" onClick={() => setConfirmReset(true)}>
                Kembalikan minggu ini ke jadwal awal
              </button>
            )}
          </div>
        )}

        <div className="sh" style={{ marginTop: '28px' }}>
          <div>
            <h3 style={{ fontSize: '18px' }}>Pesan untuk grup</h3>
            <p>Format sama dengan yang biasa dikirim. Salin, lalu tempel di WhatsApp.</p>
          </div>
          <button className="btn acc" onClick={() => copyToClipboard(waText(v), 'Pesan WhatsApp disalin!')}>
            Salin pesan
          </button>
        </div>

        <pre className="wa">{waText(v)}</pre>
      </div>
    );
  };

  /* ===== SUB-RENDER: SHEET FORM ===== */
  const renderSheet = (v, r) => {
    const k = r.k;
    const c = candidates(v, k);
    const holder = r.actual;
    const ringan = SL[k].k === 'r';
    const ji = holder ? jatahInfo(holder, week.slice(0, 4)) : null;
    const already = holder && (v.w.minta || []).some(m => m.name === holder);
    const canLibur = holder && ji?.sisa > 0 && !already;
    const hasMan = c.length > 0 && /tugas dari koordinator/.test(c[0].label);

    return (
      <div className="sheet">
        <h4>{holder ? `${holder} tidak hadir di ${slotName(k, v)}` : `Isi slot ${slotName(k, v)}`}</h4>

        {holder && (
          <div className="rowflex">
            <label htmlFor="absType" className="mut" style={{ fontSize: '13px' }}>Alasan</label>
            <select
              id="absType"
              value={sheetAbsType}
              onChange={(e) => setSheetAbsType(e.target.value)}
            >
              {canLibur && <option value="libur">Libur piket (maks {MAXLIBUR()} orang/minggu)</option>}
              <option value="pulang">Pulang</option>
              <option value="kuliah">Agenda kuliah (KKN, dll)</option>
              <option value="lain">Izin lain</option>
              <option value="tanpa">Tanpa kabar</option>
            </select>
            <span className={`tag ${ji?.sisa ? '' : 'warn'}`}>
              sisa {ji?.sisa} dari {ji?.base} pekan{ji?.lebih ? `, lebih ${ji.lebih}` : ''}
            </span>
          </div>
        )}

        {holder && !canLibur && (
          <p className="mut" style={{ fontSize: '12px', margin: 0 }}>
            {already
              ? 'Sudah ada permintaan libur piket minggu ini.'
              : 'Jatah 7 pekan sudah habis, jadi tidak bisa libur piket. Ketidakhadiran lain tetap dicatat sebagai lebih jatah.'}
          </p>
        )}

        <div className="opts" role="radiogroup" aria-label="Pengganti">
          {ringan && holder && (
            <label className="opt">
              <input
                type="radio"
                name="cand"
                value="__kosong"
                checked={sheetCand === '__kosong'}
                onChange={() => setSheetCand('__kosong')}
              />
              <div>
                <b>Kosongkan slot ini</b>
                <small>Slot ringan boleh kosong saat orang kurang, maksimal 2 minggu berturut-turut.</small>
              </div>
            </label>
          )}

          {c.map(o => {
            const val = `${o.name}|${o.from || ''}`;
            return (
              <label key={val} className="opt">
                <input
                  type="radio"
                  name="cand"
                  value={val}
                  checked={sheetCand === val}
                  onChange={() => setSheetCand(val)}
                />
                <div>
                  <b>{o.label}</b>
                  <small>{o.note}</small>
                </div>
              </label>
            );
          })}

          {!c.length && !ringan && (
            <div className="notice warn">Tidak ada yang tersedia. Slot berat tidak boleh kosong, hubungi koordinator.</div>
          )}
        </div>

        <div className="rowflex">
          <button className="btn pri" onClick={() => applySub(k, v)}>Simpan</button>
          <button className="btn ghost" onClick={() => setOpenSlot(null)}>Batal</button>
        </div>
      </div>
    );
  };

  /* ===== SUB-VIEW: TABEL PUTAR ===== */
  const renderTabelPutar = () => {
    const v = plannedWeek(week) || plannedWeek(config.eras[0].from);
    if (!v) return null;
    const cyc = Math.floor(v.idx / v.n);
    const start = addDays(v.era.from, cyc * v.n * 7);
    const dates = Array.from({ length: v.n }, (_, i) => addDays(start, i * 7));
    const now = upcomingFriday();

    return (
      <div>
        <div className="sh">
          <div>
            <div className="eyebrow">Siklus {cyc + 1} · {v.n} minggu</div>
            <h2>Tabel putar</h2>
            <p>
              Tiap Jumat semua orang maju satu langkah. Dalam satu siklus setiap orang dapat 5 berat, 1 menengah,{' '}
              {v.seq.filter(k => SL[k].k === 'r').length} ringan
              {v.seq.includes('BEBAS')
                ? `, dan ${v.seq.filter(k => k === 'BEBAS').length}× tugas dari koordinator (tanpa slot tetap; jadi pengganti pertama untuk slot ringan yang ditinggal)`
                : ''}
              . Kaca bergilir Selatan, Timur, Utara. Kotak oranye = orangnya tidak hadir minggu itu.
            </p>
          </div>
          <div className="weeknav">
            <button
              className="btn sm"
              onClick={() => setWeek(addDays(start, -7 * v.n))}
              disabled={start <= v.era.from}
              aria-label="Siklus sebelumnya"
            >
              ←
            </button>
            <span className="d" style={{ minWidth: '150px', fontSize: '15px' }}>
              {fmtShort(dates[0])} – {fmtShort(dates[dates.length - 1])}
            </span>
            <button
              className="btn sm"
              onClick={() => setWeek(addDays(start, 7 * v.n))}
              aria-label="Siklus berikutnya"
            >
              →
            </button>
          </div>
        </div>

        <div className="panel" style={{ padding: '12px' }}>
          <div className="gwrap">
            <table className="g">
              <thead>
                <tr>
                  <th></th>
                  {dates.map(d => (
                    <th key={d} className={d === now ? 'now' : ''}>
                      {fmtShort(d)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {v.era.members.map(m => (
                  <tr key={m.name}>
                    <th className="n">{m.name}</th>
                    {dates.map(d => {
                      const p = plannedWeek(d);
                      const key = p ? p.byPerson[m.name] : null;
                      const k = key ? SL[key].k : '';
                      const ab =
                        (weeks[d]?.absen || {})[m.name] ||
                        ((liburPlanMemo[d] || { approved: [] }).approved.some(r => r.name === m.name) ? 'libur' : '');
                      const cellTitle = `${m.name} · ${fmtShort(d)}: ${key ? slotName(key, p) : ''}${
                        ab ? ' (' + (ABS[ab] || ab).toLowerCase() + ')' : ''
                      }`;

                      return (
                        <td
                          key={d}
                          className={`${k} ${d === now ? 'now' : ''} ${ab ? 'abs' : ''}`}
                          title={cellTitle}
                        >
                          {key ? (key === 'KACA' ? 'Kaca ' + p.kaca[0] : CODE[key]) : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <th className="n">{config.plaza || ''}</th>
                  {dates.map(d => (
                    <td
                      key={d}
                      style={{
                        background: 'repeating-linear-gradient(135deg, #DBEAFE 0 2px, transparent 2px 6px)',
                        color: 'var(--ink)'
                      }}
                    >
                      Plaza
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="legend">
            <span><i className="sw" style={{ background: 'var(--c-b)' }}></i>Berat</span>
            <span><i className="sw" style={{ background: 'var(--c-m)' }}></i>Menengah</span>
            <span><i className="sw" style={{ background: 'var(--c-r)' }}></i>Ringan</span>
            <span><i className="sw" style={{ boxShadow: 'inset 0 0 0 1px var(--mut)' }}></i>Manual</span>
            <span><i className="sw" style={{ boxShadow: 'inset 0 0 0 2px var(--accent)' }}></i>Jumat terdekat</span>
            <span><i className="sw" style={{ boxShadow: 'inset 0 0 0 2px var(--warn)' }}></i>Tidak hadir</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '16px', marginTop: '14px' }}>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>Urutan langkah</div>
          <div className="rowflex">
            {v.seq.map((k, i) => (
              <span key={i} className={`tag ${SL[k].k}`}>
                {i + 1}. {CODE[k]}
              </span>
            ))}
          </div>
          <p className="mut" style={{ fontSize: '13px', margin: '10px 0 0' }}>
            Kode: VS/VT/VU = Vakum Selatan/Tengah/Utara Lt.1 · Jongkok, Duduk = WC Jongkok, WC Duduk Lt.1 · T4 = T4 Wudhu Barat & Timur · Gen = Vakum & Genset Lt.2 · WC Lt2/Lt3 = WC & T4 Wudhu di lantai itu · Media = Media/Sekre · Kaca S/T/U = Kaca Lt.1 sisi Selatan/Timur/Utara · Manual = tugas dari koordinator, tanpa slot tetap.
          </p>
        </div>
      </div>
    );
  };

  /* ===== SUB-VIEW: JATAH 7 PEKAN ===== */
  const renderJatah = () => {
    const y = week.slice(0, 4);
    const era = eraFor(week) || config.eras[config.eras.length - 1];
    const members = era.members.map(m => m.name);
    const base = JATAH();
    const rows = members
      .map(n => ({ n, j: jatahInfo(n, y) }))
      .sort((a, b) => a.j.sisa - b.j.sisa || b.j.lebih - a.j.lebih || a.n.localeCompare(b.n));

    return (
      <div>
        <div className="sh">
          <div>
            <div className="eyebrow">Tahun {y} · Januari–Desember</div>
            <h2>Jatah 7 pekan</h2>
            <p>
              Setiap anggota inti boleh tidak hadir piket Jumat paling banyak {base} pekan setahun, apa pun alasannya:
              libur piket, pulang, KKN atau agenda kuliah lain, maupun izin. Yang tidak pulang bisa memakai seluruh jatahnya untuk libur piket.{' '}
              {y === '2026' ? 'Untuk 2026, ketidakhadiran sejak Maret ikut dihitung.' : ''}
            </p>
          </div>
          <div className="weeknav">
            <button
              className="btn sm"
              onClick={() => setWeek(`${+y - 1}-12-25`)}
              aria-label="Tahun sebelumnya"
            >
              ←
            </button>
            <span className="d" style={{ minWidth: '80px', fontSize: '15px' }}>{y}</span>
            <button
              className="btn sm"
              onClick={() => setWeek(`${+y + 1}-01-08`)}
              aria-label="Tahun berikutnya"
            >
              →
            </button>
          </div>
        </div>

        <div className="panel" style={{ padding: '4px 6px' }}>
          <div className="gwrap">
            <table className="jtab">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Terpakai</th>
                  <th className="n">Sisa</th>
                  <th>Rincian</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ n, j }) => {
                  const cells = Array.from({ length: Math.max(base, j.used) }, (_, i) => (
                    <i
                      key={i}
                      className={i < j.used ? (i < base ? 'u' : 'x') : ''}
                    />
                  ));
                  const det = j.list
                    .map(e => (e.type === 'riwayat' ? fmtShort(e.date) : `${fmtShort(e.date)} (${(ABS[e.type] || e.type).toLowerCase()})`))
                    .join(' · ');

                  return (
                    <tr key={n}>
                      <td style={{ fontWeight: 600 }}>{n}</td>
                      <td>
                        <div className="bar7" aria-label={`${j.used} dari ${base} pekan terpakai`}>
                          {cells}
                        </div>
                      </td>
                      <td className="n">
                        {j.sisa}
                        {j.lebih ? <span className="tag warn" style={{ marginLeft: '4px' }}>lebih {j.lebih}</span> : null}
                      </td>
                      <td className="mut" style={{ fontSize: '12px' }}>
                        {det || 'Belum pernah tidak hadir'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="legend" style={{ marginTop: '12px' }}>
          <span><i className="sw" style={{ background: 'var(--c-m)' }}></i>Terpakai</span>
          <span><i className="sw" style={{ background: 'var(--warn)' }}></i>Lebih dari jatah</span>
          <span><i className="sw" style={{ background: 'var(--line)' }}></i>Sisa</span>
        </div>
      </div>
    );
  };

  /* ===== SUB-VIEW: KERJA BAKTI ===== */
  const renderKerjaBakti = () => {
    const mk = month || monthKey(week);
    const b = bakti[mk] || {};
    const [y, m] = mk.split('-').map(Number);
    const prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`;
    const next = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}`;
    const ram = config?.ramadanH1 || '';
    const ramHere = ram && monthKey(ram) === mk;

    const toggleArea = (areaId) => {
      save(
        'kerjabakti/' + mk,
        curB => {
          curB.done = curB.done || {};
          if (curB.done[areaId]) delete curB.done[areaId];
          else curB.done[areaId] = todayISO();
          return curB;
        },
        `Kerja bakti ${mk}: ${(AREAS.find(a => a.id === areaId) || { n: areaId }).n}`
      );
    };

    const handleDateChange = (newDate) => {
      save(
        'kerjabakti/' + mk,
        curB => {
          curB.tanggal = newDate;
          return curB;
        },
        `Kerja bakti ${mk}`
      );
    };

    return (
      <div>
        <div className="sh">
          <div>
            <div className="eyebrow">Sebulan sekali · semua anggota inti</div>
            <h2>Kerja bakti {MONTHS[m - 1]} {y}</h2>
            <p>Area yang dibersihkan bersama. Pembagian orang per area belum diatur, cukup centang area yang sudah selesai.</p>
          </div>
          <div className="weeknav">
            <button className="btn sm" onClick={() => setMonth(prev)} aria-label="Bulan sebelumnya">←</button>
            <span className="d" style={{ minWidth: '130px', fontSize: '15px' }}>{MON3[m - 1]} {y}</span>
            <button className="btn sm" onClick={() => setMonth(next)} aria-label="Bulan berikutnya">→</button>
          </div>
        </div>

        <div className="panel" style={{ padding: '14px 16px', marginBottom: '12px' }}>
          <div className="rowflex">
            <label htmlFor="bkDate" style={{ fontWeight: 600, fontSize: '14px' }}>Tanggal kerja bakti</label>
            <input
              type="date"
              id="bkDate"
              value={b.tanggal || ''}
              onChange={(e) => handleDateChange(e.target.value)}
            />
            <span className="mut" style={{ fontSize: '13px' }}>
              {b.tanggal ? fmtLong(b.tanggal) : 'Belum ditentukan'}
            </span>
          </div>
        </div>

        <div className="panel">
          {AREAS.map((a, i) => {
            const done = !!(b.done || {})[a.id];
            const active = a.when === 'bulanan' || (a.when === 'ramadan' && ramHere);
            const sub =
              a.when === 'bulanan'
                ? 'Setiap bulan'
                : a.when === 'ramadan'
                ? ram
                  ? `H-1 sebelum Ramadan · ${fmtLong(ram)}`
                  : 'H-1 sebelum Ramadan · tanggal belum diisi di Pengaturan'
                : 'Prospek, belum dijadwalkan';

            return (
              <div key={a.id} className={`area ${active ? '' : 'off'}`}>
                <button
                  className={`ck ${done ? 'on' : ''}`}
                  disabled={!active}
                  onClick={() => toggleArea(a.id)}
                  aria-label={`Tandai ${a.n} selesai`}
                  aria-pressed={done}
                >
                  {done ? '✓' : ''}
                </button>
                <div>
                  <b>{i + 1}. {a.n}</b>
                  <span className="s">{sub}</span>
                </div>
                {done ? (
                  <span className="tag ok">selesai</span>
                ) : active ? null : (
                  <span className="tag">bukan bulan ini</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="sh" style={{ marginTop: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px' }}>Pesan kerja bakti</h3>
          </div>
          <button className="btn acc" onClick={() => copyToClipboard(baktiWA(mk, b, ramHere), 'Pesan kerja bakti disalin!')}>
            Salin pesan
          </button>
        </div>

        <pre className="wa">{baktiWA(mk, b, ramHere)}</pre>
      </div>
    );
  };

  /* ===== SUB-VIEW: PENGATURAN ===== */
  const renderPengaturan = () => {
    const era = eraFor(week) || config.eras[config.eras.length - 1];
    const currentDraft =
      draft || {
        members: era ? era.members.map(m => m.name) : [],
        from: addDays(upcomingFriday(), 7),
        plaza: config.plaza || '',
        relawan: (config.relawan || []).join(', '),
        ram: config.ramadanH1 || ''
      };

    const n = currentDraft.members.length;
    const ok = n >= 10;
    const isFromFriday = D(currentDraft.from).getUTCDay() === 5;

    const moveMember = (idx, delta) => {
      const arr = [...currentDraft.members];
      const temp = arr[idx];
      arr[idx] = arr[idx + delta];
      arr[idx + delta] = temp;
      setDraft({ ...currentDraft, members: arr });
    };

    const removeMember = (idx) => {
      const arr = [...currentDraft.members];
      arr.splice(idx, 1);
      setDraft({ ...currentDraft, members: arr });
    };

    const addMember = () => {
      const name = newMemName.trim();
      if (!name) return;
      if (currentDraft.members.includes(name)) {
        showToast('Nama sudah ada');
        return;
      }
      setDraft({ ...currentDraft, members: [...currentDraft.members, name] });
      setNewMemName('');
    };

    const saveEra = () => {
      const sameMembers = era && JSON.stringify(era.members.map(m => m.name)) === JSON.stringify(currentDraft.members);
      const members = currentDraft.members.map((name, i) => ({ name, start: i + 1 }));

      save(
        'config/main',
        c => {
          if (!sameMembers) {
            c.eras = (c.eras || []).filter(e => e.from < currentDraft.from);
            c.eras.push({ from: currentDraft.from, members });
          }
          c.plaza = currentDraft.plaza.trim();
          c.relawan = currentDraft.relawan.split(',').map(s => s.trim()).filter(Boolean);
          c.ramadanH1 = currentDraft.ram || null;
          return c;
        },
        'Pengaturan anggota & tanggal mulai'
      );

      setDraft(null);
    };

    return (
      <div>
        <div className="sh">
          <div>
            <div className="eyebrow">Untuk koordinator</div>
            <h2>Pengaturan</h2>
            <p>Perubahan anggota berlaku mulai tanggal yang dipilih sebagai siklus baru. Jadwal sebelum tanggal itu tidak berubah.</p>
          </div>
        </div>

        {era && (
          <div className="panel" style={{ padding: '16px', marginBottom: '12px' }}>
            <div className="eyebrow" style={{ marginBottom: '6px' }}>Susunan yang berlaku</div>
            <p style={{ margin: 0 }}>
              {era.members.length} anggota inti, mulai {fmtLong(era.from)}. Plaza: {config.plaza}. Jatah {JATAH()} pekan per tahun, maksimal {MAXLIBUR()} libur piket per minggu.
            </p>
          </div>
        )}

        <div className="panel" style={{ padding: '16px', display: 'grid', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '16px' }}>Anggota inti (urutan = urutan tabel)</h3>
            <p className="mut" style={{ fontSize: '13px', margin: '4px 0 0' }}>
              Minimal 10 orang. 11 orang = 10 slot + Kaca bergilir. 12 orang atau lebih = tiap orang tambahan menambah satu langkah tugas dari koordinator (tanpa slot tetap).
            </p>
          </div>

          <div>
            {currentDraft.members.map((nm, i) => (
              <div key={nm + i} className="memrow">
                <span className="num mut">{i + 1}</span>
                <span style={{ fontWeight: 600 }}>{nm}</span>
                <span className="mut" style={{ fontSize: '12px' }}>mulai langkah {i + 1}</span>
                <span className="rowflex">
                  <button
                    className="btn sm ghost"
                    disabled={i === 0}
                    onClick={() => moveMember(i, -1)}
                    aria-label={`Naikkan ${nm}`}
                  >
                    ↑
                  </button>
                  <button
                    className="btn sm ghost"
                    disabled={i === n - 1}
                    onClick={() => moveMember(i, 1)}
                    aria-label={`Turunkan ${nm}`}
                  >
                    ↓
                  </button>
                  <button
                    className="btn sm ghost"
                    onClick={() => removeMember(i)}
                  >
                    Hapus
                  </button>
                </span>
              </div>
            ))}
          </div>

          <div className="rowflex">
            <input
              type="text"
              id="newMem"
              placeholder="Nama anggota baru"
              style={{ width: '200px' }}
              value={newMemName}
              onChange={(e) => setNewMemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
            />
            <button className="btn sm" onClick={addMember}>Tambah</button>
          </div>

          <div className="rowflex">
            <label htmlFor="fromD" style={{ fontWeight: 600, fontSize: '14px' }}>Berlaku mulai Jumat</label>
            <input
              type="date"
              id="fromD"
              value={currentDraft.from}
              onChange={(e) => setDraft({ ...currentDraft, from: e.target.value })}
            />
          </div>

          <div className="rowflex">
            <label htmlFor="plz" style={{ fontWeight: 600, fontSize: '14px' }}>Petugas Plaza (tetap)</label>
            <input
              type="text"
              id="plz"
              value={currentDraft.plaza}
              onChange={(e) => setDraft({ ...currentDraft, plaza: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="rel" style={{ fontWeight: 600, fontSize: '14px' }}>Relawan di luar rotasi</label>
            <input
              type="text"
              id="rel"
              value={currentDraft.relawan}
              onChange={(e) => setDraft({ ...currentDraft, relawan: e.target.value })}
              style={{ width: '100%', marginTop: '6px' }}
              placeholder="pisahkan dengan koma"
            />
          </div>

          <div className="rowflex">
            <label htmlFor="ram" style={{ fontWeight: 600, fontSize: '14px' }}>Tanggal H-1 Ramadan (kerja bakti gudang)</label>
            <input
              type="date"
              id="ram"
              value={currentDraft.ram}
              onChange={(e) => setDraft({ ...currentDraft, ram: e.target.value })}
            />
          </div>

          {!ok && (
            <div className="notice warn">
              Butuh minimal 10 anggota inti. Kurang dari itu, slot berat pasti jatuh dua minggu berturut-turut ke orang yang sama.
            </div>
          )}

          <div className="rowflex">
            <button
              className="btn pri"
              disabled={!ok || !isFromFriday}
              onClick={saveEra}
            >
              Simpan
            </button>
            <button
              className="btn ghost"
              onClick={() => { setDraft(null); setNewMemName(''); }}
            >
              Reset
            </button>
            {!isFromFriday && (
              <span className="mut" style={{ fontSize: '13px' }}>Tanggal mulai harus hari Jumat.</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const logEntries = Object.entries(log).sort((a, b) => (a[1].at < b[1].at ? 1 : -1)).slice(0, 30);

  /* ===== MAIN RENDER ===== */
  return (
    <div className="piket-app-scope">
      <div className="page">
        <header className="top">
          <div className="brandrow">
            <div className="brand">
              Sistem Piket <span>MPR</span>
            </div>
            <div className="rowflex" style={{ gap: '12px' }}>
              <div className="sync on" id="sync">
                <i></i>
                <span>Tersimpan otomatis</span>
              </div>
              <button
                className="btn sm ghost"
                onClick={() => setHistOpen(!histOpen)}
                aria-expanded={histOpen}
              >
                Riwayat &amp; urungkan
              </button>
            </div>
          </div>

          <nav className="tabs" role="tablist" aria-label="Menu">
            <button
              className="tab"
              role="tab"
              aria-selected={tab === 'minggu'}
              onClick={() => { setTab('minggu'); setOpenSlot(null); }}
            >
              Minggu ini
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={tab === 'putar'}
              onClick={() => { setTab('putar'); setOpenSlot(null); }}
            >
              Tabel putar
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={tab === 'jatah'}
              onClick={() => { setTab('jatah'); setOpenSlot(null); }}
            >
              Jatah 7 pekan
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={tab === 'bakti'}
              onClick={() => { setTab('bakti'); setOpenSlot(null); }}
            >
              Kerja bakti
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={tab === 'atur'}
              onClick={() => { setTab('atur'); setOpenSlot(null); }}
            >
              Pengaturan
            </button>
          </nav>
        </header>

        {histOpen && (
          <div className="hist" role="region" aria-label="Riwayat perubahan" style={{ marginTop: '12px' }}>
            <div className="rowflex" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
              <b style={{ fontSize: '15px' }}>Riwayat perubahan</b>
              <button className="btn sm ghost" onClick={() => setHistOpen(false)}>Tutup</button>
            </div>
            <p className="mut" style={{ fontSize: '12px', margin: '0 0 6px' }}>
              30 perubahan terakhir. Urungkan mengembalikan data ke sebelum perubahan itu. Kalau data yang sama sudah diubah lagi, urungkan yang lebih baru dulu. (Bisa juga tekan <kbd style={{ padding: '1px 4px', background: 'var(--line)', borderRadius: '4px' }}>Ctrl+Z</kbd>)
            </p>
            {logEntries.length > 0 ? (
              logEntries.map(([id, e]) => (
                <div key={id} className={`hrow ${e.undone ? 'undone' : ''}`}>
                  <div>
                    <b>{e.label}</b>
                    <br />
                    <small>{relTime(e.at)}{e.undone ? ' · sudah diurungkan' : ''}</small>
                  </div>
                  <button
                    className={`btn sm ${e.undone ? 'ghost' : ''}`}
                    onClick={() => undoLog(id, e.undone)}
                  >
                    {e.undone ? 'Ulangi' : 'Urungkan'}
                  </button>
                </div>
              ))
            ) : (
              <p className="mut" style={{ fontSize: '13px' }}>Belum ada perubahan yang tercatat.</p>
            )}
          </div>
        )}

        <main id="main">
          {tab === 'minggu' && renderMingguIni()}
          {tab === 'putar' && renderTabelPutar()}
          {tab === 'jatah' && renderJatah()}
          {tab === 'bakti' && renderKerjaBakti()}
          {tab === 'atur' && renderPengaturan()}
        </main>
      </div>

      {toastData && (
        <div className="toast" role="status">
          <span>{toastData.msg}</span>
          {toastData.act && (
            <button
              onClick={() => {
                const fn = toastData.act.fn;
                setToastData(null);
                fn();
              }}
            >
              {toastData.act.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
