# App Store Discounts器 - 前端展示页面 需求文档 (PRD)

## 1. 项目概述

### 1.1 背景

当前项目 `appstore-discounts` 是一个基于 GitHub Actions 的 App Store 折扣信息追踪系统，已具备完整的数据采集、价格追踪、折扣计算能力。数据存储在 JSON 文件中，目前仅通过 RSS/Telegram/钉钉 推送折扣信息。

现需要开发一个 **Web 前端展示页面**，让用户可以直接通过网页浏览折扣应用列表和详细信息，提升用户体验和项目的可发现性。

### 1.2 访问地址

通过自定义域名访问：**`https://appstore-discounts.eyelly.me`**

### 1.3 技术选型

| 类别 | 选型 | 说明 |
|------|------|------|
| 框架 | React 18+ | 复用项目已有 React 生态 |
| 构建工具 | Vite | 快速构建，原生 ESM 支持 |
| 语言 | TypeScript | 类型安全 |
| 图表库 | Chart.js + react-chartjs-2 | 轻量级（~60KB gzip），功能满足折线图需求 |
| 样式方案 | Tailwind CSS | 快速开发，响应式支持优秀，tree-shaking 体积小 |
| 国际化 | @i18n-pro/react | 基于 i18n-pro 的 React 国际化方案，默认中文（text-as-key），英文通过 JSON 翻译 |
| SEO 方案 | @prerenderer/prerenderer | 静态站点生成，预渲染首页和各地区列表页，保障 SEO |
| 后端服务 | Cloudflare Workers | iTunes API 代理（解决 CORS）+ 折扣数据 API |
| 部署 | Cloudflare Pages | 支持自定义域名，自动 CI/CD |

---

## 2. 功能需求

### 2.1 折扣应用列表页（首页）

> 首页即为地区折扣列表页，打开后默认展示 `cn`（中国大陆）的折扣数据。用户可通过地区选择器切换到其他地区，切换后列表数据整体刷新。

#### 2.1.1 数据展示规则

- **默认按时间倒序**展示最近有折扣的应用列表
- **按日期分组**：相同日期（按浏览器本地时区计算）的折扣应用归为一组，每组显示日期标题
  - 日期格式根据当前语言本地化（中文：`2026年5月23日` / 英文：`May 23, 2026`）
- **折扣数据来源**：基于 `src/data/storage/{region}.json` 重新计算折扣信息，而非 `rss.json`（因为 `rss.json` 仅保留最近 3 天的折扣记录，数据范围有限）
- **去重规则**：同一应用（trackId 相同）且折扣信息完全一致时才进行去重，保留最新的一条记录

#### 2.1.2 应用卡片信息

每个应用卡片需展示以下信息：

| 信息项 | 数据来源 | 展示方式 |
|--------|----------|----------|
| 应用 Logo | `artworkUrl100`（iTunes API） | 圆角图标，懒加载 |
| 应用名称 | `trackName`（iTunes API） | 加粗显示，最多 2 行截断 |
| 评分 | `averageUserRating`（iTunes API） | 星星图标 + 数值 |
| 应用描述 | `description`（iTunes API） | 截断显示，最多 2-3 行 |
| 适配系统 | `supportedDevices`（iTunes API） | 解析为平台标签图标（iOS / iPadOS / macOS / watchOS / tvOS） |
| 分类 | `genres`（iTunes API） | 标签样式 |
| 优惠信息 - 应用价格 | `discounts`（存储数据计算）中 `type: 'price'` | 原价（删除线）+ 折扣价（高亮红色/绿色）+ 历史价格区间 |
| 优惠信息 - 内购价格 | `discounts`（存储数据计算）中 `type: 'inAppPurchase'` | 每项内购：原价 → 折扣价 + 历史价格区间 |
| 折扣发现时间 | `timestamp`（存储数据） | 相对时间（如"2小时前"） |
| 通知禁用标识 | `notificationDisabled`（构建时从 `apps.json` 标注） | 应用名称旁显示图标（�+禁止符号），鼠标悬浮提示“推送已禁用”（仅当 `allowNotification: false` 时显示） |

> **数据来源说明**：除优惠信息（折扣数据从存储 JSON 计算得出）外，应用的基础信息（Logo、名称、评分、描述、适配系统、分类等）均通过 iTunes Search API 实时获取。

**通知禁用标识规则**：
- 在 `apps.json` 中，若应用配置项包含 `allowNotification: false`，则认为该应用已禁用推送
- 在构建时（`generateWebData.ts`）根据 `apps.json` 将 `notificationDisabled: true` 写入每条折扣记录
- 前端在应用卡片的应用名称旁显示图标（�铃铛+禁止符号），鼠标悬浮时显示文字提示“推送已禁用”
- 前端独立提供 `/api/disabled-apps` 端点供详情页查询（返回 `{ ids: number[] }` 格式）

#### 2.1.3 应用信息缓存策略

由于卡片展示需要调用 iTunes API 获取应用基础信息，需实现有效的缓存机制避免不必要的接口查询：

- **缓存键**：`{region}_{trackId}`（例如 `cn_6502453075`），因为同一应用在不同地区的信息可能不同（价格、描述本地化等）
- **缓存存储**：优先使用内存缓存（`Map<string, CachedAppInfo>`），页面刷新后使用 `localStorage` 作为二级缓存
- **缓存有效期（TTL）**：1 小时（应用信息更新频率较低）
- **缓存策略**：
  1. 加载列表时，先从缓存中批量查询已有的应用信息
  2. 仅对缓存中不存在或已过期的 `region+trackId` 组合发起 API 请求
  3. 支持批量查询：iTunes API 支持 `?id=123,456,789&country=cn` 格式批量获取，减少请求次数
  4. 切换地区后，对应地区的缓存独立管理，不互相干扰
  5. 切换地区后分页从第一条数据重新开始计算

#### 2.1.4 分页加载（API 接口 + 无限滚动）

- **数据获取方式**：通过 Cloudflare Workers API 接口获取折扣数据，而非前端直接加载 JSON 文件（后期数据量会很大，前端加载 JSON 不现实）
- **接口端点**：`GET /api/discounts/{region}?page={page}&size=40`
- **首次加载**：通过接口获取最近 40 条折扣记录
- **滚动加载**：滚动到底部时自动请求下一页（每页 40 条）
- **接口设计**：
  ```
  GET /api/discounts/{region}?page=1&size=40&sort=desc
  Response: { items: DiscountListItem[], total: number, page: number, hasMore: boolean }
  ```
