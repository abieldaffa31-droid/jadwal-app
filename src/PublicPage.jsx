import React, { useState, useEffect } from 'react';
import { getSupabase } from './supabaseClient';

export default function PublicPage() {
  const [schedule, setSchedule]       = useState({});
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [tomorrowPrayerTimes, setTomorrowPrayerTimes] = useState(null);
  const [hijriDate, setHijriDate]     = useState(null);
  const [clock, setClock]             = useState(new Date());
  const [ptLoading, setPtLoading]     = useState(true);
  const [viewModeOverride, setViewModeOverride] = useState(null); // 'today' | 'tomorrow' | null (auto)

  // ── Realtime Supabase & Live Cross-Device Sync ──────────────────────────────
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const fetchLatest = async () => {
      try {
        const { data } = await supabase
          .from('jadwal_takmir')
          .select('schedule')
          .eq('id', 'default')
          .maybeSingle();

        if (data?.schedule) {
          setSchedule(data.schedule);
        }
      } catch (e) {
        console.error('Supabase public fetch error:', e);
      }
    };

    // Fetch segera saat halaman dibuka
    fetchLatest();

    // 1. Supabase Realtime Subscription (Instant push saat admin update)
    const sub = supabase
      .channel('publik:jadwal_takmir_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal_takmir' }, (payload) => {
        if (payload.new?.schedule) {
          setSchedule(payload.new.schedule);
        }
      })
      .subscribe();

    // 2. Window focus sync (saat layar dinyalakan / tab dibuka)
    const handleFocus = () => fetchLatest();
    window.addEventListener('focus', handleFocus);

    // 3. Fallback Poller setiap 5 detik (untuk TV/layar publik yang tidak ada interaksi)
    const pollInterval = setInterval(fetchLatest, 5000);

    return () => {
      supabase.removeChannel(sub);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

  // ── Jam Realtime ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── API Waktu Sholat (Standar Al-Habib / Kemenag RI untuk Sinduadi, Mlati) ──
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      setPtLoading(true);
      try {
        const now = new Date();
        const d = now.getDate().toString().padStart(2, '0');
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        const y = now.getFullYear();

        const tmrw = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const td = tmrw.getDate().toString().padStart(2, '0');
        const tm = (tmrw.getMonth() + 1).toString().padStart(2, '0');
        const ty = tmrw.getFullYear();

        // Hari ini (Standar Alhabib / Kemenag RI: Koordinat Sinduadi Mlati + 2m Ihtiyati)
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=-7.7613&longitude=110.3698&method=20&tune=0,2,0,2,2,2,0,2,0`
        );
        const data = await res.json();
        if (data.code === 200) {
          setPrayerTimes(data.data.timings);
          setHijriDate(data.data.date.hijri);
        }

        // Besok
        const resTmrw = await fetch(
          `https://api.aladhan.com/v1/timings/${td}-${tm}-${ty}?latitude=-7.7613&longitude=110.3698&method=20&tune=0,2,0,2,2,2,0,2,0`
        );
        const dataTmrw = await resTmrw.json();
        if (dataTmrw.code === 200) {
          setTomorrowPrayerTimes(dataTmrw.data.timings);
        }
      } catch (e) {}
      setPtLoading(false);
    };
    fetchPrayerTimes();
  }, []);

  const dayMap = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', "JUM'AT", 'SABTU'];
  const dayLabelMap = { AHAD: 'Ahad', SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu', KAMIS: 'Kamis', "JUM'AT": "Jum'at", SABTU: 'Sabtu' };
  
  const nowMins = clock.getHours() * 60 + clock.getMinutes();
  
  // LOGIKA AUTO GANTI JADWAL KE BESOK JAM 20:00 (ATAU SETELAH ISYA SELESAI)
  const isAutoTomorrow = nowMins >= 20 * 60; // Jam 20.00 ke atas
  const isShowingTomorrow = viewModeOverride ? viewModeOverride === 'tomorrow' : isAutoTomorrow;

  // Tanggal & Hari Aktif yang ditampilkan
  const activeDate = isShowingTomorrow
    ? new Date(clock.getTime() + 24 * 60 * 60 * 1000)
    : clock;
  const activeDayKey = dayMap[activeDate.getDay()];
  const activeDayLabel = dayLabelMap[activeDayKey];

  const PRAYERS = [
    { key: 'SUBUH',   label: 'Subuh',   apiKey: 'Fajr',    icon: '🌙' },
    { key: 'DZUHUR',  label: 'Dzuhur',  apiKey: 'Dhuhr',   icon: '☀️' },
    { key: 'ASHAR',   label: 'Ashar',   apiKey: 'Asr',     icon: '🌤️' },
    { key: 'MAGHRIB', label: 'Maghrib', apiKey: 'Maghrib', icon: '🌆' },
    { key: 'ISYA',    label: 'Isya',    apiKey: 'Isha',    icon: '⭐' },
  ];

  const parseSuffix = (val, sfx) => {
    if (!val) return null;
    for (const line of val.split('\n')) {
      if (line.includes(`(${sfx})`)) return line.replace(new RegExp(`\\s*\\(${sfx}\\)`, 'g'), '').trim();
    }
    const first = val.split('\n')[0]?.trim();
    return first && !first.match(/\([a-zp]\)/) ? first : null;
  };

  const getDuty = (pKey, dayKey = activeDayKey) => {
    const cell = schedule[`${dayKey}-${pKey}`];
    if (!cell || typeof cell !== 'object') return [];

    if (pKey === 'SUBUH') {
      const isAhad = dayKey === 'AHAD';
      return [
        { label: 'ADZAN K1', value: cell.k1 },
        { label: 'ADZAN K2', value: cell.k2 },
        { label: 'IMAM',     value: cell.imam },
        { label: 'BADAL',    value: cell.badal },
        isAhad
          ? { label: 'MC', value: parseSuffix(schedule[`MC-${dayKey}`], 'p') || schedule[`MC-${dayKey}`] }
          : { label: 'HADITS',   value: schedule[`HADITS-${dayKey}`] },
      ].filter(r => r.value && r.value !== '-');
    }

    if (pKey === 'DZUHUR' || pKey === 'ISYA') {
      return [
        { label: 'ADZAN', value: cell.adzan },
        { label: 'IMAM',  value: cell.imam },
        { label: 'BADAL', value: cell.badal },
      ].filter(r => r.value && r.value !== '-');
    }

    if (pKey === 'ASHAR') {
      const base = [
        { label: 'ADZAN', value: cell.adzan },
        { label: 'IMAM',  value: cell.imam },
        { label: 'BADAL', value: cell.badal },
      ];
      if (dayKey === 'SENIN' || dayKey === 'KAMIS') {
        const mc = parseSuffix(schedule[`MC-${dayKey}`], 's');
        const st = parseSuffix(schedule[`STREAMER-${dayKey}`], 's');
        if (mc) base.push({ label: 'MC SORE',       value: mc });
        if (st) base.push({ label: 'STREAMER SORE', value: st });
      }
      return base.filter(r => r.value && r.value !== '-');
    }

    if (pKey === 'MAGHRIB') {
      const mc = parseSuffix(schedule[`MC-${dayKey}`], 'm') || schedule[`MC-${dayKey}`];
      const st = parseSuffix(schedule[`STREAMER-${dayKey}`], 'm') || schedule[`STREAMER-${dayKey}`];
      return [
        { label: 'ADZAN',    value: cell.adzan },
        { label: 'IMAM',     value: cell.imam },
        { label: 'BADAL',    value: cell.badal },
        { label: 'MC MALAM', value: mc },
        { label: 'STREAMER', value: st },
      ].filter(r => r.value && r.value !== '-');
    }

    return [];
  };

  // Next prayer logic
  const getNextPrayer = () => {
    if (!prayerTimes) return null;

    // Jika sedang mode besok (setelah jam 20.00), sholat berikutnya adalah Subuh besok
    if (isShowingTomorrow) {
      const subuhTime = tomorrowPrayerTimes?.Fajr || prayerTimes?.Fajr || '04:29';
      const [h, m] = subuhTime.split(':').map(Number);
      const subuhMinsTomorrow = (24 * 60 - nowMins) + (h * 60 + m);
      return {
        ...PRAYERS[0],
        time: subuhTime,
        minsLeft: subuhMinsTomorrow,
        isTomorrow: true,
        isOngoing: false,
      };
    }

    // Jika masih hari ini
    for (const p of PRAYERS) {
      const t = prayerTimes[p.apiKey];
      if (!t) continue;
      const [h, m] = t.split(':').map(Number);
      const pMins = h * 60 + m;
      if (pMins + 10 > nowMins) {
        const minsLeft = pMins - nowMins;
        return { ...p, time: t, minsLeft: Math.max(0, minsLeft), isOngoing: minsLeft <= 0, isTomorrow: false };
      }
    }

    // Default jika lewat isya tapi belum masuk mode besok
    return { ...PRAYERS[0], time: tomorrowPrayerTimes?.Fajr || prayerTimes?.Fajr, minsLeft: null, isTomorrow: true };
  };

  const next = getNextPrayer();
  const timeStr = clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const activeDateFormatted = activeDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hijriStr = hijriDate ? `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} H` : '';

  // Greeting berdasarkan waktu
  const getGreeting = () => {
    const hr = clock.getHours();
    if (hr >= 4 && hr < 11) return 'Selamat Pagi';
    if (hr >= 11 && hr < 15) return 'Selamat Siang';
    if (hr >= 15 && hr < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const dutyFeatured = next ? getDuty(next.key, isShowingTomorrow ? activeDayKey : dayMap[clock.getDay()]) : [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a1926] text-[#e0f2fe] pb-20 selection:bg-[#38bdf8]/30" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ── AMBIENT SKY BLUE / ICE CYAN GLOW BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Luminous Light Sky Blue bokeh top right */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#38bdf8]/18 blur-3xl" />
        {/* Deep ocean cyan glow bottom left */}
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-[#0284c7]/25 blur-3xl" />
        {/* Subtle ice blue light stream overlay */}
        <div className="absolute right-0 top-0 w-72 h-96 opacity-15 bg-gradient-to-b from-[#7dd3fc]/25 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 space-y-4">

        {/* ── TOP NAV BAR (LOGO & MENU) ── */}
        <div className="flex items-center justify-between pt-1 pb-2">
          <div className="flex items-center gap-2.5">
            {/* Waveform / Star cyan icon */}
            <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md border border-sky-400/20 flex items-center justify-center text-[#7dd3fc] text-lg shadow-sm">
              ✨
            </div>
            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-[#7dd3fc]/90 block">
                MASJID POGUNG RAYA
              </span>
              <span className="text-xs font-semibold text-[#e0f2fe]">
                Sinduadi, Mlati
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Hari Ini / Besok button */}
            <button
              onClick={() => setViewModeOverride(isShowingTomorrow ? 'today' : 'tomorrow')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                isShowingTomorrow
                  ? 'bg-sky-500/25 border-sky-400/50 text-[#bae6fd]'
                  : 'bg-white/5 border-white/10 text-[#93c5fd] hover:bg-white/10'
              }`}
            >
              <span>{isShowingTomorrow ? '🌙 Jadwal Besok' : '☀️ Jadwal Hari Ini'}</span>
              <span className="text-[9px] opacity-70">⇄</span>
            </button>
          </div>
        </div>

        {/* ── GREETING & CLOCK SECTION ── */}
        <div className="space-y-1 pt-1">
          <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#f0f9ff]">
            {getGreeting()}, <span className="text-[#38bdf8]">Takmir Muda</span>
          </div>
          <p className="text-xs text-[#93c5fd]/80 font-medium leading-relaxed">
            {isShowingTomorrow
              ? `Jadwal & persiapan ibadah untuk besok (${activeDayLabel}).`
              : 'Luruskan shaf, tenangkan jiwa, raih keberkahan.'}
          </p>

          <div className="pt-2 flex items-baseline justify-between">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums text-white">
              {timeStr}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-[#7dd3fc]">
                {activeDateFormatted}
              </div>
              {hijriStr && (
                <div className="text-[11px] text-[#93c5fd]/80">
                  {hijriStr}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── NOTICE JADWAL BESOK (JIKA >= 20.00) ── */}
        {isShowingTomorrow && (
          <div className="p-3 rounded-2xl bg-[#0f2b42]/85 border border-sky-400/30 backdrop-blur-md flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-[#7dd3fc] flex items-center justify-center text-sm font-bold">
                🌙
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#7dd3fc] block">
                  MODE MALAM (PASCA ISYA)
                </span>
                <span className="text-xs font-bold text-white">
                  Menampilkan Jadwal Petugas Besok ({activeDayLabel})
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-sky-500/30 text-white px-2 py-0.5 rounded-full font-semibold">
              Persiapan
            </span>
          </div>
        )}

        {/* ── FEATURED HERO CARD (LIGHT BLUE FROSTED GLASS) ── */}
        {next && (
          <div className="relative rounded-3xl overflow-hidden p-5 md:p-6 backdrop-blur-xl bg-gradient-to-b from-[#13324d]/85 to-[#0c2238]/90 border border-sky-400/25 shadow-2xl space-y-4">
            
            {/* Subtle light blue glow highlight inside card */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7dd3fc] tracking-wide">
                <span>★</span>
                <span>
                  {next.isTomorrow
                    ? `JADWAL SHOLAT BERIKUTNYA (${activeDayLabel.toUpperCase()})`
                    : next.isOngoing
                    ? 'WAKTU SHOLAT SEDANG BERLANGSUNG'
                    : 'WAKTU SHOLAT BERIKUTNYA'}
                </span>
              </div>
              {next.isOngoing ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0284c7] text-white flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  BERLANGSUNG
                </span>
              ) : (
                <span className="text-[#38bdf8] text-sm font-bold">
                  ➔
                </span>
              )}
            </div>

            <div className="space-y-1 relative z-10">
              <div className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{next.icon}</span>
                <span>{next.label}</span>
                <span className="text-xl font-bold text-[#7dd3fc] ml-auto tabular-nums">
                  {next.time} <span className="text-xs opacity-75 font-semibold text-[#bae6fd]">WIB</span>
                </span>
              </div>

              <div className="text-xs text-[#93c5fd] font-medium flex items-center gap-2 pt-0.5">
                {next.isTomorrow ? (
                  <span>🌙 Persiapan tugas sholat Subuh esok hari</span>
                ) : next.minsLeft != null ? (
                  <span>⏳ Kurang lebih {next.minsLeft} menit lagi</span>
                ) : (
                  <span>Tepat waktu di Sinduadi</span>
                )}
              </div>
            </div>

            {/* Frosted Duty Pill Button / Cards */}
            {dutyFeatured.length > 0 && (
              <div className="pt-2 relative z-10">
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#7dd3fc]/80 mb-2">
                  Petugas {next.label} {isShowingTomorrow ? `(${activeDayLabel})` : ''}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {dutyFeatured.slice(0, 3).map((d) => (
                    <div
                      key={d.label}
                      className="rounded-2xl p-2.5 bg-black/25 backdrop-blur-md border border-sky-400/20 text-center"
                    >
                      <div className="text-[9px] font-bold text-[#7dd3fc] uppercase tracking-wider mb-0.5">
                        {d.label}
                      </div>
                      <div className="text-xs font-extrabold text-white truncate">
                        {d.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QUICK PRAYER TIMELINE (CATEGORIES PILL BAR) ── */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-extrabold text-[#7dd3fc] uppercase tracking-wider text-[11px]">
              Jadwal 5 Waktu ({activeDayLabel})
            </span>
            <span className="text-[11px] text-[#93c5fd]/80 font-medium">
              Sinduadi, Mlati (Al-Habib)
            </span>
          </div>

          {/* ── LIST OF PRAYERS (ROUNDED FROSTED ICE-BLUE CARDS) ── */}
          {ptLoading ? (
            <div className="text-center py-10 text-[#93c5fd]/50 font-semibold">
              ⏳ Memuat jadwal sholat...
            </div>
          ) : (
            <div className="space-y-2.5">
              {PRAYERS.map((p) => {
                const timesSource = isShowingTomorrow
                  ? tomorrowPrayerTimes || prayerTimes
                  : prayerTimes;
                const timeDisplay = timesSource?.[p.apiKey] || '—';
                const isSelectedNext = next?.key === p.key;
                const duties = getDuty(p.key, activeDayKey);

                return (
                  <div
                    key={p.key}
                    className={`rounded-3xl p-3.5 md:p-4 backdrop-blur-md transition-all shadow-md ${
                      isSelectedNext
                        ? 'bg-gradient-to-r from-[#173d60] to-[#0f2c47] border border-sky-400/60 ring-1 ring-sky-400/30'
                        : 'bg-[#10273d]/70 border border-white/10 hover:bg-[#14324d]/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Icon circle */}
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                            isSelectedNext
                              ? 'bg-sky-400 text-slate-950 font-bold shadow-md'
                              : 'bg-white/10 text-[#7dd3fc] border border-sky-400/20'
                          }`}
                        >
                          {p.icon}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-white tracking-wide">
                              {p.label}
                            </span>
                            {isSelectedNext && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-[#bae6fd] border border-sky-400/40">
                                {next.isOngoing ? 'BERLANGSUNG' : 'BERIKUTNYA'}
                              </span>
                            )}
                            {(activeDayKey === 'SENIN' || activeDayKey === 'KAMIS') && p.key === 'ASHAR' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950/70 text-[#7dd3fc] border border-sky-400/30">
                                + Kajian Sore
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-extrabold text-[#e0f2fe] tabular-nums">
                          {timeDisplay} <span className="text-[10px] opacity-70 font-semibold text-[#7dd3fc]">WIB</span>
                        </span>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelectedNext
                              ? 'bg-sky-400 text-slate-950'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          ❯
                        </div>
                      </div>
                    </div>

                    {/* Duty Roster Mini Cards */}
                    {duties.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/10 overflow-x-auto custom-scroll-x">
                        <div className="flex items-center divide-x divide-white/10 min-w-max">
                          {duties.map((d, idx) => (
                            <div
                              key={d.label}
                              className={`px-3 first:pl-0 last:pr-0 text-center ${idx === 0 ? 'text-left' : ''}`}
                            >
                              <div className="text-[8.5px] font-bold text-[#7dd3fc]/80 uppercase tracking-wider">
                                {d.label}
                              </div>
                              <div className="text-[11.5px] font-extrabold text-white">
                                {d.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── PIKET CARD (BOTTOM SESSION STYLE) ── */}
        <div className="rounded-3xl p-4 bg-gradient-to-r from-[#112a42]/90 to-[#0c1f33]/90 border border-sky-400/20 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-[#7dd3fc] flex items-center justify-center text-xl shadow-inner">
              🧹
            </div>
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#38bdf8]">
                PIKET {isShowingTomorrow ? `BESOK (${activeDayLabel.toUpperCase()})` : `HARI INI (${activeDayLabel.toUpperCase()})`}
              </div>
              <div className="text-base font-extrabold text-white">
                {schedule[`PIKET-${activeDayKey}`] || '—'}
              </div>
              <div className="text-[10.5px] text-[#93c5fd]/80 italic mt-0.5">
                &quot;Kebersihan dan kenyamanan adalah bagian dari ibadah.&quot;
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#7dd3fc] text-xs font-bold">
            ❯
          </div>
        </div>

      </div>
    </div>
  );
}
