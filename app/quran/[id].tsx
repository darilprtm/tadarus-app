import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Pressable, Platform, Share, Dimensions } from 'react-native';
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
};

type SurahDetail = {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    ayahs: Ayah[];
};

const DEFAULT_FONT_SIZE = 28;

export default function SurahDetailScreen() {
    const { id, ayah } = useLocalSearchParams(); // Access the ?ayah parameter for auto-scrolling
    const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold });

    const [surah, setSurah] = useState<SurahDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeBookmark, setActiveBookmark] = useState<number | null>(null);
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const ayahLayouts = useRef<{ [key: number]: number }>({});
    const initialScrollDone = useRef(false);

    useEffect(() => {
        loadPreferences();
        fetchSurahDetail();
    }, [id]);

    const loadPreferences = async () => {
        try {
            const storedFontSize = await AsyncStorage.getItem('@quran_font_size');
            if (storedFontSize) setFontSize(Number(storedFontSize));

            const storedBookmark = await AsyncStorage.getItem('@bookmark_surat');
            if (storedBookmark) {
                const parsed = JSON.parse(storedBookmark);
                if (parsed.id === id) setActiveBookmark(parsed.ayahNumber);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSurahDetail = async () => {
        try {
            const dbKey = `@surah_${id}_full`;
            const cached = await AsyncStorage.getItem(dbKey);
            if (cached) {
                setSurah(JSON.parse(cached));
                setLoading(false);
                return;
            }

            const resAr = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
            const resId = await fetch(`https://api.alquran.cloud/v1/surah/${id}/id.indonesian`);

            const jsonAr = await resAr.json();
            const jsonId = await resId.json();

            if (jsonAr.code === 200 && jsonId.code === 200) {
                const dataAr = jsonAr.data;
                const dataId = jsonId.data;

                const mergedAyahs = dataAr.ayahs.map((ayah: any, index: number) => ({
                    number: ayah.number,
                    text: ayah.text,
                    numberInSurah: ayah.numberInSurah,
                    juz: ayah.juz,
                    translation: dataId.ayahs[index].text
                }));

                const finalData = {
                    number: dataAr.number,
                    name: dataAr.name,
                    englishName: dataAr.englishName,
                    englishNameTranslation: dataAr.englishNameTranslation,
                    revelationType: dataAr.revelationType,
                    numberOfAyahs: dataAr.numberOfAyahs,
                    ayahs: mergedAyahs
                };

                setSurah(finalData);
                await AsyncStorage.setItem(dbKey, JSON.stringify(finalData));
            }
        } catch (e) {
            console.warn("Error fetching surah details", e);
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll logic if `?ayah=x` is present in URL
    const handleScrollToAyah = () => {
        if (surah && ayah && !initialScrollDone.current) {
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

    const toggleBookmark = async (ayahNumber: number) => {
        try {
            if (activeBookmark === ayahNumber) {
                setActiveBookmark(null);
                await AsyncStorage.removeItem('@bookmark_surat');
            } else {
                setActiveBookmark(ayahNumber);
                const IndoName = IndonesianSurahNames[surah!.number - 1] || surah!.englishName;
                const bookmarkObj = {
                    id: id,
                    name: IndoName,
                    ayahNumber: ayahNumber,
                    linkInfo: `/quran/${id}?ayah=${ayahNumber}`
                };
                await AsyncStorage.setItem('@bookmark_surat', JSON.stringify(bookmarkObj));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleShare = async (ayah: Ayah) => {
        try {
            const IndoName = IndonesianSurahNames[surah!.number - 1] || surah!.englishName;
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

    if (!fontsLoaded || loading || !surah) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#0f766e" />
            </View>
        );
    }

    const IndoName = IndonesianSurahNames[surah.number - 1] || surah.englishName;

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
                    colors={['#0f766e', '#115e59', '#134e4a']}
                    style={[styles.massiveHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[styles.decorativeCircle, { top: -20, right: -40 }]} />
                    <Ionicons name="book" size={160} color="rgba(255,255,255,0.05)" style={styles.heroWatermark} />

                    <View style={styles.headerTop}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" />
                        </Pressable>
                        <View style={styles.headerRightControls}>
                            <View style={styles.surahBadge}>
                                <Text style={styles.surahBadgeText}>No. {surah.number}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.heroArabic}>{surah.name.replace('سُورَةُ ', '')}</Text>
                        <Text style={styles.headlineTitle}>{IndoName}</Text>

                        <View style={styles.metaRow}>
                            <View style={styles.metaPill}>
                                <Text style={styles.metaPillText}>{surah.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah'}</Text>
                            </View>
                            <View style={styles.metaPill}>
                                <Ionicons name="list" size={14} color="#ccfbf1" style={{ marginRight: 6 }} />
                                <Text style={styles.metaPillText}>{surah.numberOfAyahs} Ayat</Text>
                            </View>
                        </View>

                        {surah.number !== 1 && surah.number !== 9 && (
                            <View style={styles.bismillahContainer}>
                                <Text style={styles.bismillahText}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                <View style={styles.contentArea}>
                    {surah.ayahs.map((ayah) => {
                        const isBookmarked = activeBookmark === ayah.numberInSurah;

                        // Clean Bismillah out of the first Ayah in database if it exists inline
                        let cleanArabic = ayah.text;
                        if (ayah.numberInSurah === 1 && surah.number !== 1) {
                            cleanArabic = cleanArabic.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
                        }

                        return (
                            <View
                                key={ayah.number}
                                style={[styles.ayahCard, isBookmarked && styles.ayahCardBookmarked]}
                                onLayout={(e) => {
                                    ayahLayouts.current[ayah.numberInSurah] = e.nativeEvent.layout.y;
                                    if (Object.keys(ayahLayouts.current).length === surah.ayahs.length) {
                                        handleScrollToAyah(); // Fire jump once all ayahs calculated layout
                                    }
                                }}
                            >
                                <View style={styles.ayahHeader}>
                                    <View style={[styles.ayahBadge, isBookmarked && { backgroundColor: '#0f766e' }]}>
                                        <Text style={[styles.ayahBadgeText, isBookmarked && { color: '#ffffff' }]}>{ayah.numberInSurah}</Text>
                                    </View>
                                    <View style={styles.actionRow}>
                                        <Pressable style={styles.iconButton} onPress={() => handleShare(ayah)}>
                                            <Ionicons name="share-social-outline" size={20} color="#0f766e" />
                                        </Pressable>
                                        <Pressable style={styles.iconButton} onPress={() => toggleBookmark(ayah.numberInSurah)}>
                                            <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={22} color="#0f766e" />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* DYNAMIC FONT SIZING APPLIED HERE */}
                                <Text style={[styles.ayahArabic, { fontSize: fontSize, lineHeight: fontSize * 2.1 }]}>
                                    {cleanArabic}
                                </Text>

                                <Text style={styles.ayahTranslation}>{ayah.translation}</Text>
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
    scrollContent: { minHeight: '100%', paddingBottom: 100 }, // Leaves room for floating font scaler

    massiveHeader: { width: '100%', paddingBottom: 80, overflow: 'hidden' },
    decorativeCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)' },
    heroWatermark: { position: 'absolute', left: -40, top: 20, transform: [{ rotate: '15deg' }] },

    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

    headerRightControls: { flexDirection: 'row', gap: 12 },
    surahBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 },
    surahBadgeText: { color: '#ffffff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

    headerContent: { alignItems: 'center', paddingHorizontal: 28 },
    heroArabic: { fontSize: 50, color: '#ccfbf1', fontFamily: 'Amiri_700Bold', marginBottom: -4 },
    headlineTitle: { fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: -1, marginBottom: 16 },

    metaRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    metaPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
    metaPillText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },

    bismillahContainer: { paddingVertical: 12, paddingHorizontal: 32, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    bismillahText: { fontSize: 24, color: '#ffffff', fontFamily: 'Amiri_400Regular' },

    contentArea: {
        flex: 1, backgroundColor: '#f8fafc', marginTop: -40,
        borderTopLeftRadius: 36, borderTopRightRadius: 36,
        paddingHorizontal: 16, paddingTop: 32, paddingBottom: 60
    },

    ayahCard: {
        backgroundColor: '#ffffff', padding: 20, borderRadius: 24, marginBottom: 16,
        borderWidth: 1, borderColor: '#f1f5f9',
        shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, shadowOffset: { width: 0, height: 6 }
    },
    ayahCardBookmarked: { borderColor: '#99f6e4', backgroundColor: '#f0fdf4', borderWidth: 2 },

    ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    ayahBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    ayahBadgeText: { fontSize: 14, fontWeight: '800', color: '#0f766e' },

    actionRow: { flexDirection: 'row', gap: 12 },
    iconButton: { padding: 4 },

    ayahArabic: { color: '#0f172a', textAlign: 'right', marginBottom: 24, fontFamily: 'Amiri_700Bold' }, // fontSize controlled by state
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
