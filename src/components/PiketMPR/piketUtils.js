// piketUtils.js - Logika Bisnis & Utilitas Sistem Piket MPR

export const DEFAULT_PIKET_MEMBERS = [
  'Mujahid', 'Fadel', 'Malik', 'Nabiel', 'Nafhan', 'Yusuf',
  'Septian', 'Nurdin', 'Wildan', 'Zufar', 'Amrul', 'Raihan'
];

export const DEFAULT_VOLUNTEERS = ['Hilal', 'Lalu', 'Imam'];
export const DEFAULT_PLAZA_OFFICER = 'Cahyo';
export const BASE_START_FRIDAY = '2026-10-09'; // Jumat 9 Okt 2026 (Siklus 1)

// R1 & R2: 12 Langkah Slot Piket Baku
export const PIKET_SLOTS = [
  { code: 'VS', name: 'Vakum Selatan Lt.1', class: 'Berat', points: 3, order: 1 },
  { code: 'Genset', name: 'Vakum & Genset Lt.2', class: 'Ringan', points: 1, order: 2 },
  { code: 'WC3', name: 'WC Lt.3', class: 'Ringan', points: 1, order: 3 },
  { code: 'WCLt2', name: 'WC Lt.2', class: 'Ringan', points: 1, order: 4 },
  { code: 'VT', name: 'Vakum Tengah Lt.1', class: 'Berat', points: 3, order: 5 },
  { code: 'T4', name: 'T4 Wudhu Barat & Timur', class: 'Menengah', points: 2, order: 6 },
  { code: 'WC2', name: 'WC 2 Utara & T4 Wudhu', class: 'Berat', points: 3, order: 7 },
  { code: 'WC3U', name: 'WC 3 Utara', class: 'Berat', points: 3, order: 8 },
  { code: 'VU', name: 'Vakum Utara Lt.1', class: 'Berat', points: 3, order: 9 },
  { code: 'Media', name: 'Media / Sekre', class: 'Ringan', points: 1, order: 10 },
  { code: 'Kaca', name: 'Kaca Lt.1', class: 'Ringan', points: 1, order: 11 },
  { code: 'Bebas', name: 'Bebas Piket', class: 'Bebas', points: 0, order: 12 },
];

export const KACA_SIDES = ['Selatan', 'Timur', 'Utara'];

export const ABSENCE_REASONS = [
  { id: 'libur piket', label: 'Libur Piket (Jatah)', cutsQuota: true },
  { id: 'pulang', label: 'Pulang Kampung', cutsQuota: true },
  { id: 'agenda kuliah', label: 'Agenda Kuliah / Ujian', cutsQuota: true },
  { id: 'izin lain', label: 'Izin Lainnya', cutsQuota: true },
  { id: 'tanpa kabar', label: 'Tanpa Kabar (Alpha)', cutsQuota: true },
];

export const SIDAK_STATUSES = ['Belum', 'Selesai', 'Ulang'];

