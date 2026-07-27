import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals"

type AnalyticsParameters = Record<string, string | number>

declare global {
  interface Window {
    blogAnalytics?: {
      track: (eventName: string, parameters?: AnalyticsParameters) => void
    }
  }
}

function metricValue(metric: Metric) {
  return metric.name === "CLS"
    ? Number(metric.value.toFixed(4))
    : Math.round(metric.value)
}

function reportMetric(metric: Metric) {
  const report = () => {
    window.blogAnalytics?.track("web_vital", {
      metric_name: metric.name,
      metric_value: metricValue(metric),
      metric_rating: metric.rating,
      navigation_type: metric.navigationType,
    })
  }

  if (window.blogAnalytics) {
    report()
    return
  }

  window.addEventListener("blog:analytics-ready", report, { once: true })
}

onCLS(reportMetric)
onFCP(reportMetric)
onINP(reportMetric)
onLCP(reportMetric)
onTTFB(reportMetric)
