import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { agronomyService } from '@/api/agronomy.service';
import { AnomalyReport } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Fix default icon issue with Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export const AnomalyMap = () => {
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agronomyService.listAnomalies({ page_size: 100 })
      .then(resp => setAnomalies(resp.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  // Filter anomalies with valid coordinates
  const mapData = anomalies.filter(a => a.latitude && a.longitude);

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'blue';
      case 'MEDIUM': return 'yellow';
      case 'HIGH': return 'orange';
      case 'CRITICAL': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Anomaly Map</h1>
      <div className="bg-white p-2 rounded shadow">
        <MapContainer center={[-1.9441, 30.0619]} zoom={10} style={{ height: '600px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {mapData.map((a) => (
            <Marker
              key={a.id}
              position={[a.latitude, a.longitude]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${getMarkerColor(a.severity)}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{a.category}</h3>
                  <p>{a.description}</p>
                  <p>Severity: <span className="font-semibold">{a.severity}</span></p>
                  <p>Cooperative: {a.cooperative_name}</p>
                  <p>Sector: {a.sector}</p>
                  <p>Status: {a.resolved ? 'Resolved' : 'Open'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};