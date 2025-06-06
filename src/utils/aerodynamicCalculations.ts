
import { IMUDataPoint, AerodynamicCoefficient, AircraftParameters } from "@/types";

export const calculateAerodynamicCoefficients = (
  data: IMUDataPoint[],
  startTime: number,
  endTime: number,
  aircraftParams: AircraftParameters
): AerodynamicCoefficient[] => {
  console.log("Starting aerodynamic coefficient calculation using pressure-based algorithm");
  console.log("Start time:", startTime, "End time:", endTime);
  console.log("Aircraft params:", aircraftParams);
  
  // Get the first timestamp to calculate relative time bounds
  const firstTimestamp = data[0].timestamp;
  const targetStartTime = firstTimestamp + startTime;
  const targetEndTime = firstTimestamp + endTime;
  
  console.log("First timestamp:", firstTimestamp);
  console.log("Target start time:", targetStartTime, "Target end time:", targetEndTime);
  
  // Filter data to the specified time bounds
  const filteredData = data.filter(point => 
    point.timestamp >= targetStartTime && point.timestamp <= targetEndTime
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
    const pressure = point['Pressure'] || point['pressure'] || 0;
    const forwardAccel = point['Linear Accel X'] || point['linear_accel_x'] || point['LinAccel X'] || 0;
    const verticalAccel = point['Linear Accel Y'] || point['linear_accel_y'] || point['LinAccel Y'] || 0;
    
    pressures.push(pressure);
    forwardAccels.push(forwardAccel);
    verticalAccels.push(verticalAccel);
    timestamps.push(point.timestamp);
  });
  
  console.log("Sample pressure data:", pressures.slice(0, 5));
  console.log("Sample forward acceleration data:", forwardAccels.slice(0, 5));
  console.log("Sample vertical acceleration data:", verticalAccels.slice(0, 5));
  
  // Convert dynamic pressure to velocity: V = sqrt(2 * q / rho)
  const velocities = pressures.map(pressure => Math.sqrt(2 * pressure / rho));
  
  // Compute coefficients for each sample in the window
  const coefficients: AerodynamicCoefficient[] = [];
  
  for (let i = 0; i < filteredData.length; i++) {
    const velocity = velocities[i];
    const q_value = pressures[i]; // pressure is already dynamic pressure in Pa
    
    // Lift force = mass * a_y (Y axis is lift-direction)
    const lift_force = mass * verticalAccels[i];
    const CL = lift_force / (q_value * S + 1e-8);
    
    // Drag force = mass * |a_x|
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
