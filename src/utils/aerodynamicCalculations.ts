
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

// Helper function to extract sensor data from IMU point
const extractSensorData = (point: IMUDataPoint) => {
  console.log("Point keys:", Object.keys(point));
  console.log("Sample point data:", point);
  
  // Try to find acceleration data - look for common column names
  const accelX = point.accelX || point.accel_x || point['accel x'] || point.ax || point.AccelX || 0;
  const accelY = point.accelY || point.accel_y || point['accel y'] || point.ay || point.AccelY || 0;
  const accelZ = point.accelZ || point.accel_z || point['accel z'] || point.az || point.AccelZ || 0;
  
  // Try to find quaternion data - look for common column names
  const qw = point.qw || point.q_w || point['q w'] || point.w || point.QuatW || 1;
  const qx = point.qx || point.q_x || point['q x'] || point.x || point.QuatX || 0;
  const qy = point.qy || point.q_y || point['q y'] || point.y || point.QuatY || 0;
  const qz = point.qz || point.q_z || point['q z'] || point.z || point.QuatZ || 0;
  
  // Try to find gyroscope data
  const gyroX = point.gyroX || point.gyro_x || point['gyro x'] || point.gx || point.GyroX || 0;
  const gyroY = point.gyroY || point.gyro_y || point['gyro y'] || point.gy || point.GyroY || 0;
  const gyroZ = point.gyroZ || point.gyro_z || point['gyro z'] || point.gz || point.GyroZ || 0;
  
  return {
    accel: [accelX, accelY, accelZ],
    quaternion: { w: qw, x: qx, y: qy, z: qz },
    gyro: [gyroX, gyroY, gyroZ]
  };
};

