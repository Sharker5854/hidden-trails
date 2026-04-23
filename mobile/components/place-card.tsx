import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors, Shadow } from '@/constants/app-theme';
import { Place } from '@/lib/mock-data';

type PlaceCardProps = {
  place: Place;
  onPress?: () => void;
  onAuthorPress?: () => void;
  compact?: boolean;
};

export function PlaceCard({ place, onPress, onAuthorPress, compact = false }: PlaceCardProps) {
  return (
    <Pressable style={[styles.card, compact && styles.compact]} onPress={onPress}>
      <Image source={{ uri: place.image }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.area}>{place.area}</Text>
          <Text style={styles.likes}>{place.likes}</Text>
        </View>
        <Text style={styles.title}>{place.title}</Text>
        <Pressable
          style={styles.authorButton}
          onPress={(event) => {
            event.stopPropagation();
            onAuthorPress?.();
          }}>
          <Text style={styles.author}>@{place.author}</Text>
        </Pressable>
        <Text style={styles.description} numberOfLines={compact ? 2 : 3}>
          {place.description}
        </Text>
        <View style={styles.tags}>
          {place.tags.slice(0, 3).map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    ...Shadow,
  },
  compact: {
    width: 260,
  },
  image: {
    width: '100%',
    height: 154,
    backgroundColor: AppColors.surfaceMuted,
  },
  body: {
    gap: 8,
    padding: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  area: {
    flex: 1,
    color: AppColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  likes: {
    color: AppColors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: AppColors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  description: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  authorButton: {
    alignSelf: 'flex-start',
  },
  author: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
    color: AppColors.primaryDark,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
  },
});
