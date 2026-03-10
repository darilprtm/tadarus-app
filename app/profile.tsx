import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../lib/firebase';
import { updateProfile, signOut, User } from 'firebase/auth';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (currentUser) setDisplayName(currentUser.displayName || '');
        });
        return unsubscribe;
    }, []);

    const handleSave = async () => {
        if (!user) return;
        if (!displayName.trim()) {
            Alert.alert('Gagal', 'Nama tidak boleh kosong.');
            return;
        }

        setLoading(true);
        try {
            await updateProfile(user, {
                displayName: displayName
            });
            Alert.alert('Sukses', 'Profil berhasil diperbarui!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Keluar Akun",
            "Apakah Anda yakin ingin keluar?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Keluar",
                    style: "destructive",
                    onPress: async () => {
                        await signOut(auth);
                        router.replace('/');
                    }
                }
            ]
        );
    };

    const handleAvatarClick = () => {
        Alert.alert("Ganti Foto Profil", "Sistem integrasi galeri foto (ImagePicker) akan segera rilis di update berikutnya!");
    };

    if (!user) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0f766e" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </Pressable>
                <Text style={styles.headerTitle}>Edit Profil</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Avatar Section */}
                <View style={styles.avatarContainer}>
                    <Pressable onPress={handleAvatarClick} style={styles.avatarWrapper}>
                        {user.photoURL ? (
                            <View style={[styles.avatarBox, { backgroundColor: '#e2e8f0' }]} />
                        ) : (
                        <View style={styles.avatarBox}>
                            <Text style={styles.avatarText}>
                                {displayName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'H'}
                            </Text>
                        </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={14} color="#ffffff" />
                        </View>
                    </Pressable>
                    <Text style={styles.emailText}>{user.email}</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nama Tampilan</Text>
                    <TextInput
                        style={styles.input}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Masukkan nama Anda"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                    />
                </View>

                {/* Actions */}
                <Pressable
                    style={[styles.saveBtn, loading && styles.saveBtnLoading]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                    )}
                </Pressable>

                <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>Keluar Akun</Text>
                </Pressable>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff' },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    content: { padding: 24, paddingBottom: 60 },

    avatarContainer: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    avatarWrapper: { position: 'relative', marginBottom: 16 },
    avatarBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8, shadowOffset: { width: 0, height: 8 } },
    avatarText: { fontSize: 40, fontWeight: '800', color: '#ffffff' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#f8fafc' },
    emailText: { fontSize: 15, color: '#64748b', fontWeight: '500' },

    formGroup: { marginBottom: 32 },
    label: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10, marginLeft: 4 },
    input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18, fontSize: 16, color: '#0f172a', fontWeight: '600', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },

    saveBtn: { backgroundColor: '#0f766e', borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, shadowOffset: { width: 0, height: 6 }, marginBottom: 24 },
    saveBtnLoading: { opacity: 0.7 },
    saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' },
    logoutBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' }
});
