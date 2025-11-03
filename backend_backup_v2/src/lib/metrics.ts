const client = require('prom-client');

exports.register = new client.Registry();
register.setDefaultLabels({ service: "genesis-backend" });
client.collectDefaultMetrics({ register });

exports.httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 0.3, 0.7, 1, 2, 5, 10, 30],
});
register.registerMetric(httpDuration);

// simple helpers
export function startTimer(labels: Record<string, string>) {
  return httpDuration.startTimer(labels);
}
