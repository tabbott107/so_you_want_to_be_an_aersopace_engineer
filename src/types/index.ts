
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
  filterCutoff?: number;
  integrationMethod: 'euler' | 'rk4';
  gravityCompensation: boolean;
  calculateFromGyro?: boolean;
}

export interface AircraftParameters {
  wingSurfaceArea: number;
  aircraftWeight: number;
  airDensity: number;
}
