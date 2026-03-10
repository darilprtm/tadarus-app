import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Pressable, Platform, Share } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IndonesianSurahNames } from '@/constants/SurahNames';

type Ayah = {
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    translation: string;
    surahNumber: number;
    surahNameAr: string;
};

type JuzDetail = {
    id: number;
    ayahs: Ayah[];
};

const DEFAULT_FONT_SIZE = 28;

export default function JuzDetailScreen() {
    const { id, ayah } = useLocalSearchParams(); // Access the ?ayah parameter for auto-scrolling
    const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold });

    const [juzData, setJuzData] = useState<JuzDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeBookmark, setActiveBookmark] = useState<number | null>(null);
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const ayahLayouts = useRef<{ [key: number]: number }>({});
    const initialScrollDone = useRef(false);

    useEffect(() => {
        loadPreferences();
        fetchJuzDetail();
    }, [id]);

    const loadPreferences = async () => {
        try {
            const storedFontSize = await AsyncStorage.getItem('@quran_font_size');
            if (storedFontSize) setFontSize(Number(storedFontSize));

            const storedBookmark = await AsyncStorage.getItem('@bookmark_juz');
            if (storedBookmark) {
                const parsed = JSON.parse(storedBookmark);
                if (parsed.id === id) setActiveBookmark(parsed.globalAyahNumber);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchJuzDetail = async () => {
        try {
            const dbKey = `@juz_${id}_full`;
            const cached = await AsyncStorage.getItem(dbKey);
            if (cached) {
                setJuzData(JSON.parse(cached));
                setLoading(false);
                return;
            }

            const resAr = await fetch(`https://api.alquran.cloud/v1/juz/${id}/quran-uthmani`);
            const resId = await fetch(`https://api.alquran.cloud/v1/juz/${id}/id.indonesian`);

            const jsonAr = await resAr.json();
            const jsonId = await resId.json();

            if (jsonAr.code === 200 && jsonId.code === 200) {
                const dataAr = jsonAr.data;
                const dataId = jsonId.data;

                const mergedAyahs = dataAr.ayahs.map((a: any, index: number) => ({
                    number: a.number, // Global Ayah Number (1-6236)
                    text: a.text,
                    numberInSurah: a.numberInSurah,
                    juz: a.juz,
                    translation: dataId.ayahs[index].text,
                    surahNumber: a.surah.number,
                    surahNameAr: a.surah.name
                }));

                const finalData = {
                    id: Number(id),
                    ayahs: mergedAyahs
                };

                setJuzData(finalData);
                await AsyncStorage.setItem(dbKey, JSON.stringify(finalData));
            }
        } catch (e) {
            console.warn("Error fetching juz details", e);
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll logic if `?ayah=x` is present in URL
    const handleScrollToAyah = () => {
        if (juzData && ayah && !initialScrollDone.current) {
            const targetAyah = Number(ayah);
            const targetY = ayahLayouts.current[targetAyah];

            if (targetY !== undefined && scrollViewRef.current) {
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: targetY - 120, animated: true });
                }, 300); // Slight delay ensures layout rendering is totally finished
                initialScrollDone.current = true;
            }
        }
    };

    const toggleBookmark = async (globalAyahNumber: number, surahNumber: number, numberInSurah: number) => {
        try {
            if (activeBookmark === globalAyahNumber) {
                setActiveBookmark(null);
                await AsyncStorage.removeItem('@bookmark_juz');
            } else {
                setActiveBookmark(globalAyahNumber);
                const IndoName = IndonesianSurahNames[surahNumber - 1];
                const bookmarkObj = {
                    id: id,
                    name: `Juz ${id}`,
                    ayahNumber: numberInSurah, // Displayed on dashboard
                    globalAyahNumber: globalAyahNumber, // Used for state tracking here
                    linkInfo: `/quran/juz/${id}?ayah=${globalAyahNumber}`
                };
                await AsyncStorage.setItem('@bookmark_juz', JSON.stringify(bookmarkObj));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleShare = async (ayah: Ayah) => {
        try {
            const IndoName = IndonesianSurahNames[ayah.surahNumber - 1];
            await Share.share({
                message: `${ayah.text}\n\n"${ayah.translation}"\n\n(QS. ${IndoName} Ayat ${ayah.numberInSurah})`
            });
        } catch (error) {
            console.log(error);
        }
    };

    const changeFontSize = async (delta: number) => {
        const newSize = Math.max(20, Math.min(60, fontSize + delta)); // Clamp between 20 and 60
        setFontSize(newSize);
        await AsyncStorage.setItem('@quran_font_size', newSize.toString());
    };

    if (!fontsLoaded || loading || !juzData) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#0369a1" />
            </View>
        );
    }

    let currentSurahTracker = 0;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Massive Gradient Header */}
                <LinearGradient
                    colors={['#0369a1', '#075985', '#082f49']}
                    style={[styles.massiveHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[styles.decorativeCircle, { top: -20, right: -40 }]} />
                    <Ionicons name="albums" size={160} color="rgba(255,255,255,0.05)" style={styles.heroWatermark} />

                    <View style={styles.headerTop}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" />
                        </Pressable>
                        <View style={styles.headerRightControls}>
                            <View style={styles.juzBadge}>
                                <Text style={styles.juzBadgeText}>Juz {id}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.headlineTitle}>Juz {id}</Text>
                        <Text style={styles.subtitle}>Membaca keseluruhan Juz {id}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.contentArea}>
                    {juzData.ayahs.map((ayah) => {
                        const isBookmarked = activeBookmark === ayah.number;
                        let showSurahHeader = false;

                        if (ayah.surahNumber !== currentSurahTracker) {
                            showSurahHeader = true;
                            currentSurahTracker = ayah.surahNumber;
                        }

                        const IndoName = IndonesianSurahNames[ayah.surahNumber - 1];

                        // Clean Bismillah out of the first Ayah in database if it exists inline
                        let cleanArabic = ayah.text;
                        if (ayah.numberInSurah === 1 && ayah.surahNumber !== 1) {
                            cleanArabic = cleanArabic.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
                        }

                        return (
                            <View key={ayah.number} onLayout={(e) => {
                                ayahLayouts.current[ayah.number] = e.nativeEvent.layout.y;
                                if (Object.keys(ayahLayouts.current).length === juzData.ayahs.length) {
                                    handleScrollToAyah();
                                }
                            }}>
                                {showSurahHeader && (
                                    <View style={styles.surahDivider}>
                                        <Text style={styles.surahDividerNameAr}>{ayah.surahNameAr.replace('سُورَةُ ', '')}</Text>
                                        <Text style={styles.surahDividerNameId}>{IndoName}</Text>
                                        {ayah.surahNumber !== 1 && ayah.surahNumber !== 9 && (
                                            <View style={styles.bismillahContainer}>
                                                <Text style={styles.bismillahText}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                <View style={[styles.ayahCard, isBookmarked && styles.ayahCardBookmarked]}>
                                    <View style={styles.ayahHeader}>
                                        <View style={[styles.ayahBadge, isBookmarked && { backgroundColor: '#0ea5e9' }]}>
                                            <Text style={[styles.ayahBadgeText, isBookmarked && { color: '#ffffff' }]}>{ayah.numberInSurah}</Text>
                                        </View>
                                        <View style={styles.actionRow}>
                                            <Pressable style={styles.iconButton} onPress={() => handleShare(ayah)}>
                                                <Ionicons name="share-social-outline" size={20} color="#0284c7" />
                                            </Pressable>
                                            <Pressable style={styles.iconButton} onPress={() => toggleBookmark(ayah.number, ayah.surahNumber, ayah.numberInSurah)}>
                                                <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={22} color="#0284c7" />
                                            </Pressable>
                                        </View>
                                    </View>

                                    {/* DYNAMIC FONT SIZING APPLIED HERE */}
                                    <Text style={[styles.ayahArabic, { fontSize: fontSize, lineHeight: fontSize * 2.1 }]}>
                                        {cleanArabic}
                                    </Text>

                                    <Text style={styles.ayahTranslation}>{ayah.translation}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Floating Font Controller */}
            <View style={[styles.floatingFontControls, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <Pressable onPress={() => changeFontSize(-2)} style={({ pressed }) => [styles.fontBtn, pressed && styles.fontBtnPressed]}>
                    <Text style={styles.fontBtnTextSmall}>A-</Text>
                </Pressable>
                <View style={styles.fontDivider} />
                <Pressable onPress={() => changeFontSize(2)} style={({ pressed }) => [styles.fontBtn, pressed && { opacity: 0.7 }]}>
                    <Text style={styles.fontBtnTextLarge}>A+</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
    scrollContent: { minHeight: '100%', paddingBottom: 100 },

    massiveHeader: { width: '100%', paddingBottom: 80, overflow: 'hidden' },
    decorativeCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)' },
    heroWatermark: { position: 'absolute', left: -40, top: 20, transform: [{ rotate: '15deg' }] },

    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

    headerRightControls: { flexDirection: 'row', gap: 12 },
    juzBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 },
    juzBadgeText: { color: '#ffffff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

    headerContent: { alignItems: 'center', paddingHorizontal: 28 },
    headlineTitle: { fontSize: 40, fontWeight: '900', color: '#ffffff', letterSpacing: -1.2, marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#bae6fd', fontWeight: '500' },

    contentArea: {
        flex: 1, backgroundColor: '#f8fafc', marginTop: -32,
        borderTopLeftRadius: 36, borderTopRightRadius: 36,
        paddingHorizontal: 16, paddingTop: 32, paddingBottom: 60
    },

    surahDivider: { alignItems: 'center', marginVertical: 32, paddingHorizontal: 20 },
    surahDividerNameAr: { fontSize: 36, color: '#0369a1', fontFamily: 'Amiri_700Bold', marginBottom: 4 },
    surahDividerNameId: { fontSize: 16, fontWeight: '800', color: '#0ea5e9', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 },

    bismillahContainer: { paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#f0f9ff', borderRadius: 20, borderWidth: 1, borderColor: '#e0f2fe' },
    bismillahText: { fontSize: 24, color: '#0369a1', fontFamily: 'Amiri_400Regular' },

    ayahCard: {
        backgroundColor: '#ffffff', padding: 20, borderRadius: 24, marginBottom: 16,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, shadowOffset: { width: 0, height: 6 }
    },
    ayahCardBookmarked: { borderColor: '#7dd3fc', backgroundColor: '#f0f9ff', borderWidth: 2 },

    ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    ayahBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    ayahBadgeText: { fontSize: 14, fontWeight: '800', color: '#0284c7' },

    actionRow: { flexDirection: 'row', gap: 12 },
    iconButton: { padding: 4 },

    ayahArabic: { color: '#0f172a', textAlign: 'right', marginBottom: 24, fontFamily: 'Amiri_700Bold' },
    ayahTranslation: { fontSize: 15, color: '#475569', lineHeight: 26, fontWeight: '500' },

    // FLOATING FONT CONTOLLS
    floatingFontControls: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1, borderTopColor: '#f1f5f9',
        paddingTop: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 15
    },
    fontBtn: { paddingHorizontal: 32, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    fontBtnPressed: { opacity: 0.5 },
    fontBtnTextSmall: { fontSize: 16, fontWeight: '800', color: '#64748b' },
    fontBtnTextLarge: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
    fontDivider: { width: 2, height: 24, backgroundColor: '#e2e8f0', borderRadius: 2 }
});
