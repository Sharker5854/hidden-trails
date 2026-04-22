import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  getConversationsRequest,
  getFeedRequest,
  getMyRoutesRequest,
  getProfileRequest,
  getPublicRoutesRequest,
  loginRequest,
  publishRouteRequest,
  registerRequest,
  saveRouteRequest,
  togglePremiumRequest,
} from '@/lib/api';
import {
  normalizeConversations,
  normalizePlaces,
  normalizeRoute,
  normalizeRoutes,
  normalizeUser,
} from '@/lib/normalizers';
import {
  Conversation,
  conversations as seedConversations,
  initialRoutes,
  Place,
  places as seedPlaces,
  TrailRoute,
} from '@/lib/mock-data';

type UserProfile = {
  nickname: string;
  email: string;
  rating: number;
  isPremium: boolean;
  avatar: string;
};

type RouteDraft = Omit<TrailRoute, 'id'>;

type AppState = {
  user: UserProfile | null;
  token: string | null;
  places: Place[];
  routes: TrailRoute[];
  publicRoutes: TrailRoute[];
  conversations: Conversation[];
  selectedPlaceId: number | null;
  isLoading: boolean;
  isOfflineFallback: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nickname: string, password: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
  togglePremium: () => Promise<void>;
  saveRoute: (route: RouteDraft) => Promise<TrailRoute>;
  publishRoute: (routeId: number) => Promise<void>;
  selectPlace: (placeId: number | null) => void;
};

const AppStateContext = createContext<AppState | null>(null);

function tokenFromAuthResponse(data: any) {
  return data?.access_token || data?.accessToken || null;
}

function userFromAuthResponse(data: any) {
  return normalizeUser(data?.user) || null;
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>(seedPlaces);
  const [routes, setRoutes] = useState<TrailRoute[]>(initialRoutes);
  const [publicRoutes, setPublicRoutes] = useState<TrailRoute[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(
    async (activeToken = token) => {
      if (!activeToken) return;

      setIsLoading(true);
      setError('');

      try {
        const [profileData, feedData, myRoutesData, publicRoutesData, conversationsData] =
          await Promise.all([
            getProfileRequest(activeToken),
            getFeedRequest(activeToken),
            getMyRoutesRequest(activeToken),
            getPublicRoutesRequest(activeToken),
            getConversationsRequest(activeToken),
          ]);

        const normalizedUser = normalizeUser(profileData);
        if (normalizedUser) {
          setUser(normalizedUser);
        }
        const loadedPlaces = normalizePlaces(feedData?.geotags);
        const loadedRoutes = normalizeRoutes(myRoutesData?.routes);
        setPlaces(loadedPlaces.length > 0 ? loadedPlaces : seedPlaces);
        setRoutes(loadedRoutes.length > 0 ? loadedRoutes : []);
        setPublicRoutes(normalizeRoutes(publicRoutesData?.routes));
        setConversations(normalizeConversations(conversationsData?.conversations));
        setIsOfflineFallback(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные.');
        setIsOfflineFallback(true);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      loadData(token).catch(() => {});
    }
  }, [loadData, token]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await loginRequest(email, password);
      const authToken = tokenFromAuthResponse(data);
      const authUser = userFromAuthResponse(data);

      if (!authToken || !authUser) {
        throw new Error('Backend did not return a session.');
      }

      setToken(authToken);
      setUser(authUser);
      setIsOfflineFallback(false);
      await loadData(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  const register = useCallback(async (email: string, nickname: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await registerRequest(email, nickname, password);
      const authToken = tokenFromAuthResponse(data);
      const authUser = userFromAuthResponse(data);

      if (!authToken || !authUser) {
        throw new Error('Backend did not return a session.');
      }

      setToken(authToken);
      setUser(authUser);
      setIsOfflineFallback(false);
      await loadData(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPlaces(seedPlaces);
    setRoutes(initialRoutes);
    setPublicRoutes([]);
    setConversations(seedConversations);
    setIsOfflineFallback(true);
    setError('');
  }, []);

  const togglePremium = useCallback(async () => {
    if (!token) return;

    try {
      const data = await togglePremiumRequest(token);
      const normalizedUser = normalizeUser(data);
      if (normalizedUser) {
        setUser(normalizedUser);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить премиум.');
      throw err;
    }
  }, [token]);

  const saveRoute = useCallback(
    async (routeDraft: RouteDraft) => {
      if (!token) {
        throw new Error('Нужно войти, чтобы сохранить маршрут.');
      }

      const savedRoute = normalizeRoute(
        await saveRouteRequest(token, {
          title: routeDraft.title,
          description: routeDraft.description,
          geotagIds: routeDraft.placeIds,
          points: routeDraft.points,
          mode: routeDraft.mode,
          isPublic: routeDraft.isPublic,
        })
      );

      setRoutes((currentRoutes) => [
        savedRoute,
        ...currentRoutes.filter((route) => route.id !== savedRoute.id),
      ]);

      if (savedRoute.isPublic) {
        setPublicRoutes((currentRoutes) => [
          savedRoute,
          ...currentRoutes.filter((route) => route.id !== savedRoute.id),
        ]);
      }

      return savedRoute;
    },
    [token]
  );

  const publishRoute = useCallback(
    async (routeId: number) => {
      if (!token) return;

      const publishedRoute = normalizeRoute(await publishRouteRequest(token, routeId));
      setRoutes((currentRoutes) =>
        currentRoutes.map((route) => (route.id === publishedRoute.id ? publishedRoute : route))
      );
      setPublicRoutes((currentRoutes) => [
        publishedRoute,
        ...currentRoutes.filter((route) => route.id !== publishedRoute.id),
      ]);
    },
    [token]
  );

  const value = useMemo<AppState>(
    () => ({
      user,
      token,
      places,
      routes,
      publicRoutes,
      conversations,
      selectedPlaceId,
      isLoading,
      isOfflineFallback,
      error,
      login,
      register,
      logout,
      refreshData: () => loadData(token),
      togglePremium,
      saveRoute,
      publishRoute,
      selectPlace: setSelectedPlaceId,
    }),
    [
      conversations,
      error,
      isLoading,
      isOfflineFallback,
      loadData,
      login,
      logout,
      places,
      publicRoutes,
      publishRoute,
      register,
      routes,
      saveRoute,
      selectedPlaceId,
      token,
      togglePremium,
      user,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const state = useContext(AppStateContext);

  if (!state) {
    throw new Error('useAppState must be used inside AppStateProvider.');
  }

  return state;
}
