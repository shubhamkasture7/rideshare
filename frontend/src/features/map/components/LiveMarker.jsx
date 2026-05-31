import React, { useMemo, useState, useEffect, useRef } from 'react';
import { OverlayView, InfoWindowF } from '@react-google-maps/api';
import { Box } from '@mui/material';

const PulseMarker = ({ color, label }) => (
  <Box sx={{ position: 'relative', width: 40, height: 40, transform: 'translate(-50%, -50%)' }}>
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `${color}33`,
        animation: 'pulse 2s ease-out infinite',
        '@keyframes pulse': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
          '100%': { transform: 'translate(-50%, -50%) scale(2.5)', opacity: 0 },
        },
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: color,
        border: '3px solid #fff',
        boxShadow: `0 2px 10px ${color}80`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 700,
      }}
    >
      {label}
    </Box>
  </Box>
);

const CarMarker = ({ rotation = 0 }) => (
  <Box
    sx={{
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      transition: 'transform 0.3s ease-out',
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
      userSelect: 'none',
      cursor: 'pointer',
    }}
  >
    🚕
  </Box>
);

const calculateBearing = (start, end) => {
  if (!start || !end) return 0;
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

const LiveMarker = ({
  position,
  type = 'rider',
  label = '',
  popupContent,
  animate = true,
}) => {
  const [currentPos, setCurrentPos] = useState(() => {
    if (Array.isArray(position)) return { lat: position[0], lng: position[1] };
    return position;
  });
  
  const [rotation, setRotation] = useState(0);
  const prevPositionRef = useRef(position);

  useEffect(() => {
    const target = Array.isArray(position) ? { lat: position[0], lng: position[1] } : position;
    
    if (!target || typeof target.lat !== 'number' || typeof target.lng !== 'number') return;

    if (!prevPositionRef.current) {
      setCurrentPos(target);
      prevPositionRef.current = target;
      return;
    }

    const start = Array.isArray(prevPositionRef.current) 
      ? { lat: prevPositionRef.current[0], lng: prevPositionRef.current[1] } 
      : prevPositionRef.current;

    if (start.lat !== target.lat || start.lng !== target.lng) {
      const newBearing = calculateBearing(start, target);
      if (Math.abs(newBearing - rotation) > 1) { 
        setRotation(newBearing);
      }
    }
    
    if (!animate) {
      setCurrentPos(target);
      prevPositionRef.current = target;
      return;
    }

    if (start.lat === target.lat && start.lng === target.lng) return;

    const duration = 1000;
    const startTime = performance.now();

    const animateStep = (currentTime) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      const lat = start.lat + (target.lat - start.lat) * eased;
      const lng = start.lng + (target.lng - start.lng) * eased;

      setCurrentPos({ lat, lng });

      if (t < 1) {
        requestAnimationFrame(animateStep);
      }
    };

    requestAnimationFrame(animateStep);
    prevPositionRef.current = target;
  }, [position, animate]);

  const markerView = useMemo(() => {
    switch (type) {
      case 'rider': return <PulseMarker color="#6C5CE7" label="👤" />;
      case 'driver': return <CarMarker rotation={rotation} />;
      case 'pickup': return <PulseMarker color="#00B894" label="P" />;
      case 'drop': return <PulseMarker color="#E17055" label="D" />;
      default: return <PulseMarker color="#74B9FF" />;
    }
  }, [type, rotation]);

  return (
    <OverlayView
      position={currentPos}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <Box sx={{ cursor: 'pointer' }}>
        {markerView}
        {popupContent && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              mb: 1,
              bgcolor: 'rgba(17, 24, 39, 0.95)',
              color: '#F1F5F9',
              px: 1.5,
              py: 0.75,
              borderRadius: 1.5,
              fontSize: '12px',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {popupContent}
          </Box>
        )}
      </Box>
    </OverlayView>
  );
};

export default LiveMarker;
