import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PlaceCard } from '@/components/place-card';
import { AppColors, Shadow } from '@/constants/app-theme';
import { getUserProfileRequest } from '@/lib/api';
import { Place, users as seedUsers } from '@/lib/mock-data';
import { normalizePublicProfile } from '@/lib/normalizers';
import { useAppState } from '../../context/app-state';

type PublicProfile = {
  id: number;
  nickname: string;
  avatar: string;
  rating: number;
  name: string;
  surname: string;
  followersCount: number;
  followingCount: number;
  geotags: Place[];
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, places, selectPlace } = useAppState();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = Number(id);
    if (!userId) return;

    if (!token) {
      const fallbackUser = seedUsers.find((user) => user.id === userId);
      if (fallbackUser) {
        setProfile({
          id: fallbackUser.id,
          nickname: fallbackUser.nickname,
          avatar: fallbackUser.avatar,
          rating: fallbackUser.rating,
          name: '',
          surname: '',
          followersCount: 0,
          followingCount: 0,
          geotags: places.filter((place) => place.authorId === fallbackUser.id),
        });
      }
      return;
    }

    getUserProfileRequest(token, userId)
      .then((data) => setProfile(normalizePublicProfile(data)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось открыть профиль.'));
  }, [id, places, token]);

  if (!profile) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>Профиль не найден</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        <View style={styles.headerBody}>
          <Text style={styles.nickname}>@{profile.nickname}</Text>
          <Text style={styles.name}>{[profile.name, profile.surname].filter(Boolean).join(' ') || 'Путешественник'}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.rating}</Text>
              <Text style={styles.statLabel}>рейтинг</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.followersCount}</Text>
              <Text style={styles.statLabel}>читателей</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.geotags.length}</Text>
              <Text style={styles.statLabel}>статей</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статьи пользователя</Text>
        {profile.geotags.length > 0 ? (
          profile.geotags.map((place) => (
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
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Пользователь пока не написал статей.</Text>
        )}
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
  headerCard: {
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 16,
    ...Shadow,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  headerBody: {
    flex: 1,
    gap: 8,
  },
  nickname: {
    color: AppColors.text,
    fontSize: 25,
    fontWeight: '900',
  },
  name: {
    color: AppColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statValue: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: AppColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyText: {
    color: AppColors.textMuted,
    fontSize: 15,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    backgroundColor: AppColors.background,
  },
  title: {
    color: AppColors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  errorText: {
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    color: AppColors.danger,
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
});
