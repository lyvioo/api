const { 
    httpRequestDurationMicroseconds, 
    httpRequestsTotal, 
    httpActiveConnections, 
    cpuUsage, 
    ramUsage
  } = require('../metrics/metrics');
  const os = require('os');
  
  module.exports = (req, res, next) => {
    // Incrementa o gauge quando uma solicitação é recebida
    httpActiveConnections.inc();
  
    // Atualiza a métrica de uso da CPU
    updateRamUsage();
    updateCpuUsage();
  
    const start = process.hrtime();
    res.on('finish', () => {
      // Decrementa o gauge quando a resposta é finalizada
      httpActiveConnections.dec();
  
      const duration = process.hrtime(start);
      const durationMs = duration[0] * 1000 + duration[1] / 1e6;
      httpRequestDurationMicroseconds
        .labels(req.method, req.path, res.statusCode)
        .observe(durationMs);
      httpRequestsTotal
        .labels(req.method, req.path, res.statusCode)
        .inc();
    });
    next();
  };
  
  function updateCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
  
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
  
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = (1 - idle / total) * 100;
  
    cpuUsage.set(usage);
  }

  function updateRamUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
  
    ramUsage.set(usedMemory);
  }
  