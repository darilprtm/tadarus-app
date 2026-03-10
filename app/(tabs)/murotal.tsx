import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { IndonesianSurahNames } from '@/constants/SurahNames';

const { height } = Dimensions.get('window');

type SurahItem = {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
};

export default function MurotalScreen() {
    const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold });
    const [surahs, setSurahs] = useState<SurahItem[]>([]);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    // Audio State
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [currentSurah, setCurrentSurah] = useState<SurahItem | null>(null);

    useEffect(() => {
        const loadSurahs = async () => {
            try {
                const cached = await AsyncStorage.getItem('@surahs_list');
                if (cached) {
                    setSurahs(JSON.parse(cached));
                    setLoading(false);
                }
                const response = await fetch('https://api.alquran.cloud/v1/surah');
                const json = await response.json();
                if (json.code === 200) {
                    setSurahs(json.data);
                    await AsyncStorage.setItem('@surahs_list', JSON.stringify(json.data));
                }
            } catch (e) {
                console.warn("Offline or API Error");
            } finally {
                setLoading(false);
            }
        };

        // Configure Audio Session
        const setupAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false
                });
            } catch (e) { }
        };

        loadSurahs();
        setupAudio();

        return () => {
            // Cleanup on unmount
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    async function playSurah(surah: SurahItem) {
        try {
            // If clicking the currently playing surah, just toggle pause/play
            if (currentSurah && currentSurah.number === surah.number && sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                } else {
                    await sound.playAsync();
                }
                return;
            }

            setIsBuffering(true);
            // If changing surahs, unload previous
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }

            setCurrentSurah(surah);
            setIsPlaying(true);

            const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surah.number}.mp3`;

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            setSound(newSound);
            setIsBuffering(false);
        } catch (error) {
            console.error("Audio playback error:", error);
            setIsBuffering(false);
            setIsPlaying(false);
        }
    }

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            if (status.didJustFinish) {
                setIsPlaying(false); // Reached end of Surah
            } else {
                setIsPlaying(status.isPlaying);
                setIsBuffering(status.isBuffering);
            }
        } else {
            if (status.error) {
                console.warn(`FATAL PLAYER ERROR: ${status.error}`);
                setIsPlaying(false);
                setIsBuffering(false);
            }
        }
    };

    async function togglePlayPause() {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }
    }

    if (!fontsLoaded || loading && surahs.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0369a1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={{ minHeight: height, paddingBottom: currentSurah ? 120 : 40 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Massive Overlapping Header */}
                <LinearGradient
                    colors={['#0369a1', '#075985', '#0c4a6e']}
                    style={[styles.scrollableHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[styles.decorativeCircle, { top: -40, right: -60 }]} />
                    <View style={[styles.decorativeCircleSmall, { top: 120, left: -20 }]} />

                    <View style={styles.headerContent}>
                        <Text style={styles.headline}>Murotal Audio</Text>
                        <Text style={styles.subtitle}>Syeikh Mishary Rashid Alafasy</Text>
                    </View>
                </LinearGradient>

                <View style={styles.listArea}>
                    {surahs.map((surah) => {
                        const isActive = currentSurah?.number === surah.number;
                        return (
                            <TouchableOpacity
                                key={surah.number}
                                activeOpacity={0.7}
                                style={[styles.cardSolid, isActive && styles.cardActive]}
                                onPress={() => playSurah(surah)}
                            >
                                <View style={styles.numberBadgeContainer}>
                                    <LinearGradient colors={isActive ? ['#0369a1', '#0284c7'] : ['#f1f5f9', '#e2e8f0']} style={styles.numberBadge}>
                                        {isActive && isPlaying ? (
                                            <View style={styles.musicBars}>
                                                <View style={[styles.bar, { height: 12 }]} />
                                                <View style={[styles.bar, { height: 18 }]} />
                                                <View style={[styles.bar, { height: 10 }]} />
                                            </View>
                                        ) : (
                                            <Ionicons name="play" size={18} color={isActive ? '#ffffff' : '#64748b'} style={{ marginLeft: 3 }} />
                                        )}
                                    </LinearGradient>
                                </View>

                                <View style={styles.infoBlock}>
                                    <Text style={[styles.surahName, isActive && { color: '#0369a1' }]} numberOfLines={1}>
                                        {IndonesianSurahNames[surah.number - 1] || surah.englishName}
                                    </Text>
                                    <View style={styles.surahMetaRow}>
                                        <Text style={styles.surahMeta}>
                                            Surat ke-{surah.number} • {surah.numberOfAyahs} Ayat
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.arabicText}>{surah.name.replace('سُورَةُ ', '')}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* FLOATING NOW PLAYING BAR */}
            {currentSurah && (
                <View style={[styles.miniPlayerContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.miniPlayer}>

                        <View style={styles.miniLeft}>
                            <View style={styles.recordDisk}>
                                <Ionicons name="musical-notes" size={18} color="#0f766e" />
                            </View>
                            <View style={styles.miniTextInfo}>
                                <Text style={styles.miniSurahTitle} numberOfLines={1}>
                                    {IndonesianSurahNames[currentSurah.number - 1] || currentSurah.englishName}
                                </Text>
                                <Text style={styles.miniQari}>Mishary Alafasy</Text>
                            </View>
                        </View>

                        <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseBtn}>
                            {isBuffering ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Ionicons name={isPlaying ? "pause" : "play"} size={26} color="#ffffff" style={!isPlaying && { marginLeft: 3 }} />
                            )}
                        </TouchableOpacity>

                    </LinearGradient>
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },

    scrollableHeader: { width: '100%', paddingBottom: 60, overflow: 'hidden' },
    decorativeCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)' },
    decorativeCircleSmall: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },

    headerContent: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 16 },
    headline: { fontSize: 44, fontWeight: '900', color: '#ffffff', letterSpacing: -1.2, marginBottom: 4 },
    subtitle: { fontSize: 16, color: '#e0f2fe', fontWeight: '500', opacity: 0.9 },

    listArea: {
        flex: 1, backgroundColor: '#f8fafc', marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 20, paddingTop: 32,
    },

    cardSolid: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 28,
        paddingVertical: 18, paddingHorizontal: 20, marginBottom: 14,
        shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 15, elevation: 4, shadowOffset: { width: 0, height: 5 },
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    cardActive: {
        borderColor: '#bae6fd',
        backgroundColor: '#f0f9ff',
    },

    numberBadgeContainer: { marginRight: 16 },
    numberBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

    musicBars: { flexDirection: 'row', alignItems: 'flex-end', height: 18, justifyContent: 'center' },
    bar: { width: 3, backgroundColor: '#ffffff', borderRadius: 2, marginHorizontal: 1.5 },

    infoBlock: { flex: 1, justifyContent: 'center', marginRight: 16 },
    surahName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4, letterSpacing: -0.5 },
    surahMetaRow: { flexDirection: 'row', alignItems: 'center' },
    surahMeta: { fontSize: 13, color: '#64748b', fontWeight: '600' },

    arabicText: { fontSize: 32, color: '#0ea5e9', fontFamily: 'Amiri_700Bold', lineHeight: 60, textAlign: 'right', paddingTop: 8 },

    // Now Playing Floating Bar
    miniPlayerContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingTop: 16,
        backgroundColor: 'transparent'
    },
    miniPlayer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#0f172a', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 16,
        shadowColor: '#0369a1', shadowOpacity: 0.3, shadowRadius: 30, elevation: 15, shadowOffset: { width: 0, height: -10 }
    },
    miniLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 },
    recordDisk: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    miniTextInfo: { flex: 1 },
    miniSurahTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 2 },
    miniQari: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
    playPauseBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }
});
