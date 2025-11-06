/**
 * Analytics feature exports
 */

// Pages
export { default as AnalyticsDashboard } from './pages/AnalyticsDashboard';

// Components
export { default as AnalyticsMetricsCards } from './components/AnalyticsMetricsCards';
export { default as CustomReportBuilder } from './components/CustomReportBuilder';

// Charts
export { default as UserGrowthChart } from './components/charts/UserGrowthChart';
export { default as ContentPerformance } from './components/charts/ContentPerformance';
export { default as RevenueCharts } from './components/charts/RevenueCharts';
export { default as TrafficSourcesChart } from './components/charts/TrafficSourcesChart';
export { default as TopContributors } from './components/charts/TopContributors';

// Hooks
export {
  useAnalytics,
  useCustomAnalytics,
  useCohortAnalysis,
  useFunnelAnalysis,
  useExportAnalytics,
  useInvalidateAnalyticsCache,
} from './hooks/useAnalytics';

// Types
export type * from '../types/analytics.types';
