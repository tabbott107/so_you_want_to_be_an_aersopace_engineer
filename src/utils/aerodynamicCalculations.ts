
import { IMUDataPoint, AerodynamicCoefficient, FlightBounds, AircraftParameters } from "@/types";

// Helper function to extract sensor data from IMU point
const extractSensorData = (point: IMUDataPoint) => {
  console.log("Point keys:", Object.keys(point));
  
  // Try to find Linear Acceleration data - look for common column names
  const accelX = point['linear_accel_x'] || point['Linear Accel X'] || point.accelX || point.accel_x || point['accel x'] || point.ax || point.AccelX || 0;
  const accelY = point['linear_accel_y'] || point['Linear Accel Y'] || point.accelY || point.accel_y || point['accel y'] || point.ay || point.AccelY || 0;
  const accelZ = point['linear_accel_z'] || point['Linear Accel Z'] || point.accelZ || point.accel_z || point['accel z'] || point.az || point.AccelZ || 0;
  
  return {
    accel: [accelX, accelY, accelZ]
  };
};

// Vector magnitude
const vectorMagnitude = (v: number[]): number => {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
};

// Dot product
const dotProduct = (a: number[], b: number[]): number => {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

export const calculateAerodynamicCoefficients = (
  data: IMUDataPoint[],
  bounds: FlightBounds,
  aircraftParams: AircraftParameters
): AerodynamicCoefficient[] => {
  console.log("Starting aerodynamic coefficient calculation with new algorithm");
  console.log("Data length:", data.length);
  console.log("Bounds:", bounds);
  console.log("Aircraft params:", aircraftParams);
  
  // Extract flight data based on bounds
  const flightData = data.slice(bounds.flightStart, bounds.flightEnd + 1);
  
  console.log("Flight data length:", flightData.length);
  
  if (flightData.length === 0) {
    console.warn("Insufficient flight data for calculation");
    return [];
  }
  
  // Log sample data to understand structure
  if (flightData.length > 0) {
    const sampleFlight = extractSensorData(flightData[0]);
    console.log("Sample flight sensor data:", sampleFlight);
  }
  
  const coefficients: AerodynamicCoefficient[] = [];
  const velocity = [0, 0, 0]; // Initialize velocity
  
  // Extract time and acceleration data
  const timeData = flightData.map(point => point.timestamp);
  const accelData = flightData.map(point => extractSensorData(point).accel);
  
  // Calculate dt for each sample
  const dt = timeData.map((time, index) => {
    if (index === 0) return 0;
    return Math.max(0.001, (time - timeData[index - 1]) / 1000); // Convert to seconds
  });
  
  console.log("Sample dt values:", dt.slice(0, 5));
  console.log("Sample acceleration data:", accelData.slice(0, 3));
  
  // Integrate acceleration to get velocity using forward Euler
  for (let i = 0; i < flightData.length; i++) {
    if (i > 0) {
      velocity[0] += accelData[i][0] * dt[i];
      velocity[1] += accelData[i][1] * dt[i];
      velocity[2] += accelData[i][2] * dt[i];
    }
    
    const velocityMagnitude = vectorMagnitude(velocity);
    
    // Aerodynamic force = mass * acceleration
    const F_aero = [
      aircraftParams.aircraftWeight * accelData[i][0],
      aircraftParams.aircraftWeight * accelData[i][1],
      aircraftParams.aircraftWeight * accelData[i][2]
    ];
    
    let CL = 0;
    let CD = 0;
    
    // Only calculate coefficients if we have reasonable velocity
    if (velocityMagnitude > 0.1) {
      // Decompose into drag (along velocity) and lift (perpendicular)
      const dragProjection = dotProduct(F_aero, velocity) / (velocityMagnitude + 1e-8);
      
      // Drag vector (along velocity direction)
      const dragUnit = [
        velocity[0] / (velocityMagnitude + 1e-8),
        velocity[1] / (velocityMagnitude + 1e-8),
        velocity[2] / (velocityMagnitude + 1e-8)
      ];
      
      const D_vec = [
        dragProjection * dragUnit[0],
        dragProjection * dragUnit[1],
        dragProjection * dragUnit[2]
      ];
      
      // Lift vector (perpendicular to velocity)
      const L_vec = [
        F_aero[0] - D_vec[0],
        F_aero[1] - D_vec[1],
        F_aero[2] - D_vec[2]
      ];
      
      const L_mag = vectorMagnitude(L_vec);
      const D_mag = vectorMagnitude(D_vec);
      
      // Dynamic pressure
      const q_dyn = 0.5 * aircraftParams.airDensity * velocityMagnitude * velocityMagnitude;
      
      // Calculate coefficients
      if (q_dyn > 1e-8) {
        CL = L_mag / (q_dyn * aircraftParams.wingSurfaceArea);
        CD = D_mag / (q_dyn * aircraftParams.wingSurfaceArea);
      }
    }
    
    coefficients.push({
      timestamp: flightData[i].timestamp,
      CL: CL,
      CD: CD,
      velocity: velocityMagnitude,
      dynamicPressure: 0.5 * aircraftParams.airDensity * velocityMagnitude * velocityMagnitude
    });
    
    // Log progress every 50 points
    if (i % 50 === 0) {
      console.log(`Processing point ${i}/${flightData.length}, Velocity: ${velocityMagnitude.toFixed(2)}, CL: ${CL.toFixed(4)}, CD: ${CD.toFixed(4)}`);
    }
  }
  
  console.log("Coefficient calculation complete");
  console.log("Sample final coefficients:", coefficients.slice(0, 5));
  
  return coefficients;
};