- **价格历史接口**：`GET /api/history/{region}/{trackId}`
  ```
  Response: PriceHistoryItem
  ```
- **加载状态**：显示骨架屏（Skeleton Screen）或底部 Spinner
- **加载完成**：所有数据加载完毕后显示"已加载全部"提示
- **切换地区**：分页从第一条数据重新开始计算
- **性能优化**：使用虚拟列表（Virtual List）优化大量数据的渲染性能

#### 2.1.6 固定辅助 UI（日期导航、回到顶部、排序按钮）定位

固定（`position: fixed`）的辅助 UI 元素应 **靠近内容区域** 而非屏幕边缘，与 `<main>` 的 `max-w-7xl`（80rem）内容区边界对齐：

- **日期导航（DateNav）**（仅 ≥1280px 可见）：
  以 `fixed` 定位，完全位于内容区域左边界左侧（`left = 内容区域左边界 - 导航器宽度 - 间距`，与内容区边缘无重叠）
- **回到顶部按钮（ScrollToTop）**：
  以 `fixed` 定位，完全位于内容区域左边界左侧（`left = 内容区域左边界 - 按钮宽度 - 间距`，与内容区边缘无重叠）
- **排序按钮**：非 fixed 定位，为内容区域内的内联元素（见 2.1.5）

#### 2.1.5 排序

- **默认排序**：按折扣时间倒序（最新折扣在前）
- **可切换**：按折扣时间正序（最早折扣在前）
- **无需其他排序方式**
- **排序按钮行为**：
  - 按钮位于搜索框右侧，与搜索框同行排列（sticky 区域）
  - 按钮显示 **目标状态文字**（即点击后切换到的状态），而非当前状态
    - 当前最新优先时，显示 `↑ 最早`（点击切换至时间正序）
    - 当前最早优先时，显示 `↓ 最新`（点击切换至时间倒序）

### 2.2 应用详情页

#### 2.2.1 路由

```
/{region}/{trackId}
```

示例：`/cn/6502453075`

- 支持浏览器前进/后退
- 支持直接通过 URL 访问和分享

#### 2.2.2 页面布局（Tab 页签）

详情页采用 **Tab 页签布局**，将内容分区展示，避免页面过长导致的滚动疲劳。

**常驻区域**（不随 Tab 切换）：
- 应用头部信息卡片：左右布局（PC 端），左侧为图标、名称、开发者、评分、分类、平台标签，右侧为操作按钮组（「前往 App Store」、「分享」）
- 进入详情页时自动滚动到页面顶部（无论何种导航方式）

**Tab 页签**：

| Tab | 名称 | 包含内容 | 默认 |
|-----|------|---------|------|
| 价格 | `price` | 价格信息卡片、App 内购买项目价格及历史区间、历史价格折线图 | ✅ 默认 Tab |
| 图片 | `screenshots` | 应用截图展示（iPhone + iPad 截图，支持点击放大预览，可上一张/下一张切换，支持键盘左右箭头切换和 ESC 关闭） | |
| 详情 | `details` | 应用信息（版本、大小、系统要求等）、应用描述、更新日志 | |
| 评论 | `comments` | Giscus 评论区（基于 GitHub Discussions） | |

**交互规则**：
- Tab 切换通过 URL hash 同步（如 `/cn/6502453075#price`），支持直接链接跳转
- Tab 导航栏支持 sticky 定位（`sticky top-16`），滚动时始终保持在视口顶部附近
- 使用 ARIA `role="tablist"` / `role="tab"` / `role="tabpanel"` 语义化属性
- 切换 Tab 时通过 `hidden` 属性隐藏非活动 Tab 面板，保留各 Tab 内部状态（DOM 节点和组件状态不被销毁）

#### 2.2.3 应用基本信息

展示应用的完整信息，数据通过 **iTunes Search API** 实时获取：

```
GET https://itunes.apple.com/lookup?id={trackId}&country={regionCode}
```

| 信息项 | 字段 | 说明 |
|--------|------|------|
| 应用 Logo | `artworkUrl512` | 高清大图展示 |
| 应用名称 | `trackName` | 主标题 |
| 开发者 | `artistName` / `sellerName` | 可点击跳转开发者页面 |
| 评分 | `averageUserRating` / `userRatingCount` | 星级 + 评价总数 |
| 分类 | `genres` / `primaryGenreName` | 标签展示 |
| 适配设备 | `supportedDevices` | 完整设备兼容列表，解析为平台标签 |
| 内容分级 | `contentAdvisoryRating` / `trackContentRating` | 年龄分级 |
| 当前版本 | `version` | 版本号 |
| 更新日期 | `currentVersionReleaseDate` | 格式化日期 |
| 文件大小 | `fileSizeBytes` | 转换为可读格式（如 123.5 MB） |
| 最低系统要求 | `minimumOsVersion` | 如 iOS 15.0 |
| 支持语言 | `languageCodesISO2A` | 语言标签列表 |
| 应用描述 | `description` | 完整展示，保留换行格式 |
| 更新日志 | `releaseNotes` | 最新版本更新内容 |
| App Store 链接 | `trackViewUrl` | "前往 App Store" 按钮，使用 iTunes API 返回的地区专属 URL |
| 通知禁用标识 | 通过 `/api/disabled-apps` 查询当前 trackId 是否存在 | 应用名称旁显示图标（�+禁止符号），鼠标悬浮提示“推送已禁用”（与列表页标注形式一致） |

#### 2.2.4 价格信息区

- **当前价格**：格式化价格显示
- **价格区间**：历史最低价 ~ 最高价（来自存储数据的 `minPriceInfo` 和 `maxPriceInfo`）
- **折扣幅度**：计算并显示折扣百分比
- **内购项目列表**：展示所有内购项的当前价格及历史价格区间（最低 ~ 最高）

#### 2.2.5 历史价格折线图 ⭐ 核心功能

- **图表库**：Chart.js + react-chartjs-2
- **数据来源**：`src/data/storage/{region}.json` 中对应 `trackId` 的 `history` 字段

图表区域默认展示全部历史价格数据，不提供时间范围筛选。

