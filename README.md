# 小摊记 (StallNow)

一款地摊分布与发现工具微信小程序，旨在推广家乡美食文化，方便游客发现地摊、帮助商贩展示信息。

## 项目简介

"小摊记"不是一个"商家平台"，而是一个"帮人找到摊位的本地指南"。

### 核心原则
- 名字可以不正规
- 联系可以不完善
- 信息可以不完美
- 但信任会慢慢累积

## 功能特性

### 用户端
- **地图发现**：基于腾讯地图展示地摊分布
  - **分类彩色标记+名称显示**：不同颜色标记+文字标签，一眼识别摊位类型
  - 点击标记弹出卡片预览，再进入详情
  - 支持标记点聚合显示
- **地摊详情**：展示商品类别、出摊时间、实拍图片、大致位置
- **分类筛选**：按商品类别和出摊时段筛选
- **关键词搜索**：支持按摊位名称、商品名称搜索 ⭐优化
- **距离筛选**：参考美团样式，支持附近/500m/1km/3km/全城筛选
- **列表排序**：支持距离排序、活跃度排序
- **收藏功能**：收藏常用摊位，快速查看
- **点赞功能**：点赞喜欢的摊位，表达支持 ⭐新增
- **反馈机制**：用户可反馈信息不准确
- **推荐摊位**：游客可推荐发现的摊位，丰富平台内容 ⭐新增

### 摊主端
- **入驻申请**：7步完成申请，5分钟搞定
  - 支持上传 1-3 张摊位照片（自动压缩，节省存储空间）
  - **出摊时间灵活选择**：选择"不固定"时可自定义具体时段（如 18:00-22:00）
  - **价格区间设置**：设置商品价格区间（10元以内/10-20/20-30/30元以上/自定义/暂不提供）⭐新增
  - **合规提示**：引导摊主避免上传含价格、交易信息的图片
- **摊位认领**：扫码认领管理员代录入的摊位
  - 提交认证信息：姓名、手机号、微信号、摊位照片
  - 等待管理员审核确认
  - 审核通过获得摊位管理权
- **摊位管理**：
  - 编辑摊位信息（名称、照片、联系方式等）
  - 修改出摊时间（实时生效）
  - 查看摊位状态（今日可能在/最近没摆/信息过期）
- **每日签到**：
  - 摊主每天可签到一次，确认摊位仍在营业
  - 签到后状态显示为"今日可能在"，更容易被用户找到
  - 提示商贩每天签到，保持摊位状态新鲜
- **摊位分享**：
  - 生成专属小程序码（可打印张贴在摊位）
  - 用户扫码后弱引导收藏摊位
- **摊位确认**：扫码确认摊位，延长可信度有效期
- **一键下线**：随时下线自己的摊位
- **联系方式**：可选展示电话和微信二维码

### 管理端
- **入驻审核**：审核摊主入驻申请
  - 显示完整申请信息：申请人头像昵称、商品类型、外观特征、摊位照片、位置、出摊时间、联系方式等
  - **地图可视化**：直观展示申请摊位的地图位置，支持缩放查看
  - 支持预览摊位照片
- **认领审核**：审核摊主认领申请
  - 查看认领者提交的认证信息：姓名、手机号、微信号
  - 查看证明材料：摊位实拍照片、身份证、营业执照
  - 对比摊位现有信息，确认是否为真实摊主
  - 审核操作：通过 / 拒绝并填写原因
- **代录入摊位**：帮助不熟悉小程序的商贩录入信息
  - 无需审核，直接上架
  - 摊位状态："营业中（待认领）"
  - 支持摊主后续扫码认领，认领需审核
- **地摊管理**：上架、下架、确认摊位
- **反馈处理**：处理用户反馈

### 合规页面（在"我的"标签页中）
- **隐私政策**：明确数据收集和使用说明
- **关于我们**：产品介绍和免责声明
- **用户反馈说明**：反馈处理机制说明
- **联系方式说明**：联系方式展示规则说明
- **意见反馈**：用户可提交功能建议和内容纠错

## 技术栈

