import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, Platform, Vibration } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOLAT_NAMES = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"];

export default function TrackerScreen() {
    const insets = useSafeAreaInsets();
    const [tracker, setTracker] = useState<boolean[]>([false, false, false, false, false]);

    useEffect(() => {
        loadTracker();
    }, []);

    const loadTracker = async () => {
        try {
            const today = new Date().toDateString();
            const savedDate = await AsyncStorage.getItem('@tracker_date');
            if (savedDate === today) {
                const savedState = await AsyncStorage.getItem('@tracker_state');
                if (savedState) setTracker(JSON.parse(savedState));
            } else {
                // New day, reset tracker
                await AsyncStorage.setItem('@tracker_date', today);
                await AsyncStorage.setItem('@tracker_state', JSON.stringify([false, false, false, false, false]));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleSholat = async (index: number) => {
        if (Platform.OS === 'android') Vibration.vibrate(40);
        else Vibration.vibrate();

        const newState = [...tracker];
        newState[index] = !newState[index];
        setTracker(newState);

        await AsyncStorage.setItem('@tracker_state', JSON.stringify(newState));
    };

    const completedCount = tracker.filter(Boolean).length;
    const progressText = completedCount === 5 ? "Alhamdulillah, Sempurna! 🌟" : `${completedCount}/5 Selesai`;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Massive Header */}
                <LinearGradient
                    colors={['#059669', '#047857', '#064e3b']}
                    style={[styles.massiveHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
                >
                    <View style={[styles.decorativeCircle, { top: -20, right: -40 }]} />
                    <Ionicons name="checkmark-done" size={160} color="rgba(255,255,255,0.05)" style={styles.heroWatermark} />

                    <View style={styles.headerTop}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" />
                        </Pressable>
                    </View>

                    <View style={styles.headerContent}>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressNumber}>{completedCount}</Text>
                            <Text style={styles.progressTotal}>/ 5</Text>
                        </View>
                        <Text style={styles.headlineTitle}>Tracker Sholat</Text>
                        <Text style={styles.headlineSubtitle}>{progressText}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.contentArea}>
                    <Text style={styles.sectionTitle}>Ibadah Wajib Hari Ini</Text>

                    {SHOLAT_NAMES.map((sholat, index) => {
                        const isDone = tracker[index];
                        return (
                            <Pressable key={index} onPress={() => toggleSholat(index)} style={({ pressed }) => [
                                styles.trackerCard,
                                isDone && styles.trackerCardDone,
                                pressed && { transform: [{ scale: 0.98 }] }
                            ]}>
                                <View style={styles.cardLeft}>
                                    <View style={[styles.iconBox, isDone && styles.iconBoxDone]}>
                                        <Ionicons name="time" size={24} color={isDone ? "#ffffff" : "#10b981"} />
                                    </View>
                                    <Text style={[styles.cardTitle, isDone && { color: '#047857' }]}>Sholat {sholat}</Text>
                                </View>

                                <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                                    {isDone && <Ionicons name="checkmark" size={20} color="#ffffff" />}
                                </View>
                            </Pressable>
                        );
                    })}
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
    progressCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 20 },
    progressNumber: { fontSize: 40, fontWeight: '900', color: '#ffffff', letterSpacing: -2 },
    progressTotal: { fontSize: 18, fontWeight: '700', color: '#a7f3d0', marginTop: 14, marginLeft: 2 },

    headlineTitle: { fontSize: 34, fontWeight: '900', color: '#ffffff', letterSpacing: -1, marginBottom: 8 },
    headlineSubtitle: { fontSize: 16, color: '#a7f3d0', fontWeight: '600' },

    contentArea: {
        flex: 1, backgroundColor: '#f8fafc', marginTop: -40,
        borderTopLeftRadius: 36, borderTopRightRadius: 36,
        paddingHorizontal: 24, paddingTop: 32,
    },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 20, letterSpacing: -0.5 },

    trackerCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#ffffff', padding: 20, borderRadius: 24, marginBottom: 16,
        borderWidth: 2, borderColor: '#f1f5f9',
        shadowColor: '#0f172a', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, shadowOffset: { width: 0, height: 4 }
    },
    trackerCardDone: { borderColor: '#a7f3d0', backgroundColor: '#f0fdf4' },

    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    iconBoxDone: { backgroundColor: '#10b981' },
    cardTitle: { fontSize: 18, fontWeight: '800', color: '#334155' },

    checkbox: { width: 32, height: 32, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: '#10b981', borderColor: '#10b981' }
});
