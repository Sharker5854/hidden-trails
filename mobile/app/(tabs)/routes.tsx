import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlaceCard } from '@/components/place-card';
import { RouteCard } from '@/components/route-card';
import { AppColors, Shadow } from '@/constants/app-theme';
import { useAppState } from '../../context/app-state';

export default function RoutesScreen() {
  const { places, routes, user, saveRoute, publishRoute, error } = useAppState();
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<number[]>(
    places.slice(0, 2).map((place) => place.id)
  );
  const [mapPoints, setMapPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [mode, setMode] = useState<'places' | 'map'>('places');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(routes[0]?.id || null);

  const selectedRoute = routes.find((route) => route.id === selectedRouteId) || routes[0];
  const placesAlongRoute = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.placeIds
      .map((placeId) => places.find((place) => place.id === placeId))
      .filter(Boolean);
  }, [places, selectedRoute]);

  const togglePlace = (placeId: number) => {
    setSelectedPlaceIds((currentIds) =>
      currentIds.includes(placeId)
        ? currentIds.filter((id) => id !== placeId)
        : [...currentIds, placeId]
    );
  };

  const addMapPoint = () => {
    if (places.length === 0) return;
    const nextPlace = places[mapPoints.length % places.length];
    setMapPoints((currentPoints) => [
      ...currentPoints,
      {
        latitude: nextPlace.latitude,
        longitude: nextPlace.longitude,
      },
    ]);
  };

  const handleSave = async (isPublic: boolean) => {
    if (!user?.isPremium) return;

    const placeIds =
      mode === 'places'
        ? selectedPlaceIds
        : places
            .slice(0, Math.max(1, mapPoints.length))
            .map((place) => place.id);
    const route = await saveRoute({
      title: mode === 'places' ? 'Маршрут из карточек' : 'Маршрут A-Б',
      description:
        mode === 'places'
          ? 'Путь собран из выбранных мест.'
          : 'Путь построен по точкам на карте, карточки подобраны по дороге.',
      distanceKm: Number((placeIds.length * 2.4 + 0.8).toFixed(1)),
      durationMin: placeIds.length * 28,
      mode: 'walk',
      isPublic,
      placeIds,
      points:
        mode === 'places'
          ? placeIds.map((placeId) => {
              const place = places.find((item) => item.id === placeId) || places[0];
              if (!place) {
                return { latitude: 0, longitude: 0 };
              }
              return { latitude: place.latitude, longitude: place.longitude };
            })
          : mapPoints,
    });
    setSelectedRouteId(route.id);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Маршруты</Text>
        <Text style={styles.subtitle}>
          Премиум открывает построение маршрутов по карточкам и точкам A-Б на карте.
        </Text>
      </View>

      {!user ? (
        <View style={styles.locked}>
          <Text style={styles.lockedTitle}>Нужно войти</Text>
          <Text style={styles.lockedText}>
            Авторизуйся в профиле, чтобы строить маршруты через backend.
          </Text>
        </View>
      ) : null}

      {user && !user.isPremium ? (
        <View style={styles.locked}>
          <Text style={styles.lockedTitle}>Нужен премиум</Text>
          <Text style={styles.lockedText}>
            Включи премиум в профиле, чтобы строить и сохранять маршруты.
          </Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.builder}>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, mode === 'places' && styles.modeButtonActive]}
            onPress={() => setMode('places')}>
            <Text style={[styles.modeText, mode === 'places' && styles.modeTextActive]}>
              По карточкам
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mode === 'map' && styles.modeButtonActive]}
            onPress={() => setMode('map')}>
            <Text style={[styles.modeText, mode === 'map' && styles.modeTextActive]}>
              Точки A-Б
            </Text>
          </Pressable>
        </View>

        {mode === 'places' ? (
          <View style={styles.optionGrid}>
            {places.map((place) => {
              const isSelected = selectedPlaceIds.includes(place.id);
              return (
                <Pressable
                  key={place.id}
                  style={[styles.placeOption, isSelected && styles.placeOptionActive]}
                  onPress={() => togglePlace(place.id)}>
                  <Text style={[styles.placeOptionText, isSelected && styles.placeOptionTextActive]}>
                    {place.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.mapBuilder}>
            <View style={styles.miniMap}>
              <View style={styles.routeLine} />
              {mapPoints.map((point, index) => (
                <Text
                  key={`${point.latitude}-${point.longitude}-${index}`}
                  style={[
                    styles.mapPoint,
                    {
                      left: 34 + index * 62,
                      top: index % 2 === 0 ? 64 : 132,
                    },
                  ]}>
                  {index === 0 ? 'A' : index === mapPoints.length - 1 ? 'Б' : index + 1}
                </Text>
              ))}
            </View>
            <View style={styles.mapActions}>
              <Pressable style={styles.secondaryButton} onPress={addMapPoint}>
                <Text style={styles.secondaryButtonText}>Добавить точку</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => setMapPoints([])}>
                <Text style={styles.secondaryButtonText}>Очистить</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, !user?.isPremium && styles.disabledButton]}
            disabled={!user?.isPremium}
            onPress={() => handleSave(false)}>
            <Text style={styles.primaryButtonText}>Сохранить</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, !user?.isPremium && styles.disabledButton]}
            disabled={!user?.isPremium}
            onPress={() => handleSave(true)}>
            <Text style={styles.secondaryButtonText}>Сохранить как пост</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Мои маршруты</Text>
        <View style={styles.routesList}>
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              places={places}
              onPress={() => setSelectedRouteId(route.id)}
            />
          ))}
        </View>
      </View>

      {selectedRoute ? (
        <View style={styles.section}>
          <View style={styles.selectedHeader}>
            <Text style={styles.sectionTitle}>Карточки по пути</Text>
            {!selectedRoute.isPublic ? (
              <Pressable style={styles.smallButton} onPress={() => publishRoute(selectedRoute.id)}>
                <Text style={styles.smallButtonText}>В пост</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
            {placesAlongRoute.map((place) => (
              place ? <PlaceCard key={place.id} place={place} compact /> : null
            ))}
          </ScrollView>
        </View>
      ) : null}
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
    lineHeight: 23,
  },
  locked: {
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1c27d',
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    padding: 14,
  },
  lockedTitle: {
    color: AppColors.accent,
    fontSize: 17,
    fontWeight: '900',
  },
  lockedText: {
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
  builder: {
    gap: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    padding: 14,
    ...Shadow,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    padding: 12,
  },
  modeButtonActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary,
  },
  modeText: {
    color: AppColors.text,
    textAlign: 'center',
    fontWeight: '800',
  },
  modeTextActive: {
    color: '#ffffff',
  },
  optionGrid: {
    gap: 8,
  },
  placeOption: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
    padding: 12,
  },
  placeOptionActive: {
    borderColor: AppColors.primary,
    backgroundColor: '#d9f2ea',
  },
  placeOptionText: {
    color: AppColors.text,
    fontWeight: '700',
  },
  placeOptionTextActive: {
    color: AppColors.primaryDark,
  },
  mapBuilder: {
    gap: 12,
  },
  miniMap: {
    height: 220,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#dfe9dc',
  },
  routeLine: {
    position: 'absolute',
    left: 38,
    top: 112,
    width: 260,
    height: 8,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    transform: [{ rotate: '-12deg' }],
  },
  mapPoint: {
    position: 'absolute',
    width: 34,
    height: 34,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 17,
    backgroundColor: AppColors.accent,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 30,
    textAlign: 'center',
  },
  mapActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: AppColors.text,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.48,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  routesList: {
    gap: 12,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  smallButton: {
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  horizontalCards: {
    gap: 12,
    paddingRight: 18,
  },
});
