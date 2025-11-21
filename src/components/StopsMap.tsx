import { Map, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect } from "react";
import { Point } from "./Point";
import { convertPointToLatLng, createSimplePoint } from "../gpx";
import type { Point as GPXPoint } from "@we-gold/gpxjs";
import { Polyline } from "./Polyline";

interface StopsMapProps {
  points: GPXPoint[]; // TODO: This should be Point[]
  route: GPXPoint[];
}

const baseLocation: GPXPoint = createSimplePoint(
  42.36532727926379,
  -71.08122517314398,
);

export const StopsMap: React.FC<StopsMapProps> = ({
  points,
  route,
}: StopsMapProps) => {
  const map = useMap("gmap");

  const calculateBounds = (points: GPXPoint[]): [GPXPoint, GPXPoint] => {
    let minLat = Infinity;
    let minLng = Infinity;
    let maxLat = -Infinity;
    let maxLng = -Infinity;

    points.forEach(({ latitude, longitude }) => {
      minLat = latitude < minLat ? latitude : minLat;
      minLng = longitude < minLng ? longitude : minLng;
      maxLat = latitude > maxLat ? latitude : maxLat;
      maxLng = longitude > maxLng ? longitude : maxLng;
    });

    const swPoint = createSimplePoint(minLat, minLng);
    const nePoint = createSimplePoint(maxLat, maxLng);

    return [swPoint, nePoint];
  };

  useEffect(() => {
    if (points.length > 0 && route.length > 0 && map != null) {
      const point_bounds = calculateBounds(route);
      const map_bounds = new google.maps.LatLngBounds(
        convertPointToLatLng(point_bounds[0]),
        convertPointToLatLng(point_bounds[1]),
      );
      map.fitBounds(map_bounds);
    }
  }, [points, route, map]);

  return (
    <div>
      <Map
        id="gmap"
        mapId="mv89mn8f98qwkmfm09"
        style={{ width: "40vw", height: "75vh" }}
        defaultCenter={convertPointToLatLng(baseLocation)}
        defaultZoom={12}
        clickableIcons={false}
      >
        {points.map((point, index) => (
          <Point
            key={`${point.latitude}_${point.longitude}`}
            index={index}
            numPoints={points.length}
            point={point}
          />
        ))}
        <Polyline
          path={route.map((point) => convertPointToLatLng(point))}
          clickable={false}
        />
      </Map>
    </div>
  );
};