**图表配置**：

| 配置项 | 说明 |
|--------|------|
| X 轴 | 时间轴（日期），格式化显示 |
| Y 轴 | 价格，自动刻度 |
| 价格折线 | 应用价格或内购项价格变化曲线（主色） |
| 历史最低价标注 | 水平虚线标注历史最低价 |
| 历史最高价标注 | 水平虚线标注历史最高价 |

**交互功能**：

- 鼠标/手指悬停显示 Tooltip（日期、价格详情）
- 支持捏合缩放（移动端）和滚轮缩放（桌面端）查看特定时间段
- 支持拖拽平移
- 图例可点击切换显示/隐藏各折线

### 2.3 应用截图展示

#### 2.3.1 功能概述

在详情页的「图片」Tab 中展示应用的截图，帮助用户更直观地了解应用界面。

- **数据来源**：iTunes API 返回的 `screenshotUrls`（iPhone 截图）和 `ipadScreenshotUrls`（iPad 截图）
- **展示方式**：
  - 按设备类型分组展示（iPhone / iPad）
  - 横向滚动浏览，支持懒加载
  - 点击截图可放大预览（模态框）
  - 模态框支持点击背景或关闭按钮退出

#### 2.3.2 交互规则

- 截图卡片支持悬停缩放效果（桌面端）
- 移动端支持触摸滑动浏览截图
- 图片使用 `loading="lazy"` 实现懒加载，优化首屏性能
- 预览模态框支持 ESC 键关闭

### 2.4 用户评价系统

#### 2.4.1 功能概述

为应用添加社区评价/讨论功能，基于 **Giscus**（开源评论系统）实现。

