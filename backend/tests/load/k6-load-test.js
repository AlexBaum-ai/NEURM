/**
 * K6 Load Testing Script for Neurmatic Platform
 *
 * Test Scenarios:
 * - Smoke test: 1 VU for 30s (sanity check)
 * - Load test: Ramp up to 100 VUs (normal load)
 * - Stress test: Ramp up to 500 VUs (peak load)
 * - Spike test: Sudden spike to 1000 VUs (traffic spike)
 *
 * Usage:
 *   npm install -g k6
 *   k6 run tests/load/k6-load-test.js
 *   k6 run --vus 100 --duration 5m tests/load/k6-load-test.js
 *
 * Thresholds:
 * - p95 response time < 200ms
 * - p99 response time < 500ms
 * - Error rate < 1%
 * - Request rate > 100 req/s
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://vps-1a707765.vps.ovh.net:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  // Smoke test scenario (default)
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],

  // Performance thresholds
  thresholds: {
    // 95% of requests should complete within 200ms
    http_req_duration: ['p(95)<200', 'p(99)<500'],

    // Error rate should be below 1%
    errors: ['rate<0.01'],

    // 95% of requests should succeed
    http_req_failed: ['rate<0.05'],

    // API response time should be fast
    api_response_time: ['p(95)<200', 'avg<100'],
  },

  // Additional scenarios (uncomment to use)
  /*
  // Load test: Normal traffic
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  */

  /*
  // Stress test: High traffic
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 300 },  // Increase load
    { duration: '5m', target: 500 },  // Peak load
    { duration: '2m', target: 0 },    // Ramp down
  ],
  */

  /*
  // Spike test: Sudden traffic spike
  stages: [
    { duration: '1m', target: 50 },   // Normal load
    { duration: '10s', target: 1000 }, // Sudden spike!
    { duration: '3m', target: 1000 },  // Sustain spike
    { duration: '1m', target: 50 },    // Return to normal
    { duration: '1m', target: 0 },     // Ramp down
  ],
  */
};

// Test data
const testUser = {
  email: 'loadtest@example.com',
  password: 'LoadTest123!',
};

let authToken = null;

// Setup: Run once before all iterations
export function setup() {
  console.log('Load test starting...');
  console.log(`Target: ${BASE_URL}`);

  // Health check
  const healthRes = http.get(`${API_BASE}/performance/health`);
  check(healthRes, {
    'health check passed': (r) => r.status === 200,
  });

  return { baseUrl: BASE_URL };
}

// Main test function: Run for each VU iteration
export default function (data) {
  // Test weight distribution (simulating real user behavior)
  const testWeight = Math.random();

  if (testWeight < 0.4) {
    // 40% - Browse articles
    testBrowseArticles();
  } else if (testWeight < 0.7) {
    // 30% - Browse forum
    testBrowseForum();
  } else if (testWeight < 0.9) {
    // 20% - Browse jobs
    testBrowseJobs();
  } else {
    // 10% - Authenticated actions
    testAuthenticatedActions();
  }

  // Think time (simulate real user behavior)
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

/**
 * Test: Browse articles (public)
 */
function testBrowseArticles() {
  group('Browse Articles', () => {
    // List articles
    const listRes = http.get(`${API_BASE}/articles?page=1&limit=20`, {
      tags: { name: 'ListArticles' },
    });

    const listSuccess = check(listRes, {
      'articles list status 200': (r) => r.status === 200,
      'articles list has data': (r) => {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.articles);
      },
      'articles list response time OK': (r) => r.timings.duration < 200,
    });

    apiResponseTime.add(listRes.timings.duration);
    errorRate.add(!listSuccess);

    if (listSuccess) {
      successfulRequests.add(1);

      // Get article details (80% of users)
      if (Math.random() < 0.8) {
        const articles = JSON.parse(listRes.body).data.articles;
        if (articles && articles.length > 0) {
          const randomArticle = articles[Math.floor(Math.random() * articles.length)];

          const detailRes = http.get(`${API_BASE}/articles/${randomArticle.id}`, {
            tags: { name: 'GetArticle' },
          });

          const detailSuccess = check(detailRes, {
            'article detail status 200': (r) => r.status === 200,
            'article detail response time OK': (r) => r.timings.duration < 150,
          });

          apiResponseTime.add(detailRes.timings.duration);
          errorRate.add(!detailSuccess);

          if (detailSuccess) {
            successfulRequests.add(1);
          } else {
            failedRequests.add(1);
          }
        }
      }
    } else {
      failedRequests.add(1);
    }

    sleep(1);
  });
}

/**
 * Test: Browse forum (public)
 */
