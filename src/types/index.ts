
export interface IMUDataPoint {
  timestamp: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  pressure: number;
}

export interface ProcessedDataPoint extends IMUDataPoint {
  instantAccel: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  speed: number;
}

export interface RawData {
  headers: string[];
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
}
