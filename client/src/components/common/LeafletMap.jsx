import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Optional default icon fix for Vite
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});
L.Marker.prototype.options.icon = DefaultIcon;

const LeafletMap = ({ lat = 33.8938, lng = 35.5018, zoom = 12 }) => {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[lat, lng]}>
        <Popup>You are here</Popup>
      </Marker>
    </MapContainer>
  );
};

export default LeafletMap;