export const calculateAerodynamicCoefficients = (
  data: IMUDataPoint[],
  bounds: FlightBounds,
  aircraftParams: AircraftParameters
): AerodynamicCoefficient[] => {
  console.log("Starting aerodynamic coefficient calculation");
  console.log("Data length:", data.length);
  console.log("Bounds:", bounds);
  console.log("Aircraft params:", aircraftParams);
  
  // Extract stationary period data for calibration
  const stationaryData = data.slice(bounds.stationaryStart, bounds.stationaryEnd + 1);
  const flightData = data.slice(bounds.flightStart, bounds.flightEnd + 1);
  
  console.log("Stationary data length:", stationaryData.length);
  console.log("Flight data length:", flightData.length);
  
  if (stationaryData.length === 0 || flightData.length === 0) {
    console.warn("Insufficient data for calculation");
    return [];
  }
  
  // Log sample data to understand structure
  if (stationaryData.length > 0) {
    const sampleStationary = extractSensorData(stationaryData[0]);
    console.log("Sample stationary sensor data:", sampleStationary);
  }
  
  // Calculate reference quaternion from stationary period
  const stationaryQuaternions = stationaryData.map(point => {
    const sensor = extractSensorData(point);
    return sensor.quaternion;
  });
  
  const q0 = averageQuaternion(stationaryQuaternions);
  console.log("Reference quaternion calculated:", q0);
  
  // Calculate average acceleration during stationary period for gravity reference
  const stationaryAccels = stationaryData.map(point => extractSensorData(point).accel);
  const avgStationaryAccel = [
    stationaryAccels.reduce((sum, a) => sum + a[0], 0) / stationaryAccels.length,
    stationaryAccels.reduce((sum, a) => sum + a[1], 0) / stationaryAccels.length,
    stationaryAccels.reduce((sum, a) => sum + a[2], 0) / stationaryAccels.length
  ];
  
  console.log("Average stationary acceleration (gravity reference):", avgStationaryAccel);
  const gravityMagnitude = vectorMagnitude(avgStationaryAccel);
  console.log("Gravity magnitude:", gravityMagnitude);
  
  // Process flight data
  const coefficients: AerodynamicCoefficient[] = [];
  let velocity = [0, 0, 0]; // Initialize velocity
  
  for (let i = 0; i < flightData.length; i++) {
    const point = flightData[i];
    const prevPoint = i > 0 ? flightData[i - 1] : point;
    
    const sensor = extractSensorData(point);
    
    // Create rotation matrix from body to earth frame
    const R_b2e = quaternionToRotationMatrix(sensor.quaternion);
    
    // Transform acceleration to earth frame
    const accel_earth = transformVector(R_b2e, sensor.accel);
    
    // Subtract gravity (assume gravity is in -Z direction in earth frame)
    accel_earth[2] -= gravityMagnitude;
    
    // Time step calculation
    const dt = i > 0 ? Math.max(0.001, (point.timestamp - prevPoint.timestamp) / 1000) : 0.01;
    
    // Integrate velocity using trapezoidal method
    if (i > 0) {
      const prevSensor = extractSensorData(prevPoint);
      const prevAccel_earth = transformVector(quaternionToRotationMatrix(prevSensor.quaternion), prevSensor.accel);
      prevAccel_earth[2] -= gravityMagnitude;
      
      // Trapezoidal integration
      velocity[0] += 0.5 * (accel_earth[0] + prevAccel_earth[0]) * dt;
      velocity[1] += 0.5 * (accel_earth[1] + prevAccel_earth[1]) * dt;
      velocity[2] += 0.5 * (accel_earth[2] + prevAccel_earth[2]) * dt;
      
      // Velocity drift compensation - gradually decay velocity when acceleration is low
      const accelMag = vectorMagnitude(accel_earth);
      if (accelMag < 1.0) { // Low acceleration threshold
        const driftFactor = Math.exp(-dt / 10.0); // 10 second time constant
        velocity[0] *= driftFactor;
        velocity[1] *= driftFactor;
        velocity[2] *= driftFactor;
      }
    }
    
    const speed = vectorMagnitude(velocity);
    
    // Calculate dynamic pressure
    const q_dyn = 0.5 * aircraftParams.airDensity * speed * speed;
    
    let CL = 0;
    let CD = 0;
    
    // Only calculate coefficients if we have reasonable speed and dynamic pressure
    if (speed > 1.0 && q_dyn > 0.01) {
      // Calculate aerodynamic force (F = ma, but we need to account for weight)
      const weightForce = [0, 0, -aircraftParams.aircraftWeight * gravityMagnitude];
      const totalForce = [
        aircraftParams.aircraftWeight * accel_earth[0],
        aircraftParams.aircraftWeight * accel_earth[1],
        aircraftParams.aircraftWeight * accel_earth[2] + weightForce[2]
      ];
      
      // Velocity unit vector
      const v_hat = normalizeVector(velocity);
      
      // Drag force (component of total force in direction opposite to velocity)
      const dragMagnitude = -dotProduct(totalForce, v_hat); // Negative because drag opposes motion
      
      // Lift force (perpendicular to velocity)
      const liftForce = [
        totalForce[0] + dragMagnitude * v_hat[0],
        totalForce[1] + dragMagnitude * v_hat[1],
        totalForce[2] + dragMagnitude * v_hat[2]
      ];
      
      const liftMagnitude = vectorMagnitude(liftForce);
      
      // Calculate coefficients
      const denominator = q_dyn * aircraftParams.wingSurfaceArea;
      CL = liftMagnitude / denominator;
      CD = Math.abs(dragMagnitude) / denominator;
    }
    
    coefficients.push({
      timestamp: point.timestamp,
      CL: CL,
      CD: CD,
      velocity: speed,
      dynamicPressure: q_dyn
    });
    
    // Log progress every 100 points
    if (i % 100 === 0) {
      console.log(`Processing point ${i}/${flightData.length}, Speed: ${speed.toFixed(2)}, CL: ${CL.toFixed(4)}, CD: ${CD.toFixed(4)}`);
    }
  }
  
  console.log("Raw coefficients calculated, applying filter...");
  
  // Apply Butterworth filter to smooth coefficients
  const CLValues = coefficients.map(c => c.CL);
  const CDValues = coefficients.map(c => c.CD);
  
  const filteredCL = butterworthFilter(CLValues, 1.0, 100); // Lower cutoff for smoother results
  const filteredCD = butterworthFilter(CDValues, 1.0, 100);
  
  // Return filtered coefficients
  const finalCoefficients = coefficients.map((coeff, index) => ({
    ...coeff,
    CL: filteredCL[index],
    CD: filteredCD[index]
  }));
  
  console.log("Coefficient calculation complete");
  console.log("Sample final coefficients:", finalCoefficients.slice(0, 5));
  
  return finalCoefficients;
};
