import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type HijriDate = {
    day: string;
    monthEn: string;
    monthAr: string;
    year: string;
    designation: string;
};

const IMPORTANT_DATES = [
    { title: "Tahun Baru Islam", moonPhase: "moon-outline", date: "1 Muharram" },
    { title: "Puasa Tasu'a & Asyura", moonPhase: "water-outline", date: "9-10 Muharram" },
    { title: "Maulid Nabi Muhammad SAW", moonPhase: "star-outline", date: "12 Rabiul Awal" },
    { title: "Mulai Puasa Ramadhan", moonPhase: "restaurant-outline", date: "1 Ramadhan" },
    { title: "Nuzulul Quran", moonPhase: "book-outline", date: "17 Ramadhan" },
    { title: "Hari Raya Idul Fitri", moonPhase: "heart-outline", date: "1 Syawal" },
    { title: "Hari Raya Idul Adha", moonPhase: "gift-outline", date: "10 Dzulhijjah" }
];

export default function HijriyahScreen() {
    const insets = useSafeAreaInsets();
    const [hijri, setHijri] = useState<HijriDate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHijriDate();
    }, []);

    const fetchHijriDate = async () => {
        try {
            const today = new Date();
            const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
            const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${formattedDate}`);
            const data = await response.json();

            if (data.code === 200) {
                setHijri({
                    day: data.data.hijri.day,
                    monthEn: data.data.hijri.month.en,
                    monthAr: data.data.hijri.month.ar,
                    year: data.data.hijri.year,
                    designation: data.data.hijri.designation.abbreviated
                });
            }
        } catch (e) {
            console.error("Failed fetching Hijri date", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Massive Header */}
                <LinearGradient
                    colors={['#4338ca', '#3730a3', '#312e81']}
                    style={[styles.massiveHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
                >
                    <View style={[styles.decorativeCircle, { top: -20, right: -40 }]} />
                    <Ionicons name="calendar" size={160} color="rgba(255,255,255,0.05)" style={styles.heroWatermark} />

                    <View style={styles.headerTop}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" />
                        </Pressable>
                    </View>

                    <View style={styles.headerContent}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#ffffff" style={{ marginVertical: 40 }} />
                        ) : hijri ? (
                            <>
                                <View style={styles.badgeRow}>
                                    <View style={styles.badge}><Text style={styles.badgeText}>HARI INI</Text></View>
                                </View>
                                <Text style={styles.bigDay}>{hijri.day}</Text>
                                <Text style={styles.bigMonth}>{hijri.monthEn}</Text>
                                <Text style={styles.subtextYear}>{hijri.year} {hijri.designation} • {hijri.monthAr}</Text>
                            </>
                        ) : (
                            <Text style={styles.errorText}>Gagal memuat tanggal Hijriah</Text>
                        )}
                    </View>
                </LinearGradient>

                <View style={styles.contentArea}>
                    <Text style={styles.sectionTitle}>Hari Besar Islam</Text>

                    {IMPORTANT_DATES.map((item, index) => (
                        <View key={index} style={styles.dateCard}>
                            <View style={styles.cardLeft}>
                                <View style={styles.iconBox}>
                                    <Ionicons name={item.moonPhase as any} size={20} color="#4f46e5" />
                                </View>
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.cardSubtitle}>Penanggalan Hijriah</Text>
                                </View>
                            </View>
                            <View style={styles.pillDate}>
                                <Text style={styles.pillText}>{item.date}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { paddingBottom: 40 },

    massiveHeader: { width: '100%', paddingBottom: 80, overflow: 'hidden' },
    decorativeCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroWatermark: { position: 'absolute', left: -40, top: 20, transform: [{ rotate: '15deg' }] },

    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

    headerContent: { alignItems: 'center', paddingHorizontal: 28 },
    badgeRow: { marginBottom: 16 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99 },
    badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

    bigDay: { fontSize: 80, fontWeight: '900', color: '#ffffff', letterSpacing: -3, lineHeight: 84 },
    bigMonth: { fontSize: 32, fontWeight: '800', color: '#e0e7ff', letterSpacing: -1, marginBottom: 8 },
    subtextYear: { fontSize: 18, color: '#a5b4fc', fontWeight: '600' },
    errorText: { color: '#ffffff', fontSize: 16, marginVertical: 40 },

    contentArea: {
        flex: 1, backgroundColor: '#f8fafc', marginTop: -40,
        borderTopLeftRadius: 36, borderTopRightRadius: 36,
        paddingHorizontal: 24, paddingTop: 32,
    },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 20, letterSpacing: -0.5 },

    dateCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#ffffff', padding: 20, borderRadius: 24, marginBottom: 16,
        borderWidth: 1, borderColor: '#eef2ff',
        shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, shadowOffset: { width: 0, height: 6 }
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
    cardSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500' },

    pillDate: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
    pillText: { color: '#4f46e5', fontSize: 12, fontWeight: '800' }
});