- **技术方案**：使用 [Giscus](https://giscus.app/)，基于 GitHub Discussions 的开源评论系统
- **优势**：
  - 无需自建后端和数据库，数据存储在 GitHub Discussions 中
  - 基于 GitHub 账号认证，无需额外实现登录系统
  - 支持评论、回复、表情回应
  - 支持亮色/暗色主题切换（通过 postMessage 动态同步，无需重建 iframe）
  - 支持多语言（中/英）
  - 完全免费、开源
- **评价绑定**：使用 `pathname` mapping，每个页面路径自动对应一个 GitHub Discussions 话题
- **查看范围**：详情页嵌入 Giscus 评论组件，展示用户对该应用的讨论和评价

#### 2.4.2 集成方式

- 在 GitHub 仓库 `appstore-discounts/discussions` 中启用 Discussions 功能
- 使用 "Announcements" 分类（category-id: `DIC_kwDOSyAI8c4C-kYh`）
- 在应用详情页底部嵌入 Giscus 组件
- Giscus 配置：
  - `repo`: `appstore-discounts/discussions`
  - `repo-id`: `R_kgDOSyAI8Q`
  - `category`: `Announcements`
  - `category-id`: `DIC_kwDOSyAI8c4C-kYh`
  - `mapping`: `pathname`（按 URL 路径自动匹配讨论）
  - `theme`: 跟随系统偏好（`preferred_color_scheme`），应用内主题切换时通过 `postMessage` 动态同步
  - `lang`: 跟随应用语言设置
- 评论数据完全由 GitHub Discussions 管理，无需额外的数据库或 API

#### 2.4.3 展示位置

- **应用详情页**：底部嵌入 Giscus 评论区，用户可对应用进行讨论和评价
- **列表页**：不展示评论内容（评论仅在详情页查看）

### 2.5 多地区支持

#### 2.5.1 地区选择器

- 页面顶部导航栏提供地区切换入口
- **单选模式**：同一时间只能选择一个地区
- 支持的地区及对应数据源：

| 代码 | 名称 | 数据文件 |
|------|------|----------|
| cn | 中国大陆（默认） | `src/data/storage/cn.json` |
| hk | 中国香港 | `src/data/storage/hk.json` |
| mo | 中国澳门 | `src/data/storage/mo.json` |
| tw | 中国台湾 | `src/data/storage/tw.json` |
| us | 美国 | `src/data/storage/us.json` |
| tr | 土耳其 | `src/data/storage/tr.json` |
| pt | 葡萄牙 | `src/data/storage/pt.json` |

- 切换地区后，列表数据整体刷新，分页从第一条数据重新开始
- 地区选择体现在 URL 路径中（如 `/cn`、`/us`）
- 默认地区为 `cn`（中国大陆）
- **切换地区保持当前页面**：在任何页面（列表页、详情页、关于）切换地区时，保持当前页面类型不变，仅替换 URL 中的地区段（如 `/cn/about` → `/us/about`）

#### 2.5.2 App Store 链接

详情页的「前往 App Store」按钮需要正确跳转到对应地区的 App Store：

- **Apple 设备**（iOS/iPadOS/macOS）：使用 `itms-apps://itunes.apple.com/app/id{trackId}` 原生 URL Scheme，直接打开设备上的 App Store 应用，绕过网页重定向
- **非 Apple 设备**：使用 `https://apps.apple.com/{region}/app/id{trackId}` 网页链接（注意：Apple 可能按 IP 重定向到当地地区）
- **平台检测**：通过 `navigator.userAgent` 判断是否为 Apple 设备
- **trackId 通用性**：应用的 trackId 在全球所有地区通用，同一个 trackId 在任何地区商店都指向同一个应用

### 2.6 分享功能

- **分享按钮**：详情页头部区域提供分享按钮
- **Web Share API**：移动端优先使用原生分享面板
- **降级方案**：不支持 Web Share API 时，复制当前页面链接到剪贴板
- **反馈提示**：复制成功后显示"已复制"提示（2 秒后自动消失）

### 2.7 关注应用列表页

- **路由**：`/:region/apps`
- 展示当前地区所有被追踪的应用列表（按 trackId 去重）

**功能包括**：
- 分页加载（每页 40 条），通过 IntersectionObserver 实现滚动加载
- 支持按应用名称搜索过滤（服务端过滤，带 300ms 防抖）
- 展示应用图标、名称、评分、最新折扣信息
- 点击可跳转应用详情页

### 2.8 404 页面

- **路由**：`*`（未匹配任何路由时）
- 显示 🔍 图标、404 文字、本地化提示信息
- 提供"返回首页"按钮

### 2.9 错误处理与重试

- **列表页**：网络请求失败时显示错误状态 UI（⚠️ 图标 + 提示文字 + 重试按钮），重试通过递增计数器重新触发数据加载
- **详情页**：加载失败时显示错误状态 UI，重试通过 `retryKey` 状态递增重新触发 `useEffect`（避免页面刷新）
- **详情页**：加载失败时显示错误状态 UI + 重试按钮
- **骨架屏加载**：详情页数据加载前显示骨架屏占位（头部卡片、Tab 栏、内容区域），替代简单 spinner
- **全局 Suspense 骨架屏**：路由级代码分割的 Suspense fallback 使用卡片网格骨架屏，替代简单 spinner

---

## 3. 非功能需求

### 3.1 主题支持

- **亮色模式（Light）**：默认主题
- **暗色模式（Dark）**：深色背景主题

**切换机制**：

- 页面导航栏提供主题切换按钮（☀️/🌙 图标）
- 首次访问时自动检测系统偏好（`prefers-color-scheme`）
- 用户选择存储在 `localStorage` 中，持久化
- 使用 Tailwind CSS 的 `dark:` 前缀实现暗色模式

### 3.2 多语言支持

使用 `@i18n-pro/react` 实现国际化，默认语言为中文。

**text-as-key 模式**：中文文案直接作为 key，无需维护中文语言包。

```tsx
// 中文环境下直接显示文案
t('中国大陆')  // → 中国大陆
// 英文环境下通过 en.json 映射翻译
t('中国大陆')  // → China Mainland
```

**语言包**：英文语言包通过 `en.json` 引入（文案量较小，对首屏影响可忽略）。

**切换机制**：

- 页面导航栏提供语言切换入口（中/EN 按钮）
- 通过 `useI18n().setI18n({ locale })` 切换语言
- 首次访问时根据浏览器语言（`navigator.language`）自动选择
- 语言偏好存储在 `localStorage` 中

### 3.3 响应式设计

需适配以下设备类型：

| 设备类型 | 断点 | 布局特点 |
|----------|------|----------|
| 手机（Mobile） | < 768px | 单列布局，卡片全宽，底部/汉堡菜单导航 |
| 平板（Tablet） | 768px ~ 1024px | 双列布局，侧边栏可折叠 |
| 桌面（Desktop） | > 1024px | 三列布局，固定顶部导航栏，鼠标悬停交互 |

**具体适配要点**：

- 应用卡片：手机端单列 → 平板端双列 → 桌面端三列
- 详情页：手机端全屏页面 → 桌面端可考虑弹窗/侧边面板
- 折线图：根据屏幕宽度自适应缩放，移动端支持触摸手势
- 导航栏：手机端（<640px）地区选择器 + 主题/语言按钮保持可见，页面链接（应用列表、关于）收进汉堡菜单 → 桌面端（≥640px）所有导航项水平排列
- 触摸设备：支持触摸滑动、捏合缩放等手势
- 卡片悬停效果：使用 `@media (hover: hover)` 媒体查询，仅在支持悬停的设备上启用 `hover:shadow-md`，避免触摸设备上的 sticky hover 问题

### 3.4 性能要求

| 指标 | 目标 |
|------|------|
| 首屏加载时间（FCP） | < 2 秒 |
| 最大内容绘制（LCP） | < 2.5 秒 |
| 累积布局偏移（CLS） | < 0.1 |
| 首次输入延迟（FID） | < 100ms |

**优化策略**：

- **构建时数据预处理**：将原始 JSON 数据转换为前端优化格式，减少运行时计算
- **图片懒加载**：应用 Logo 使用 `loading="lazy"` + Intersection Observer
- **虚拟列表**：大量数据使用虚拟滚动（如 `react-window` 或 `react-virtuoso`）
- **代码分割**：按路由进行代码分割（React.lazy + Suspense）
- **资源压缩**：Gzip/Brotli 压缩，图片 WebP 格式
- **CDN 加速**：通过 Cloudflare CDN 分发静态资源
- **缓存策略**：静态资源长期缓存，API 数据适当缓存

### 3.5 SEO 优化策略 ⭐ 重点

SEO 是本项目的重要考量，需从以下多个维度进行优化：

#### 3.5.1 静态站点生成（SSG）

- 使用 `@prerenderer/prerenderer` 方案，在构建时预渲染页面
- 预渲染页面包括：
  - 首页（重定向到 `/cn`）
  - 各地区折扣列表页（`/cn`、`/hk`、`/mo`、`/tw`、`/us`、`/tr`、`/pt`）
- 配置方式：在 `scripts/prerender.ts` 中指定预渲染路径
- 非预渲染页面（详情页、应用列表页等）使用客户端渲染，但提供合理的 fallback

#### 3.5.2 Meta 标签

每个页面需包含完整的 meta 信息：

```html
<!-- 基础 Meta -->
<title>App Store Discounts - {region}</title>
<meta name="description" content="追踪 {地区} App Store 最新折扣信息，发现应用和内购项目的限时优惠。">
<meta name="keywords" content="App Store, 折扣, 优惠, 限免, {应用名称}, {地区}">

<!-- Open Graph (社交分享) -->
<meta property="og:title" content="{应用名称} - App Store 折扣">
<meta property="og:description" content="{应用描述摘要}">
<meta property="og:image" content="{应用 Logo URL}">
<meta property="og:url" content="https://appstore-discounts.eyelly.me/{region}/{trackId}">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{应用名称} - App Store 折扣">
<meta name="twitter:description" content="{折扣信息摘要}">

<!-- Canonical URL -->
<link rel="canonical" href="https://appstore-discounts.eyelly.me{当前路径}">
```

#### 3.5.3 结构化数据（JSON-LD）

为页面添加 Schema.org 结构化数据：

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "{应用名称}",
  "description": "{应用描述}",
  "applicationCategory": "{分类}",
  "operatingSystem": "iOS, iPadOS, macOS",
  "offers": {
    "@type": "Offer",
    "price": "{折扣价格}",
    "priceCurrency": "{货币代码}",
    "priceValidUntil": "{折扣截止日期（如有）}"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{评分}",
    "ratingCount": "{评价数}"
  }
}
```

#### 3.5.4 其他 SEO 措施

| 措施 | 说明 |
|------|------|
| 语义化 HTML | 使用 `<article>`、`<nav>`、`<main>`、`<header>`、`<footer>` 等语义标签 |
| Sitemap | 构建时自动生成 `sitemap.xml`，包含所有预渲染页面 |
| robots.txt | 配置允许搜索引擎爬取，指向 sitemap |
| URL 结构 | 使用简洁、可读的 URL（如 `/cn/6502453075`） |
| 页面链接 | 列表页和详情页之间有完整的链接关系，便于爬虫发现 |
| 图片 alt | 所有图片（应用 Logo）包含描述性 alt 属性 |
| 内部链接 | 在折扣信息中链接到应用详情页，形成内链网络 |
| hreflang | 为中英文页面添加 `hreflang` 标签，告知搜索引擎多语言版本 |
| RSS/Atom | 提供 RSS feed 发现链接，增加内容分发渠道 |
| 页面加载速度 | SEO 排名因素之一，通过性能优化保障 |

---

## 4. 数据架构

### 4.1 数据来源

本项目的数据来源分为两部分：

#### 4.1.1 构建时数据（来自项目存储文件）

在 Vite 构建阶段，从项目存储文件中提取和预处理数据：

```
原始数据文件                        构建时处理                        前端静态数据
├── src/data/storage/rss.json       ──→  提取最近折扣信息           ──→  data/discounts/{region}.json
├── src/data/storage/{region}.json  ──→  提取价格历史               ──→  data/history/{region}.json
├── src/data/storage/monthly-*.json ──→  月度数据（暂未使用）         ──→  （保留）
└── apps.json                       ──→  应用追踪配置               ──→  data/apps.json
```

**折扣列表数据结构**（构建后，基于 `storage/{region}.json` 重新计算）：

```typescript
/**
 * 折扣列表项 - 构建时从 storage/{region}.json 计算生成
 * 用于前端列表展示，仅包含折扣相关的核心数据
 * 应用的基础信息（名称、Logo、评分等）需通过 iTunes API 实时获取
 */