- **前端**：微信小程序原生框架（WXML + WXSS + JS）
- **地图服务**：腾讯位置服务 API
- **后端**：微信云开发（CloudBase）
  - 云数据库
  - 云存储
  - 云函数

## 项目结构

```
StallNow/
├── miniprogram/           # 小程序前端代码
│   ├── pages/            # 页面
│   ├── components/       # 公共组件
│   ├── utils/            # 工具函数
│   │   ├── api.js        # 原始API封装（直接调用云函数）
│   │   ├── cached-api.js # 带缓存的API封装（推荐）⭐ 新增
│   │   └── cache-manager.js # 缓存管理器 ⭐ 新增
│   └── images/           # 图片资源
├── cloudfunctions/       # 云函数
│   ├── getStalls/           # 获取地摊列表
│   ├── getStallDetail/      # 获取地摊详情
│   ├── submitApplication/   # 提交入驻申请
│   ├── auditApplication/    # 审核入驻申请
│   ├── adminGetApplications/# 获取入驻申请列表
│   ├── submitClaimApplication/  # ⭐ 提交认领申请
│   ├── auditClaimApplication/   # ⭐ 审核认领申请
│   ├── getClaimApplications/    # ⭐ 获取认领申请列表
│   ├── getMyClaimStatus/        # ⭐ 获取用户对摊位的认领状态
│   ├── checkinStall/            # ⭐ 摊主签到
│   ├── confirmStall/        # 确认摊位
│   ├── submitFeedback/      # 提交反馈
│   ├── offlineStall/        # 下线摊位
│   ├── updateReliability/   # 更新可信度状态
│   ├── bindStallOwner/      # 绑定摊主
│   ├── unbindStallOwner/    # 解绑摊主
│   └── checkCitySupport/    # 检查城市支持
│
**注意**：所有云函数统一返回格式为 `{ code: 0, data: ..., message: ... }`，`code: 0` 表示成功，`code: -1` 表示失败
├── plan.md              # 产品规划文档
├── README.md           # 项目说明文档
└── database-init.md    # 数据库初始化指南
```

## 数据缓存机制 ⭐

为了降低云函数调用成本并提升用户体验，项目实现了**双层缓存机制**。

### 缓存策略

| 数据类型 | 缓存有效期 | 存储位置 | 触发刷新 |
|---------|-----------|---------|---------|
| 分类数据 | 7天 | Storage + 内存 | 手动刷新 |
| 摊位列表 | 5分钟 | Storage + 内存 | 筛选变化/下拉刷新 |
| 摊位详情 | 10分钟 | Storage + 内存 | 编辑后/手动刷新 |
| 用户信息 | 应用生命周期 | 内存 | 修改后 |

### 使用方式

```javascript
// 方式1：使用带缓存的API（推荐）
const cachedApi = require('../../utils/cached-api.js');

// 自动使用缓存
const result = await cachedApi.getStalls({ city: '汕尾市' });

// 强制刷新（忽略缓存）
const result = await cachedApi.getStalls(
  { city: '汕尾市' },
  { forceRefresh: true }
);

// 方式2：直接使用缓存管理器
const cacheManager = require('../../utils/cache-manager.js');

// 存储缓存（5分钟有效期）
cacheManager.set('my_key', data, 5 * 60 * 1000);

// 读取缓存
const data = cacheManager.get('my_key');

// 清理缓存
cacheManager.clear(); // 清空所有
cacheManager.clearByPrefix('stalls_'); // 按前缀清理
```

### 预期收益

- **云函数调用减少 50-90%**（根据用户使用模式）
- **页面加载速度提升 30-50%**
- **降低云开发费用支出**

---

## 快速开始

### 1. 环境准备

- 安装微信开发者工具
- 注册微信小程序账号
- 开通微信云开发

### 2. 项目配置

1. 使用微信开发者工具打开项目
2. 在 `miniprogram/app.js` 中配置云开发环境ID：
   ```javascript
   wx.cloud.init({
     env: 'your-env-id', // 替换为你的云开发环境ID
   });
   ```

