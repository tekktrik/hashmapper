import {
  AdvancedMarker,
  InfoWindow,
  Pin,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import type { Point as GPXPoint } from "@we-gold/gpxjs";
import React, { useState } from "react";
import { convertPointToLatLng } from "../gpx";

interface PointProps {
  index: number;
  numPoints: number;
  point: GPXPoint;
}

export const Point: React.FC<PointProps> = ({
  index,
  numPoints,
  point,
}: PointProps) => {
  const [visible, setVisibility] = useState<boolean>(false);
  const [markerRef, marker] = useAdvancedMarkerRef();

  const onClick = (_: google.maps.MapMouseEvent) => {
    setVisibility(!visible);
  };

  const getLabel = (): string => {
    if (index == 0) {
      return "Start";
    } else if (index == numPoints - 1) {
      return "On In";
    } else {
      return "Stop " + index.toString();
    }
  };

  const getPinBackgroundColor = (): string => {
    if (index == 0) {
      return "#66ce64ff";
    } else if (index == numPoints - 1) {
      return "#eb3535ff";
    } else {
      return "#5aa7e6ff";
    }
  };

  const getPinGlyphColor = (): string => {
    if (index == 0) {
      return "#279925ff";
    } else if (index == numPoints - 1) {
      return "#bb1b1bff";
    } else {
      return "#3471a3ff";
    }
  };

  const getURL = (): string => {
    return (
      "https://www.google.com/maps/place/" +
      point.latitude.toString() +
      "," +
      point.longitude.toString()
    );
  };

  return (
    <>
      <AdvancedMarker
        position={convertPointToLatLng(point)}
        onClick={onClick}
        ref={markerRef}
      >
        <Pin
          background={getPinBackgroundColor()}
          glyphColor={getPinGlyphColor()}
          borderColor="#000000"
        />
      </AdvancedMarker>
      {visible ? (
        <InfoWindow anchor={marker} headerDisabled={true}>
          <p style={{ color: "#000000" }}>{getLabel()}</p>
          <br />
          <a href={getURL()} target="_blank">
            Click here for Google Maps link
          </a>
        </InfoWindow>
      ) : null}
    </>
  );
};