type DiscountListItem = {
  /** 应用的唯一标识符，对应 App Store 的 Track ID */
  trackId: number
  /** 所属地区 */
  region: Region
  /** 折扣发现的时间戳（毫秒） */
  timestamp: number
  /** 折扣详情列表，包含价格和内购的折扣信息 */
  discounts: Discount[]
  /** 当前应用价格（数值） */
  price: number
  /** 当前应用格式化价格字符串（如 "¥68.00"、"$9.99"） */
  formattedPrice: string
  /** 货币代码（如 "CNY"、"USD"） */
  currency: string
  /** App Store 应用详情页链接 */
  trackViewUrl: string
}
```

**价格历史数据结构**（构建后）：

```typescript
/**
 * 价格历史项 - 包含某应用在某地区的完整价格变化记录
 * 用于详情页的价格折线图展示
 */
type PriceHistoryItem = {
  /** 应用的唯一标识符 */
  trackId: number
  /** 应用名称（来自存储数据） */
  trackName: string
  /** 所属地区 */
  region: Region
  /** 历史最高价格信息（包含应用价格和各内购项的最高价） */
  maxPriceInfo: PriceInfo
  /** 历史最低价格信息（包含应用价格和各内购项的最低价） */
  minPriceInfo: PriceInfo
  /**
   * 完整价格历史记录
   * 外层数组按日期分组（每个元素代表一天内的价格变化记录）
   * 内层数组为同一天内的多次价格变化（按时间倒序）
   */
  history: DateStorageAppInfo[]
}
```

**应用信息缓存结构**：

```typescript
/**
 * 缓存的应用信息 - 从 iTunes API 获取后缓存到客户端
 * 以 {region}_{trackId} 为键存储
 */
type CachedAppInfo = {
  /** 应用的唯一标识符 */
  trackId: number
  /** 应用名称 */
  trackName: string
  /** 应用图标 URL（100x100） */
  artworkUrl100: string
  /** 应用图标 URL（512x512，用于详情页） */
  artworkUrl512: string
  /** 平均评分（0-5） */
  averageUserRating: number
  /** 评价总数 */
  userRatingCount: number
  /** 应用描述 */
  description: string
  /** 支持的设备列表（用于解析平台标签） */
  supportedDevices: string[]
  /** 应用分类列表 */
  genres: string[]
  /** 主分类名称 */
  primaryGenreName: string
  /** 内容分级（如 "4+"、"12+"、"17+"） */
  contentAdvisoryRating: string
  /** 当前版本号 */
  version: string
  /** 当前版本发布日期（ISO 8601 格式） */
  currentVersionReleaseDate: string
  /** 文件大小（字节数，字符串格式） */
  fileSizeBytes: string
  /** 最低系统版本要求（如 "15.0"） */
  minimumOsVersion: string
  /** 支持的语言代码列表（ISO 2A 格式） */
  languageCodesISO2A: string[]
  /** 最新版本更新日志 */
  releaseNotes: string
  /** App Store 链接 */
  trackViewUrl: string
  /** 缓存时间戳（毫秒），用于判断缓存是否过期 */
  cachedAt: number
}
```

#### 4.1.2 运行时数据（实时 API 调用 + 服务端代理）

应用的基础信息通过 iTunes Search API 获取：

```
GET https://itunes.apple.com/lookup?id={trackId}&country={regionCode}
```

| 参数 | 说明 | 示例 |
|------|------|------|
| `id` | 应用的 Track ID | `6502453075` |
| `country` | 地区代码（大写） | `CN`、`US`、`HK` |

支持批量查询（减少请求次数）：

```
GET https://itunes.apple.com/lookup?id=123,456,789&country=cn
```

**API 返回的关键字段**（对应 `RequestAppInfo` 类型）：

| 字段 | 用途 |
|------|------|
| `trackName` | 应用名称 |
| `artworkUrl512` | 高清应用图标 |
| `description` | 应用描述 |
| `averageUserRating` | 平均评分 |
| `userRatingCount` | 评价总数 |
| `genres` | 分类列表 |
| `version` | 当前版本 |
| `currentVersionReleaseDate` | 更新日期 |
| `fileSizeBytes` | 文件大小 |
| `minimumOsVersion` | 最低系统要求 |
| `languageCodesISO2A` | 支持语言 |
| `contentAdvisoryRating` | 内容分级 |
| `releaseNotes` | 更新日志 |
| `trackViewUrl` | App Store 链接 |
| `formattedPrice` | 格式化价格 |
| `supportedDevices` | 支持设备列表 |

**跨域问题 ⚠️**：

iTunes Search API（`itunes.apple.com`）**不支持 CORS**（跨域资源共享），浏览器端直接调用会被拦截。因此需要通过服务端代理转发请求。

**代理方案**：在 Cloudflare Workers 上创建轻量级 API 代理，使用原生 Workers API 实现，无需第三方框架。

- **代理端点**：`GET /api/itunes/lookup?id={trackId}&country={regionCode}`
- **代理逻辑**：接收前端请求 → 转发到 iTunes API → 返回响应给前端
- **附加能力**：在代理层实现缓存（利用 CDN/Edge 缓存），进一步减少对 Apple 服务器的请求

**Cloudflare Workers API 实现**：

使用原生 Cloudflare Workers API（`fetch` 事件处理器），无需引入第三方框架（如 Hono）。通过标准的 `Request` / `Response` 对象处理 HTTP 请求和响应。

```
api/
└── index.ts              # Cloudflare Workers 入口（原生 fetch 处理器）
```

| 文件 | 说明 |
|------|------|
| `api/index.ts` | Cloudflare Workers 入口，使用原生 `fetch` 事件处理器，基于 URL 路径路由请求 |

**缓存策略**（客户端）：

- API 响应按 `{region}_{trackId}` 为键进行缓存
- 内存缓存（`Map`）+ `localStorage` 二级缓存，TTL 为 1 小时
- 加载列表时，先批量查询缓存，仅对未命中缓存的项发起请求
- 支持 iTunes API 的批量查询格式（`?id=123,456,789`），一次性获取多个应用信息

#### 4.1.3 本地开发方案

在本地开发阶段，无需部署到 Cloudflare Workers / Vercel 即可完整走通功能。通过 Vite 的本地开发服务器代理 iTunes API 请求：

**Vite Dev Server 代理配置**：

```typescript
// src/web/vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      // 将 /api/itunes/* 请求代理到 iTunes API（解决 CORS 跨域问题）
      '/api/itunes': {
        target: 'https://itunes.apple.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/itunes/, ''),
        // 配置 User-Agent 头（Apple 可能会校验）
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'appstore-discounts/1.0')
          })
        },
      },
      // 将 /api/discounts/* 和 /api/history/* 代理到本地 Wrangler 开发服务器
      '/api/discounts': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api/history': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
