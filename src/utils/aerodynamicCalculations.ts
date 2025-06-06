
import { IMUDataPoint, AerodynamicCoefficient, AircraftParameters } from "@/types";

export const calculateAerodynamicCoefficients = (
  data: IMUDataPoint[],
  startTime: number,
  endTime: number,
  aircraftParams: AircraftParameters
): AerodynamicCoefficient[] => {
  console.log("Starting aerodynamic coefficient calculation");
  console.log("Start time:", startTime, "End time:", endTime);
  console.log("Aircraft params:", aircraftParams);
  
  // Filter data to the specified time bounds directly
  const filteredData = data.filter(point => 
    point.timestamp >= startTime && point.timestamp <= endTime
  );
  
  console.log("Filtered data length:", filteredData.length);
  
  if (filteredData.length === 0) {
    console.warn("No data points found in the specified time interval");
    return [];
  }
  
  // Constants from aircraft parameters
  const rho = aircraftParams.airDensity; // kg/m³
  const mass = aircraftParams.aircraftWeight; // kg
  const S = aircraftParams.wingSurfaceArea; // m²
  
  console.log("Using constants - rho:", rho, "mass:", mass, "S:", S);
  
  // Extract pressure and accelerations in the window
  const pressures: number[] = [];
  const forwardAccels: number[] = [];
  const verticalAccels: number[] = [];
  const timestamps: number[] = [];
  
  filteredData.forEach(point => {
    // Try different possible column names for pressure
    const pressure = point['Pressure'] || point['pressure'] || 0;
    
    // Try different possible column names for accelerations
    const forwardAccel = point['LinAccel X'] || point['Linear Accel X'] || 
                        point['linear_accel_x'] || point['linaccel_x'] || 
                        point['LinAccelX'] || point['LinearAccelX'] || 0;
    
    const verticalAccel = point['LinAccel Y'] || point['Linear Accel Y'] || 
                         point['linear_accel_y'] || point['linaccel_y'] || 
                         point['LinAccelY'] || point['LinearAccelY'] || 0;
    
    pressures.push(pressure);
    forwardAccels.push(forwardAccel);
    verticalAccels.push(verticalAccel);
    timestamps.push(point.timestamp);
  });
  
  console.log("Sample pressure data:", pressures.slice(0, 5));
  console.log("Sample forward acceleration data:", forwardAccels.slice(0, 5));
  console.log("Sample vertical acceleration data:", verticalAccels.slice(0, 5));
  
  // Convert dynamic pressure to velocity: V = sqrt(2 * q / rho)
  const velocities = pressures.map(pressure => Math.sqrt(2 * Math.abs(pressure) / rho));
  
  // Compute coefficients for each sample in the window
  const coefficients: AerodynamicCoefficient[] = [];
  const CL_values: number[] = [];
  const CD_values: number[] = [];
  
  for (let i = 0; i < filteredData.length; i++) {
    const velocity = velocities[i];
    const q_value = Math.abs(pressures[i]); // pressure is already dynamic pressure in Pa
    
    if (q_value === 0 || velocity === 0) {
      continue; // Skip invalid data points
    }
    
    // Lift force = mass * a_y (Y axis is lift-direction)
    const lift_force = mass * verticalAccels[i];
    const CL = lift_force / (q_value * S);
    
    // Drag force = mass * |a_x|
    const drag_force = mass * Math.abs(forwardAccels[i]);
    const CD = drag_force / (q_value * S);
    
    CL_values.push(CL);
    CD_values.push(CD);
    
    coefficients.push({
      timestamp: timestamps[i],
      CL: CL,
      CD: CD,
      velocity: velocity,
      dynamicPressure: q_value
    });
  }
  
  console.log("Total valid coefficients calculated:", coefficients.length);
  console.log("Sample CL values:", CL_values.slice(0, 5));
  console.log("Sample CD values:", CD_values.slice(0, 5));
  
  return coefficients;
};
