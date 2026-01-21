import React, { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  center: { lng: number; lat: number };
  marker?: { lng: number; lat: number };
  className?: string;
};

export default function LiveLocationMap({ center, marker, className }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const styleUrl = useMemo(() => {
    // Open, no-key demo style. Replace with your own tiles/style for production.
    return 'https://demotiles.maplibre.org/style.json';
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [center.lat, center.lng, styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter([center.lng, center.lat]);
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!marker) return;

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker().setLngLat([marker.lng, marker.lat]).addTo(map);
      return;
    }

    markerRef.current.setLngLat([marker.lng, marker.lat]);
  }, [marker?.lat, marker?.lng]);

  return (
    <div
      ref={mapContainerRef}
      className={className || ''}
      style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}
    />
  );
}
