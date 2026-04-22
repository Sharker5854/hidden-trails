import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors, Shadow } from '@/constants/app-theme';
import { Place, TrailRoute } from '@/lib/mock-data';

const modeLabel = {
  walk: 'Пешком',
  bicycle: 'Велосипед',
  drive: 'Авто',
};

type RouteCardProps = {
  route: TrailRoute;
  places: Place[];
  onPress?: () => void;
};

export function RouteCard({ route, places, onPress }: RouteCardProps) {
  const routePlaces = route.placeIds
    .map((placeId) => places.find((place) => place.id === placeId))
    .filter(Boolean) as Place[];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{route.title}</Text>
        <Text style={[styles.badge, route.isPublic && styles.badgePublic]}>
          {route.isPublic ? 'Пост' : 'Профиль'}
        </Text>
      </View>
      <Text style={styles.description}>{route.description}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>{route.distanceKm} км</Text>
        <Text style={styles.stat}>{route.durationMin} мин</Text>
        <Text style={styles.stat}>{modeLabel[route.mode]}</Text>
      </View>
      <View style={styles.points}>
        {routePlaces.map((place, index) => (
          <View key={place.id} style={styles.pointRow}>
            <Text style={styles.pointIndex}>{index + 1}</Text>
            <Text style={styles.pointTitle}>{place.title}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 16,
    ...Shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
    color: AppColors.textMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '800',
  },
  badgePublic: {
    backgroundColor: AppColors.primary,
    color: '#ffffff',
  },
  description: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
    color: AppColors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '800',
  },
  points: {
    gap: 8,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointIndex: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '900',
  },
  pointTitle: {
    flex: 1,
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
