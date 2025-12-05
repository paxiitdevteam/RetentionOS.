# RetentionOS - API Performance Benchmarks

This document defines performance requirements and benchmarks for RetentionOS. These are mandatory targets for backend implementation.

---

## Overview

These benchmarks guide how the backend must perform under production loads. Cursor or dev team must use these as mandatory targets.

---

## 1. Widget API Performance

### Requirement
The widget call must feel instant for the end user.

### Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first byte (TTFB) | **Under 100 ms** | From request to first byte received |
| Total API response time | **Under 250 ms** | Complete request/response cycle |
| Flow JSON size | **Under 10 KB** | Compressed response size |
| Modal load time | **Under 150 ms** | Widget modal display time |

### Load Target
- **1000 cancel events per minute** across all tenants
- Must handle traffic spikes up to 2000 events/minute
- Graceful degradation beyond capacity

### Optimization Strategies
- Cache flow data in Redis
- Use CDN for widget assets
- Compress JSON responses (gzip)
- Database query optimization
- Connection pooling

---

## 2. Backend API Performance

### Benchmarks

| Endpoint Type | Target Response Time | Notes |
|---------------|---------------------|-------|
| Admin endpoints | **Under 200 ms** | All admin dashboard API calls |
| Analytics endpoints | **Under 400 ms** | Dashboard analytics queries |
| Stripe webhook processing | **Under 500 ms** | Webhook acknowledgment |
| Flow builder save | **Under 300 ms** | Flow creation/update operations |

### Concurrency Target
- **Handle 100 concurrent requests** without performance drop
- Support up to 500 concurrent requests with acceptable degradation
- Queue management for burst traffic

### Performance Monitoring
- Track p50, p95, p99 response times
- Alert on p95 > 2x target
- Monitor error rates
- Track database query times

---

## 3. Database Performance

### Benchmarks

| Operation | Target | Measurement |
|-----------|--------|-------------|
| SELECT queries (indexed) | **Under 10 ms** | Queries on indexed fields |
| INSERT event logs | **Under 20 ms** | Single row insert |
| Aggregation queries | **Under 70 ms** | Daily summary calculations |
| Complex joins | **Under 100 ms** | Multi-table queries |

### Required Indexes

#### Users Table
- `userId` (PRIMARY KEY)
- `external_id` (UNIQUE INDEX)
- `email` (INDEX)
- `plan` (INDEX)
- `region` (INDEX)

#### Subscriptions Table
- `subscriptionId` (PRIMARY KEY)
- `user_id` (INDEX)
- `stripe_subscription_id` (UNIQUE INDEX)
- `status` (INDEX)

#### Offer Events Table
- `eventId` (PRIMARY KEY)
- `user_id` (INDEX)
- `flow_id` (INDEX)
- `created_at` (INDEX)
- `offer_type` (INDEX)
- `accepted` (INDEX)

#### Churn Reasons Table
- `reasonId` (PRIMARY KEY)
- `user_id` (INDEX)
- `reason_code` (INDEX)
- `created_at` (INDEX)

#### Flows Table
- `flowId` (PRIMARY KEY)
- `language` (INDEX)
- `ranking_score` (INDEX)

### Connection Pooling
- **10-20 connections** for backend service
- **3-5 read replicas** optional at scale
- Connection timeout: 5 seconds
- Idle timeout: 30 seconds
- Max connection lifetime: 1 hour

### Query Optimization
- Use EXPLAIN ANALYZE for slow queries
- Avoid N+1 queries
- Use database views for complex queries
- Implement query result caching

---

## 4. Analytics Engine Performance

### Benchmarks

| Operation | Target | Notes |
|-----------|--------|-------|
| Daily summary cache refresh | **Under 1 second** | Pre-computed metrics |
| Offer performance query | **Under 200 ms** | Real-time query |
| Time-series rendering | **Under 300 ms** | Chart data generation |
| Churn reasons aggregation | **Under 250 ms** | Grouped statistics |

### Caching Strategies

#### Redis Caching
- Cache daily summary for 1 hour
- Cache offer performance for 30 minutes
- Cache user segments for 15 minutes
- Cache flow data for 5 minutes

#### Pre-computation
- **Precompute high-traffic metrics hourly**
- Background jobs for heavy calculations
- Incremental updates instead of full recalculation
- Cache invalidation on data updates

### Analytics Query Optimization
- Use materialized views for common queries
- Aggregate data at write time
- Use time-series database for metrics (optional)
- Batch processing for historical data

---

## 5. Stripe Integration Performance

### Benchmarks

