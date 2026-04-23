import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PlaceCard } from '@/components/place-card';
import { AppColors } from '@/constants/app-theme';
import { useAppState } from '../../context/app-state';

export default function FeedScreen() {
  const { places, selectPlace } = useAppState();
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Hidden Trails</Text>
        <Text style={styles.title}>Места, которые хочется найти самому</Text>
        <Text style={styles.subtitle}>
          Лента геометок с подсказками, предупреждениями и живыми карточками маршрутов.
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{places.length}</Text>
          <Text style={styles.statLabel}>места</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>тем</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>км рядом</Text>
        </View>
      </View>

      <View style={styles.list}>
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onPress={() => {
              selectPlace(place.id);
              router.push({
                pathname: '/place/[id]',
                params: { id: String(place.id) },
              });
            }}
            onAuthorPress={() => {
              if (place.authorId) {
                router.push({
                  pathname: '/user/[id]',
                  params: { id: String(place.authorId) },
                });
              }
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    gap: 18,
    padding: 18,
    paddingTop: 58,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: AppColors.text,
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 36,
  },
  subtitle: {
    color: AppColors.textMuted,
    fontSize: 16,
    lineHeight: 23,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 12,
  },
  statValue: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: AppColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 16,
  },
});
