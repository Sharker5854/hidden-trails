import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import { AppColors, Shadow } from '@/constants/app-theme';
import { Place } from '@/lib/mock-data';
import { useAppState } from '../../context/app-state';

function buildMapHtml(places: Place[], selectedPlaceId: number | null) {
  const safePlaces = JSON.stringify(
    places.map((place) => ({
      id: place.id,
      title: place.title,
      author: place.author,
      latitude: place.latitude,
      longitude: place.longitude,
    }))
  ).replace(/</g, '\\u003c');
  const center = places[0] || { latitude: 55.751244, longitude: 37.618423 };

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <link href="https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
    body { background: #dfe9dc; }
    .marker {
      width: 34px;
      height: 34px;
      border: 2px solid #fff;
      border-radius: 17px;
      background: #0f766e;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font: 800 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 8px 20px rgba(15, 118, 110, 0.35);
      transform-origin: center bottom;
    }
    .marker.active {
      background: #b45309;
      transform: scale(1.18);
    }
    .maplibregl-ctrl-bottom-left,
    .maplibregl-ctrl-bottom-right { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.js"></script>
  <script>
    const places = ${safePlaces};
    const selectedPlaceId = ${selectedPlaceId || 'null'};
    const post = (payload) => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    };

    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://demotiles.maplibre.org/style.json',
      center: [${center.longitude}, ${center.latitude}],
      zoom: 11.5,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    places.forEach((place, index) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'marker' + (place.id === selectedPlaceId ? ' active' : '');
      element.textContent = String(index + 1);
      element.setAttribute('aria-label', place.title);
      element.addEventListener('click', () => {
        document.querySelectorAll('.marker').forEach((item) => item.classList.remove('active'));
        element.classList.add('active');
        map.easeTo({ center: [place.longitude, place.latitude], zoom: Math.max(map.getZoom(), 13), duration: 550 });
        post({ type: 'place', id: place.id });
      });

      new maplibregl.Marker({ element, anchor: 'bottom' })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);
    });

    map.on('load', () => post({ type: 'ready' }));
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const { places, selectedPlaceId, selectPlace } = useAppState();
  const router = useRouter();
  const [expandedPlaceId, setExpandedPlaceId] = useState<number | null>(selectedPlaceId);
  const expandedPlace = places.find((place) => place.id === expandedPlaceId) || null;
  const mapHtml = useMemo(
    () => buildMapHtml(places, expandedPlaceId || selectedPlaceId),
    [expandedPlaceId, places, selectedPlaceId]
  );

  const openPlace = (placeId: number) => {
    selectPlace(placeId);
    router.push({
      pathname: '/place/[id]',
      params: { id: String(placeId) },
    });
  };

  const openAuthor = (place: Place) => {
    if (!place.authorId) return;

    router.push({
      pathname: '/user/[id]',
      params: { id: String(place.authorId) },
    });
  };

  if (places.length === 0) {
    return (
      <View style={[styles.screen, styles.emptyScreen]}>
        <Text style={styles.title}>Карта мест</Text>
        <Text style={styles.subtitle}>Мест пока нет. Создай первую геометку на backend.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <WebView
        key={places.map((place) => place.id).join('-')}
        style={styles.map}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        source={{ html: mapHtml }}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data);
            if (payload.type === 'place') {
              setExpandedPlaceId(Number(payload.id));
              selectPlace(Number(payload.id));
            }
          } catch {
            // Ignore malformed WebView messages.
          }
        }}
      />

      <View style={styles.headerOverlay}>
        <Text style={styles.overlayTitle}>Карта мест</Text>
        <Text style={styles.overlayText}>MapLibre: масштабируй, двигай карту и открывай карточки.</Text>
      </View>

      {expandedPlace ? (
        <View style={styles.placeSheet}>
          <Image source={{ uri: expandedPlace.image }} style={styles.sheetImage} />
          <View style={styles.sheetBody}>
            <Text style={styles.sheetArea}>{expandedPlace.area}</Text>
            <Text style={styles.sheetTitle}>{expandedPlace.title}</Text>
            <Pressable onPress={() => openAuthor(expandedPlace)}>
              <Text style={styles.author}>@{expandedPlace.author}</Text>
            </Pressable>
            <Text style={styles.sheetDescription} numberOfLines={2}>
              {expandedPlace.description}
            </Text>
            <View style={styles.sheetActions}>
              <Pressable style={styles.primaryButton} onPress={() => openPlace(expandedPlace.id)}>
                <Text style={styles.primaryButtonText}>Открыть статью</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => setExpandedPlaceId(null)}>
                <Text style={styles.secondaryButtonText}>Свернуть</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  emptyScreen: {
    justifyContent: 'center',
    gap: 10,
    padding: 18,
  },
  map: {
    flex: 1,
    backgroundColor: '#dfe9dc',
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
  headerOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 56,
    gap: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 12,
    ...Shadow,
  },
  overlayTitle: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  overlayText: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  placeSheet: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    ...Shadow,
  },
  sheetImage: {
    width: 116,
    backgroundColor: AppColors.surfaceMuted,
  },
  sheetBody: {
    flex: 1,
    gap: 6,
    padding: 12,
  },
  sheetArea: {
    color: AppColors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  author: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  sheetDescription: {
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  sheetActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
});
