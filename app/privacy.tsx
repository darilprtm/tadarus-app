import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
    {
        num: '01', title: 'Data yang Kami Kumpulkan',
        body: 'Aplikasi ini dirancang dengan prinsip Privacy-First. Fitur inti (Al-Quran, Tasbih, Doa, Zikir) berjalan sepenuhnya Offline. Data yang mungkin dikirim ke pihak ketiga: koordinat GPS anonim (untuk jadwal sholat & kiblat), email & nama tampilan (jika Anda membuat akun secara opsional), dan data iklan anonim (jika AdMob aktif, sesuai persetujuan ATT Anda).'
    },
    {
        num: '02', title: 'Izin Perangkat yang Diperlukan',
        body: 'Lokasi (GPS): Menghitung jadwal sholat & arah kiblat akurat. Tidak pernah disimpan di server kami.\n\nNotifikasi (Opsional): Pengingat waktu sholat. Anda dapat mencabut izin kapan saja di Pengaturan HP.\n\nInternet: Streaming audio Murotal & mengambil jadwal sholat terkini.'
    },
    {
        num: '03', title: 'Sistem Akun & Otentikasi (Opsional)',
        body: 'Membuat akun bersifat opsional. Jika Anda mendaftar, kami menggunakan Firebase Authentication (Google) yang hanya menyimpan alamat email dan nama tampilan Anda. Kami tidak pernah memiliki akses ke kata sandi Anda. Anda dapat menghapus akun kapan saja.'
    },
    {
        num: '04', title: 'Layanan Pihak Ketiga',
        body: 'Aladhan API — jadwal sholat.\nAlquran.cloud — teks Al-Quran.\nIslamic Network CDN — streaming audio Murotal.\nFirebase (Google) — autentikasi opsional.\nGoogle AdMob — iklan dalam aplikasi (mendatang).'
    },
    {
        num: '05', title: 'Streaming Audio & Data Seluler',
        body: 'Fitur Murotal menggunakan streaming langsung untuk menghemat penyimpanan HP. Penggunaan intensif dapat mengonsumsi kuota data seluler. Disarankan menggunakan Wi-Fi. Tadarus.id tidak bertanggung jawab atas biaya data operator.'
    },
    {
        num: '06', title: 'Notifikasi (Opsional)',
        body: 'Aplikasi ini dapat meminta izin Opt-In untuk mengirimkan Notifikasi Waktu Sholat. Perizinan sepenuhnya dikendalikan oleh Anda dan diproses secara internal oleh sistem operasi perangkat Anda.'
    },
    {
        num: '07', title: 'Keamanan Data',
        body: 'Kami menerapkan enkripsi HTTPS untuk semua transmisi data dan menggunakan infrastruktur Firebase bersertifikat ISO 27001. Tidak ada sistem yang 100% aman, namun kami berkomitmen untuk segera memberi tahu jika terjadi pelanggaran data.'
    },
    {
        num: '08', title: 'Hak-Hak Anda',
        body: 'Anda berhak: mengakses data yang kami simpan, mengoreksi informasi tidak akurat, menghapus akun & semua data, mencabut izin lokasi/notifikasi kapan saja, dan menolak iklan yang dipersonalisasi.'
    },
    {
        num: '09', title: 'Kebijakan untuk Anak-Anak',
        body: 'Tadarus.id tidak ditujukan untuk anak-anak di bawah 13 tahun. Kami tidak sengaja mengumpulkan data dari anak di bawah usia tersebut. Jika Anda orang tua yang mengetahui hal ini, hubungi kami di darilpsr@gmail.com.'
    },
    {
        num: '10', title: 'Perubahan Kebijakan',
        body: 'Kami berhak memperbarui kebijakan ini sewaktu-waktu. Setiap perubahan material akan tercermin pada halaman ini dengan tanggal pembaruan terkini.'
    },
    {
        num: '11', title: 'Hubungi Kami',
        body: 'Pertanyaan atau permintaan terkait privasi:\n\nDaril Pratomo\nPengembang Tadarus.id\ndarilpsr@gmail.com'
    },
];

export default function PrivacyPolicyScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </Pressable>
                <Text style={styles.headerTitle}>Kebijakan Privasi</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Pembaruan Terakhir: Maret 2026</Text>

                <Text style={styles.intro}>
                    <Text style={styles.bold}>Tadarus.id</Text> berkomitmen penuh menjaga privasi dan keamanan data Anda.
                    Kebijakan ini berlaku untuk aplikasi mobile iOS &amp; Android serta website tadarus.id.
                </Text>

                {SECTIONS.map((sec) => (
                    <View key={sec.num} style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.numBadge}>
                                <Text style={styles.numText}>{sec.num}</Text>
                            </View>
                            <Text style={styles.sectionTitle}>{sec.title}</Text>
                        </View>
                        <Text style={styles.sectionBody}>{sec.body}</Text>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff'
    },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    content: { padding: 20, paddingBottom: 60 },
    lastUpdated: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    intro: { fontSize: 15, color: '#475569', lineHeight: 26, marginBottom: 24 },
    bold: { fontWeight: '700', color: '#0f172a' },
    sectionCard: {
        backgroundColor: '#ffffff', borderRadius: 20, padding: 18,
        marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9',
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    numBadge: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center'
    },
    numText: { fontSize: 11, fontWeight: '900', color: '#ffffff' },
    sectionTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0f172a' },
    sectionBody: { fontSize: 14, color: '#475569', lineHeight: 24 },
});