```

**代理逻辑说明**：

| 环境 | 请求路径 | 实际转发 |
|------|----------|----------|
| 本地开发（Vite） | `http://localhost:5173/api/itunes/lookup?id=123&country=cn` | → `https://itunes.apple.com/lookup?id=123&country=cn` |
| 本地开发（Vite） | `http://localhost:5173/api/discounts/cn?page=1&size=40` | → `http://localhost:8787/api/discounts/cn?page=1` |
| 本地开发（Vite） | `http://localhost:5173/api/history/cn/123456` | → `http://localhost:8787/api/history/cn/123456` |
| 生产环境（CF Pages） | `https://appstore-discounts.eyelly.me/api/itunes/lookup?id=123&country=cn` | → Workers 函数 → `https://itunes.apple.com/lookup?id=123&country=cn` |
| 生产环境（CF Pages） | `https://appstore-discounts.eyelly.me/api/discounts/cn?page=1&size=40` | → Workers 函数读取 `discounts/cn.json` |

**前端 API 调用统一**：

前端代码中统一使用相对路径 `/api/itunes/lookup`，本地和生产环境无需切换：

```typescript
// src/web/utils/api.ts
const API_BASE = '/api/itunes'

export async function lookupApp(trackId: number, region: string) {
  const country = region.toUpperCase()
  const res = await fetch(`${API_BASE}/lookup?id=${trackId}&country=${country}`)
  return res.json()
}

export async function lookupApps(trackIds: number[], region: string) {
  const country = region.toUpperCase()
  const ids = trackIds.join(',')
  const res = await fetch(`${API_BASE}/lookup?id=${ids}&country=${country}`)
  return res.json()
}
```

**本地开发完整流程**：

```
1. 启动数据采集（现有流程）
   pnpm run rss  →  更新 storage/*.json

2. 数据预处理
   pnpm run generate-web-data  →  生成 src/web/data/*.json

3. 启动前端开发服务器
   cd src/web && pnpm run dev  →  http://localhost:5173
   （Vite 自动代理 /api/itunes/* 到 iTunes API）

4. 浏览器访问
   http://localhost:5173/cn  →  查看折扣列表
   http://localhost:5173/cn/6502453075  →  查看应用详情 + 价格折线图
```

> **无需任何额外配置或部署**，本地开发即可完整测试所有功能。

