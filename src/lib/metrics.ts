import { Registry, collectDefaultMetrics, Counter, Histogram } from "prom-client";

const globalForMetrics = global as unknown as { registry: Registry };

export const registry = globalForMetrics.registry || new Registry();

if (!globalForMetrics.registry) {
  collectDefaultMetrics({ register: registry });
  globalForMetrics.registry = registry;
}

export const externalApiRequests =
  (registry.getSingleMetric("external_api_requests_total") as Counter<string>) ||
  new Counter({
    name: "external_api_requests_total",
    help: "Total number of external API requests",
    labelNames: ["vendor", "method", "status"],
    registers: [registry],
  });

export const externalApiRequestDuration =
  (registry.getSingleMetric("external_api_request_duration_seconds") as Histogram<string>) ||
  new Histogram({
    name: "external_api_request_duration_seconds",
    help: "Duration of external API requests",
    labelNames: ["vendor", "method"],
    registers: [registry],
    buckets: [0.1, 0.25, 0.5, 1, 2, 5],
  });

export const cacheRequests =
  (registry.getSingleMetric("cache_requests_total") as Counter<string>) ||
  new Counter({
    name: "cache_requests_total",
    help: "Total number of cache requests",
    labelNames: ["function", "status"],
    registers: [registry],
  });

export const sessionUpdates =
  (registry.getSingleMetric("session_updates_total") as Counter<string>) ||
  new Counter({
    name: "session_updates_total",
    help: "Total number of session updates",
    labelNames: ["type", "reason"],
    registers: [registry],
  });
