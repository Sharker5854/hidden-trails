import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const center = [55.751244, 37.618423];

export default function LeafletMap() {
  return (
    <MapContainer
      center={[55.751244, 37.618423]}
      zoom={12}
      style={{ height: '500px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={center}>
        <Popup>
          <div>
            <h3>Тестовая метка</h3>
            <p>Здесь потом будет карточка места</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}