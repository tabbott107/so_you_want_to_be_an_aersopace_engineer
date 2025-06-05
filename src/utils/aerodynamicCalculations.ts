
import { IMUDataPoint, AerodynamicCoefficient, FlightBounds, AircraftParameters } from "@/types";

// Helper function to extract sensor data from IMU point
const extractSensorData = (point: IMUDataPoint) => {
  // Try to find Linear Acceleration data - look for common column names
  const accelX = point['Linear Accel X'] || point['linear_accel_x'] || point.accelX || point.accel_x || point['accel x'] || point.ax || point.AccelX || 0;
  const accelY = point['Linear Accel Y'] || point['linear_accel_y'] || point.accelY || point.accel_y || point['accel y'] || point.ay || point.AccelY || 0;
  const accelZ = point['Linear Accel Z'] || point['linear_accel_z'] || point.accelZ || point.accel_z || point['accel z'] || point.az || point.AccelZ || 0;
  
  return [accelX, accelY, accelZ];
};

// Vector magnitude (L2 norm)
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
  console.log("Starting aerodynamic coefficient calculation with exact algorithm");
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
  
  // Extract time and acceleration data exactly as in Python algorithm
  const time = flightData.map(point => point.timestamp);
  const lin_accel = flightData.map(point => extractSensorData(point));
  
  console.log("Sample time data:", time.slice(0, 5));
  console.log("Sample acceleration data:", lin_accel.slice(0, 3));
  
  // Compute dt for each sample (prepend first dt = 0) - exactly like Python np.diff(time, prepend=time[0])
  const dt = [0]; // First dt is 0
  for (let i = 1; i < time.length; i++) {
    dt.push(time[i] - time[i - 1]);
  }
  
  console.log("Sample dt values:", dt.slice(0, 5));
  
  // Integrate acceleration → velocity (forward Euler) - exactly like Python np.cumsum
  const v: number[][] = [];
  let vx = 0, vy = 0, vz = 0;
  
  for (let i = 0; i < flightData.length; i++) {
    if (i === 0) {
      v.push([0, 0, 0]); // Initial velocity is zero
    } else {
      vx += lin_accel[i][0] * dt[i];
      vy += lin_accel[i][1] * dt[i];
      vz += lin_accel[i][2] * dt[i];
      v.push([vx, vy, vz]);
    }
  }
  
  // Calculate velocity magnitude for each point
  const v_mag = v.map(vel => vectorMagnitude(vel));
  
  console.log("Sample velocity magnitudes:", v_mag.slice(0, 5));
  
  const coefficients: AerodynamicCoefficient[] = [];
  
  // Process each data point
  for (let i = 0; i < flightData.length; i++) {
    // Aerodynamic force = m * a (exactly like Python)
    const F_aero = [
      aircraftParams.aircraftWeight * lin_accel[i][0],
      aircraftParams.aircraftWeight * lin_accel[i][1],
      aircraftParams.aircraftWeight * lin_accel[i][2]
    ];
    
    let CL = 0;
    let CD = 0;
    
    // Only calculate if we have reasonable velocity
    if (v_mag[i] > 1e-8) {
      // Decompose into drag (along velocity) and lift (perpendicular) - exactly like Python
      const drag_proj = dotProduct(F_aero, v[i]) / (v_mag[i] + 1e-8);
      
      // Drag unit vector
      const drag_unit = [
        v[i][0] / (v_mag[i] + 1e-8),
        v[i][1] / (v_mag[i] + 1e-8),
        v[i][2] / (v_mag[i] + 1e-8)
      ];
      
      // Drag vector
      const D_vec = [
        drag_proj * drag_unit[0],
        drag_proj * drag_unit[1],
        drag_proj * drag_unit[2]
      ];
      
      // Lift vector (perpendicular to velocity)
      const L_vec = [
        F_aero[0] - D_vec[0],
        F_aero[1] - D_vec[1],
        F_aero[2] - D_vec[2]
      ];
      
      const L_mag = vectorMagnitude(L_vec);
      const D_mag = vectorMagnitude(D_vec);
      const q_dyn = 0.5 * aircraftParams.airDensity * v_mag[i] * v_mag[i];
      
      // Calculate coefficients exactly like Python
      CL = L_mag / (q_dyn * aircraftParams.wingSurfaceArea + 1e-8);
      CD = D_mag / (q_dyn * aircraftParams.wingSurfaceArea + 1e-8);
    }
    
    coefficients.push({
      timestamp: flightData[i].timestamp,
      CL: CL,
      CD: CD,
      velocity: v_mag[i],
      dynamicPressure: 0.5 * aircraftParams.airDensity * v_mag[i] * v_mag[i]
    });
    
    // Log progress every 50 points
    if (i % 50 === 0) {
      console.log(`Processing point ${i}/${flightData.length}, Velocity: ${v_mag[i].toFixed(2)}, CL: ${CL.toFixed(4)}, CD: ${CD.toFixed(4)}`);
    }
  }
  
  console.log("Coefficient calculation complete");
  console.log("Sample final coefficients:", coefficients.slice(0, 5));
  
  return coefficients;
};