| Operation | Target | Notes |
|-----------|--------|-------|
| Webhook acknowledgment | **Under 200 ms** | Immediate response to Stripe |
| Subscription update | **Under 300 ms** | API call to Stripe |
| Payment processing | **Under 500 ms** | Complete payment flow |

### Queue for Heavy Tasks
- **Avoid blocking webhook** with long operations
- **Push heavy updates to Redis queue** with worker
- Process webhooks asynchronously
- Retry failed operations with exponential backoff

### Webhook Processing
1. Acknowledge webhook immediately (< 200ms)
2. Validate webhook signature
3. Queue for processing
4. Process in background worker
5. Update database
6. Trigger analytics updates

### Error Handling
- Retry failed Stripe API calls (3 attempts)
- Log all Stripe errors
- Alert on high failure rate
- Fallback mechanisms for critical operations

---

## 6. System Health Benchmarks

### Uptime and Reliability

| Metric | Target | Measurement |
|--------|--------|-------------|
| API uptime | **99.5%** | Monthly availability |
| Error rate | **Under 0.5%** | Per 10k requests |
| Max CPU usage | **Under 60%** | On normal load |
| Max memory usage | **Under 75%** | On normal load |

### Resource Monitoring
- CPU usage alerts at 70%
- Memory usage alerts at 80%
- Disk usage alerts at 85%
- Network bandwidth monitoring

### Logging Requirements
- **Logs must stream to central storage**
- Use structured logging (JSON format)
- Include request ID in all logs
- Log levels: ERROR, WARN, INFO, DEBUG

### Alerting Rules
- **Warning alerts after 5% error spike**
- Critical alerts after 10% error spike
- Uptime alerts below 99%
- Response time alerts (p95 > 2x target)

---

## 7. Load Testing Requirements

### Test Scenarios

#### Normal Load
- 1000 requests/minute
- 100 concurrent users
- Mixed endpoint types
- Verify all benchmarks met

#### Peak Load
- 2000 requests/minute
- 500 concurrent users
- Stress test all endpoints
- Verify graceful degradation

#### Sustained Load
- 1500 requests/minute
- 300 concurrent users
- 1 hour duration
- Monitor for memory leaks

### Load Testing Tools
- k6 for API load testing
- Apache JMeter for complex scenarios
- Artillery for real-world simulation
- Custom scripts for widget testing

---

## 8. Performance Monitoring

### Metrics to Track

#### Response Times
- p50 (median)
- p95 (95th percentile)
- p99 (99th percentile)
- Maximum response time

#### Throughput
- Requests per second
- Successful requests
- Failed requests
- Timeout rate

#### Resource Usage
- CPU utilization
- Memory usage
- Database connections
- Network I/O

### Monitoring Tools
- Prometheus for metrics collection
- Grafana for visualization
- APM tools (New Relic, Datadog)
- Custom dashboards

---

## 9. Performance Optimization Checklist

### Backend Optimization
- [ ] Database indexes on all query fields
- [ ] Connection pooling configured
- [ ] Query result caching implemented
- [ ] Response compression enabled
- [ ] Async processing for heavy tasks

### API Optimization
- [ ] Rate limiting implemented
- [ ] Request validation optimized
- [ ] Response pagination for large datasets
- [ ] GraphQL or field selection for flexible queries
- [ ] CDN for static assets

### Database Optimization
- [ ] Proper indexes on all foreign keys
- [ ] Query optimization (EXPLAIN ANALYZE)
- [ ] Database connection pooling
- [ ] Read replicas for analytics queries
- [ ] Partitioning for large tables

### Caching Strategy
- [ ] Redis for session storage
- [ ] Redis for analytics caching
- [ ] CDN for widget assets
- [ ] Browser caching headers
- [ ] Cache invalidation strategy

---

## 10. Performance SLA

### Service Level Objectives (SLOs)

| Service | SLO | Measurement Period |
|---------|-----|-------------------|
| Widget API | 99.5% requests < 250ms | 1 minute |
| Admin API | 99% requests < 200ms | 1 minute |
| Analytics API | 95% requests < 400ms | 1 minute |
| System Uptime | 99.5% availability | 1 month |

### Service Level Agreements (SLAs)
- Uptime guarantee: 99.5%
- Response time guarantee: p95 < 2x target
- Error rate guarantee: < 0.5%
- Support response time: < 4 hours

---

## 11. Performance Testing Schedule

### Regular Testing
- **Load testing**: Before each major release
- **Stress testing**: Monthly
- **Performance regression**: Per sprint
- **Capacity planning**: Quarterly

### Performance Review
- Review metrics weekly
- Identify bottlenecks
- Plan optimizations
- Document improvements

---

*This document defines mandatory performance targets. All implementations must meet or exceed these benchmarks.*