// Hitung selisih pekan (Jumat ke Jumat) dari tanggal referensi
export function getWeeksDiff(targetDateStr, baseDateStr = BASE_START_FRIDAY) {
  const d1 = new Date(baseDateStr + 'T00:00:00');
  const d2 = new Date(targetDateStr + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

// Format tanggal Indonesia
export function formatIndoDate(dateStr, withDay = true) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  if (withDay) options.weekday = 'long';
  return d.toLocaleDateString('id-ID', options);
}

// Dapatkan Jumat terdekat (hari ini jika Jumat, atau Jumat terdekat berikutnya)
export function getNearestFriday(currentDate = new Date()) {
  const d = new Date(currentDate);
  const day = d.getDay(); // 0: Ahad, 1: Senin, ..., 5: Jumat, 6: Sabtu
  let diff = (5 - day);
  if (diff < 0) diff += 7; // jika Sabtu (6), maka Jumat berikutnya (+6)
  
  d.setDate(d.getDate() + diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Tambah / kurangi pekan ke tanggal Jumat
export function addWeeksToFriday(fridayStr, weeksToAdd) {
  const d = new Date(fridayStr + 'T00:00:00');
  d.setDate(d.getDate() + (weeksToAdd * 7));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// R2 & R3: Kalkulasi jadwal dasar rotasi tabel putar
// Rumus: slotIndex = (memberIndex + weekDiff) % 12
export function calculateBaseAssignments(fridayStr, members = DEFAULT_PIKET_MEMBERS, baseDateStr = BASE_START_FRIDAY) {
  const weekDiff = getWeeksDiff(fridayStr, baseDateStr);
  const numMembers = members.length;
  const numSlots = PIKET_SLOTS.length; // 12
  
  // Posisi slot untuk masing-masing slotCode
  const slotAssignments = {};
  PIKET_SLOTS.forEach(slot => {
    slotAssignments[slot.code] = {
      slot,
      originalMember: null,
      assignedMember: null,
      isSubstitute: false,
      substituteReason: null,
      status: 'Belum', // Status sidak
      kacaSide: null,
    };
  });

  // Tentukan sisi kaca bergilir (R4)
  const normalizedWeek = ((weekDiff % 3) + 3) % 3;
  slotAssignments['Kaca'].kacaSide = KACA_SIDES[normalizedWeek];

  // Petakan setiap anggota ke slotnya
  members.forEach((member, memberIdx) => {
    // langkah maju per pekan
    const rawStep = (memberIdx + weekDiff) % numMembers;
    const stepIdx = (rawStep + numMembers) % numMembers; // tangani nilai negatif jika pekan sebelum base
    
    if (stepIdx < numSlots) {
      const slotCode = PIKET_SLOTS[stepIdx].code;
      if (slotAssignments[slotCode]) {
        slotAssignments[slotCode].originalMember = member;
        slotAssignments[slotCode].assignedMember = member;
      }
    }
  });

  return slotAssignments;
}

// R8 & R9: Terapkan ketidakhadiran dan pemilihan pengganti otomatis
export function resolveWeeklySchedule(fridayStr, config, weekData = {}) {
  const members = config.members || DEFAULT_PIKET_MEMBERS;
  const volunteers = config.volunteers || DEFAULT_VOLUNTEERS;
  const baseDate = config.startDate || BASE_START_FRIDAY;

  const baseAssignments = calculateBaseAssignments(fridayStr, members, baseDate);
  const absences = weekData.absences || {}; // { [memberName]: { reason, substitute, note } }
  const sidak = weekData.sidak || {}; // { [slotCode]: 'Belum' | 'Selesai' | 'Ulang' }
  const manualOverrides = weekData.manualOverrides || {}; // { [slotCode]: memberName }

  // 1. Terapkan status sidak yang sudah tercatat
  Object.keys(sidak).forEach(slotCode => {
    if (baseAssignments[slotCode]) {
      baseAssignments[slotCode].status = sidak[slotCode];
    }
  });

  // 2. Kumpulkan siapa yang tidak hadir dan siapa yang bebas
  const absentMembers = Object.keys(absences);
  const freeMembers = [];
  if (baseAssignments['Bebas'] && baseAssignments['Bebas'].originalMember) {
    const bebasPerson = baseAssignments['Bebas'].originalMember;
    if (!absentMembers.includes(bebasPerson)) {
      freeMembers.push(bebasPerson);
    }
  }

  // 3. Deteksi slot mana saja yang petugas aslinya tidak hadir
  const affectedSlots = [];
  PIKET_SLOTS.forEach(slot => {
    const item = baseAssignments[slot.code];
    if (item.originalMember && absentMembers.includes(item.originalMember)) {
      affectedSlots.push(slot.code);
    }
  });

  // Urutan prioritas slot yang butuh pengganti (Slot Berat & Menengah tidak boleh kosong)
  const heavyMediumSlots = affectedSlots.filter(code => {
    const s = PIKET_SLOTS.find(x => x.code === code);
    return s && (s.class === 'Berat' || s.class === 'Menengah');
  });

  // R8: Alur pengganti slot berat / menengah
  // Calon donor berurutan:
  // 1. Pemegang Media
  // 2. Relawan atau anggota yang sedang Bebas
  // 3. Pemegang Kaca
  // 4. Pemegang WC Lt.3
  const availableDonors = [];
  
  const mediaHolder = baseAssignments['Media']?.originalMember;
  if (mediaHolder && !absentMembers.includes(mediaHolder)) availableDonors.push({ member: mediaHolder, donorSlot: 'Media' });

  freeMembers.forEach(m => availableDonors.push({ member: m, donorSlot: 'Bebas' }));
  volunteers.forEach(v => availableDonors.push({ member: v, donorSlot: 'Relawan' }));

  const kacaHolder = baseAssignments['Kaca']?.originalMember;
  if (kacaHolder && !absentMembers.includes(kacaHolder)) availableDonors.push({ member: kacaHolder, donorSlot: 'Kaca' });

  const wc3Holder = baseAssignments['WC3']?.originalMember;
  if (wc3Holder && !absentMembers.includes(wc3Holder)) availableDonors.push({ member: wc3Holder, donorSlot: 'WC3' });

  let donorIdx = 0;
  heavyMediumSlots.forEach(slotCode => {
    const customSub = absences[baseAssignments[slotCode].originalMember]?.substitute;
    if (customSub) {
      baseAssignments[slotCode].assignedMember = customSub;
      baseAssignments[slotCode].isSubstitute = true;
      baseAssignments[slotCode].substituteReason = absences[baseAssignments[slotCode].originalMember].reason;
    } else if (donorIdx < availableDonors.length) {
      const donor = availableDonors[donorIdx++];
      baseAssignments[slotCode].assignedMember = donor.member;
      baseAssignments[slotCode].isSubstitute = true;
      baseAssignments[slotCode].substituteReason = absences[baseAssignments[slotCode].originalMember].reason;
      
      // Kosongkan slot asal donor jika berasal dari slot ringan
      if (donor.donorSlot !== 'Bebas' && donor.donorSlot !== 'Relawan' && baseAssignments[donor.donorSlot]) {
        baseAssignments[donor.donorSlot].assignedMember = null;
        baseAssignments[donor.donorSlot].donorTarget = slotCode;
      }
    } else {
      // Tidak ada pengganti sama sekali
      baseAssignments[slotCode].assignedMember = null;
    }
  });

  // Slot ringan yang anggotanya tidak hadir
  const lightSlotsAbsent = affectedSlots.filter(code => {
    const s = PIKET_SLOTS.find(x => x.code === code);
    return s && s.class === 'Ringan';
  });

  lightSlotsAbsent.forEach(slotCode => {
    const customSub = absences[baseAssignments[slotCode].originalMember]?.substitute;
    if (customSub) {
      baseAssignments[slotCode].assignedMember = customSub;
      baseAssignments[slotCode].isSubstitute = true;
      baseAssignments[slotCode].substituteReason = absences[baseAssignments[slotCode].originalMember].reason;
    } else {
      // Slot ringan otomatis kosong jika petugas absen dan tidak diisi
      baseAssignments[slotCode].assignedMember = null;
    }
  });

  // Terapkan manual overrides jika ada
  Object.keys(manualOverrides).forEach(slotCode => {
    if (baseAssignments[slotCode]) {
      baseAssignments[slotCode].assignedMember = manualOverrides[slotCode];
    }
  });

  return {
    fridayStr,
    assignments: baseAssignments,
    absences,
    freeMembers,
    plazaOfficer: config.fixedPlaza || DEFAULT_PLAZA_OFFICER,
  };
}

// Rekap akumulasi Jatah 7 Pekan per orang
export function calculateAnnualQuotaStats(config, allWeeksData = {}, year = '2026') {
  const members = config.members || DEFAULT_PIKET_MEMBERS;
  const maxQuota = config.maxLeavePerYear || 7;
  
  const stats = {};
  members.forEach(m => {
    stats[m] = {
      name: m,
      usedCount: 0,
      remainingCount: maxQuota,
      excessCount: 0,
      history: [], // { date, reason, substitute }
    };
  });

  // Iterasi seluruh pekan yang tersimpan
  Object.keys(allWeeksData).forEach(dateStr => {
    if (dateStr.startsWith(year)) {
      const weekItem = allWeeksData[dateStr];
      const absences = weekItem.absences || {};
      
      Object.keys(absences).forEach(member => {
        if (stats[member]) {
          const detail = absences[member];
          stats[member].usedCount += 1;
          stats[member].history.push({
            date: dateStr,
            reason: detail.reason || 'izin',
            substitute: detail.substitute || '-',
            note: detail.note || '',
          });
        }
      });
    }
  });

  // Hitung sisa dan kelebihan (R7)
  members.forEach(m => {
    const s = stats[m];
    // Sort riwayat dari tanggal terlama ke terbaru
    s.history.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (s.usedCount > maxQuota) {
      s.remainingCount = 0;
      s.excessCount = s.usedCount - maxQuota;
    } else {
      s.remainingCount = maxQuota - s.usedCount;
      s.excessCount = 0;
    }
  });

  return stats;
}

// Generator Pesan WhatsApp Format Grup (F2)
export function generateWhatsAppMessage(scheduleObj) {
  const { fridayStr, assignments, absences, plazaOfficer } = scheduleObj;
  const indoDate = formatIndoDate(fridayStr, true);

  let msg = `*JADWAL PIKET JUMAT TAKMIR MASJID POGUNG RAYA*\n`;
  msg += `📅 ${indoDate}\n\n`;

  msg += `*DAFTAR TUGAS & PETUGAS:*\n`;

  let idx = 1;
  PIKET_SLOTS.forEach(slot => {
    if (slot.code === 'Bebas') return; // Ditampilkan di bawah

    const item = assignments[slot.code];
    let personName = item?.assignedMember || '(kosong)';
    let detailExtra = '';

    if (slot.code === 'Kaca' && item?.kacaSide) {
      detailExtra = ` (${item.kacaSide})`;
    }

    // Status sidak
    let sidakBadge = '';
    if (item?.status === 'Selesai') sidakBadge = ' [SELESAI]';
    else if (item?.status === 'Ulang') sidakBadge = ' [ULANG]';

    // Info jika digantikan
    if (item?.isSubstitute && item.originalMember) {
      personName = `${personName} (gantikan ${item.originalMember})`;
    }

    msg += `${idx}. ${slot.name}${detailExtra}: *${personName}*${sidakBadge}\n`;
    idx++;
  });

  msg += `${idx}. Pel Plaza: *${plazaOfficer || DEFAULT_PLAZA_OFFICER}*\n\n`;

  // Bagian Bebas Piket
  const bebasItem = assignments['Bebas'];
  const bebasPerson = bebasItem?.assignedMember || bebasItem?.originalMember || '-';
  msg += `🏖️ *Bebas Piket:* ${bebasPerson}\n`;

  // Bagian Tidak Hadir
  const absentKeys = Object.keys(absences || {});
  if (absentKeys.length > 0) {
    msg += `❌ *Tidak Hadir:*\n`;
    absentKeys.forEach(name => {
      const a = absences[name];
      const sub = a.substitute ? ` -> digantikan ${a.substitute}` : '';
      msg += `   • ${name} (${a.reason}${sub})\n`;
    });
  } else {
    msg += `✅ *Tidak Hadir:* Nihil (Semua personil lengkap)\n`;
  }

  msg += `\n*Catatan:*\n`;
  msg += `• Piket dilaksanakan ba'da Ashar / sesuai kesepakatan tim.\n`;
  msg += `• Mohon lapor ke koordinator sidak setelah area bersih tuntas.\n`;
  msg += `• Jazaakumullahu khayran wa baarakallahu fiikum.`;

  return msg;
}
