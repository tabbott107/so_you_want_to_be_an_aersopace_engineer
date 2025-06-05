
import { IMUDataPoint, AerodynamicCoefficient, AircraftParameters } from "@/types";

export const calculateAerodynamicCoefficients = (
  data: IMUDataPoint[],
  startTime: number,
  endTime: number,
  aircraftParams: AircraftParameters
): AerodynamicCoefficient[] => {
  console.log("Starting new aerodynamic coefficient calculation using pressure-based algorithm");
  console.log("Start time:", startTime, "End time:", endTime);
  console.log("Aircraft params:", aircraftParams);
  
  // Filter data to the specified time bounds
  const filteredData = data.filter(point => 
    point.timestamp >= startTime && point.timestamp <= endTime
  );
  
  console.log("Filtered data length:", filteredData.length);
  
  if (filteredData.length === 0) {
    console.warn("No data points found in the specified time interval");
    return [];
  }
  
  // Constants
  const rho = aircraftParams.airDensity; // kg/m³
  const mass = aircraftParams.aircraftWeight; // kg
  const S = aircraftParams.wingSurfaceArea; // m²
  const g = 9.81; // m/s²
  
  console.log("Using constants - rho:", rho, "mass:", mass, "S:", S);
  
  // Extract pressure and forward acceleration data
  const pressures: number[] = [];
  const forwardAccels: number[] = [];
  const timestamps: number[] = [];
  
  filteredData.forEach(point => {
    const pressure = point['Pressure'] || point['pressure'] || 0;
    const forwardAccel = point['Linear Accel X'] || point['linear_accel_x'] || point['LinAccel X'] || 0;
    
    pressures.push(pressure);
    forwardAccels.push(forwardAccel);
    timestamps.push(point.timestamp);
  });
  
  console.log("Sample pressure data:", pressures.slice(0, 5));
  console.log("Sample forward acceleration data:", forwardAccels.slice(0, 5));
  
  // Convert dynamic pressure to velocity: V = sqrt(2 * q / rho)
  const velocities = pressures.map(pressure => Math.sqrt(2 * pressure / rho));
  
  // Compute lift force (steady, level flight: lift ≈ weight)
  const lift_force = mass * g;
  
  // Compute coefficients for each sample
  const coefficients: AerodynamicCoefficient[] = [];
  
  for (let i = 0; i < filteredData.length; i++) {
    const velocity = velocities[i];
    const q_value = 0.5 * rho * velocity * velocity; // Should match pressure if pressure is dynamic pressure
    
    const CL = lift_force / (q_value * S + 1e-8);
    const drag_force = mass * Math.abs(forwardAccels[i]);
    const CD = drag_force / (q_value * S + 1e-8);
    
    coefficients.push({
      timestamp: timestamps[i],
      CL: CL,
      CD: CD,
      velocity: velocity,
      dynamicPressure: q_value
    });
    
    // Log progress every 20 points
    if (i % 20 === 0) {
      console.log(`Processing point ${i}/${filteredData.length}, Velocity: ${velocity.toFixed(2)}, CL: ${CL.toFixed(4)}, CD: ${CD.toFixed(4)}`);
    }
  }
  
  console.log("Coefficient calculation complete");
  console.log("Sample final coefficients:", coefficients.slice(0, 5));
  
  return coefficients;
};
