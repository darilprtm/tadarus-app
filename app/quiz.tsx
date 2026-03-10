import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { IndonesianSurahNames } from '@/constants/SurahNames';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';

type QuizOption = {
    id: number;
    name: string;
    isCorrect: boolean;
};

type QuestionData = {
    arabic: string;
    translation: string;
    surahId: number;
    surahName: string;
    ayahNumberInSurah: number;
};

export default function QuizScreen() {
    const insets = useSafeAreaInsets();
    const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold });

    type QuizMode = 'TEBAK_SURAT' | 'SAMBUNG_AYAT';
    const [quizMode, setQuizMode] = useState<QuizMode>('TEBAK_SURAT');

    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [options, setOptions] = useState<QuizOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        fetchNewQuestion();
    }, []);

    const fetchNewQuestion = async () => {
        setLoading(true);
        setSelectedOption(null);

        try {
            const mode: QuizMode = Math.random() > 0.5 ? 'TEBAK_SURAT' : 'SAMBUNG_AYAT';
            setQuizMode(mode);

            if (mode === 'TEBAK_SURAT') {
                const randomAyahId = Math.floor(Math.random() * 6236) + 1;
                const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahId}/editions/quran-uthmani,id.indonesian`);
                const json = await res.json();

                if (json.code === 200) {
                    const arabicData = json.data[0];
                    const translationData = json.data[1];
                    const correctSurahId = arabicData.surah.number;
                    const correctSurahName = IndonesianSurahNames[correctSurahId - 1] || arabicData.surah.englishName;

                    setQuestion({
                        arabic: arabicData.text,
                        translation: translationData.text,
                        surahId: correctSurahId,
                        surahName: correctSurahName,
                        ayahNumberInSurah: arabicData.numberInSurah
                    });

                    let wrongIds = new Set<number>();
                    while (wrongIds.size < 3) {
                        const r = Math.floor(Math.random() * 114) + 1;
                        if (r !== correctSurahId) wrongIds.add(r);
                    }

                    let newOptions: QuizOption[] = [
                        { id: correctSurahId, name: correctSurahName, isCorrect: true },
                        ...Array.from(wrongIds).map(id => ({ id, name: IndonesianSurahNames[id - 1], isCorrect: false }))
                    ];

                    newOptions.sort(() => Math.random() - 0.5);
                    setOptions(newOptions);
                }
            } else {
                // SAMBUNG_AYAT
                let randomAyahId = Math.floor(Math.random() * 6235) + 1;
                const requestIds = [randomAyahId, randomAyahId + 1];

                while (requestIds.length < 5) {
                    const r = Math.floor(Math.random() * 6236) + 1;
                    if (!requestIds.includes(r)) requestIds.push(r);
                }

                const promises = requestIds.map(id => fetch(`https://api.alquran.cloud/v1/ayah/${id}/editions/quran-uthmani,id.indonesian`).then(res => res.json()));
                const results = await Promise.all(promises);

                const currentAyahData = results[0].data[0];
                const currentAyahTrans = results[0].data[1];
                const nextAyahData = results[1].data[0];

                setQuestion({
                    arabic: currentAyahData.text,
                    translation: currentAyahTrans.text,
                    surahId: currentAyahData.surah.number,
                    surahName: currentAyahData.surah.englishName,
                    ayahNumberInSurah: currentAyahData.numberInSurah
                });

                let newOptions: QuizOption[] = [
                    { id: nextAyahData.number, name: nextAyahData.text, isCorrect: true },
                    { id: results[2].data[0].number, name: results[2].data[0].text, isCorrect: false },
                    { id: results[3].data[0].number, name: results[3].data[0].text, isCorrect: false },
                    { id: results[4].data[0].number, name: results[4].data[0].text, isCorrect: false },
                ];

                newOptions.sort(() => Math.random() - 0.5);
                setOptions(newOptions);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (opt: QuizOption) => {
        if (selectedOption) return; // Prevent multiple taps
        setSelectedOption(opt);

        if (opt.isCorrect) {
            setScore(prev => prev + 10);
            setStreak(prev => prev + 1);
        } else {
            setStreak(0); // Reset streak on wrong
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Massive Header */}
                <LinearGradient
                    colors={['#e11d48', '#be123c', '#881337']}
                    style={[styles.massiveHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
                >
                    <View style={[styles.decorativeCircle, { top: -20, right: -40 }]} />
                    <Ionicons name="help-buoy" size={160} color="rgba(255,255,255,0.05)" style={styles.heroWatermark} />

                    <View style={styles.headerTop}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" />
                        </Pressable>
                        <View style={styles.scoreContainer}>
                            <Ionicons name="flame" size={16} color="#fda4af" />
                            <Text style={styles.scoreText}>{streak} Streak</Text>
                        </View>
                    </View>

                    <View style={styles.headerContent}>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreNumber}>{score}</Text>
                        </View>
                        <Text style={styles.headlineTitle}>Quiz Al-Quran</Text>
                        <Text style={styles.headlineSubtitle}>{quizMode === 'TEBAK_SURAT' ? 'Tebak Surat dari Ayat di bawah ini' : 'Sambung Ayat Quran di bawah ini'}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.contentArea}>

                    {loading || !fontsLoaded || !question ? (
                        <View style={{ marginTop: 60, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#e11d48" />
                            <Text style={styles.loadingText}>Menyiapkan Ayat...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.questionCard}>
                                <Ionicons name="book" size={24} color="#f43f5e" style={{ alignSelf: 'center', marginBottom: 16, opacity: 0.2 }} />
                                <Text style={styles.ayahArabic}>
                                    {question.arabic.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '')}
                                </Text>
                                <Text style={styles.ayahTranslation}>"{question.translation}"</Text>
                            </View>

                            <View style={styles.optionsContainer}>
                                {options.map(opt => {
                                    const isSelected = selectedOption?.id === opt.id;
                                    let btnStyle: any = styles.optionBtn;
                                    let textStyle: any = styles.optionText;

                                    if (selectedOption) {
                                        if (opt.isCorrect) {
                                            btnStyle = [styles.optionBtn, styles.optionCorrect];
                                            textStyle = [styles.optionText, styles.optionTextWhite];
                                        } else if (isSelected && !opt.isCorrect) {
                                            btnStyle = [styles.optionBtn, styles.optionWrong];
                                            textStyle = [styles.optionText, styles.optionTextWhite];
                                        } else {
                                            btnStyle = [styles.optionBtn, { opacity: 0.5 }];
                                        }
                                    }

                                    if (quizMode === 'SAMBUNG_AYAT') {
                                        textStyle = [styles.optionArabicText, isSelected ? styles.optionTextWhite : {}, opt.isCorrect && selectedOption ? styles.optionTextWhite : {}];
                                    }

                                    return (
                                        <Pressable
                                            key={opt.id}
                                            onPress={() => handleSelectOption(opt)}
                                            style={({ pressed }) => [btnStyle, pressed && !selectedOption && { transform: [{ scale: 0.98 }] }]}
                                        >
                                            <Text style={textStyle} numberOfLines={3}>{opt.name.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '')}</Text>

                                            {selectedOption && opt.isCorrect && <Ionicons name="checkmark-circle" size={24} color="#ffffff" style={quizMode === 'SAMBUNG_AYAT' ? { marginRight: 10 } : {}} />}
                                            {selectedOption && isSelected && !opt.isCorrect && <Ionicons name="close-circle" size={24} color="#ffffff" style={quizMode === 'SAMBUNG_AYAT' ? { marginRight: 10 } : {}} />}
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {selectedOption && (
                                <Pressable style={styles.nextBtn} onPress={fetchNewQuestion}>
                                    <Text style={styles.nextBtnText}>Lanjut Pertanyaan Berikutnya</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                                </Pressable>
                            )}
                        </>
                    )}

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

    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    scoreContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, gap: 6 },
    scoreText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

    headerContent: { alignItems: 'center', paddingHorizontal: 28 },
    scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffe4e6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    scoreNumber: { fontSize: 32, fontWeight: '900', color: '#e11d48', letterSpacing: -1 },

    headlineTitle: { fontSize: 34, fontWeight: '900', color: '#ffffff', letterSpacing: -1, marginBottom: 8 },
    headlineSubtitle: { fontSize: 16, color: '#fbcfe8', fontWeight: '500' },

    contentArea: {
        flex: 1, backgroundColor: '#f8fafc', marginTop: -40,
        borderTopLeftRadius: 36, borderTopRightRadius: 36,
        paddingHorizontal: 20, paddingTop: 32,
    },

    loadingText: { marginTop: 16, fontSize: 16, color: '#64748b', fontWeight: '600' },

    questionCard: {
        backgroundColor: '#ffffff', padding: 24, borderRadius: 32, marginBottom: 24,
        borderWidth: 1, borderColor: '#ffe4e6',
        shadowColor: '#e11d48', shadowOpacity: 0.04, shadowRadius: 20, elevation: 3, shadowOffset: { width: 0, height: 8 }
    },
    ayahArabic: { fontSize: 28, color: '#0f172a', textAlign: 'center', lineHeight: 54, marginBottom: 20, fontFamily: 'Amiri_700Bold' },
    ayahTranslation: { fontSize: 15, color: '#64748b', textAlign: 'center', fontStyle: 'italic', lineHeight: 24, fontWeight: '500' },

    optionsContainer: { gap: 12 },
    optionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#ffffff', padding: 20, borderRadius: 20,
        borderWidth: 2, borderColor: '#f1f5f9',
    },
    optionText: { fontSize: 16, fontWeight: '700', color: '#334155' },
    optionArabicText: { fontSize: 24, fontFamily: 'Amiri_400Regular', color: '#0f172a', textAlign: 'right', flex: 1, marginLeft: 16, lineHeight: 40 },
    optionTextWhite: { color: '#ffffff' },

    optionCorrect: { backgroundColor: '#10b981', borderColor: '#10b981' },
    optionWrong: { backgroundColor: '#ef4444', borderColor: '#ef4444' },

    nextBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0f172a', paddingVertical: 18, borderRadius: 99, marginTop: 32
    },
    nextBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginRight: 8 }
});
