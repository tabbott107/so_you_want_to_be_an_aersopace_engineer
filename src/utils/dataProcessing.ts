
import { IMUDataPoint, ProcessedDataPoint, ProcessedData, RawData, ProcessingOptions } from "@/types";

// Calculate the magnitude of a 3D vector
const calculateMagnitude = (x: number, y: number, z: number): number => {
  return Math.sqrt(x * x + y * y + z * z);
};

// Simple low-pass filter implementation
const lowPassFilter = (data: number[], cutoff: number): number[] => {
  const filteredData: number[] = [];
  const alpha = cutoff; // Simplified filter coefficient (0-1)
  
  if (data.length === 0) return [];
  
  filteredData[0] = data[0];
  
  for (let i = 1; i < data.length; i++) {
    filteredData[i] = alpha * data[i] + (1 - alpha) * filteredData[i - 1];
  }
  
  return filteredData;
};

// Calculate time difference between data points (in seconds)
const calculateTimeDelta = (current: IMUDataPoint, previous: IMUDataPoint): number => {
  // Handle both seconds and milliseconds timestamps
  const timeDiff = current.timestamp - previous.timestamp;
  return timeDiff > 1000 ? timeDiff / 1000 : timeDiff;
};

// Calculate instantaneous acceleration and velocity using Euler method
const calculateEuler = (
  data: IMUDataPoint[],
  options: ProcessingOptions
): ProcessedDataPoint[] => {
  const processedData: ProcessedDataPoint[] = [];
  
  if (data.length === 0) return [];
  
  // Initial values
  const firstPoint = data[0];
  processedData.push({
    ...firstPoint,
    instantAccel: calculateMagnitude(firstPoint.accelX, firstPoint.accelY, firstPoint.accelZ),
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    speed: 0
  });
  
  // Process the rest of the data
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = processedData[i - 1];
    const dt = calculateTimeDelta(current, data[i - 1]);
    
    // Gravity compensation (approximate 9.81 m/s^2)
    let accelX = current.accelX;
    let accelY = current.accelY;
    let accelZ = current.accelZ;
    
    if (options.gravityCompensation) {
      // Simple gravity compensation - remove approximately 1G from the vertical axis
      // This is a very simplified approach - a real implementation would use sensor fusion
      accelZ = current.accelZ - 9.81;
    }
    
    // Calculate instantaneous acceleration magnitude
    const instantAccel = calculateMagnitude(accelX, accelY, accelZ);
    
    // Integrate acceleration to get velocity (Euler method)
    const velocityX = previous.velocityX + accelX * dt;
    const velocityY = previous.velocityY + accelY * dt;
    const velocityZ = previous.velocityZ + accelZ * dt;
    
    // Calculate speed magnitude
    const speed = calculateMagnitude(velocityX, velocityY, velocityZ);
    
    processedData.push({
      ...current,
      instantAccel,
      velocityX,
      velocityY,
      velocityZ,
      speed
    });
  }
  
  return processedData;
};

// Calculate instantaneous acceleration and velocity using RK4 method
const calculateRK4 = (
  data: IMUDataPoint[],
  options: ProcessingOptions
): ProcessedDataPoint[] => {
  const processedData: ProcessedDataPoint[] = [];
  
  if (data.length === 0) return [];
  
  // Initial values
  const firstPoint = data[0];
  processedData.push({
    ...firstPoint,
    instantAccel: calculateMagnitude(firstPoint.accelX, firstPoint.accelY, firstPoint.accelZ),
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    speed: 0
  });
  
  // RK4 integration for velocity
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    const prevProcessed = processedData[i - 1];
    const dt = calculateTimeDelta(current, previous);
    
    // Gravity compensation
    let accelX = current.accelX;
    let accelY = current.accelY;
    let accelZ = current.accelZ;
    
    if (options.gravityCompensation) {
      accelZ = current.accelZ - 9.81;
    }
    
    // Calculate instantaneous acceleration magnitude
    const instantAccel = calculateMagnitude(accelX, accelY, accelZ);
    
    // RK4 integration for velocity
    // For simplicity, we use a linear interpolation of acceleration between points
    // k1 = f(t, y)
    const k1x = accelX;
    const k1y = accelY;
    const k1z = accelZ;
    
    // k2 = f(t + dt/2, y + dt*k1/2)
    const k2x = accelX;
    const k2y = accelY;
    const k2z = accelZ;
    
    // k3 = f(t + dt/2, y + dt*k2/2)
    const k3x = accelX;
    const k3y = accelY;
    const k3z = accelZ;
    
    // k4 = f(t + dt, y + dt*k3)
    const k4x = accelX;
    const k4y = accelY;
    const k4z = accelZ;
    
    // y(t+dt) = y(t) + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
    const velocityX = prevProcessed.velocityX + 
      (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    const velocityY = prevProcessed.velocityY + 
      (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    const velocityZ = prevProcessed.velocityZ + 
      (dt / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
    
    // Calculate speed magnitude
    const speed = calculateMagnitude(velocityX, velocityY, velocityZ);
    
    processedData.push({
      ...current,
      instantAccel,
      velocityX,
      velocityY,
      velocityZ,
      speed
    });
  }
  
  return processedData;
};

// Convert processed data to CSV format
const generateCSV = (processedData: ProcessedDataPoint[]): string => {
  const headers = [
    "timestamp",
    "accelX",
    "accelY",
    "accelZ",
    "gyroX",
    "gyroY",
    "gyroZ",
    "pressure",
    "instantAccel",
    "velocityX",
    "velocityY",
    "velocityZ",
    "speed"
  ].join(",");
  
  const rows = processedData.map(point => {
    return [
      point.timestamp,
      point.accelX,
      point.accelY,
      point.accelZ,
      point.gyroX,
      point.gyroY,
      point.gyroZ,
      point.pressure,
      point.instantAccel,
      point.velocityX,
      point.velocityY,
      point.velocityZ,
      point.speed
    ].join(",");
  });
  
  return [headers, ...rows].join("\n");
};

// Process the data with the specified options
export const processData = (
  rawData: RawData,
  options: ProcessingOptions
): ProcessedData => {
  // Apply the selected integration method
  let processedData: ProcessedDataPoint[];
  
  switch (options.integrationMethod) {
    case "rk4":
      processedData = calculateRK4(rawData.data, options);
      break;
    case "euler":
    default:
      processedData = calculateEuler(rawData.data, options);
      break;
  }
  
  // Generate CSV content
  const csvContent = generateCSV(processedData);
  
  return {
    rawData,
    processedData,
    csvContent
  };
};
