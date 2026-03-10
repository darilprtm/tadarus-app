import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ZIKIR_LIST = [
    { id: 1, title: 'Tasbih', arabic: 'سُبْحَانَ اللَّهِ', latin: 'Subhanallah (33x)', translation: 'Maha Suci Allah' },
    { id: 2, title: 'Tahmid', arabic: 'الْحَمْدُ لِلَّهِ', latin: 'Alhamdulillah (33x)', translation: 'Segala puji bagi Allah' },
    { id: 3, title: 'Takbir', arabic: 'اللَّهُ أَكْبَرُ', latin: 'Allahu Akbar (33x)', translation: 'Allah Maha Besar' },
    { id: 4, title: 'Tahlil', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', latin: 'Laa ilaaha illallaah (33x)', translation: 'Tiada Tuhan selain Allah' },
    { id: 5, title: 'Hauqalah', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', latin: 'Laa hawla wa laa quwwata illaa billaah', translation: 'Tiada daya dan upaya kecuali dengan kekuatan Allah' },
    { id: 6, title: 'Istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ', latin: 'Astaghfirullahal \'azhiim', translation: 'Aku memohon ampun kepada Allah Yang Maha Agung' },
    { id: 7, title: 'Sholawat Nabi', arabic: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ', latin: 'Allahumma sholli \'alaa sayyidinaa Muhammad', translation: 'Ya Allah, limpahkanlah rahmat kepada junjungan kami, Nabi Muhammad' },
    { id: 8, title: 'Sayyidul Istighfar', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ', latin: 'Allahumma anta robbii laa ilaaha illaa anta, kholaqtanii wa anaa \'abduka...', translation: 'Ya Allah, Engkau adalah Tuhanku, tiada Tuhan selain Engkau yang telah menciptakanku...' }
];

export default function ZikirScreen() {
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
                <Text style={styles.headerTitle}>Zikir Utama</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.heroCard}>
                    <LinearGradient colors={['#4f46e5', '#3730a3']} style={styles.heroGradient}>
                        <Ionicons name="rose" size={120} color="rgba(255,255,255,0.06)" style={styles.heroIcon} />
                        <Text style={styles.heroTitle}>Zikir Penenang</Text>
                        <Text style={styles.heroSubtitle}>Basahi lisan dengan zikir, agar hati senantiasa damai dan dekat dengan Sang Pencipta.</Text>
                    </LinearGradient>
                </View>

                <View style={styles.listContainer}>
                    {ZIKIR_LIST.map((zikir) => {
                        const isExpanded = expandedId === zikir.id;
                        return (
                            <Pressable key={zikir.id} onPress={() => toggleExpand(zikir.id)} style={[styles.card, isExpanded && styles.cardExpanded]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="leaf" size={18} color="#4f46e5" />
                                    </View>
                                    <Text style={styles.zikirTitle}>{zikir.title}</Text>
                                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94a3b8" />
                                </View>

                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        <Text style={styles.arabicText}>{zikir.arabic}</Text>
                                        <Text style={styles.latinText}>{zikir.latin}</Text>
                                        <Text style={styles.translationText}>{zikir.translation}</Text>
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

    heroCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, shadowColor: '#4f46e5', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5, shadowOffset: { width: 0, height: 4 } },
    heroGradient: { padding: 24, paddingVertical: 32 },
    heroIcon: { position: 'absolute', right: -20, bottom: -20, transform: [{ rotate: '-15deg' }] },
    heroTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
    heroSubtitle: { fontSize: 14, color: '#eef2ff', lineHeight: 22, opacity: 0.9, paddingRight: 40 },

    listContainer: { gap: 12 },
    card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
    cardExpanded: { borderColor: '#eef2ff', backgroundColor: '#ffffff' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
    zikirTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a' },

    expandedContent: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    arabicText: { fontSize: 32, color: '#0f172a', textAlign: 'right', lineHeight: 60, marginBottom: 16, fontFamily: 'Amiri_700Bold', paddingTop: 8 },
    latinText: { fontSize: 14, color: '#0ea5e9', fontStyle: 'italic', marginBottom: 12, lineHeight: 22 },
    translationText: { fontSize: 15, color: '#475569', lineHeight: 24 }
});
