import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Switch, Alert, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [offlineSize, setOfflineSize] = useState('Menghitung...');
    const [darkTheme, setDarkTheme] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(false);

    const handleComingSoon = () => {
        Alert.alert(
            "Segera Hadir",
            "Sistem sedang dalam sinkronisasi. Fitur ini akan tersedia tidak lama lagi."
        );
    };

    const handleRating = () => {
        Linking.openURL("market://details?id=com.daril.tadarus").catch(() => {
            Alert.alert("Google Play", "Fitur rating belum tersedia di mode lokal/expo-go. Terima kasih atas dukungan Anda!");
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        calculateCacheSize();
        return () => unsubscribe();
    }, []);

    const calculateCacheSize = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            // Extremely rough estimation based on string length (1 char = 1 byte). 
            // A full Surah Al-Baqarah JSON is roughly 250KB.
            let totalBytes = 0;
            for (let key of keys) {
                if (key.startsWith('@surah_') || key.startsWith('@juz_')) {
                    const item = await AsyncStorage.getItem(key);
                    totalBytes += item ? item.length : 0;
                }
            }
            const mb = (totalBytes / (1024 * 1024)).toFixed(2);
            setOfflineSize(`${mb} MB`);
        } catch (e) {
            setOfflineSize('Gagal menghitung');
        }
    };

    const clearCache = () => {
        Alert.alert(
            "Hapus Data Offline",
            "Semua data Al-Quran yang sudah diunduh akan dihapus. Anda butuh internet lagi untuk membacanya.",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const keys = await AsyncStorage.getAllKeys();
                            const cacheKeys = keys.filter(k => k.startsWith('@surah_') || k.startsWith('@juz_'));
                            await AsyncStorage.multiRemove(cacheKeys);
                            calculateCacheSize();
                            Alert.alert("Berhasil", "Data offline berhasil dibersihkan.");
                        } catch (error) {
                            Alert.alert("Gagal", "Terjadi kesalahan saat menghapus data.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.container}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.header}>
                        <Text style={styles.headline}>Pengaturan</Text>
                    </View>

                    {/* SECTION: Akun */}
                    <Text style={styles.sectionTitle}>Akun Anda</Text>
                    <View style={styles.cardGroup}>
                        {user ? (
                            <>
                                <View style={[styles.row, styles.borderBottom]}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: '#0f766e' }]}>
                                            <Ionicons name="person" size={20} color="#fff" />
                                        </View>
                                        <View style={{ flexShrink: 1 }}>
                                            <Text style={styles.rowText}>{user.displayName || "Hamba Allah"}</Text>
                                            <Text style={{ fontSize: 13, color: '#64748b' }}>{user.email}</Text>
                                        </View>
                                    </View>
                                </View>
                                <Pressable style={styles.row} onPress={() => {
                                    Alert.alert("Keluar Akun", "Apakah Anda yakin ingin keluar?", [
                                        { text: "Batal", style: 'cancel' },
                                        { text: "Keluar", style: 'destructive', onPress: () => signOut(auth) }
                                    ]);
                                }}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconBox, { backgroundColor: '#ef4444' }]}>
                                            <Ionicons name="log-out" size={20} color="#fff" />
                                        </View>
                                        <Text style={[styles.rowText, { color: '#ef4444' }]}>Keluar Akun</Text>
                                    </View>
                                </Pressable>
                            </>
                        ) : (
                            <Pressable style={styles.row} onPress={() => router.push('/login')}>
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#0f766e' }]}>
                                        <Ionicons name="log-in" size={20} color="#fff" />
                                    </View>
                                    <View style={{ flexShrink: 1 }}>
                                        <Text style={styles.rowText}>Masuk / Daftar</Text>
                                        <Text style={{ fontSize: 13, color: '#64748b' }}>Simpan progres Anda di awan</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                            </Pressable>
                        )}
                    </View>

                    {/* SECTION: Notifikasi */}
                    <Text style={styles.sectionTitle}>Sistem Notifikasi</Text>
                    <View style={styles.cardGroup}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#f59e0b' }]}>
                                    <Ionicons name="notifications" size={20} color="#fff" />
                                </View>
                                <Text style={styles.rowText}>Notifikasi Waktu Sholat</Text>
                            </View>
                            <Switch
                                value={notifEnabled}
                                onValueChange={setNotifEnabled}
                                trackColor={{ false: '#cbd5e1', true: '#0f766e' }}
                            />
                        </View>
                    </View>

                    {/* SECTION: Penyimpanan */}
                    <Text style={styles.sectionTitle}>Penyimpanan Offline</Text>
                    <View style={styles.cardGroup}>
                        <View style={[styles.row, styles.borderBottom]}>
                            <View style={[styles.rowLeft, { flexShrink: 1, paddingRight: 16 }]}>
                                <View style={[styles.iconBox, { backgroundColor: '#10b981' }]}>
                                    <Ionicons name="server" size={20} color="#fff" />
                                </View>
                                <Text style={styles.rowText}>Kapasitas Terpakai</Text>
                            </View>
                            <Text style={[styles.valueText, { textAlign: 'right', flexShrink: 1 }]}>{offlineSize}</Text>
                        </View>
                        <Pressable style={styles.row} onPress={clearCache}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#ef4444' }]}>
                                    <Ionicons name="trash" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.rowText, { color: '#ef4444' }]}>Bersihkan Data Offline</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </Pressable>
                    </View>

                    {/* SECTION: Bantuan & Legal (Wajib App Store & AdMob) */}
                    <Text style={styles.sectionTitle}>Bantuan & Legal</Text>
                    <View style={styles.cardGroup}>
                        <Pressable style={[styles.row, styles.borderBottom]} onPress={async () => {
                            try {
                                await Share.share({ message: 'Mari mengaji & tracker sholat lebih khusyuk dengan aplikasi Tadarus.id! 🌙\nDownload sekarang di Play Store/App Store.' });
                            } catch (e) { }
                        }}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#14b8a6' }]}>
                                    <Ionicons name="share-social" size={20} color="#fff" />
                                </View>
                                <Text style={styles.rowText}>Bagikan Aplikasi</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </Pressable>

                        <Pressable style={[styles.row, styles.borderBottom]} onPress={handleRating}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#ec4899' }]}>
                                    <Ionicons name="star" size={20} color="#fff" />
                                </View>
                                <Text style={styles.rowText}>Beri Rating 5 Bintang</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </Pressable>

                        <Pressable style={[styles.row, styles.borderBottom]} onPress={() => Linking.openURL('mailto:darilpsr@gmail.com?subject=Tadarus.id%20Support')}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#3b82f6' }]}>
                                    <Ionicons name="chatbubbles" size={20} color="#fff" />
                                </View>
                                <Text style={styles.rowText}>Hubungi Bantuan</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </Pressable>

                        <Pressable style={[styles.row, styles.borderBottom]} onPress={() => router.push('/privacy')}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: '#6366f1' }]}>
                                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                                </View>
                                <Text style={styles.rowText}>Kebijakan Privasi</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </Pressable>

                        <Pressable style={styles.row} onPress={() => router.push('/about')}>
                            <View style={[styles.rowLeft, { flexShrink: 1, paddingRight: 16 }]}>
                                <View style={[styles.iconBox, { backgroundColor: '#8b5cf6' }]}>
                                    <Ionicons name="information-circle" size={20} color="#fff" />
                                </View>
                                <Text style={styles.rowText}>Tentang Aplikasi</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </Pressable>
                    </View>

                    <Text style={styles.footerText}>© {new Date().getFullYear()} Daril Pratomo. Hak Cipta Dilindungi.</Text>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 16 },

    header: { marginBottom: 36, marginTop: 10 },
    headline: { fontSize: 44, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5 },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginLeft: 16, marginTop: 16 },

    cardGroup: {
        backgroundColor: '#ffffff',
        borderRadius: 32,
        shadowColor: '#94a3b8', shadowOpacity: 0.12, shadowRadius: 15, elevation: 4, shadowOffset: { width: 0, height: 6 },
        marginBottom: 24,
        overflow: 'hidden'
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: '#ffffff'
    },
    borderBottom: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f1f5f9'
    },

    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowText: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
    valueText: { fontSize: 16, fontWeight: '500', color: '#64748b' },

    footerText: { textAlign: 'center', marginTop: 12, color: '#94a3b8', fontSize: 14, fontWeight: '600' }
});