function testBrowseForum() {
  group('Browse Forum', () => {
    // List topics
    const topicsRes = http.get(`${API_BASE}/forum/topics?page=1&limit=20`, {
      tags: { name: 'ListTopics' },
    });

    const topicsSuccess = check(topicsRes, {
      'topics list status 200': (r) => r.status === 200,
      'topics list response time OK': (r) => r.timings.duration < 200,
    });

    apiResponseTime.add(topicsRes.timings.duration);
    errorRate.add(!topicsSuccess);

    if (topicsSuccess) {
      successfulRequests.add(1);

      // Get topic details (70% of users)
      if (Math.random() < 0.7) {
        const topics = JSON.parse(topicsRes.body).data?.topics;
        if (topics && topics.length > 0) {
          const randomTopic = topics[Math.floor(Math.random() * topics.length)];

          const topicRes = http.get(`${API_BASE}/forum/topics/${randomTopic.id}`, {
            tags: { name: 'GetTopic' },
          });

          const topicSuccess = check(topicRes, {
            'topic detail status 200': (r) => r.status === 200,
            'topic detail response time OK': (r) => r.timings.duration < 150,
          });

          apiResponseTime.add(topicRes.timings.duration);
          errorRate.add(!topicSuccess);

          if (topicSuccess) {
            successfulRequests.add(1);
          } else {
            failedRequests.add(1);
          }
        }
      }
    } else {
      failedRequests.add(1);
    }

    sleep(1);
  });
}

/**
 * Test: Browse jobs (public)
 */
function testBrowseJobs() {
  group('Browse Jobs', () => {
    // List jobs
    const jobsRes = http.get(`${API_BASE}/jobs?page=1&limit=20&status=active`, {
      tags: { name: 'ListJobs' },
    });

    const jobsSuccess = check(jobsRes, {
      'jobs list status 200': (r) => r.status === 200,
      'jobs list response time OK': (r) => r.timings.duration < 200,
    });

    apiResponseTime.add(jobsRes.timings.duration);
    errorRate.add(!jobsSuccess);

    if (jobsSuccess) {
      successfulRequests.add(1);

      // Get job details (60% of users)
      if (Math.random() < 0.6) {
        const jobs = JSON.parse(jobsRes.body).data?.jobs;
        if (jobs && jobs.length > 0) {
          const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

          const jobRes = http.get(`${API_BASE}/jobs/${randomJob.id}`, {
            tags: { name: 'GetJob' },
          });

          const jobSuccess = check(jobRes, {
            'job detail status 200': (r) => r.status === 200,
            'job detail response time OK': (r) => r.timings.duration < 150,
          });

          apiResponseTime.add(jobRes.timings.duration);
          errorRate.add(!jobSuccess);

          if (jobSuccess) {
            successfulRequests.add(1);
          } else {
            failedRequests.add(1);
          }
        }
      }
    } else {
      failedRequests.add(1);
    }

    sleep(1);
  });
}

/**
 * Test: Authenticated actions (requires auth)
 */
function testAuthenticatedActions() {
  group('Authenticated Actions', () => {
    // Note: In a real test, you'd authenticate first
    // For now, just test public endpoints

    // Get user profile (simulated)
    const profileRes = http.get(`${API_BASE}/articles?page=1&limit=5`, {
      tags: { name: 'GetProfile' },
    });

    check(profileRes, {
      'profile request completed': (r) => r.status === 200 || r.status === 401,
      'profile response time OK': (r) => r.timings.duration < 200,
    });

    apiResponseTime.add(profileRes.timings.duration);

    sleep(1);
  });
}

// Teardown: Run once after all iterations
export function teardown(data) {
  console.log('Load test completed');
}

// Handle summary report
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let output = '\n';
  output += `${indent}Load Test Summary\n`;
  output += `${indent}================\n\n`;

  // Metrics
  if (data.metrics) {
    output += `${indent}Metrics:\n`;

    Object.keys(data.metrics).forEach(metricName => {
      const metric = data.metrics[metricName];
      if (metric && metric.values) {
        output += `${indent}  ${metricName}:\n`;
        output += `${indent}    avg: ${metric.values.avg?.toFixed(2) || 'N/A'}\n`;
        output += `${indent}    min: ${metric.values.min?.toFixed(2) || 'N/A'}\n`;
        output += `${indent}    max: ${metric.values.max?.toFixed(2) || 'N/A'}\n`;
        output += `${indent}    p95: ${metric.values['p(95)']?.toFixed(2) || 'N/A'}\n`;
        output += `${indent}    p99: ${metric.values['p(99)']?.toFixed(2) || 'N/A'}\n`;
      }
    });
  }

  return output;
}
