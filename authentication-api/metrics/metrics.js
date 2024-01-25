const client = require('prom-client');

client.collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code']
});

const httpActiveConnections = new client.Gauge({
    name: 'http_active_connections',
    help: 'Number of active connections'
  });

  const cpuUsage = new client.Gauge({
    name: 'nodejs_cpu_usage',
    help: 'CPU usage percentage',
  });

  const ramUsage = new client.Gauge({
    name: 'nodejs_ram_usage_bytes',
    help: 'RAM usage in bytes',
  });

  const queueSize = new client.Gauge({
    name: 'job_queue_size',
    help: 'Number of jobs in the queue',
  });
  
  const jobProcessingDuration = new client.Histogram({
    name: 'job_processing_duration_seconds',
    help: 'Duration of job processing in seconds',
    buckets: [0.1, 1, 5, 10, 30, 60, 120, 300]  // Ajuste os buckets conforme necessário
  });
  

module.exports = {
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  httpActiveConnections,
  cpuUsage,
  ramUsage,
  queueSize,
  jobProcessingDuration,
  client
};
