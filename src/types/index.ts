
export interface IMUDataPoint {
  timestamp: number;
  [key: string]: number; // Dynamic columns
}

export interface ProcessedDataPoint extends IMUDataPoint {
  instantAccel: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  speed: number;
}

export interface RawData {
  headers: Array<string | { original: string, display: string, selected: boolean }>;
  timeColumnIndex: number;
  data: IMUDataPoint[];
}

export interface ProcessedData {
  rawData: RawData;
  processedData: ProcessedDataPoint[];
  csvContent: string;
}

export interface ProcessingOptions {
  sampleRate?: number;
  integrationMethod: 'euler' | 'rk4';
  gravityCompensation: boolean;
  calculateFromGyro?: boolean;
  filterCutoff?: number;
}

export interface AircraftParameters {
  wingSurfaceArea: number;
  aircraftWeight: number;
  airDensity: number;
}

export interface FlightBounds {
  flightStart: number;
  flightEnd: number;
  stationaryStart: number;
  stationaryEnd: number;
}

export interface AerodynamicCoefficient {
  timestamp: number;
  CL: number;
  CD: number;
  velocity: number;
  dynamicPressure: number;
}
