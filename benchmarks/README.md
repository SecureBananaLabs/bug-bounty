# FreelanceFlow API Benchmark Suite

使用 [autocannon](https://github.com/mcollina/autocannon) 对所有 `/api/` 端点进行性能基准测试。

## 快速开始

```bash
# 安装依赖
cd benchmarks && npm install

# 确保API服务正在运行
cd ../apps/api && npm run dev

# 运行完整基准测试
npm run benchmark

# 运行单个端点测试
npm run benchmark:health
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BENCHMARK_URL` | `http://localhost:3000` | API服务地址 |
| `BENCHMARK_DURATION` | `10` | 每个端点测试时长（秒） |
| `BENCHMARK_CONNECTIONS` | `10` | 并发连接数 |
| `BENCHMARK_TOKEN` | - | 认证token（用于受保护端点） |

## 测试覆盖的端点

| 端点 | 方法 | 认证 |
|------|------|------|
| `/health` | GET | 否 |
| `/api/auth/register` | POST | 否 |
| `/api/auth/login` | POST | 否 |
| `/api/auth/refresh` | POST | 否 |
| `/api/users` | GET | 可选 |
| `/api/users` | POST | 否 |
| `/api/jobs` | GET | 可选 |
| `/api/jobs` | POST | 可选 |
| `/api/proposals` | GET/POST | 可选 |
| `/api/payments` | POST | 可选 |
| `/api/reviews` | GET/POST | 可选 |
| `/api/messages` | GET/POST | 可选 |
| `/api/notifications` | GET/POST | 可选 |
| `/api/search` | GET | 可选 |
| `/api/admin/metrics` | GET | 是 |

## 输出示例

```
================================================================================
  FreelanceFlow API Benchmark Report
  Target: http://localhost:3000
  Duration: 10s | Connections: 10
================================================================================

Endpoint                  Method   p50          p95          p99          RPS            Errors    Throughput
--------------------------------------------------------------------------------
health                    GET      1.23 ms      3.45 ms      8.90 ms      8234.5 req/s   0         1.23 MB/s
auth-login                POST     5.67 ms      12.34 ms     25.67 ms     1823.2 req/s   0         456.78 KB/s
...
```

## 报告

JSON格式的详细报告保存在 `benchmarks/reports/` 目录下，包含：
- 每个端点的 p50/p95/p99 延迟
- 每秒请求数 (RPS)
- 吞吐量
- 错误数和超时数
