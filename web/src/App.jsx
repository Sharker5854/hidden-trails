import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const places = [
  {
    id: 1,
    name: 'Красная площадь',
    description: 'Тестовая геометка в центре Москвы',
    position: [55.75393, 37.620795],
  },
  {
    id: 2,
    name: 'Парк Горького',
    description: 'Пример карточки места',
    position: [55.729876, 37.603943],
  },
];

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Hidden Trails</h1>
        <p>Тестовая карта с метками</p>
      </header>

      <main className="main">
        <div className="map-wrapper">
          <MapContainer
            center={[55.751244, 37.618423]}
            zoom={11}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {places.map((place) => (
              <Marker key={place.id} position={place.position} icon={customIcon}>
                <Popup>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{place.name}</h3>
                    <p style={{ margin: 0 }}>{place.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>
    </div>
  );
}