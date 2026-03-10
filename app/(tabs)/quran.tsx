import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function QuranScreen() {
  const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold });
  const [activeTab, setActiveTab] = useState<'surat' | 'juz'>('surat');

  const [surahs, setSurahs] = useState<SurahItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

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

    loadSurahs();
  }, []);

  const juzList = Array.from({ length: 30 }, (_, i) => i + 1);

  const filteredSurahs = surahs.filter(surah => {
    const indoName = IndonesianSurahNames[surah.number - 1] || surah.englishName;
    return indoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.number.toString() === searchQuery;
  });

  const filteredJuz = juzList.filter(juz =>
    juz.toString().includes(searchQuery) ||
    `juz ${juz}`.includes(searchQuery.toLowerCase())
  );

  if (!fontsLoaded || loading && surahs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ minHeight: height }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Massive Overlapping Header */}
        <LinearGradient
          colors={['#0f766e', '#115e59', '#134e4a']}
          style={[styles.scrollableHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.decorativeCircle, { top: -40, right: -60 }]} />
          <View style={[styles.decorativeCircleSmall, { top: 120, left: -20 }]} />

          <View style={styles.headerContent}>
            <Text style={styles.headline}>Al-Quran</Text>
            <Text style={styles.subtitle}>Selamat membaca, hamba Allah.</Text>

            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" color="#64748b" size={22} style={{ marginRight: 14 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={activeTab === 'surat' ? "Cari Surat (Yasin, 36)" : "Cari Juz (30)"}
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setActiveTab('surat'); setSearchQuery(''); }}
                style={[styles.tabButton, activeTab === 'surat' && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, activeTab === 'surat' && styles.tabTextActive]}>Surat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setActiveTab('juz'); setSearchQuery(''); }}
                style={[styles.tabButton, activeTab === 'juz' && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, activeTab === 'juz' && styles.tabTextActive]}>Juz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* List Content Overlapping the Header */}
        <View style={styles.listArea}>
          {activeTab === 'surat' ? (
            filteredSurahs.length > 0 ? (
              filteredSurahs.map((surah) => (
                <Link key={surah.number} href={`/quran/${surah.number}` as any} asChild>
                  {/* TouchableOpacity guarantees the solid style is rendered without CloneElement bugs */}
                  <TouchableOpacity activeOpacity={0.7} style={styles.cardSolid}>

                    <View style={styles.numberBadgeContainer}>
                      <LinearGradient colors={['#e0f2fe', '#bae6fd']} style={styles.numberBadge}>
                        <Text style={styles.numberText}>{surah.number}</Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.infoBlock}>
                      <Text style={styles.surahName} numberOfLines={1}>{IndonesianSurahNames[surah.number - 1] || surah.englishName}</Text>
                      <View style={styles.surahMetaRow}>
                        <Text style={styles.surahMeta}>
                          {surah.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah'} • {surah.numberOfAyahs} Ayat
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.arabicText}>{surah.name.replace('سُورَةُ ', '')}</Text>

                  </TouchableOpacity>
                </Link>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>Surat tidak ditemukan</Text>
              </View>
            )
          ) : (
            filteredJuz.length > 0 ? (
              filteredJuz.map((juz) => (
                <Link key={juz} href={`/quran/juz/${juz}` as any} asChild>
                  <TouchableOpacity activeOpacity={0.7} style={styles.cardSolid}>

                    <View style={styles.numberBadgeContainer}>
                      <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.numberBadge}>
                        <Text style={[styles.numberText, { color: '#d97706' }]}>{juz}</Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.infoBlock}>
                      <Text style={styles.surahName}>Juz {juz}</Text>
                      <Text style={styles.surahMeta}>Baca Keseluruhan Juz {juz}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />

                  </TouchableOpacity>
                </Link>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>Juz tidak ditemukan</Text>
              </View>
            )
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },

  scrollableHeader: {
    width: '100%',
    paddingBottom: 72, // Extra padding for overlap
    overflow: 'hidden'
  },
  decorativeCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)' },
  decorativeCircleSmall: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },

  headerContent: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 16 },
  headline: { fontSize: 40, fontWeight: '900', color: '#ffffff', letterSpacing: -1.2, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#ccfbf1', fontWeight: '500', marginBottom: 28, opacity: 0.9 },

  searchContainer: { flexDirection: 'row', marginBottom: 24 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    paddingHorizontal: 20, paddingVertical: 18, borderRadius: 24,
    shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 25, elevation: 8, shadowOffset: { width: 0, height: 12 }
  },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '600', height: '100%' },

  tabContainer: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 6,
  },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 6, shadowOffset: { width: 0, height: 6 }
  },
  tabText: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  tabTextActive: { color: '#0f766e', fontWeight: '800' },

  listArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    marginTop: -32, // Creates the massive overlap effect perfectly
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },

  /* 
   * Strict Card Styling 
   * Solid white background, elevated, with robust borders.
   * Replaced Pressable with TouchableOpacity to guarantee styles don't get stripped.
   */
  cardSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, shadowOffset: { width: 0, height: 8 },
    borderWidth: 1, borderColor: '#e2e8f0',
  },

  numberBadgeContainer: {
    marginRight: 16,
    shadowColor: '#bae6fd', shadowOpacity: 0.8, shadowRadius: 12, elevation: 4, shadowOffset: { width: 0, height: 6 }
  },
  numberBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 16, fontWeight: '900', color: '#0369a1' },

  infoBlock: { flex: 1, justifyContent: 'center', marginRight: 16 },
  surahName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 },
  surahMetaRow: { flexDirection: 'row', alignItems: 'center' },
  surahMeta: { fontSize: 13, color: '#64748b', fontWeight: '600' },

  arabicText: { fontSize: 32, color: '#0f766e', fontFamily: 'Amiri_700Bold', lineHeight: 60, textAlign: 'right', paddingTop: 8 },

  emptyContainer: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' }
});
