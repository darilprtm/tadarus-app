import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Location from 'expo-location';

type PrayerTimes = {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
};

export default function SholatScreen() {
    const [times, setTimes] = useState<PrayerTimes | null>(null);
    const [targetCity, setTargetCity] = useState('Mencari lokasi...');
    const [isLoading, setIsLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState('');

    const insets = useSafeAreaInsets();
    const router = useRouter();

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorStatus('Izin akses lokasi ditolak.');
                setIsLoading(false);
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                const lat = location.coords.latitude;
                const lon = location.coords.longitude;

                const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
                if (reverseGeocode.length > 0) {
                    setTargetCity(reverseGeocode[0].city || reverseGeocode[0].subregion || 'Lokasi Ditemukan');
                }

                const date = new Date();
                const year = date.getFullYear();
                const month = date.getMonth() + 1;

                // Fetch Al-Adhan API (Method 11 = Kemenag RI, or Method 5 = Egyptian Standard, using 11 for ID)
                const response = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${lat}&longitude=${lon}&method=11`);
                const data = await response.json();

                if (data.code === 200) {
                    setTimes(data.data.timings);
                } else {
                    setErrorStatus('Gagal memuat jadwal dari server.');
                }
            } catch (e) {
                setErrorStatus('Tidak ada koneksi internet / GPS lemah.');
            }
            setIsLoading(false);
        })();
    }, []);

    const getUpcomingPrayer = () => {
        if (!times) return null;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const schedule = [
            { name: 'Subuh', time: times.Fajr },
            { name: 'Dzuhur', time: times.Dhuhr },
            { name: 'Ashar', time: times.Asr },
            { name: 'Maghrib', time: times.Maghrib },
            { name: 'Isya', time: times.Isha }
        ];

        for (let s of schedule) {
            const [h, m] = s.time.split(':').map(Number);
            if ((h * 60 + m) > currentMinutes) return s.name;
        }
        return 'Subuh'; // Next day
    };

    const upcomingPrayer = getUpcomingPrayer();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Massive Overlapping Header */}
                <LinearGradient
                    colors={['#10b981', '#059669', '#047857']}
                    style={[styles.massiveHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
                >
                    <View style={[styles.decorativeCircle, { top: -20, right: -40 }]} />
                    <Ionicons name="time" size={160} color="rgba(255,255,255,0.05)" style={styles.heroWatermark} />

                    <View style={styles.headerTop}>
                        <View style={styles.backButtonContainer} onTouchEnd={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" style={styles.backButtonIcon} />
                        </View>
                        <View style={styles.locationPill}>
                            <Ionicons name="location" color="#ccfbf1" size={14} />
                            <Text style={styles.locationText}>{targetCity}</Text>
                        </View>
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.headline}>Waktu Sholat</Text>
                        <Text style={styles.subtitle}>Jadwal berdasarkan koordinat Anda</Text>
                    </View>

                    <View style={styles.dateBlock}>
                        <View style={styles.dateGlass}>
                            <Ionicons name="calendar" size={16} color="#ffffff" />
                            <Text style={styles.dateText}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.contentArea}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 60 }} />
                    ) : errorStatus ? (
                        <Text style={styles.errorText}>{errorStatus}</Text>
                    ) : times ? (
                        <View style={styles.scheduleGrid}>

                            <PrayerRow label="Imsak" time={times.Imsak} isNext={false} icon="moon-outline" />
                            <PrayerRow label="Subuh" time={times.Fajr} isNext={upcomingPrayer === 'Subuh'} icon="cloudy-night-outline" />
                            <PrayerRow label="Terbit" time={times.Sunrise} isNext={false} icon="sunny-outline" />
                            <PrayerRow label="Dzuhur" time={times.Dhuhr} isNext={upcomingPrayer === 'Dzuhur'} icon="sunny" />
                            <PrayerRow label="Ashar" time={times.Asr} isNext={upcomingPrayer === 'Ashar'} icon="partly-sunny-outline" />
                            <PrayerRow label="Maghrib" time={times.Maghrib} isNext={upcomingPrayer === 'Maghrib'} icon="partly-sunny" />
                            <PrayerRow label="Isya" time={times.Isha} isNext={upcomingPrayer === 'Isya'} icon="star-outline" />

                        </View>
                    ) : null}
                </View>

            </ScrollView>
        </View>
    );
}

function PrayerRow({ label, time, isNext, icon }: { label: string, time: string, isNext: boolean, icon: any }) {
    // Bold formatting for standard 5 prayers + highlight upcoming
    const isPrimary = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].includes(label);

    return (
        <View style={[styles.prayerRow, isNext && styles.prayerRowActive]}>
            <View style={styles.prayerLeft}>
                <View style={[styles.iconBox, isNext && styles.iconBoxActive]}>
                    <Ionicons name={icon} size={20} color={isNext ? '#ffffff' : '#94a3b8'} />
                </View>
                <Text style={[styles.prayerLabel, isPrimary && styles.prayerLabelBold, isNext && styles.prayerLabelActive]}>{label}</Text>
            </View>
            <View style={styles.prayerRight}>
                {isNext && <View style={styles.nextBadge}><Text style={styles.nextBadgeText}>BERIKUTNYA</Text></View>}
                <Text style={[styles.prayerTime, isPrimary && styles.prayerTimeBold, isNext && styles.prayerTimeActive]}>{time}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { minHeight: '100%', paddingBottom: 60 },

    massiveHeader: { width: '100%', paddingBottom: 80, overflow: 'hidden' },
    decorativeCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroWatermark: { position: 'absolute', right: -20, top: 40, transform: [{ rotate: '-15deg' }] },

    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    backButtonContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    backButtonIcon: { marginLeft: -2 }, // optical alignment

    locationPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, gap: 6 },
    locationText: { color: '#ffffff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

    headerContent: { paddingHorizontal: 28 },
    headline: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: -1 },
    subtitle: { fontSize: 15, color: '#d1fae5', fontWeight: '500', marginTop: 4 },

    dateBlock: { paddingHorizontal: 28, marginTop: 20 },
    dateGlass: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    dateText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

    contentArea: {
        flex: 1, backgroundColor: '#f8fafc', marginTop: -40,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 20, paddingTop: 32,
    },

    errorText: { color: '#ef4444', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 60 },

    scheduleGrid: {
        backgroundColor: '#ffffff', borderRadius: 32, paddingVertical: 12, paddingHorizontal: 16,
        shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, shadowOffset: { width: 0, height: 8 },
        borderWidth: 1, borderColor: '#e2e8f0',
    },

    prayerRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 12,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    prayerRowActive: {
        backgroundColor: '#ecfdf5', borderRadius: 20, borderBottomWidth: 0,
        marginTop: 8, marginBottom: 8, paddingVertical: 20
    },

    prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    iconBoxActive: { backgroundColor: '#10b981' },

    prayerLabel: { fontSize: 17, color: '#64748b', fontWeight: '500' },
    prayerLabelBold: { color: '#0f172a', fontWeight: '700' },
    prayerLabelActive: { color: '#047857', fontWeight: '900', fontSize: 20 },

    prayerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    nextBadge: { backgroundColor: '#34d399', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    nextBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

    prayerTime: { fontSize: 18, color: '#64748b', fontWeight: '500', minWidth: 50, textAlign: 'right' },
    prayerTimeBold: { color: '#0f172a', fontWeight: '800' },
    prayerTimeActive: { color: '#047857', fontWeight: '900', fontSize: 22 },
});