### 4.2 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        构建阶段 (Build Time)                      │
│                                                                   │
│  storage/*.json  ──→  generateData.ts  ──→  dist/data/*.json     │
│                                          ──→  dist/SSR pages      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        运行时 (Runtime)                           │
│                                                                   │
│  用户访问页面                                                      │
│    │                                                              │
│    ├─→ 加载预渲染的折扣列表数据 (静态 JSON)                         │
│    │     └─→ 渲染折扣卡片列表                                      │
│    │                                                              │
│    ├─→ 点击应用 → 进入详情页                                       │
│    │     ├─→ 从存储数据加载价格历史 → 渲染折线图                    │
│    │     └─→ 调用 iTunes API → 获取应用详情 → 渲染详情面板          │
│    │                                                              │
│    └─→ 切换地区/语言 → 重新加载对应数据                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 路由设计

| 路由 | 页面 | SSR/SSG | 说明 |
|------|------|---------|------|
| `/` | 首页 | SSG | 重定向到 `/cn`（默认地区） |
| `/{region}` | 折扣列表页 | SSG | 展示特定地区的折扣列表，首页即为 `/cn`，支持 cn/hk/mo/tw/us/tr/pt |
| `/{region}/apps` | 关注应用列表 | CSR | 展示当前地区所有被追踪的应用列表（按 trackId 去重），支持搜索 |
| `/{region}/{trackId}` | 应用详情 | SSG（热门） + CSR | 应用详情 + 历史价格折线图 + 用户评价 |
| `/{region}/about` | 关于页面 | SSG | 项目介绍 |
| `*` | 404 页面 | CSR | 未匹配路由时显示 |

**路由参数**：

| 参数 | 类型 | 可选值 |
|------|------|--------|
| `region` | `Region` | `cn` / `hk` / `mo` / `tw` / `us` / `tr` / `pt` |
| `trackId` | `string` | App Store 应用 ID（纯数字） |

---

## 6. 项目目录结构

```
src/web/                          # 前端页面根目录
├── index.html                    # 入口 HTML
├── main.tsx                      # 入口（含 JSX，使用 .tsx 后缀）
├── App.tsx                       # 根组件
├── i18n.ts                       # i18n 配置
├── vite.config.ts                # Vite 配置
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
├── wrangler.toml                 # Wrangler 配置
│
├── pages/                        # 页面组件
│   ├── DiscountList.tsx          # 折扣列表页（即首页，路由 /{region}）
│   ├── AppDetail.tsx             # 应用详情页（路由 /{region}/{trackId}）
│   ├── Apps.tsx                  # 关注应用列表页（路由 /{region}/apps）
│   ├── About.tsx                 # 关于页面
│   └── NotFound.tsx              # 404 页面
│
├── components/                   # 通用组件
│   ├── Layout/
│   │   ├── index.tsx             # 页面布局（Header + Content + Footer）
│   │   ├── Header.tsx            # 顶部导航栏（Logo、地区选择、语言切换、主题切换）
│   │   └── Footer.tsx            # 页脚
│   ├── AppCard/
│   │   ├── index.tsx             # 应用卡片组件
│   │   └── AppCardSkeleton.tsx   # 卡片骨架屏
│   ├── PriceTag.tsx              # 价格标签（原价删除线 + 折扣价高亮）
│   ├── RatingStars.tsx           # 评分星星组件
│   ├── PlatformTags.tsx          # 平台标签（iOS / iPadOS / macOS / watchOS / tvOS）
│   ├── DateNav.tsx               # 日期导航栏（左侧固定，可滚动定位）
│   ├── ScrollToTop.tsx           # 置顶按钮（右下角浮动）
│   ├── VirtualizedSection.tsx    # 虚拟化容器（IntersectionObserver 虚拟化）
│   ├── PriceChart.tsx            # 价格折线图（Chart.js + zoom/pan）
│   ├── SEOHead.tsx               # SEO Meta 标签管理
│   ├── StructuredData.tsx        # JSON-LD 结构化数据
│   ├── SearchInput.tsx           # 搜索输入框（带 300ms 防抖）
│   ├── ShareButton.tsx           # 分享按钮（Web Share API + 剪贴板降级）
│   └── GiscusComments.tsx        # Giscus 评论组件（基于 GitHub Discussions）
│
├── hooks/                        # 自定义 Hooks
│   ├── useTheme.ts               # 主题管理（亮/暗 + 系统偏好检测）
│   ├── useLocale.ts              # 语言管理
│   ├── useMediaQuery.ts          # 响应式断点检测
│   └── useDiscounts.ts           # 折扣数据加载与分页（含无限滚动 + 排序）
│
├── utils/                        # 工具函数
│   ├── price.ts                  # 价格格式化、折扣幅度计算
│   ├── device.ts                 # supportedDevices → 平台标签解析
│   ├── date.ts                   # 日期格式化、相对时间、分组
│   └── api.ts                    # iTunes Search API 调用封装（含缓存 + TTL）
│
├── i18n/                         # 国际化资源
│   └── en.json                   # 英文翻译（text-as-key 模式）
│
├── types/                        # 类型定义
│   └── index.ts
│
├── styles/                       # 全局样式
│   └── globals.css               # Tailwind 指令 + 全局样式 + DateNav 滚动条样式
│
├── public/                       # 静态资源
│   └── robots.txt
│
├── data/                         # 构建时生成的静态数据
│   ├── discounts/                # 折扣列表数据
│   │   └── {region}.json
│   └── history/                  # 价格历史数据
│       └── {region}.json
│
├── scripts/                      # 构建脚本
│   ├── generateWebData.ts        # 数据预处理脚本
│   └── generateSitemap.ts        # Sitemap 生成脚本
│
└── api/                          # Cloudflare Workers API
    └── index.ts                  # 原生 Workers 入口（iTunes 代理 + 折扣数据 + 价格历史）
```

---

## 7. SEO 详细策略

### 7.1 页面级 SEO

| 页面 | Title 模板 | Description 模板 |
|------|-----------|-----------------|
| 首页 | `App Store Discounts - {地区名称} 最新优惠` | `追踪{地区名称} App Store 最新折扣，发现应用和内购项目的限时优惠。免费开源工具。` |
| 详情页 | `{应用名称} - App Store Discounts` | `{应用名称}当前价格{价格}，历史最低{最低价}。查看完整价格趋势和折扣记录。` |
| 关于 | `关于 - App Store Discounts` | `开源的 App Store 折扣信息助手，基于 GitHub Actions，支持 RSS、Telegram 和钉钉通知。` |

### 7.2 Sitemap 策略

```xml
<!-- sitemap.xml -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>https://appstore-discounts.eyelly.me/cn</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- 应用详情页（仅收录热门应用） -->
  <url>
    <loc>https://appstore-discounts.eyelly.me/cn/6502453075</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**收录策略**：仅预渲染并收录折扣频率较高的热门应用（如月度折扣排行前 100 的应用），避免生成过多低质量页面。

### 7.3 链接策略

- 列表页每个应用卡片链接到详情页
- 列表页支持按应用名称搜索过滤
- 详情页进入时自动滚动到顶部
- 提供 `rel="prev"` 和 `rel="next"` 分页链接（如果使用传统分页）

---

## 8. 部署方案

### 8.1 部署选项

推荐 **Cloudflare Pages**（首选）或 **Vercel**，理由：

| 方案 | 优势 | 说明 |
|------|------|------|
| **Cloudflare Pages** ⭐ | 全球 CDN、免费 SSL、自定义域名、构建速度快 | 适合静态站点，与域名 `eyelly.me` 集成方便 |
| Vercel | 自动部署、Serverless Functions、Analytics | 如果未来需要 API Routes 可选 |
| GitHub Pages | 免费、与 GitHub Actions 集成 | 功能相对简单，无 Serverless 支持 |

#### 免费额度对比

两个平台的 Serverless 功能均可**免费使用**，对于本项目的规模（API 代理 + 静态站点）完全足够：

| 平台 | 免费类型 | 免费额度 | 本项目预估用量 |
|------|----------|----------|----------------|
| **Cloudflare Workers** | 每日请求 | 100,000 次/天 | ~10,000-50,000 次/天 |
| **Cloudflare Workers** | CPU 时间 | 10ms/请求 | 单次 iTunes API 代理约 50-100ms（异步 fetch 不计 CPU 时间） |
| **Cloudflare Pages** | 构建次数 | 500 次/月 | ~150 次/月（每 2 小时一次） |
| **Vercel Serverless** | 执行时间 | 100 小时/月 | ~10-20 小时/月 |
| **Vercel** | 带宽 | 100 GB/月 | ~10-30 GB/月 |
| **Vercel** | 构建次数 | 无限（Hobby 计划） | ~150 次/月 |

> **结论**：两个平台的免费额度均能满足项目需求，无需付费。

#### GitHub Actions 集成

两个平台均**完美支持**通过 GitHub Actions 实现自动部署：

**方案一：GitHub Actions 统一构建 + 部署**（推荐）

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy
on:
  schedule:
    - cron: '0 */2 * * *'  # 每 2 小时触发（与数据采集同步）
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm run generate-data     # 数据预处理
      - run: pnpm run build:web         # SSG 构建

      # 方案 A: 部署到 Cloudflare Pages
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: pages deploy dist --project-name=appstore-discounts

      # 方案 B: 部署到 Vercel
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
```

**方案二：平台自动 Git 集成**

| 平台 | 集成方式 | 说明 |
|------|----------|------|
| Cloudflare | GitHub App 连接 | 仓库 push 后自动触发构建和部署，也可配置构建命令 |
| Vercel | Git Integration | 连接 GitHub 仓库后，每次 push 自动构建部署，支持 Preview Deployments |

> **推荐**：采用**方案一**（GitHub Actions 统一构建），原因：
> 1. 可以在同一 CI 流程中先执行数据采集（更新 storage/*.json），再构建前端
> 2. 构建逻辑集中管理，切换部署平台时只需修改部署步骤
> 3. 与现有的 GitHub Actions 定时任务流程无缝衔接

### 8.2 CI/CD 流程

```
GitHub Actions 定时任务（每 120 分钟）
  │
  ├─→ 数据采集 & 折扣计算（现有流程）
  │     └─→ 更新 storage/*.json
  │
  ├─→ 触发前端构建
  │     ├─→ generateWebData.ts（数据预处理）
  │     ├─→ vite build（构建）
  │     └─→ 生成 dist/ 目录
  │
  └─→ react-snap（SSG 构建）
  │
  └─→ 自动部署到 Cloudflare Pages / Vercel
        └─→ 通过 CNAME 配置 appstore-discounts.eyelly.me
```

### 8.3 域名配置

- 主域名：`appstore-discounts.eyelly.me`
- SSL：自动（Cloudflare/Vercel 提供免费 SSL）
- DNS：添加 CNAME 记录指向部署平台

---

## 9. 验收标准

### 9.1 功能验收

- [ ] 折扣列表默认按时间倒序展示，按日期分组
- [ ] 首次加载显示 40 条数据，滚动到底部自动加载更多
- [ ] 每个应用卡片展示 Logo、评分、名称、描述、平台标签、优惠信息
- [ ] 价格信息正确显示原价（删除线）和折扣价（高亮）
- [ ] 点击应用卡片跳转到详情页 `/{region}/{trackId}`
- [ ] 详情页通过 iTunes API 获取并展示完整的应用信息
- [ ] 详情页折线图正确显示历史价格变化（含应用价格和内购价格）
- [ ] 折线图支持悬停 Tooltip、缩放、拖拽交互
- [ ] 支持 7 个地区的数据切换，URL 路径正确反映当前地区
- [ ] 支持亮色/暗色主题切换，偏好持久化
- [ ] 支持中英文语言切换，偏好持久化
- [ ] 移动端（< 768px）单列布局正确适配
- [ ] 平板（768-1024px）双列布局正确适配
- [ ] 桌面（> 1024px）三列布局正确适配

### 9.2 SEO 验收

- [ ] 所有页面包含完整的 `<title>` 和 `<meta description>`
- [ ] 应用详情页包含 Open Graph 标签
- [ ] 应用详情页包含 JSON-LD 结构化数据
- [ ] 生成 `sitemap.xml` 并可通过 URL 访问
- [ ] 使用语义化 HTML 标签（`<article>`、`<nav>`、`<main>` 等）
- [ ] 所有图片包含 `alt` 属性
- [ ] SSG 预渲染的页面 HTML 中包含完整内容（非空壳）
- [ ] Google Rich Results Test 验证结构化数据通过

### 9.3 性能验收

- [ ] Lighthouse Performance 得分 ≥ 90
- [ ] Lighthouse SEO 得分 ≥ 95
- [ ] First Contentful Paint (FCP) < 2 秒
- [ ] Largest Contentful Paint (LCP) < 2.5 秒
- [ ] Cumulative Layout Shift (CLS) < 0.1

### 9.4 兼容性验收

- [ ] Chrome、Firefox、Safari、Edge 最新两个大版本正常运行
- [ ] iOS Safari 15+ 正常运行
- [ ] Android Chrome 最新版本正常运行

---

## 10. 开发阶段规划

| 阶段 | 内容 | 预计工期 |
|------|------|----------|
| P1 | 项目初始化（Vite + React + TypeScript + Tailwind） | 0.5 天 |
| P2 | 数据预处理脚本 + 路由搭建 | 1 天 |
| P3 | 折扣列表页（卡片、分组、无限滚动） | 2 天 |
| P4 | 应用详情页 + iTunes API 集成 | 1.5 天 |
| P5 | 价格折线图 | 1 天 |
| P6 | 主题 + 多语言 + 响应式适配 | 1.5 天 |
| P7 | SEO 优化（SSG、Meta、结构化数据、Sitemap） | 1 天 |
| P8 | 部署配置 + 域名绑定 + CI/CD | 0.5 天 |
| P9 | 测试、优化、Bug 修复 | 1 天 |
| **总计** | | **约 10 天** |
