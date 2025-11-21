import { parseGPX, type Point } from "@we-gold/gpxjs";
import { calculateDistance as gpxCalculateDistance } from "@we-gold/gpxjs";
import { linear } from "everpolate";

type SpeedPoint = [Point, number];
type PacePoint = [Point, number];

export async function processGPX(gpx_file: File): Promise<[Point[], Point[]]> {
  const file_text = await gpx_file.text();
  const [data, error] = parseGPX(file_text);
  if (error) throw Error; // TODO: Update
  const gpx_points = data.tracks[0].points;

  const inst_speeds: SpeedPoint[] = [];
  const inst_paces: PacePoint[] = [];

  const starts = gpx_points.slice(0, -1);
  const ends = gpx_points.slice(1);

  const segments = starts.map((start, index) => [start, ends[index]]);

  // Calculate instantaneous speeds for each point
  for (const [start, end] of segments) {
    const speed = calculateSpeed(start, end);
    const pace = convertSpeedToPace(speed);
    inst_speeds.push([end, speed]);
    inst_paces.push([end, pace]);
  }

  // Perform pace map interpolation
  const interp_pace_map = interpolatePaceMap(inst_paces);

  // Perform a moving average
  const moving_avg = applyMovingAverage(interp_pace_map);
  const min_paces = applyMinimumPace(moving_avg);

  // TODO: Combine points that are too close together

  return [findStopPoints(min_paces), gpx_points];
}

function convertSpeedToPace(speed: number, min_pace: number = 120) {
  const min_speed = 1 / (min_pace * (2.23694 / 60));
  return speed < min_speed ? min_pace : 1 / (speed * (2.23694 / 60))
}

function calculateDistance(start: Point, end: Point): number {
  return gpxCalculateDistance([start, end]).total;
}

function calculateTimeElapsed(start: Point, end: Point): number {
  if (start.time == null || end.time == null) {
    throw Error();
  }
  return (end.time.getTime() - start.time.getTime()) / 1000;
}

function calculateSpeed(start: Point, end: Point): number {
  const distance = calculateDistance(start, end);
  const time = calculateTimeElapsed(start, end);
  return distance / time;
}

function averagePoint(points: Point[]): Point {
  let sumLat: number = 0;
  let sumLng: number = 0;

  points.forEach((point) => {
    sumLat += point.latitude;
    sumLng += point.longitude;
  });

  const lat = sumLat / points.length;
  const lng = sumLng / points.length;

  const avg_point = createSimplePoint(lat, lng);

  return avg_point;
}

function interpolatePaceMap(pace_map: PacePoint[]): PacePoint[] {
  if (pace_map.length < 2) {
    throw Error(); // TODO: Update
  }

  // Get the elapsed time series
  const elapsed_time_series = pace_map.map((point) =>
    calculateTimeElapsed(pace_map[0][0], point[0]),
  );
  const elapsed_time = elapsed_time_series.at(-1);
  if (elapsed_time == null) {
    throw Error; // TODO: Update
  }
  const interp_elapsed_time_series: number[] = [];
  for (let index = 0; index <= elapsed_time; index++) {
    interp_elapsed_time_series.push(index);
  }

  // Get base data
  const latitudes = pace_map.map((point) => point[0].latitude);
  const longitudes = pace_map.map((point) => point[0].longitude);
  const paces = pace_map.map((point) => point[1]);

  // Get interpolated series
  const interp_latitudes = linear(
    interp_elapsed_time_series,
    elapsed_time_series,
    latitudes,
  );
  const interp_longitudes = linear(
    interp_elapsed_time_series,
    elapsed_time_series,
    longitudes,
  );
  const interp_paces = linear(
    interp_elapsed_time_series,
    elapsed_time_series,
    paces,
  );

  const interpolated = interp_latitudes.map((start, index) => [
    start,
    interp_longitudes[index],
    interp_paces[index],
  ]);

  const new_pace_map: PacePoint[] = [];
  for (const [lat, lng, pace] of interpolated) {
    const new_point = createSimplePoint(lat, lng);
    new_pace_map.push([new_point, pace]);
  }

  return new_pace_map;
}

function applyMovingAverage(
  pace_map: PacePoint[],
  window_size: number = 46,
): PacePoint[] {
  const averaged_pace_points: PacePoint[] = [];

  const half_window_size = (window_size - 1) / 2;

  for (let index = 0; index < half_window_size; index++) {
    const pace_slice = pace_map.slice(0, index + half_window_size + 1);
    const sum_pace_slice = pace_slice.reduce(
      ([_acc_point, acc_pace], [curr_point, curr_pace]) => [
        curr_point,
        acc_pace + curr_pace,
      ],
    );
    const avg_pace_slice: PacePoint = [
      sum_pace_slice[0],
      sum_pace_slice[1] / pace_slice.length,
    ];
    averaged_pace_points.push(avg_pace_slice);
  }

  for (
    let index = half_window_size;
    index < pace_map.length - half_window_size;
    index++
  ) {
    const pace_slice = pace_map.slice(index, index + window_size);
    const sum_pace_slice = pace_slice.reduce(
      ([_, acc_pace], [curr_point, curr_pace]) => [
        curr_point,
        acc_pace + curr_pace,
      ],
    );
    const avg_pace_slice: PacePoint = [
      sum_pace_slice[0],
      sum_pace_slice[1] / pace_slice.length,
    ];
    averaged_pace_points.push(avg_pace_slice);
  }

  for (
    let index = pace_map.length - half_window_size;
    index < pace_map.length;
    index++
  ) {
    const pace_slice = pace_map.slice(index - half_window_size);
    const sum_pace_slice = pace_slice.reduce(
      ([_, acc_pace], [curr_point, curr_pace]) => [
        curr_point,
        acc_pace + curr_pace,
      ],
    );
    const avg_pace_slice: PacePoint = [
      sum_pace_slice[0],
      sum_pace_slice[1] / pace_slice.length,
    ];
    averaged_pace_points.push(avg_pace_slice);
  }

  return averaged_pace_points;
}

function applyMinimumPace(
  pace_map: PacePoint[],
  min_pace: number = 60.0,
): PacePoint[] {
  return pace_map.map(([point, pace]) => [point, pace > min_pace ? 60 : pace]);
}

function findStopPoints(
  pace_map: PacePoint[],
  threshold_min: number = 10,
  stop_pace: number = 40.0
): Point[] {
  const threshold_s = threshold_min * 60;

  const potential_stops: Point[] = [];
  let potential_stop: Point[] = [];

  for (const [point, pace] of pace_map) {
    if (pace < stop_pace) {
      if (potential_stop.length >= threshold_s) {
        const avg_point = averagePoint(potential_stop);
        potential_stops.push(avg_point);
      }
      potential_stop = [];
    } else {
      potential_stop.push(point);
    }
  }

  const last_point = pace_map.at(-1);
  if (last_point == null) throw Error; // TODO: Update

  return potential_stops;
}

export function createSimplePoint(lat: number, lng: number): Point {
  return {
    latitude: lat,
    longitude: lng,
    elevation: null,
    time: null,
    extensions: null,
  };
}

export function convertPointToLatLng(point: Point): google.maps.LatLngLiteral {
  return { lat: point.latitude, lng: point.longitude };
}
