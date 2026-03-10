import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </Pressable>
                <Text style={styles.headerTitle}>Tentang Aplikasi</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.appName}>Tadarus.id</Text>
                    <Text style={styles.appVersion}>Versi 1.0.0</Text>
                </View>

                {/* Description */}
                <Text style={styles.paragraph}>
                    <Text style={styles.bold}>Tadarus.id</Text> dirancang secara eksklusif untuk menjadi asisten ibadah harian yang cerdas, cepat, dan ringan. Membawa pengalaman membaca Al-Quran, berzikir dengan Tasbih Digital, hingga pengingat jadwal Sholat ke dalam satu genggaman yang bebas hambatan.
                </Text>

                <View style={styles.divider} />

                {/* Developer Info */}
                <Text style={styles.sectionTitle}>Pengembang Utama</Text>
                <View style={styles.cardInfo}>
                    <Ionicons name="code-slash" size={24} color="#0f766e" style={{ marginRight: 16 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>Daril Pratomo</Text>
                        <Text style={styles.cardDesc}>Lead Software Engineer & Designer</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Credits / Data Sources */}
                <Text style={styles.sectionTitle}>Sumber Data & Teknologi</Text>
                <Text style={styles.paragraph}>
                    Aplikasi ini berdiri berkat komunitas open-source dan penyedia data Islami global yang luar biasa:
                </Text>

                <View style={styles.techList}>
                    <View style={styles.techItem}>
                        <View style={styles.dot} />
                        <Text style={styles.techText}><Text style={styles.bold}>Al-Quran Cloud API</Text> (Data Teks Kitab & Terjemahan)</Text>
                    </View>
                    <View style={styles.techItem}>
                        <View style={styles.dot} />
                        <Text style={styles.techText}><Text style={styles.bold}>Aladhan API</Text> (Algoritma Waktu Sholat Global)</Text>
                    </View>
                    <View style={styles.techItem}>
                        <View style={styles.dot} />
                        <Text style={styles.techText}><Text style={styles.bold}>Google Firebase</Text> (Keamanan Otentikasi & Database)</Text>
                    </View>
                    <View style={styles.techItem}>
                        <View style={styles.dot} />
                        <Text style={styles.techText}><Text style={styles.bold}>React Native Expo</Text> (Framework Mesin Utama)</Text>
                    </View>
                </View>

                <View style={{ height: 60 }} />
                <Text style={styles.footerText}>© {new Date().getFullYear()} Daril Pratomo</Text>
                <Text style={styles.footerSubText}>Dibuat dengan dedikasi di Indonesia</Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff' },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    content: { padding: 24, paddingBottom: 60 },

    heroSection: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
    logoBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, shadowOffset: { width: 0, height: 10 }, marginBottom: 20 },
    appName: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5, marginBottom: 4 },
    appVersion: { fontSize: 15, color: '#64748b', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },

    paragraph: { fontSize: 15, color: '#475569', lineHeight: 26 },
    bold: { fontWeight: '700', color: '#0f172a' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 28 },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
    cardInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    cardTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    cardDesc: { fontSize: 14, color: '#64748b', fontWeight: '500' },

    techList: { marginTop: 12 },
    techItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#14b8a6', marginRight: 12 },
    techText: { fontSize: 15, color: '#475569', flexShrink: 1, lineHeight: 22 },

    footerText: { textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: '700' },
    footerSubText: { textAlign: 'center', color: '#cbd5e1', fontSize: 13, fontWeight: '500', marginTop: 4 }
});
