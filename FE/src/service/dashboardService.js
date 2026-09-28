/**
 * Dashboard & Mood Reflection Service
 * Provides mock data & real-time calendar mood tracking APIs.
 * Supports localStorage persistence to track daily mood logs per date (YYYY-MM-DD).
 */

export const getTodayDateKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const STORAGE_KEY = 'bina_jiwa_mood_logs';

export const getStoredMoodLogs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse mood logs', e);
  }
  // Default preset mood logs for demonstration matching the design
  return {
    '2026-09-01': { mood: 'Tenang', color: '#e0f2fe', type: 'Tenang', icon: '😊', intensity: 4, factors: ['Keluarga • Rumah', 'Kualitas Tidur'], note: 'Hari ini merasa sangat damai setelah meditasi pagi.', timestamp: '2026-09-01T08:30:00.000Z' },
    '2026-09-02': { mood: 'Bahagia', color: '#fef3c7', type: 'Bahagia', icon: '😄', intensity: 5, factors: ['Pekerjaan', 'Hubungan Sosial'], note: 'Proyek berhasil berjalan lancar dan mendapat respon positif.', timestamp: '2026-09-02T09:15:00.000Z' },
    '2026-09-03': { mood: 'Biasa', color: '#f1f5f9', type: 'Biasa', icon: '😐', intensity: 3, factors: ['Pekerjaan', 'Kebugaran Fisik'], note: 'Aktivitas rutin harian berjalan normal tanpa kendala.', timestamp: '2026-09-03T10:00:00.000Z' },
    '2026-09-04': { mood: 'Cemas', color: '#ffe4e6', type: 'Cemas', icon: '🌸', intensity: 3, factors: ['Pekerjaan'], note: 'Menghadapi deadline presentasi tetapi berusaha tetap tenang.', timestamp: '2026-09-04T07:45:00.000Z' },
    '2026-09-05': { mood: 'Lega', color: '#e0f2fe', type: 'Tenang', icon: '🌊', intensity: 4, factors: ['Keluarga • Rumah', 'Kualitas Tidur'], note: 'Akhir pekan yang menyenangkan bersama keluarga.', timestamp: '2026-09-05T09:00:00.000Z' },
    '2026-09-06': { mood: 'Bahagia', color: '#fef3c7', type: 'Bahagia', icon: '☀️', intensity: 5, factors: ['Hubungan Sosial', 'Kebugaran Fisik'], note: 'Olahraga sore dan mengobrol hangat dengan teman lama.', timestamp: '2026-09-06T16:30:00.000Z' },
    '2026-09-07': { mood: 'Tenang', color: '#e0f2fe', type: 'Tenang', icon: '🪻', intensity: 4, factors: ['Kualitas Tidur'], note: 'Tidur nyenyak 8 jam membantu mengawali pekan dengan batin tenang.', timestamp: '2026-09-07T08:00:00.000Z' },
    '2026-09-08': { mood: 'Sendu', color: '#f3e8ff', type: 'Sedih', icon: '🌧️', intensity: 2, factors: ['Hubungan Sosial'], note: 'Sedikit rindu kampung halaman di hari hujan.', timestamp: '2026-09-08T11:20:00.000Z' },
    '2026-09-09': { mood: 'Biasa', color: '#f1f5f9', type: 'Biasa', icon: '😐', intensity: 3, factors: ['Pekerjaan'], note: 'Fokus menyelesaikan pekerjaan kantor.', timestamp: '2026-09-09T09:30:00.000Z' },
    '2026-09-10': { mood: 'Damai', color: '#e0f2fe', type: 'Tenang', icon: '💙', intensity: 4, factors: ['Keluarga • Rumah', 'Kualitas Tidur'], note: 'Suasana rumah yang hangat membawa rasa damai di pikiran.', timestamp: '2026-09-10T08:15:00.000Z' },
    '2026-09-11': { mood: 'Puas', color: '#fef3c7', type: 'Bahagia', icon: '😊', intensity: 4, factors: ['Pekerjaan', 'Kebugaran Fisik'], note: 'Mencapai target harian dan menyempatkan jogging sore.', timestamp: '2026-09-11T17:00:00.000Z' },
    '2026-09-12': { mood: 'Segar', color: '#e0f2fe', type: 'Tenang', icon: '🪴', intensity: 5, factors: ['Kebugaran Fisik', 'Kualitas Tidur'], note: 'Menghirup udara segar pagi hari sambil merawat tanaman.', timestamp: '2026-09-12T07:10:00.000Z' },
    '2026-09-13': { mood: 'Santai', color: '#e0f2fe', type: 'Tenang', icon: '🪻', intensity: 4, factors: ['Keluarga • Rumah'], note: 'Menikmati teh hangat di teras rumah tanpa gangguan gadget.', timestamp: '2026-09-13T10:45:00.000Z' },
    '2026-09-14': { mood: 'Lelah', color: '#ffe4e6', type: 'Cemas', icon: '🔋', intensity: 3, factors: ['Pekerjaan'], note: 'Jadwal meeting padat dari pagi hingga sore.', timestamp: '2026-09-14T18:00:00.000Z' },
    '2026-09-15': { mood: 'Biasa', color: '#f1f5f9', type: 'Biasa', icon: '😐', intensity: 3, factors: ['Keluarga • Rumah'], note: 'Istirahat lebih awal untuk memulihkan tenaga.', timestamp: '2026-09-15T21:00:00.000Z' },
  };
};

