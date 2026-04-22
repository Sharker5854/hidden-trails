import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors, Shadow } from '@/constants/app-theme';
import { useAppState } from '../../context/app-state';

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { places } = useAppState();
  const place = places.find((item) => String(item.id) === String(id));

  if (!place) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>Место не найдено</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image source={{ uri: place.image }} style={styles.image} />
      <View style={styles.article}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Назад</Text>
        </Pressable>
        <Text style={styles.area}>{place.area}</Text>
        <Text style={styles.title}>{place.title}</Text>
        <Pressable
          style={styles.authorButton}
          onPress={() => {
            if (place.authorId) {
              router.push({
                pathname: '/user/[id]',
                params: { id: String(place.authorId) },
              });
            }
          }}>
          <Text style={styles.author}>@{place.author}</Text>
        </Pressable>
        <Text style={styles.text}>{place.description}</Text>

        <View style={styles.tags}>
          {place.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Предупреждения</Text>
          <Text style={styles.infoText}>{place.warnings || 'Особых предупреждений нет.'}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Советы</Text>
          <Text style={styles.infoText}>{place.tips || 'Автор пока не добавил советы.'}</Text>
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
    paddingBottom: 28,
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: AppColors.surfaceMuted,
  },
  article: {
    gap: 14,
    margin: 18,
    marginTop: -34,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 16,
    ...Shadow,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    color: AppColors.text,
    fontWeight: '900',
  },
  area: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: AppColors.text,
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 36,
  },
  author: {
    color: AppColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  authorButton: {
    alignSelf: 'flex-start',
  },
  text: {
    color: AppColors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
    color: AppColors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '800',
  },
  infoBlock: {
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.background,
    padding: 12,
  },
  infoTitle: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  infoText: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    padding: 18,
    backgroundColor: AppColors.background,
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
