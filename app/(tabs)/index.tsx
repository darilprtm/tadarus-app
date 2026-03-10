import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type BookmarkData = {
  id: string | number;
  name: string;
  ayahNumber: number;
  linkInfo: string;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [surahBookmark, setSurahBookmark] = useState<BookmarkData | null>(null);
  const [juzBookmark, setJuzBookmark] = useState<BookmarkData | null>(null);
  const [locationName, setLocationName] = useState('Mencari Lokasi...');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  const [nextPrayerName, setNextPrayerName] = useState('Memuat...');
  const [nextPrayerTime, setNextPrayerTime] = useState('--:--');
  const [countdownText, setCountdownText] = useState('MENGHITUNG...');
  const [timings, setTimings] = useState<{ [key: string]: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('@bookmark_surat').then(str => {
        if (str) setSurahBookmark(JSON.parse(str));
      });
      AsyncStorage.getItem('@bookmark_juz').then(str => {
        if (str) setJuzBookmark(JSON.parse(str));
      });
    }, [])
  );

  const requestLocation = async () => {
    try {
      setLocationName('Mencari Lokasi...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Ketuk - Aktifkan Lokasi');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const detectedCity = geocode[0].subregion || geocode[0].city || 'Jakarta Selatan';
        setLocationName(detectedCity);
        fetchTimings(location.coords.latitude, location.coords.longitude);
      } else {
        setLocationName('Jakarta Selatan'); // Fallback
        fetchTimings(-6.2615, 106.8106); // Default Jakarta
      }
    } catch (error) {
      setLocationName('Lokasi Gagal - Ketuk Ulang'); // Fallback on network error
      fetchTimings(-6.2615, 106.8106);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const fetchTimings = async (lat: number, lng: number) => {
    try {
      const dbKey = `@adzan_${lat.toFixed(1)}_${lng.toFixed(1)}`;
      const cached = await AsyncStorage.getItem(dbKey);

      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
      const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=20`);
      const json = await res.json();
      if (json.code === 200) {
        setTimings(json.data.timings);
        await AsyncStorage.setItem(dbKey, JSON.stringify(json.data.timings));
      } else if (cached) {
        setTimings(JSON.parse(cached));
      }
    } catch (e) {
      const dbKey = `@adzan_${lat.toFixed(1)}_${lng.toFixed(1)}`;
      const cached = await AsyncStorage.getItem(dbKey);
      if (cached) setTimings(JSON.parse(cached));
    }
  };

  useEffect(() => {
    if (!timings) return;

    const calculateNextPrayer = () => {
      const now = new Date();
      const prayerMap: Record<string, string> = { Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya' };
      let upcoming = null;
      let minDiff = Infinity;

      for (const [key, name] of Object.entries(prayerMap)) {
        const timeStr = timings[key];
        if (!timeStr) continue;
        const [hours, mins] = timeStr.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(hours, mins, 0, 0);

        const diffMs = prayerDate.getTime() - now.getTime();
        if (diffMs > 0 && diffMs < minDiff) {
          minDiff = diffMs;
          upcoming = { name, time: timeStr, diffMs };
        }
      }

      if (!upcoming) {
        const fajrStr = timings['Fajr'];
        if (fajrStr) {
          const [hours, mins] = fajrStr.split(':').map(Number);
          const tomorrowFajr = new Date();
          tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
          tomorrowFajr.setHours(hours, mins, 0, 0);
          const diffMs = tomorrowFajr.getTime() - now.getTime();
          upcoming = { name: 'Subuh', time: fajrStr, diffMs };
        }
      }

      if (upcoming) {
        setNextPrayerName(upcoming.name);
        setNextPrayerTime(upcoming.time);

        const diff = upcoming.diffMs;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (h > 0) setCountdownText(`- ${h} JAM ${m} MNT ${s} DTK`);
        else setCountdownText(`- ${m} MNT ${s} DTK`);
      }
    };

    const interval = setInterval(calculateNextPrayer, 1000);
    calculateNextPrayer(); // hit now

    return () => clearInterval(interval);
  }, [timings]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Massive Overlapping Header */}
        <LinearGradient
          colors={['#0f766e', '#115e59', '#134e4a']}
          style={[styles.massiveHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.decorativeCircle, { top: -60, left: -60, backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[styles.decorativeCircle, { bottom: -100, left: 100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.03)' }]} />
          <Ionicons name="moon" size={200} color="rgba(255,255,255,0.04)" style={styles.heroWatermark} />

          <View style={styles.headerTop}>
            <Link href={user ? "/profile" : "/login"} asChild>
              <Pressable style={styles.profileBadge}>
                <View style={styles.profileGlass}>
                  <Ionicons name="person" size={20} color="#0f766e" />
                </View>
                <View style={styles.profileTextCol}>
                  <Text style={styles.greetingText}>Assalamu'alaikum,</Text>
                  <Text style={styles.nameText} numberOfLines={1}>{user?.displayName || 'Hamba Allah'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </Link>
          </View>

          {/* Integrated Adzan Dashboard */}
          <View style={styles.adzanIntegrated}>
            <View style={styles.adzanRowTop}>
              <Pressable onPress={requestLocation} style={styles.locationPill}>
                <Ionicons name="location" color="#ccfbf1" size={16} />
                <Text style={styles.locationText}>{locationName}</Text>
              </Pressable>
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>{nextPrayerName}</Text>
              </View>
            </View>

            <View style={styles.adzanRowBottom}>
              <Text style={styles.heroTime}>{nextPrayerTime}</Text>
              <View style={styles.heroCountdownPill}>
                <Text style={styles.heroCountdownText}>{countdownText}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentArea}>

          {/* Master 8-Grid Menu Wrapped in a Card - Icons scaled down for precision */}
          <View style={styles.masterMenuCard}>

            {/* Row 1 */}
            <View style={styles.menuRow}>
              <Link href="/quran" asChild>
                <Pressable style={({ pressed }) => [styles.actionItem, pressed && styles.pressedState]}>
                  <View style={[styles.actionCircle, { backgroundColor: '#f0f9ff' }]}><Ionicons name="book-outline" size={22} color="#0284c7" /></View>
                  <Text style={styles.actionText}>Al-Quran</Text>
                </Pressable>
              </Link>

              <Link href="/sholat" asChild>
                <Pressable style={({ pressed }) => [styles.actionItem, pressed && styles.pressedState]}>
                  <View style={[styles.actionCircle, { backgroundColor: '#ecfdf5' }]}><Ionicons name="time-outline" size={22} color="#10b981" /></View>
                  <Text style={styles.actionText}>Sholat</Text>
                </Pressable>
              </Link>

              <Link href="/qibla" asChild>
                <Pressable style={({ pressed }) => [styles.actionItem, pressed && styles.pressedState]}>
                  <View style={[styles.actionCircle, { backgroundColor: '#fff7ed' }]}><Ionicons name="compass-outline" size={22} color="#ea580c" /></View>
                  <Text style={styles.actionText}>Kiblat</Text>
                </Pressable>
              </Link>

              <Link href="/tasbih" asChild>
                <Pressable style={({ pressed }) => [styles.actionItem, pressed && styles.pressedState]}>
                  <View style={[styles.actionCircle, { backgroundColor: '#faf5ff' }]}><Ionicons name="color-filter-outline" size={22} color="#9333ea" /></View>
                  <Text style={styles.actionText}>Tasbih</Text>
                </Pressable>
              </Link>
            </View>

            <View style={{ height: 20 }} />

            {/* Row 2 */}
            <View style={styles.menuRow}>
              <Link href="/doa" asChild>
                <Pressable style={({ pressed }) => [styles.actionItem, pressed && styles.pressedState]}>
                  <View style={[styles.actionCircle, { backgroundColor: '#fdf4ff' }]}><Ionicons name="moon-outline" size={22} color="#c026d3" /></View>
                  <Text style={styles.actionText}>Doa Harian</Text>
                </Pressable>
              </Link>

              <Link href="/zikir" asChild>
                <Pressable style={({ pressed }) => [styles.actionItem, pressed && styles.pressedState]}>
                  <View style={[styles.actionCircle, { backgroundColor: '#eef2ff' }]}><Ionicons name="rose-outline" size={22} color="#4f46e5" /></View>
                  <Text style={styles.actionText}>Zikir</Text>
                </Pressable>
              </Link>

              <Link href="/tracker" asChild>
                <Pressable style={({ pressed }) => [styles.actionItem, pressed && styles.pressedState]}>
                  <View style={[styles.actionCircle, { backgroundColor: '#f0fdf4' }]}><Ionicons name="checkmark-circle-outline" size={22} color="#16a34a" /></View>
                  <Text style={styles.actionText}>Tracker</Text>
                </Pressable>
              </Link>

              <Link href="/quiz" asChild>
                <Pressable style={({ pressed }) => [styles.actionItem, pressed && styles.pressedState]}>
                  <View style={[styles.actionCircle, { backgroundColor: '#fff1f2' }]}><Ionicons name="help-circle-outline" size={22} color="#e11d48" /></View>
                  <Text style={styles.actionText}>Quiz</Text>
                </Pressable>
              </Link>
            </View>

          </View>

          <Text style={styles.sectionTitle}>Terakhir Dibaca</Text>

          {/* Surat Bookmark Banner */}
          <View style={styles.bottomMargin}>
            <Link href={surahBookmark ? (surahBookmark.linkInfo as any) : "/quran"} asChild>
              <Pressable style={({ pressed }) => [styles.continueBanner, pressed && styles.pressedState]}>
                <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.bannerGradient}>
                  <Ionicons name="book" size={120} color="rgba(255,255,255,0.03)" style={styles.bannerWatermark} />
                  <View style={styles.bannerHeader}>
                    <View style={[styles.bookmarkPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                      <Ionicons name={surahBookmark ? "bookmark" : "book"} size={12} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.bookmarkText}>{surahBookmark ? 'MELANJUTKAN SURAT' : 'MULAI MEMBACA SURAT'}</Text>
                    </View>
                  </View>
                  <View style={styles.bannerContentRow}>
                    <View style={styles.bannerTextBlock}>
                      <Text style={styles.bannerTitle}>{surahBookmark ? surahBookmark.name : "Al-Quran"}</Text>
                      <Text style={styles.bannerSubtitle}>{surahBookmark ? `Ayat ${surahBookmark.ayahNumber}` : "Buka daftar Surat"}</Text>
                    </View>
                    <View style={styles.playButton}>
                      <Ionicons name="arrow-forward" size={20} color="#0f172a" />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Link>
          </View>

          {/* Juz Bookmark Banner */}
          <View style={styles.bottomMargin}>
            <Link href={juzBookmark ? (juzBookmark.linkInfo as any) : "/quran"} asChild>
              <Pressable style={({ pressed }) => [styles.continueBanner, pressed && styles.pressedState]}>
                <LinearGradient colors={['#0c4a6e', '#0369a1']} style={[styles.bannerGradient, { paddingTop: 20, paddingBottom: 20 }]}>
                  <Ionicons name="albums" size={100} color="rgba(255,255,255,0.04)" style={styles.bannerWatermark} />
                  <View style={styles.bannerHeader}>
                    <View style={[styles.bookmarkPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Ionicons name={juzBookmark ? "bookmark" : "albums"} size={12} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.bookmarkText}>{juzBookmark ? 'MELANJUTKAN JUZ' : 'MULAI MEMBACA JUZ'}</Text>
                    </View>
                  </View>
                  <View style={styles.bannerContentRow}>
                    <View style={styles.bannerTextBlock}>
                      <Text style={styles.bannerTitle}>{juzBookmark ? juzBookmark.name : "Juz Al-Quran"}</Text>
                      <Text style={styles.bannerSubtitle}>{juzBookmark ? `Berhenti di Ayat ${juzBookmark.ayahNumber}` : "Buka daftar Juz"}</Text>
                    </View>
                    <View style={styles.playButtonMini}>
                      <Ionicons name="arrow-forward" size={16} color="#0c4a6e" />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Link>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 16 },

  massiveHeader: { width: '100%', paddingBottom: 110, overflow: 'hidden' }, // Adjusted depth
  decorativeCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroWatermark: { position: 'absolute', right: -30, top: 10, transform: [{ rotate: '-10deg' }] },

  headerTop: { paddingHorizontal: 24, paddingTop: 16 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, paddingRight: 16, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  profileGlass: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  profileTextCol: { flex: 1, marginLeft: 14 },
  greetingText: { fontSize: 13, color: '#ccfbf1', fontWeight: '600' },
  nameText: { fontSize: 20, color: '#ffffff', fontWeight: '800', letterSpacing: -0.5 },

  adzanIntegrated: { paddingHorizontal: 28, marginTop: 40, marginBottom: 16 },
  adzanRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  locationPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, gap: 6 },
  locationText: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  timePill: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
  timePillText: { color: '#34d399', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  adzanRowBottom: { flexDirection: 'column', alignItems: 'flex-start', marginTop: 8 },
  heroTime: { color: '#ffffff', fontSize: 68, fontWeight: '900', letterSpacing: -3, lineHeight: 72 },
  heroCountdownPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, marginTop: 4 },
  heroCountdownText: { color: '#ccfbf1', fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  contentArea: {
    flex: 1, backgroundColor: '#f8fafc', marginTop: -60, // Adjusted overlap
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingHorizontal: 20, paddingTop: 0,
  },

  // PRECISE MASTER MENU CARD
  masterMenuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    paddingVertical: 24,
    paddingHorizontal: 28,
    marginTop: -30,
    marginBottom: 28,
    shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 20, elevation: 8, shadowOffset: { width: 0, height: 8 },
  },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionItem: { alignItems: 'center', width: 62 },
  actionCircle: {
    width: 52, height: 52, borderRadius: 26, // SHRUNK SIZE
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8
  },
  actionText: { fontSize: 11, fontWeight: '700', color: '#334155', textAlign: 'center' }, // SHRUNK SIZE + CENTERED

  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 14, letterSpacing: -0.5, paddingHorizontal: 4 },

  pressedState: { transform: [{ scale: 0.96 }], opacity: 0.9 },

  // CONTINUE BANNERS
  bottomMargin: { marginBottom: 24 },
  continueBanner: { width: '100%', shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 15, elevation: 6, shadowOffset: { width: 0, height: 8 } },
  bannerGradient: { borderRadius: 28, padding: 24, overflow: 'hidden' },
  bannerWatermark: { position: 'absolute', right: -20, bottom: -10, transform: [{ rotate: '15deg' }] },
  bannerHeader: { marginBottom: 24 },
  bookmarkPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  bookmarkText: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  bannerContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bannerTextBlock: { flex: 1, paddingRight: 16 },
  bannerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  bannerSubtitle: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },

  playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  playButtonMini: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
});
