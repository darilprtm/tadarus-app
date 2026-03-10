import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!name || !email || !password) {
            setError('Mohon lengkapi semua kolom pendaftaran.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            if (userCredential.user) {
                await updateProfile(userCredential.user, { displayName: name });
            }
            Alert.alert("Alhamdulillah", "Pendaftaran berhasil! Selamat datang di Tadarus.id", [
                { text: "Lanjutkan", onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (e: any) {
            setError(e.message || 'Pendaftaran gagal. Pastikan format email benar dan sandi minimal 6 karakter.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
                <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>

                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </Pressable>

                    <View style={styles.headerSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="person-add-outline" size={32} color="#0f766e" style={{ marginRight: 12 }} />
                            <Text style={styles.title}>Buat Akun Baru</Text>
                        </View>
                        <Text style={styles.subtitle}>Mari bergabung! Progress mengaji & sholat Anda akan tersimpan awan dengan sangat aman.</Text>
                    </View>

                    <View style={styles.formSection}>
                        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nama Lengkap</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan nama Anda"
                                    placeholderTextColor="#cbd5e1"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan email"
                                    placeholderTextColor="#cbd5e1"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Buat password (min 6 karakter)"
                                    placeholderTextColor="#cbd5e1"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={{ height: 24 }} />

                        <Pressable onPress={handleRegister} disabled={loading} style={styles.loginButton}>
                            <LinearGradient colors={['#0f766e', '#115e59']} style={styles.loginGradient}>
                                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginButtonText}>Daftar Sekarang</Text>}
                            </LinearGradient>
                        </Pressable>
                    </View>

                    <View style={styles.footerSection}>
                        <Text style={styles.footerText}>Sudah memiliki akun? </Text>
                        <Pressable onPress={() => router.back()}><Text style={styles.registerText}>Masuk Disini</Text></Pressable>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 32 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    headerSection: { marginBottom: 40 },
    title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#64748b', lineHeight: 24, fontWeight: '500' },
    formSection: { marginBottom: 32 },
    errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, marginBottom: 20 },
    errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 56 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '500' },
    loginButton: { shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, shadowOffset: { width: 0, height: 10 } },
    loginGradient: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    footerSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: 32 },
    footerText: { color: '#64748b', fontSize: 15, fontWeight: '500' },
    registerText: { color: '#0f766e', fontSize: 15, fontWeight: '800' }
});
