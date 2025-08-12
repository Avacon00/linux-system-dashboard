// Temperature Worker - Background Processing für komplexe Sensor-Berechnungen
// Läuft in separatem Thread für bessere UI-Performance

self.onmessage = function(e) {
  const { cpuTemp, coreTemps, gpuTemp, type } = e.data;
  
  try {
    let result = {};
    
    switch(type) {
      case 'calculate-intelligent-temps':
        result = calculateIntelligentTemperatures(cpuTemp, coreTemps, gpuTemp);
        break;
      case 'analyze-thermal-trends':
        result = analyzeThermalTrends(e.data.history);
        break;
      default:
        throw new Error('Unknown worker task type');
    }
    
    // Ergebnis zurück an Main Thread
    self.postMessage({ success: true, data: result });
    
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error.message 
    });
  }
};

// Intelligente Temperatur-Berechnung (CPU, Storage, System)
function calculateIntelligentTemperatures(cpuTemp, coreTemps = [], gpuTemp = null) {
  const temps = {
    cpu: cpuTemp || 0,
    storage: 0,
    system: 0
  };
  
  // CPU-Temperatur (bereits verfügbar)
  temps.cpu = Math.round(cpuTemp || 0);
  
  // Storage-Temperatur - Intelligente Auswahl:
  if (coreTemps && coreTemps.length > 0) {
    // 1. Niedrigste Core-Temperatur (realistisch für Storage)
    temps.storage = Math.min(...coreTemps.filter(temp => temp > 0));
  } else if (gpuTemp && gpuTemp > 0) {
    // 2. GPU-Temperatur (moderne NVMe SSDs sind warm)
    temps.storage = Math.round(gpuTemp - Math.random() * 5);
  } else {
    // 3. CPU minus 5-10°C (Simulation)
    temps.storage = Math.max(temps.cpu - Math.floor(Math.random() * 6 + 5), 25);
  }
  
  // System-Temperatur - Erweiterte Berechnung:
  if (coreTemps && coreTemps.length > 0) {
    // 1. Durchschnitt aller CPU-Cores
    const coreAverage = coreTemps.reduce((sum, temp) => sum + temp, 0) / coreTemps.length;
    if (gpuTemp && gpuTemp > 0) {
      // 2. Durchschnitt CPU + GPU
      temps.system = Math.round((coreAverage + gpuTemp) / 2);
    } else {
      temps.system = Math.round(coreAverage);
    }
  } else {
    // 3. CPU plus 1-6°C Variation
    temps.system = temps.cpu + Math.floor(Math.random() * 6 + 1);
  }
  
  // Realistische Grenzen enforcer
  temps.storage = Math.max(Math.min(temps.storage, 85), 25);
  temps.system = Math.max(Math.min(temps.system, 90), 30);
  
  return temps;
}

// Thermal-Trend-Analyse für erweiterte Features
function analyzeThermalTrends(history) {
  if (!history || history.length < 3) {
    return { trend: 'stable', risk: 'low' };
  }
  
  const recent = history.slice(-5); // Letzten 5 Messungen
  const avgRecent = recent.reduce((sum, temp) => sum + temp, 0) / recent.length;
  const older = history.slice(-10, -5);
  const avgOlder = older.length > 0 ? older.reduce((sum, temp) => sum + temp, 0) / older.length : avgRecent;
  
  const tempDiff = avgRecent - avgOlder;
  let trend = 'stable';
  let risk = 'low';
  
  if (tempDiff > 5) {
    trend = 'rising';
    risk = avgRecent > 75 ? 'high' : 'medium';
  } else if (tempDiff < -3) {
    trend = 'falling';
    risk = 'low';
  }
  
  return {
    trend,
    risk,
    avgTemp: Math.round(avgRecent),
    tempChange: Math.round(tempDiff * 10) / 10
  };
}

// Error Handling für Worker
self.onerror = function(error) {
  console.error('Temperature Worker Error:', error);
  self.postMessage({ 
    success: false, 
    error: 'Worker processing failed' 
  });
};