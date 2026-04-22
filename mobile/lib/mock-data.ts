export type Place = {
  id: number;
  title: string;
  description: string;
  area: string;
  authorId: number;
  author: string;
  image: string;
  tags: string[];
  latitude: number;
  longitude: number;
  warnings: string;
  tips: string;
  likes: number;
};

export type TrailRoute = {
  id: number;
  title: string;
  description: string;
  distanceKm: number;
  durationMin: number;
  mode: 'walk' | 'bicycle' | 'drive';
  isPublic: boolean;
  placeIds: number[];
  points: Array<{ latitude: number; longitude: number }>;
};

export type Conversation = {
  id: number;
  partnerId: number;
  nickname: string;
  avatar: string;
  lastMessage: string;
  unread: number;
};

export type ChatMessage = {
  id: number;
  conversationId: number;
  text: string;
  isMine: boolean;
  createdAt: string | null;
};

export type UserMini = {
  id: number;
  nickname: string;
  avatar: string;
  rating: number;
};

export const places: Place[] = [
  {
    id: 1,
    title: 'Сад у старой оранжереи',
    description: 'Тихий двор с заросшими дорожками, стеклянным павильоном и лавками под липами.',
    area: 'Москва, Басманный',
    authorId: 1,
    author: 'mira_walks',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    tags: ['дворы', 'прогулка', 'история'],
    latitude: 55.765,
    longitude: 37.646,
    warnings: 'После дождя дорожки скользкие.',
    tips: 'Лучший свет утром, до 10:00.',
    likes: 184,
  },
  {
    id: 2,
    title: 'Смотровая у воды',
    description: 'Небольшой деревянный настил у реки, откуда видно закат и старый железнодорожный мост.',
    area: 'Москва, Нагатинский затон',
    authorId: 2,
    author: 'river_notes',
    image:
      'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=900&q=80',
    tags: ['вода', 'закат', 'фото'],
    latitude: 55.682,
    longitude: 37.675,
    warnings: 'Ветер сильнее, чем кажется на карте.',
    tips: 'Возьми термос и тёплую куртку.',
    likes: 97,
  },
  {
    id: 3,
    title: 'Переулок с мозаикой',
    description: 'Короткий проход между домами, где на стене сохранилась советская мозаика с птицами.',
    area: 'Москва, Замоскворечье',
    authorId: 3,
    author: 'tile_hunter',
    image:
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
    tags: ['арт', 'архитектура', 'короткий маршрут'],
    latitude: 55.735,
    longitude: 37.631,
    warnings: 'Проход закрывают поздно вечером.',
    tips: 'Смотри вверх: рядом есть вывеска начала XX века.',
    likes: 231,
  },
  {
    id: 4,
    title: 'Лесная тропа за станцией',
    description: 'Петляющая грунтовая тропа через сосны, ручей и небольшую поляну.',
    area: 'Подмосковье',
    authorId: 4,
    author: 'north_path',
    image:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
    tags: ['лес', 'тишина', 'выходные'],
    latitude: 55.92,
    longitude: 37.52,
    warnings: 'После 18:00 быстро темнеет.',
    tips: 'Скачай офлайн-карту заранее.',
    likes: 143,
  },
];

export const initialRoutes: TrailRoute[] = [
  {
    id: 1,
    title: 'Дворы и мозаики',
    description: 'Неспешный городской маршрут через тихие места и короткие остановки.',
    distanceKm: 4.8,
    durationMin: 72,
    mode: 'walk',
    isPublic: true,
    placeIds: [1, 3],
    points: [
      { latitude: 55.765, longitude: 37.646 },
      { latitude: 55.735, longitude: 37.631 },
    ],
  },
  {
    id: 2,
    title: 'К воде к закату',
    description: 'Маршрут для вечера, когда хочется уйти от шума.',
    distanceKm: 2.1,
    durationMin: 34,
    mode: 'walk',
    isPublic: false,
    placeIds: [2],
    points: [
      { latitude: 55.69, longitude: 37.66 },
      { latitude: 55.682, longitude: 37.675 },
    ],
  },
];

export const conversations: Conversation[] = [
  {
    id: 1,
    partnerId: 1,
    nickname: 'mira_walks',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    lastMessage: 'Пойдём по маршруту в субботу?',
    unread: 2,
  },
  {
    id: 2,
    partnerId: 2,
    nickname: 'river_notes',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    lastMessage: 'Я отправил тебе точку у воды.',
    unread: 0,
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: 1,
    conversationId: 1,
    text: 'Пойдём по маршруту в субботу?',
    isMine: false,
    createdAt: null,
  },
  {
    id: 2,
    conversationId: 1,
    text: 'Да, отправь маршрут, я посмотрю точки по пути.',
    isMine: true,
    createdAt: null,
  },
];

export const users: UserMini[] = [
  {
    id: 1,
    nickname: 'mira_walks',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    rating: 820,
  },
  {
    id: 2,
    nickname: 'river_notes',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    rating: 610,
  },
  {
    id: 3,
    nickname: 'tile_hunter',
    avatar:
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=240&q=80',
    rating: 735,
  },
];