3. 在 `miniprogram/pages/index/index.js` 中配置腾讯地图Key：
   ```javascript
   key: 'your-map-key', // 替换为你的腾讯地图Key
   ```

### 3. 数据库初始化

1. 在云开发控制台创建以下集合：
   - `users`（用户表）
   - `stalls`（地摊主表）
   - `categories`（分类表）
   - `applications`（摊主申请表）
   - `stallClaims`（摊位认领申请表）
   - `feedbacks`（反馈表）
   - `searchLogs`（搜索日志表）⭐ 新增

2. 创建云函数 `initDatabase`，将 `database-init.js` 的内容复制进去

3. 运行云函数初始化分类数据

### 4. 准备合规页面文案

根据 `plan.md` 中的"上线前准备"章节，准备好以下页面的文案：

- **隐私政策**：数据收集和使用说明
- **关于我们**：产品定位和免责声明
- **用户反馈说明**：信息来源和处理机制
- **联系方式说明**：联系方式展示规则

### 5. 上传云函数

1. 右键每个云函数文件夹，选择"上传并部署：云端安装依赖"
2. 等待所有云函数部署完成

### 6. 配置定时任务

在云开发控制台配置 `updateReliability` 云函数为定时触发器：
- 触发周期：每天凌晨 2:00
- Cron 表达式：`0 0 2 * * * *`

### 7. 运行项目

1. 点击微信开发者工具的"编译"按钮
2. 查看小程序效果

### 8. 上线前检查

根据 `plan.md` 中的"上线前准备"章节完成以下检查：

**产品定位**：
- ✅ 确认是信息工具，不是交易平台
- ✅ 文案一致（所有地方都要一致）
- ✅ 功能符合定位（不涉及交易）

**合规页面**：
- ✅ 关于我们页
- ✅ 用户反馈说明页
- ✅ 联系方式说明页
- ✅ 隐私政策页（使用官方模板）

**文案准备**：
- ✅ 审核问答准备（3个问题）
- ✅ 内容治理策略明确
- ✅ 免责声明完善

## 数据模型

### 核心设计原则

**人（User）和摊位（Stall）分离**：
- 一个用户可以管理多个摊位
- 身份通过 `role` 字段控制：`user`(普通用户) / `vendor`(摊主) / `admin`(管理员)
- 摊主申请入驻需审核通过后才获得 `vendor` 角色

### users（用户表）⭐ 新增

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| openId | String | 微信 OpenID |
| nickName | String | 微信昵称 |
| avatarUrl | String | 头像 URL |
| **role** | String | **身份角色：user / vendor / admin** |
| vendorInfo | Object | 摊主信息 {realName, phone, applyTime, approvedTime} |
| stallIds | Array | 绑定的摊位ID列表 |
| favorites | Array | 收藏的摊位ID列表 |
| likes | Array | 点赞的摊位ID列表 ⭐新增 |
| createTime | Date | 注册时间 |
| updateTime | Date | 更新时间 |

### stalls（地摊主表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| displayName | String | 展示名（系统生成） |
| categoryId | String | 分类ID |
| **goodsTags** | **Array** | **商品标签列表（如["烧烤", "臭豆腐"]，最多5个）** |
| landmark | String | 外观/地标特征 |
| location | GeoPoint | 地理位置 |
| address | String | 大致位置描述 |
| city | String | 城市 |
| schedule | Object | 出摊时间 {types, display, customTime, customTimeStart, customTimeEnd} |
| images | Array | 图片URL数组 |
| status | Number | 状态：0待审核 1已上架 2已下架 3已下线 |
| reliability | Number | 可信度状态：0近期确认 1可能还在 2信息过期 |
| lastConfirmedAt | Date | 最后确认时间 |
| contact | Object | 联系方式 |
| **ownerUserId** | String | **绑定的摊主用户ID（关联 users._id）** |
| **createdBy** | String | **创建方式：vendor_self（摊主申请）/ admin_proxy（管理员代录）/ user_recommend（游客推荐）** ⭐新增 |
| **claimStatus** | String | **认领状态：unclaimed（待认领）/ pending（审核中）/ claimed（已认领）/ rejected（审核拒绝）** |
| **claimedBy** | String | **认领人用户ID** |
| **claimedAt** | Date | **认领时间** |
| **recommendedBy** | String | **推荐用户ID（游客推荐时填写）** ⭐新增 |
| **recommendedAt** | Date | **推荐时间** ⭐新增 |
| **priceRange** | Object | **价格区间** {type, display, customMin, customMax} ⭐新增 |
| **likeCount** | Number | **点赞数量** ⭐新增 |
| **favoriteCount** | Number | **收藏数量** |

