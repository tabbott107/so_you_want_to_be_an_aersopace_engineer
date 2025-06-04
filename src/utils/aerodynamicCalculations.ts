
import { IMUDataPoint, AerodynamicCoefficient, FlightBounds, AircraftParameters } from "@/types";

// Quaternion operations
interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

// SLERP interpolation for quaternion averaging
const slerp = (q1: Quaternion, q2: Quaternion, t: number): Quaternion => {
  const dot = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;
  
  if (Math.abs(dot) > 0.9995) {
    // Linear interpolation for very close quaternions
    const result = {
      w: q1.w + t * (q2.w - q1.w),
      x: q1.x + t * (q2.x - q1.x),
      y: q1.y + t * (q2.y - q1.y),
      z: q1.z + t * (q2.z - q1.z)
    };
    const norm = Math.sqrt(result.w * result.w + result.x * result.x + result.y * result.y + result.z * result.z);
    return {
      w: result.w / norm,
      x: result.x / norm,
      y: result.y / norm,
      z: result.z / norm
    };
  }
  
  const angle = Math.acos(Math.abs(dot));
  const sinAngle = Math.sin(angle);
  const a = Math.sin((1 - t) * angle) / sinAngle;
  const b = Math.sin(t * angle) / sinAngle;
  
  return {
    w: a * q1.w + b * q2.w,
    x: a * q1.x + b * q2.x,
    y: a * q1.y + b * q2.y,
    z: a * q1.z + b * q2.z
  };
};

// Calculate quaternion average using SLERP
const averageQuaternion = (quaternions: Quaternion[]): Quaternion => {
  if (quaternions.length === 0) return { w: 1, x: 0, y: 0, z: 0 };
  if (quaternions.length === 1) return quaternions[0];
  
  let result = quaternions[0];
  for (let i = 1; i < quaternions.length; i++) {
    result = slerp(result, quaternions[i], 1 / (i + 1));
  }
  return result;
};

// Convert quaternion to rotation matrix
const quaternionToRotationMatrix = (q: Quaternion): number[][] => {
  const { w, x, y, z } = q;
  return [
    [1 - 2*(y*y + z*z), 2*(x*y - w*z), 2*(x*z + w*y)],
    [2*(x*y + w*z), 1 - 2*(x*x + z*z), 2*(y*z - w*x)],
    [2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(x*x + y*y)]
  ];
};

// Matrix multiplication
const multiplyMatrices = (a: number[][], b: number[][]): number[][] => {
  const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      for (let k = 0; k < b.length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
};

// Transform vector by rotation matrix
const transformVector = (matrix: number[][], vector: number[]): number[] => {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2]
  ];
};

// Vector magnitude
const vectorMagnitude = (v: number[]): number => {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
};

// Vector normalization
const normalizeVector = (v: number[]): number[] => {
  const mag = vectorMagnitude(v);
  return mag > 0 ? [v[0] / mag, v[1] / mag, v[2] / mag] : [0, 0, 0];
};

