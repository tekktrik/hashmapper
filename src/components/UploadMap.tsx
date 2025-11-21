import { APIProvider } from "@vis.gl/react-google-maps";
import React, { useState } from "react";
import { GPXFileUpload } from "./GPXFileUpload";
import { StopsMap } from "./StopsMap";
import { processGPX } from "../gpx";
import type { Point as GPXPoint } from "@we-gold/gpxjs";

export const UploadMap: React.FC = () => {
  const [filename, setFilename] = useState<string>("");
  const [points, setPoints] = useState<GPXPoint[]>([]);
  const [route, setRoute] = useState<GPXPoint[]>([]);

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      // TODO: Add error here
      return;
    }
    const gpx_file = files[0];
    if (!gpx_file.name.endsWith(".gpx")) {
      // TODO: Add error here
      return;
    }
    setFilename(gpx_file.name);

    const [processed_points, processed_route] = await processGPX(gpx_file);

    const start = processed_route[0];
    processed_points.splice(0, 0, start);

    const end = processed_route[processed_route.length - 1];
    processed_points.push(end);

    setPoints(processed_points);
    setRoute(processed_route);
  };

  return (
    <>
      <GPXFileUpload
        onChange={handleFileSelection}
        filename={filename}
      ></GPXFileUpload>
      {/* This API key can eventually be public if it's online, once access is restricted */}
      <APIProvider apiKey={import.meta.env.VITE_GMAPS_API_KEY}>
        <StopsMap points={points} route={route}></StopsMap>
      </APIProvider>
    </>
  );
};
