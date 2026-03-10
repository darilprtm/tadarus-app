import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Platform, Vibration, Animated, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function TasbihScreen() {
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const insets = useSafeAreaInsets();
    const router = useRouter();

    useEffect(() => {
        loadCount();
    }, []);

    const loadCount = async () => {
        try {
            const savedCount = await AsyncStorage.getItem('tasbih_count');
            if (savedCount !== null) {
                setCount(parseInt(savedCount, 10));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveCount = async (newCount: number) => {
        setCount(newCount);
        try {
            await AsyncStorage.setItem('tasbih_count', newCount.toString());
        } catch (e) {
            console.error(e);
        }
    };

    const handleTap = () => {
        // Vibrate lightly
        if (Platform.OS === 'android') {
            Vibration.vibrate(40);
        } else {
            Vibration.vibrate(); // iOS standard vibrate fallback
        }

        // Animation scale down
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.92, duration: 50, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();

        saveCount(count + 1);
    };

    const handleReset = () => {
        Vibration.vibrate([0, 50, 100, 50]); // Double tap haptic for reset
        saveCount(0);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Massive Overlapping Header */}
            <LinearGradient
                colors={['#7e22ce', '#6b21a8', '#581c87']}
                style={[styles.massiveHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
            >
                <View style={[styles.decorativeCircle, { top: -20, right: -40 }]} />
                <Ionicons name="hand-right" size={160} color="rgba(255,255,255,0.03)" style={styles.heroWatermark} />

                <View style={styles.headerTop}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </Pressable>
                    <Pressable onPress={handleReset} style={styles.resetButton}>
                        <Ionicons name="refresh" size={20} color="#e9d5ff" />
                        <Text style={styles.resetText}>Reset</Text>
                    </Pressable>
                </View>

                <View style={styles.headerContent}>
                    <Text style={styles.headline}>Tasbih Digital</Text>
                    <Text style={styles.subtitle}>Berdzikir mengingat Allah</Text>
                </View>
            </LinearGradient>

            {/* Main Content Area */}
            <ScrollView
                style={styles.contentArea}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >

                {/* Count Presentation Card */}
                <View style={styles.countCard}>
                    <Text style={styles.countLabel}>Total Dzikir</Text>
                    <Text style={styles.countValue}>{count}</Text>
                    <View style={styles.targetPill}>
                        <Text style={styles.targetText}>Target: {target}</Text>
                    </View>
                </View>

                {/* Interactive Tasbih Button */}
                <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: scaleAnim }] }]}>
                    <Pressable
                        style={({ pressed }) => [styles.tapButton, pressed && styles.tapButtonPressed]}
                        onPress={handleTap}
                        android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: false, radius: 140 }}
                    >
                        <LinearGradient colors={['#9333ea', '#7e22ce']} style={styles.tapGradient}>
                            <View style={styles.innerRing}>
                                <Ionicons name="finger-print" size={80} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.tapText}>TAP</Text>
                            </View>
                        </LinearGradient>
                    </Pressable>
                </Animated.View>

                <Text style={styles.instruction}>Tekan lingkaran besar di atas untuk menghitung</Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    massiveHeader: {
        width: '100%',
        paddingBottom: 80,
        overflow: 'hidden'
    },
    decorativeCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
    heroWatermark: { position: 'absolute', right: -20, top: 40, transform: [{ rotate: '-15deg' }] },

    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    resetButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, gap: 6 },
    resetText: { color: '#e9d5ff', fontWeight: '700', fontSize: 14 },

    headerContent: { paddingHorizontal: 28 },
    headline: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#e9d5ff', fontWeight: '500', marginTop: 4 },

    contentArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
        marginTop: -40,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 32,
        alignItems: 'center'
    },

    countCard: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 32,
        alignItems: 'center',
        paddingVertical: 32,
        shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, shadowOffset: { width: 0, height: 8 },
        borderWidth: 1, borderColor: '#e2e8f0',
        marginBottom: 48
    },
    countLabel: { fontSize: 14, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
    countValue: { fontSize: 80, fontWeight: '900', color: '#0f172a', letterSpacing: -3, lineHeight: 90, marginVertical: 8 },
    targetPill: { backgroundColor: '#f3e8ff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99 },
    targetText: { color: '#7e22ce', fontWeight: '700', fontSize: 14 },

    buttonWrapper: {
        shadowColor: '#7e22ce', shadowOpacity: 0.3, shadowRadius: 30, elevation: 15, shadowOffset: { width: 0, height: 15 },
    },
    tapButton: {
        width: width * 0.65,
        height: width * 0.65,
        borderRadius: 999,
        overflow: 'hidden'
    },
    tapButtonPressed: { opacity: 0.9 },
    tapGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        borderWidth: 8,
        borderColor: '#e9d5ff'
    },
    innerRing: {
        width: '80%', height: '80%',
        borderRadius: 999,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center'
    },
    tapText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 2,
        marginTop: 8
    },

    instruction: { color: '#94a3b8', fontSize: 14, fontWeight: '500', marginTop: 40, textAlign: 'center' }
});
