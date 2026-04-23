import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppColors, Shadow } from '@/constants/app-theme';
import { getTopUsersRequest, getUsersPageRequest, searchUsersRequest } from '@/lib/api';
import { users as seedUsers, UserMini } from '@/lib/mock-data';
import { normalizeUsers } from '@/lib/normalizers';
import { useAppState } from '../../context/app-state';

export default function PeopleScreen() {
  const { token, error } = useAppState();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [topUsers, setTopUsers] = useState<UserMini[]>(seedUsers);
  const [users, setUsers] = useState<UserMini[]>(seedUsers);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!token) {
      setTopUsers(seedUsers);
      setUsers(seedUsers);
      return;
    }

    Promise.all([getTopUsersRequest(token), getUsersPageRequest(token)])
      .then(([topData, usersData]) => {
        const loadedTopUsers = normalizeUsers(topData?.users);
        const loadedUsers = normalizeUsers(usersData?.users);
        setTopUsers(loadedTopUsers.length > 0 ? loadedTopUsers : seedUsers);
        setUsers(loadedUsers.length > 0 ? loadedUsers : seedUsers);
      })
      .catch(() => {
        setTopUsers(seedUsers);
        setUsers(seedUsers);
      });
  }, [token]);

  const openProfile = (userId: number) => {
    router.push({
      pathname: '/user/[id]',
      params: { id: String(userId) },
    });
  };

  const handleSearch = async () => {
    if (!token || !query.trim()) return;

    setIsSearching(true);
    try {
      const data = await searchUsersRequest(token, query.trim());
      setUsers(normalizeUsers(data?.users));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Люди</Text>
        <Text style={styles.subtitle}>Топ авторов, поиск и переходы в профили.</Text>
      </View>

      {!token ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Нужно войти</Text>
          <Text style={styles.warningText}>Пока показываем демо-людей. После входа будет backend-список.</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Топ пользователей</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topList}>
          {topUsers.map((user, index) => (
            <Pressable key={user.id} style={styles.topCard} onPress={() => openProfile(user.id)}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Image source={{ uri: user.avatar }} style={styles.topAvatar} />
              <Text style={styles.topNickname} numberOfLines={1}>@{user.nickname}</Text>
              <Text style={styles.rating}>{user.rating} баллов</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          placeholder="Никнейм"
          placeholderTextColor={AppColors.textMuted}
          onSubmitEditing={handleSearch}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} disabled={isSearching || !token}>
          <Text style={styles.searchButtonText}>{isSearching ? '...' : 'Найти'}</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {users.map((user) => (
          <Pressable key={user.id} style={styles.userRow} onPress={() => openProfile(user.id)}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={styles.userBody}>
              <Text style={styles.nickname}>@{user.nickname}</Text>
              <Text style={styles.rating}>{user.rating} баллов</Text>
            </View>
            <Text style={styles.openText}>Открыть</Text>
          </Pressable>
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
  title: {
    color: AppColors.text,
    fontSize: 31,
    fontWeight: '900',
  },
  subtitle: {
    color: AppColors.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  warningBox: {
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1c27d',
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    padding: 14,
  },
  warningTitle: {
    color: AppColors.accent,
    fontSize: 17,
    fontWeight: '900',
  },
  warningText: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
  errorText: {
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    color: AppColors.danger,
    padding: 12,
    fontSize: 14,
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
  topList: {
    gap: 12,
    paddingRight: 18,
  },
  topCard: {
    width: 154,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 12,
    ...Shadow,
  },
  rank: {
    alignSelf: 'flex-start',
    color: AppColors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  topAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  topNickname: {
    maxWidth: '100%',
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    color: AppColors.text,
    paddingHorizontal: 12,
  },
  searchButton: {
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  list: {
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 12,
    ...Shadow,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  userBody: {
    flex: 1,
    gap: 4,
  },
  nickname: {
    color: AppColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  rating: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  openText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
});