// Dot product
const dotProduct = (a: number[], b: number[]): number => {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

// Butterworth low-pass filter
const butterworthFilter = (data: number[], cutoffHz: number = 2.5, sampleRate: number = 100): number[] => {
  const nyquist = sampleRate / 2;
  const normalizedCutoff = cutoffHz / nyquist;
  const alpha = Math.exp(-2 * Math.PI * normalizedCutoff);
  
  const filtered = [...data];
  for (let i = 1; i < filtered.length; i++) {
    filtered[i] = alpha * filtered[i - 1] + (1 - alpha) * filtered[i];
  }
  return filtered;
};

export const calculateAerodynamicCoefficients = (
  data: IMUDataPoint[],
  bounds: FlightBounds,
  aircraftParams: AircraftParameters
): AerodynamicCoefficient[] => {
  console.log("Starting aerodynamic coefficient calculation");
  
  // Extract stationary period data for calibration
  const stationaryData = data.slice(bounds.stationaryStart, bounds.stationaryEnd + 1);
  const flightData = data.slice(bounds.flightStart, bounds.flightEnd + 1);
  
  if (stationaryData.length === 0 || flightData.length === 0) {
    console.warn("Insufficient data for calculation");
    return [];
  }
  
  // Calculate reference quaternion from stationary period
  const stationaryQuaternions = stationaryData.map(point => ({
    w: point.qw || 1,
    x: point.qx || 0,
    y: point.qy || 0,
    z: point.qz || 0
  }));
  
  const q0 = averageQuaternion(stationaryQuaternions);
  const R_b2e = quaternionToRotationMatrix(q0);
  
  console.log("Reference quaternion calculated:", q0);
  
  // Process flight data
  const coefficients: AerodynamicCoefficient[] = [];
  let velocity = [0, 0, 0]; // Initialize velocity
  
  for (let i = 0; i < flightData.length; i++) {
    const point = flightData[i];
    const prevPoint = i > 0 ? flightData[i - 1] : point;
    
    // Get current quaternion and create rotation matrix
    const qi = {
      w: point.qw || 1,
      x: point.qx || 0,
      y: point.qy || 0,
      z: point.qz || 0
    };
    
    const R_qi = quaternionToRotationMatrix(qi);
    const Ri = multiplyMatrices(R_b2e, R_qi);
    
    // Transform acceleration to earth frame
    const accel_body = [point.accelX || 0, point.accelY || 0, point.accelZ || 0];
    const accel_earth = transformVector(Ri, accel_body);
    
    // Time step
    const dt = i > 0 ? (point.timestamp - prevPoint.timestamp) / 1000 : 0.01;
    
    // Integrate velocity (simple Euler integration with drift suppression)
    if (i > 0) {
      velocity[0] += accel_earth[0] * dt;
      velocity[1] += accel_earth[1] * dt;
      velocity[2] += accel_earth[2] * dt;
      
      // Simple drift suppression - gradually reduce velocity towards zero when acceleration is low
      const accelMag = vectorMagnitude(accel_earth);
      if (accelMag < 0.5) { // Low acceleration threshold
        const driftFactor = 0.99; // Reduce velocity by 1% each step during low acceleration
        velocity[0] *= driftFactor;
        velocity[1] *= driftFactor;
        velocity[2] *= driftFactor;
      }
    }
    
    const speed = vectorMagnitude(velocity);
    
    // Skip if speed is too low
    if (speed < 0.1) {
      coefficients.push({
        timestamp: point.timestamp,
        CL: 0,
        CD: 0,
        velocity: speed,
        dynamicPressure: 0
      });
      continue;
    }
    
    // Aerodynamic force = mass * acceleration
    const F_aero = [
      aircraftParams.aircraftWeight * accel_earth[0],
      aircraftParams.aircraftWeight * accel_earth[1],
      aircraftParams.aircraftWeight * accel_earth[2]
    ];
    
    // Velocity unit vector
    const v_hat = normalizeVector(velocity);
    
    // Drag vector (opposite to velocity direction)
    const dragMagnitude = dotProduct(F_aero, v_hat);
    const drag = [
      -dragMagnitude * v_hat[0],
      -dragMagnitude * v_hat[1],
      -dragMagnitude * v_hat[2]
    ];
    
    // Lift vector (perpendicular to velocity)
    const lift = [
      F_aero[0] - drag[0],
      F_aero[1] - drag[1],
      F_aero[2] - drag[2]
    ];
    
    // Dynamic pressure
    const q_dyn = 0.5 * aircraftParams.airDensity * speed * speed;
    
    // Coefficients
    const CL = q_dyn > 0 ? vectorMagnitude(lift) / (q_dyn * aircraftParams.wingSurfaceArea) : 0;
    const CD = q_dyn > 0 ? Math.abs(dragMagnitude) / (q_dyn * aircraftParams.wingSurfaceArea) : 0;
    
    coefficients.push({
      timestamp: point.timestamp,
      CL: CL,
      CD: CD,
      velocity: speed,
      dynamicPressure: q_dyn
    });
  }
  
  // Apply Butterworth filter to smooth coefficients
  const CLValues = coefficients.map(c => c.CL);
  const CDValues = coefficients.map(c => c.CD);
  
  const filteredCL = butterworthFilter(CLValues);
  const filteredCD = butterworthFilter(CDValues);
  
  // Return filtered coefficients
  return coefficients.map((coeff, index) => ({
    ...coeff,
    CL: filteredCL[index],
    CD: filteredCD[index]
  }));
};
