import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RouteCard } from '@/components/route-card';
import { AppColors, Shadow } from '@/constants/app-theme';
import { API_BASE_URL } from '@/constants/api';
import { useAppState } from '../../context/app-state';

export default function ProfileScreen() {
  const {
    user,
    places,
    routes,
    isLoading,
    isOfflineFallback,
    error,
    login,
    logout,
    register,
    refreshData,
    togglePremium,
  } = useAppState();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('eve@example.com');
  const [nickname, setNickname] = useState('eve_mobile');
  const [password, setPassword] = useState('1234');

  const handleSubmit = async () => {
    if (isRegisterMode) {
      await register(email, nickname, password);
    } else {
      await login(email, password);
    }
  };

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>{isRegisterMode ? 'Регистрация' : 'Вход'}</Text>
          <Text style={styles.authText}>Backend: {API_BASE_URL}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={AppColors.textMuted}
          />
          {isRegisterMode ? (
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              placeholder="Никнейм"
              placeholderTextColor={AppColors.textMuted}
            />
          ) : null}
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Пароль"
            placeholderTextColor={AppColors.textMuted}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Подключаемся...' : isRegisterMode ? 'Создать аккаунт' : 'Войти'}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setIsRegisterMode((value) => !value)}>
            <Text style={styles.secondaryButtonText}>
              {isRegisterMode ? 'У меня уже есть аккаунт' : 'Зарегистрироваться'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <View style={styles.profileBody}>
          <Text style={styles.nickname}>@{user.nickname}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.rating}</Text>
              <Text style={styles.statLabel}>рейтинг</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{routes.length}</Text>
              <Text style={styles.statLabel}>маршрута</Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.premiumButton, user.isPremium && styles.premiumButtonActive]}
              onPress={togglePremium}
              disabled={isLoading}>
              <Text style={[styles.premiumButtonText, user.isPremium && styles.premiumButtonTextActive]}>
                {user.isPremium ? 'Премиум активен' : 'Получить премиум'}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={logout}>
              <Text style={styles.secondaryButtonText}>Выйти</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {isOfflineFallback ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Данные из fallback</Text>
          <Text style={styles.warningText}>
            Backend недоступен или вернул ошибку. Проверь URL и запусти сервис.
          </Text>
          <Pressable style={styles.secondaryButton} onPress={refreshData}>
            <Text style={styles.secondaryButtonText}>Повторить загрузку</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.premiumInfo}>
        <Text style={styles.premiumTitle}>Что даёт премиум</Text>
        <Text style={styles.premiumText}>
          Построение маршрутов, сохранение в профиль, публикация как пост и отправка маршрутов в сообщения.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Мои маршруты</Text>
        <View style={styles.list}>
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} places={places} />
          ))}
        </View>
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
  authCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 16,
    ...Shadow,
  },
  authTitle: {
    color: AppColors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  authText: {
    color: AppColors.textMuted,
    fontSize: 13,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    color: AppColors.text,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  profileCard: {
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
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  profileBody: {
    flex: 1,
    gap: 8,
  },
  nickname: {
    color: AppColors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  email: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    minWidth: 78,
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
    padding: 10,
  },
  statValue: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: AppColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: AppColors.text,
    fontWeight: '900',
  },
  premiumButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  premiumButtonActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  premiumButtonText: {
    color: AppColors.text,
    fontWeight: '900',
  },
  premiumButtonTextActive: {
    color: '#ffffff',
  },
  warningBox: {
    gap: 8,
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
    lineHeight: 20,
  },
  errorText: {
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    color: AppColors.danger,
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  premiumInfo: {
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 14,
  },
  premiumTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  premiumText: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  list: {
    gap: 12,
  },
});