### categories（分类表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| name | String | 分类名称 |
| icon | String | 图标 |
| sort | Number | 排序 |

### applications（摊主申请表）⭐ 重命名

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| **userId** | String | **申请人用户ID** |
| stallData | Object | 申请数据（含 priceRange） |
| status | Number | 0待审核 1已通过 2已拒绝 |
| audit | Object | 审核信息 {adminId, result, remark, time} |
| submitTime | Date | 申请时间 |
| updateTime | Date | 更新时间 |

### stallClaims（摊位认领申请表）⭐ 新增

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| **stallId** | String | **关联摊位ID** |
| **userId** | String | **申请人用户ID** |
| realName | String | 真实姓名 |
| phone | String | 手机号码 |
| wechatId | String | 微信号 |
| idCardNumber | String | 身份证号（加密存储）|
| stallPhotos | Array | 摊位实拍照片URL数组（1-3张）|
| idCardPhoto | String | 身份证照片URL |
| businessLicense | String | 营业执照照片URL |
| status | Number | **0待审核 1已通过 2已拒绝** |
| remark | String | 审核备注（拒绝原因）|
| submitTime | Date | 提交时间 |
| auditTime | Date | 审核时间 |
| auditAdminId | String | 审核管理员ID |

### feedbacks（反馈表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| stallId | String | 关联地摊ID（摊位反馈时填写）|
| type | String | 反馈类型：wrong_location/wrong_info/not_exist/other/feature_bug/content_error |
| content | String | 反馈内容详情 |
| contact | String | 联系方式（可选）|
| status | Number | 0待处理 1已标记 2已处理 |
| createTime | Date | 创建时间 |
| processedAt | Date | 处理时间 |

### searchLogs（搜索日志表）⭐ 已实现

用于分析用户搜索行为，优化搜索体验。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| keyword | String | 搜索关键词 |
| city | String | 搜索城市 |
| hasResult | Boolean | 是否有搜索结果 |
| resultCount | Number | 结果数量 |
| createTime | Date | 搜索时间 |

## 风险控制机制

### 可信度状态系统
- 🟢 近期确认（30天内）：正常展示
- 🟡 信息较旧（31-90天）：折叠展示，提示"信息较旧"
- 🔴 信息过期（>90天）：默认不展示，但不删除

### 一键下线机制
- 摊主可随时一键下线自己的摊位
- 管理员可一键下线任何摊位
- 收到反馈后，先标记"待确认"并降权展示

### 免责声明
- 页面底部固定显示"信息展示，不构成交易建议"
- 详情页明确标注"以现场实际为准"

## 地区限制

初期仅在广东汕尾市开放

## 小程序经营内容说明（备案用）

本小程序是一款地摊信息展示与发现工具，主要服务于广东省汕尾市的地摊经济生态。核心功能包括：为市民游客提供地摊分布地图浏览、分类筛选、收藏分享等信息查询服务；为摊主提供摊位信息录入、编辑管理、状态更新等信息发布服务；为运营方提供信息审核、内容管理等后台服务。本小程序仅提供信息展示功能，不涉及在线交易、支付结算、商品买卖等商业交易行为，不收取任何费用，旨在助力本地夜市经济发展，方便市民发现周边美食与特色商品。

## 注意事项

1. 本项目仅用于信息展示，不涉及交易功能
2. 摊位为流动经营，信息可能变化
3. 用户应自行判断信息准确性，平台不承担任何责任

## 许可证

本项目仅供学习参考使用。
