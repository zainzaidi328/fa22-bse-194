import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SURAH_KEY = 'surahData';
const LAST_READ_KEY = 'lastReadAyah';

const QuranApp = () => {
  const [surahData, setSurahData] = useState<any[]>([]);
  const [lastReadAyah, setLastReadAyah] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSurah, setExpandedSurah] = useState<number | null>(null); 
  const [ayahData, setAyahData] = useState<{ [key: number]: any[] }>({}); 

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedSurahData = await AsyncStorage.getItem(SURAH_KEY);
        const cachedLastReadAyah = await AsyncStorage.getItem(LAST_READ_KEY);

        if (cachedSurahData && cachedLastReadAyah) {
          setSurahData(JSON.parse(cachedSurahData));
          setLastReadAyah(cachedLastReadAyah);
          setLoading(false);
        }
        fetchDataFromAPI();
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadData();
  }, []);

  const fetchDataFromAPI = async () => {
    try {
      const surahResponse = await fetch('https://api.alquran.cloud/v1/surah');
      const surahDataJson = await surahResponse.json();

      const ayahResponse = await fetch('https://api.alquran.cloud/v1/ayah/262/en.asad');
      const ayahDataJson = await ayahResponse.json();

      if (surahDataJson.status === 'OK' && ayahDataJson.status === 'OK') {
        setSurahData(surahDataJson.data);
        setLastReadAyah(ayahDataJson.data.text);

        await AsyncStorage.setItem(SURAH_KEY, JSON.stringify(surahDataJson.data));
        await AsyncStorage.setItem(LAST_READ_KEY, ayahDataJson.data.text);
      }

      setLoading(false);
    } catch (error) {
      if (!surahData.length) {
        Alert.alert('Offline Mode', 'Unable to fetch data, showing cached data.');
      }
      setLoading(false);
    }
  };

  const fetchAyahs = async (surahNumber: number) => {
    if (ayahData[surahNumber]) {
      setExpandedSurah(surahNumber === expandedSurah ? null : surahNumber); // Toggle if already fetched
    } else {
      try {
        // Fetch ayahs in English translation
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad`);
        const data = await response.json();

        if (data.status === 'OK') {
          setAyahData((prevState) => ({
            ...prevState,
            [surahNumber]: data.data.ayahs, // Store ayahs for this surah
          }));
          setExpandedSurah(surahNumber);
        }
      } catch (error) {
        console.error('Error fetching ayahs:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D44B8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Assalamu Alaikum</Text>
        <Text style={styles.username}>Tanvir Ahassan</Text>
      </View>

      <View style={styles.lastReadCard}>
        <View style={styles.lastReadContent}>
          <Text style={styles.lastReadText}>Last Read</Text>
          <Text style={styles.surahName}>Ayah: 262 (Al-Baqarah)</Text>
          <Text style={styles.ayahText}>{lastReadAyah}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <Text style={styles.tabTextActive}>Surah</Text>
        <Text style={styles.tabText}>Para</Text>
        <Text style={styles.tabText}>Page</Text>
        <Text style={styles.tabText}>Hijb</Text>
      </View>

      <View style={styles.surahList}>
        {surahData.map((surah, index) => (
          <View key={index}>
            <TouchableOpacity
              style={styles.surahItem}
              onPress={() => fetchAyahs(surah.number)}
            >
              <View style={styles.surahInfo}>
                <Text style={styles.surahNameList}>{surah.englishName}</Text>
                <Text style={styles.surahDetails}>{surah.revelationType} - {surah.numberOfAyahs} Verses</Text>
              </View>
              <Text style={styles.surahArabic}>{surah.name}</Text>
            </TouchableOpacity>

            {/* Show Ayahs if this Surah is expanded */}
            {expandedSurah === surah.number && ayahData[surah.number] && (
              <View style={styles.ayahList}>
                {ayahData[surah.number].map((ayah, ayahIndex) => (
                  <Text key={ayahIndex} style={styles.ayahText}>
                    {ayah.numberInSurah}. {ayah.text}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#555',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  lastReadCard: {
    backgroundColor: '#E0CFF2',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 20,
  },
  lastReadContent: {
    flex: 1,
  },
  lastReadText: {
    color: '#555',
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  ayahText: {
    fontSize: 14,
    color: '#555',
    marginTop: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  tabTextActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6D44B8',
  },
  tabText: {
    fontSize: 16,
    color: '#AAA',
  },
  surahList: {
    marginTop: 10,
  },
  surahItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  surahInfo: {
    flexDirection: 'column',
  },
  surahNameList: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  surahDetails: {
    color: '#555',
    marginTop: 5,
  },
  surahArabic: {
    fontSize: 18,
    color: '#6D44B8',
  },
  ayahList: {
    paddingLeft: 20,
    paddingBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuranApp;
