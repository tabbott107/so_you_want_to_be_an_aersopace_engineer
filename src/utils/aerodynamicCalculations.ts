
import { IMUDataPoint, AerodynamicCoefficient, FlightBounds, AircraftParameters } from "@/types";

// Helper function to extract sensor data from IMU point
const extractSensorData = (point: IMUDataPoint) => {
  // Try to find Linear Acceleration data - look for common column names
  const accelX = point['Linear Accel X'] || point['linear_accel_x'] || point.accelX || point.accel_x || point['accel x'] || point.ax || point.AccelX || 0;
  const accelY = point['Linear Accel Y'] || point['linear_accel_y'] || point.accelY || point.accel_y || point['accel y'] || point.ay || point.AccelY || 0;
  const accelZ = point['Linear Accel Z'] || point['linear_accel_z'] || point.accelZ || point.accel_z || point['accel z'] || point.az || point.AccelZ || 0;
  
  return [accelX, accelY, accelZ];
};

export const calculateAerodynamicCoefficients = (
  data: IMUDataPoint[],
  startTime: number,
  endTime: number,
  aircraftParams: AircraftParameters
): AerodynamicCoefficient[] => {
  console.log("Starting aerodynamic coefficient calculation following exact Python algorithm");
  console.log("Start time:", startTime, "End time:", endTime);
  console.log("Aircraft params:", aircraftParams);
  
  // Filter data to the specified time bounds (exactly like Python mask)
  const filteredData = data.filter(point => 
    point.timestamp >= startTime && point.timestamp <= endTime
  );
  
  console.log("Filtered data length:", filteredData.length);
  
  if (filteredData.length === 0) {
    console.warn("No data points found in the specified time interval");
    return [];
  }
  
  // Extract time and acceleration data exactly as in Python algorithm
  const time = filteredData.map(point => point.timestamp);
  const lin_accel = filteredData.map(point => extractSensorData(point));
  
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
  
  for (let i = 0; i < filteredData.length; i++) {
    if (i === 0) {
      v.push([0, 0, 0]); // Initial velocity is zero
    } else {
      vx += lin_accel[i][0] * dt[i];
      vy += lin_accel[i][1] * dt[i];
      vz += lin_accel[i][2] * dt[i];
      v.push([vx, vy, vz]);
    }
  }
  
  // Calculate velocity magnitude for each point (exactly like Python np.linalg.norm)
  const v_mag = v.map(vel => Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2]));
  
  console.log("Sample velocity magnitudes:", v_mag.slice(0, 5));
  
  // Aerodynamic force = m * a (exactly like Python)
  const F_aero: number[][] = [];
  for (let i = 0; i < filteredData.length; i++) {
    F_aero.push([
      aircraftParams.aircraftWeight * lin_accel[i][0],
      aircraftParams.aircraftWeight * lin_accel[i][1],
      aircraftParams.aircraftWeight * lin_accel[i][2]
    ]);
  }
  
  // Decompose into drag (along velocity) and lift (perpendicular) - exactly like Python
  const drag_proj: number[] = [];
  const drag_unit: number[][] = [];
  const D_vec: number[][] = [];
  const L_vec: number[][] = [];
  
  for (let i = 0; i < filteredData.length; i++) {
    // Calculate drag projection (dot product F_aero · v)
    const dotProduct = F_aero[i][0] * v[i][0] + F_aero[i][1] * v[i][1] + F_aero[i][2] * v[i][2];
    const proj = dotProduct / (v_mag[i] + 1e-8);
    drag_proj.push(proj);
    
    // Drag unit vector
    const unit = [
      v[i][0] / (v_mag[i] + 1e-8),
      v[i][1] / (v_mag[i] + 1e-8),
      v[i][2] / (v_mag[i] + 1e-8)
    ];
    drag_unit.push(unit);
    
    // Drag vector
    const d_vec = [
      proj * unit[0],
      proj * unit[1],
      proj * unit[2]
    ];
    D_vec.push(d_vec);
    
    // Lift vector (perpendicular to velocity)
    const l_vec = [
      F_aero[i][0] - d_vec[0],
      F_aero[i][1] - d_vec[1],
      F_aero[i][2] - d_vec[2]
    ];
    L_vec.push(l_vec);
  }
  
  const coefficients: AerodynamicCoefficient[] = [];
  
  // Calculate coefficients for each point
  for (let i = 0; i < filteredData.length; i++) {
    const L_mag = Math.sqrt(L_vec[i][0] * L_vec[i][0] + L_vec[i][1] * L_vec[i][1] + L_vec[i][2] * L_vec[i][2]);
    const D_mag = Math.sqrt(D_vec[i][0] * D_vec[i][0] + D_vec[i][1] * D_vec[i][1] + D_vec[i][2] * D_vec[i][2]);
    const q_dyn = 0.5 * aircraftParams.airDensity * v_mag[i] * v_mag[i];
    
    // Calculate coefficients exactly like Python
    const CL = L_mag / (q_dyn * aircraftParams.wingSurfaceArea + 1e-8);
    const CD = D_mag / (q_dyn * aircraftParams.wingSurfaceArea + 1e-8);
    
    coefficients.push({
      timestamp: filteredData[i].timestamp,
      CL: CL,
      CD: CD,
      velocity: v_mag[i],
      dynamicPressure: q_dyn
    });
    
    // Log progress every 20 points
    if (i % 20 === 0) {
      console.log(`Processing point ${i}/${filteredData.length}, Velocity: ${v_mag[i].toFixed(2)}, CL: ${CL.toFixed(4)}, CD: ${CD.toFixed(4)}`);
    }
  }
  
  console.log("Coefficient calculation complete");
  console.log("Sample final coefficients:", coefficients.slice(0, 5));
  
  return coefficients;
};
