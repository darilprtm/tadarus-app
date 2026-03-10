import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DOA_LIST = [
    { id: 1, title: 'Doa Sebelum Makan', arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ', latin: 'Allahumma baarik lanaa fiimaa rozaqtanaa wa qinaa \'adzaa bannaar.', translation: 'Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami dan peliharalah kami dari siksa api neraka.' },
    { id: 2, title: 'Doa Sesudah Makan', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ', latin: 'Alhamdulillahilladzi ath-amanaa wa saqoonaa wa ja\'alanaa minal muslimiin.', translation: 'Segala puji bagi Allah yang telah memberi kami makan dan minum serta menjadikan kami termasuk golongan orang muslim.' },
    { id: 3, title: 'Doa Sebelum Tidur', arabic: 'بِسْمِكَ اللَّهُمَّ أَحْيَا وَبِسْمِكَ أَمُوتُ', latin: 'Bismika allahumma ahyaa wa bismika amuut.', translation: 'Dengan nama-Mu ya Allah aku hidup, dan dengan nama-Mu aku mati.' },
    { id: 4, title: 'Doa Bangun Tidur', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', latin: 'Alhamdulillahilladzi ahyaanaa ba\'da maa amaatanaa wa ilaihin nusyuur.', translation: 'Segala puji bagi Allah, yang telah membangunkan kami setelah menidurkan kami, dan kepada-Nya lah kami dibangkitkan.' },
    { id: 5, title: 'Doa Keluar Rumah', arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', latin: 'Bismillahi tawakkaltu \'alallahi, laa hawla wa laa quwwata illaa billaah.', translation: 'Dengan nama Allah, aku bertawakkal kepada Allah. Tiada daya dan kekuatan kecuali dengan (pertolongan) Allah.' },
    { id: 6, title: 'Doa Masuk Rumah', arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا', latin: 'Bismillahi walajnaa, wa bismillahi khorojnaa, wa \'alallahi robbina tawakkalnaa.', translation: 'Dengan nama Allah kami masuk, dan dengan nama Allah kami keluar. Dan hanya kepada Tuhan kami, kami berserah diri.' },
    { id: 7, title: 'Doa Masuk Kamar Mandi', arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', latin: 'Allahumma innii a\'uudzubika minal khubuts wal khobaaits.', translation: 'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari godaan setan laki-laki dan setan perempuan.' },
    { id: 8, title: 'Doa Keluar Kamar Mandi', arabic: 'غُفْرَانَكَ، الْحَمْدُ لِلَّهِ الَّذِي أَذْهَبَ عَنِّي الْأَذَى وَعَافَانِي', latin: 'Ghufronaka, alhamdulillahilladzii adzhaba \'annil adzaa wa \'aafaanii.', translation: 'Aku memohon ampunan-Mu. Segala puji bagi Allah yang telah menghilangkan halangan dariku dan menyelamatkan aku.' },
    { id: 9, title: 'Doa Bercermin', arabic: 'اللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي', latin: 'Allahumma kamaa hassanta kholqii fa hassin khuluqii.', translation: 'Ya Allah, sebagaimana Engkau telah membaguskan rupa/kejadianku, maka baguskanlah akhlakku.' },
    { id: 10, title: 'Doa Naik Kendaraan', arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ', latin: 'Subhaanal ladzii sakhkhoro lanaa haadzaa wa maa kunnaa lahu muqriniin, wa innaa ilaa robbinaa lamunqolibuun.', translation: 'Maha Suci Allah yang telah menundukkan kendaraan ini bagi kami, padahal kami sebelumnya tidak mampu menguasainya. Dan sesungguhnya kami akan kembali kepada Tuhan kami.' }
];

export default function DoaScreen() {
    const insets = useSafeAreaInsets();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </Pressable>
                <Text style={styles.headerTitle}>Doa Harian</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.heroCard}>
                    <LinearGradient colors={['#c026d3', '#a21caf']} style={styles.heroGradient}>
                        <Ionicons name="moon" size={120} color="rgba(255,255,255,0.06)" style={styles.heroIcon} />
                        <Text style={styles.heroTitle}>Kumpulan Doa</Text>
                        <Text style={styles.heroSubtitle}>Bentengi diri dengan kekuatan doa di setiap rutinitas langkah keseharian Anda.</Text>
                    </LinearGradient>
                </View>

                <View style={styles.listContainer}>
                    {DOA_LIST.map((doa) => {
                        const isExpanded = expandedId === doa.id;
                        return (
                            <Pressable key={doa.id} onPress={() => toggleExpand(doa.id)} style={[styles.card, isExpanded && styles.cardExpanded]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="book" size={18} color="#c026d3" />
                                    </View>
                                    <Text style={styles.doaTitle}>{doa.title}</Text>
                                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94a3b8" />
                                </View>

                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        <Text style={styles.arabicText}>{doa.arabic}</Text>
                                        <Text style={styles.latinText}>{doa.latin}</Text>
                                        <Text style={styles.translationText}>{doa.translation}</Text>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#ffffff', zIndex: 10 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    content: { padding: 20, paddingTop: 20 },

    heroCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, shadowColor: '#c026d3', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5, shadowOffset: { width: 0, height: 4 } },
    heroGradient: { padding: 24, paddingVertical: 32 },
    heroIcon: { position: 'absolute', right: -20, bottom: -20, transform: [{ rotate: '-15deg' }] },
    heroTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
    heroSubtitle: { fontSize: 14, color: '#fdf4ff', lineHeight: 22, opacity: 0.9, paddingRight: 40 },

    listContainer: { gap: 12 },
    card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
    cardExpanded: { borderColor: '#fdf4ff', backgroundColor: '#ffffff' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fdf4ff', alignItems: 'center', justifyContent: 'center' },
    doaTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a' },

    expandedContent: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    arabicText: { fontSize: 32, color: '#0f172a', textAlign: 'right', lineHeight: 60, marginBottom: 16, fontFamily: 'Amiri_700Bold', paddingTop: 8 },
    latinText: { fontSize: 14, color: '#0ea5e9', fontStyle: 'italic', marginBottom: 12, lineHeight: 22 },
    translationText: { fontSize: 15, color: '#475569', lineHeight: 24 }
});
