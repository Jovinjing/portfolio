# 种子对话 — 新用户体验示例

本文件提供一段模拟的 Agent 开发对话，供首次使用的用户**立即体验**完整三模式流程。
对话覆盖 Docker 排错、数据库选型、Redis 缓存策略三个高价值场景，约 18 轮交互。

---

## 使用方法

在 Skill 激活后，直接说"使用种子对话"或"用示例对话体验一下"，AI 会以这段对话为输入，
完整走一遍：拦截记录 → 面试题生成 → 知识蒸馏。

---

## 种子对话内容

```
用户：帮我用 Docker 部署这个 Flask 项目，我本地跑得好好的，一上服务器就不行。

Agent：好的，让我先看看你的项目结构... 看到了 app.py、requirements.txt，没有 Dockerfile。
我来帮你写一个。你打算用哪个基础镜像？

用户：什么都行，小一点的最好。

Agent：小的话用 Alpine。我给你写个 Dockerfile：

FROM alpine:3.18
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "app.py"]

用户：构建成功了，但 docker run 之后容器立刻退出了。日志显示：
"exec: \"python\": executable file not found in $PATH"

Agent：这个错误很典型。Alpine 是最小化 Linux 发行版，默认不带 Python 运行时。
"最小"不等于"开箱即用"——Alpine 只给了你一个内核和包管理器，其他都要自己装。

有两个方案：
A. 换基础镜像为 python:3.11-slim（推荐——已配好 Python 环境，镜像也不算大）
B. 在 Alpine 上 RUN apk add --no-cache python3（更小但需要手动配 PATH 和依赖）

我建议方案 A。slim 镜像约 50MB，Alpine + Python 也差不多 30MB，差距不大，
但 slim 省去了手动配置的麻烦。稳定性 > 镜像体积的微小优势。

用户：好，换成 python:3.11-slim。构建成功，但容器还是起不来，报新的错：
ModuleNotFoundError: No module named 'flask'

Agent：依赖没装进镜像。你的 requirements.txt 里有 Flask，但 Dockerfile 里
没有 pip install 步骤。我之前写的 Dockerfile 有问题——COPY 了代码但没安装依赖。

修正后的 Dockerfile：
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]

另外建议用多阶段构建（multi-stage build）：编译阶段装依赖，运行阶段只复制
编译产物。这样最终镜像可以再减小 30-40%。

用户：终于跑起来了！话说回来，为什么你一开始选 Alpine？你后悔吗？

Agent：哈哈，因为你说了"小一点的最好"——这是最常见的要求。但"最小镜像"
是个经典陷阱。Alpine 用 musl libc 而不是 glibc，有些 Python 包（比如
pandas、numpy）在 Alpine 上编译很痛苦。选基础镜像的核心原则是：

体积 < 兼容性 < 可维护性

除非你有极端的镜像大小限制（比如边缘设备部署），否则 slim 系列是最佳平衡点。

用户：学到了。接下来这个项目要用数据库，我在纠结 PostgreSQL 还是 MongoDB。
这个项目是订单系统，有用户表、订单表、商品表，之间有外键关联。

Agent：这个场景我直接建议 PostgreSQL。核心原因就一条——

你的数据是关系型的。订单属于用户，订单包含多个商品，这些实体之间有严格的关系约束。
关系型数据库天然匹配这种模型：JOIN 查询、外键约束、事务 ACID。

MongoDB 适合什么场景？文档型数据——比如用户行为日志，每条日志是独立的，
没有跨文档的 JOIN 需求。或者数据结构频繁变化，JSON schema 更灵活。

但订单系统不行。你不能接受"订单里的商品 ID 不存在"这种事——关系型数据库
的外键约束能帮你兜底。

用户：那 MongoDB 有事务吗？

Agent：MongoDB 4.0+ 支持多文档事务，但它的 MVCC 实现和 PostgreSQL 有本质区别。
PostgreSQL 的 MVCC 通过元组版本链 + 事务快照实现，读不阻塞写——
UPDATE 不直接覆盖旧行，而是插入新版本，旧版本由 VACUUM 回收。
这个设计让你在高并发下读写互不干扰。

MongoDB 的 WiredTiger 引擎也实现了 MVCC，但它更偏向"写时复制"——
写操作会创建数据的私有副本，提交时才原子性地替换。适合写少读多的场景。
对于订单系统这种读写混合的高并发场景，PostgreSQL 的 MVCC 成熟度更高。

另外你提到日均 10 万单——这个量级下，你需要关注索引优化。
建议在 order 表的 user_id、status、created_at 上建联合索引，
因为最常见的查询是"某用户的某个状态的订单，按时间排序"。

用户：说到索引，慢查询怎么排查？

Agent：PostgreSQL 自带 EXPLAIN ANALYZE——这是你的第一工具：
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

关注几个指标：
- Seq Scan（全表扫描）= 坏信号，说明没走索引
- Index Scan / Bitmap Index Scan = 好信号
- cost 和 actual time 的差距大 = 统计信息过时，需要 ANALYZE 更新
- Rows Removed by Filter 很大 = 索引选择性不够

如果 EXPLAIN 显示 Seq Scan，先检查是否有合适的索引。PostgreSQL 的查询计划器
基于成本估算（cost-based），统计信息不准会导致它"误判"全表扫描更快。

用户：好。项目还要做缓存，我看到 Agent 建议用 Redis。为什么要缓存？

Agent：看你的订单系统：用户每次下单前都要查商品库存、查历史订单、
查优惠信息。这些查询有共同特点——高频读取、低频修改、实时性要求不高
（库存可接受 1 秒延迟）。

Redis 正好擅长这个：内存存储、单线程无锁、支持丰富的数据结构。
具体策略：
- 商品信息 → Redis Hash，以商品 ID 为 key
- 用户会话 → Redis String + TTL 过期
- 库存计数 → Redis 原子操作 DECR，天然防超卖

但要小心几个坑：
1. 缓存穿透：大量请求查不存在的数据（比如不存在的商品 ID），缓存里没有，
   每次都打到数据库。解决：布隆过滤器，或者把"不存在"也缓存（值设为 null，TTL 短）
2. 缓存雪崩：大量缓存在同一时刻过期，瞬间压垮数据库。
   解决：给 TTL 加随机偏移量（比如 1 小时 ± 5 分钟）
3. Redis 内存淘汰：内存满了怎么办？默认是 noeviction（写不进去直接报错），
   生产环境应该设 allkeys-lru（淘汰最近最少用的 key）

用户：这么多细节... 你是怎么记住这些的？

Agent：记模式，不记细节。缓存策略的核心思想就一条——"用空间换时间，用钱换体验"。
具体参数查文档就行，但你要知道什么场景下需要缓存、缓存失效了怎么办、
缓存和数据库不一致怎么处理。这些是判断力，不是记忆力。

用户：最后一个问题——如果日单量从 10 万涨到 100 万，现在的架构哪里会先崩？

Agent：好问题。按脆弱度排序：
1. 数据库单机先扛不住 → 引入读写分离（主库写、从库读），但要注意从库延迟
2. 应用层无状态所以好扩，但 Session 别存在应用内存里 → 放 Redis
3. Redis 单机内存不够 → Redis Cluster 分片
4. 数据库单表数据量过大 → 分库分表（按 user_id 哈希，或按时间范围）
5. 最后引入消息队列削峰——下单请求异步化，前端返回"处理中"

但记住：架构演进不是一步到位的。100 万的架构不应该在 10 万的时候就上——
那叫过度设计。每个阶段解决当前阶段的瓶颈就好。
```