export const hasFilledToday = () => {
  const logs = getStoredMoodLogs();
  const todayKey = getTodayDateKey();
  return Boolean(logs[todayKey]);
};

export const saveTodayMoodLog = async (moodData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const todayKey = getTodayDateKey();
      const logs = getStoredMoodLogs();

      if (logs[todayKey]) {
        reject(new Error('Anda sudah mengisi catatan mood untuk hari ini! Setiap hari hanya dapat diisi 1 kali.'));
        return;
      }

      const moodConfigMap = {
        'Sangat Baik': { type: 'Bahagia', color: '#fef3c7', icon: '🌟' },
        'Tenang': { type: 'Tenang', color: '#e0f2fe', icon: '🪻' },
        'Biasa': { type: 'Biasa', color: '#f1f5f9', icon: '☁️' },
        'Cemas': { type: 'Cemas', color: '#ffe4e6', icon: '🌊' },
        'Sedih': { type: 'Sedih', color: '#f3e8ff', icon: '🌧️' },
        'Lelah': { type: 'Cemas', color: '#ffe4e6', icon: '🪴' },
      };

      const config = moodConfigMap[moodData.mood] || { type: 'Tenang', color: '#e0f2fe', icon: '😊' };

      const newLog = {
        mood: moodData.mood,
        type: config.type,
        color: config.color,
        icon: config.icon,
        intensity: moodData.intensity || 4,
        factors: moodData.factors || [],
        timestamp: new Date().toISOString(),
      };

      logs[todayKey] = newLog;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      resolve({ success: true, log: newLog, message: 'Mood hari ini berhasil dicatat!' });
    }, 400);
  });
};

export const getDashboardData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          name: 'Rani Kartika',
          email: 'rani.kartika@binajiwa.id',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          status: 'Sesi Aktif',
        },
        dateInfo: {
          fullDate: 'Hari ini, Rabu 25 Oktober 2024',
          quote: 'Bernapaslah dengan tenang',
        },
        moodCheckIn: {
          currentMood: 'Tenang',
          intensityLevel: 4,
          intensityLabel: 'Nyaman & Tenang',
          factors: ['Keluarga • Rumah', 'Kualitas Tidur'],
        },
        reflection: {
          question: 'Satu hal kecil apa yang patut kamu syukuri dan hangatkan hatimu pagi ini?',
          text: '',
          maxWords: 250,
        },
        weeklyStats: {
          percentage: 78,
          label: 'Dominan Tenang',
          growthNote: 'Peningkatan ketenangan +14% dibandingkan minggu lalu setelah rutinitas nafas pagi.',
          weeklyData: [55, 60, 68, 72, 75, 78, 80],
        },
        consistency: {
          streakDays: 12,
          badgeTargetDays: 14,
          badgeName: 'Hati yang Berakar',
          progressPercent: 85,
        },
        upcomingSession: {
          doctorName: 'Nadia Pratiwi, M.Psi',
          doctorTitle: 'Psikolog Klinis Dewasa',
          doctorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
          timeSlot: 'Besok, 14:00 – 15:00 WIB',
          status: 'Terkonfirmasi',
        },
      });
    }, 400);
  });
};

export const saveMoodCheckIn = async (moodData) => {
  return saveTodayMoodLog(moodData);
};

export const saveReflection = async (text) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Refleksi harian berhasil disimpan!' });
    }, 500);
  });
};
