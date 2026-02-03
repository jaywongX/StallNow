# 摆地摊了么 (StallNow)

一款地摊分布与发现工具微信小程序，旨在推广家乡美食文化，方便游客发现地摊、帮助商贩展示信息。

## 项目简介

"摆地摊了么"不是一个"商家平台"，而是一个"帮人找到摊位的本地指南"。

### 核心原则
- 名字可以不正规
- 联系可以不完善
- 信息可以不完美
- 但信任会慢慢累积

## 功能特性

### 用户端
- **地图发现**：基于腾讯地图展示地摊分布
- **地摊详情**：展示商品类别、出摊时间、实拍图片、大致位置
- **分类筛选**：按商品类别和出摊时段筛选
- **反馈机制**：用户可反馈信息不准确

### 摊主端
- **入驻申请**：6步完成申请，5分钟搞定
- **摊位确认**：扫码确认摊位，延长可信度有效期
- **一键下线**：随时下线自己的摊位
- **联系方式**：可选展示电话和微信二维码

### 管理端
- **审核管理**：审核入驻申请
- **地摊管理**：上架、下架、确认摊位
- **反馈处理**：处理用户反馈

### 合规页面
- **隐私政策**：明确数据收集和使用说明
- **关于我们**：产品介绍和免责声明
- **意见反馈**：用户可直接提交反馈（功能建议、Bug、内容纠错）
- **联系方式说明**：联系方式展示规则说明

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
│   └── images/           # 图片资源
├── cloudfunctions/       # 云函数
│   ├── getStalls/        # 获取地摊列表
│   ├── getStallDetail/   # 获取地摊详情
│   ├── submitApplication/# 提交入驻申请
│   ├── auditApplication/ # 审核申请
│   ├── adminGetApplications/# 获取申请列表
│   ├── confirmStall/    # 确认摊位
│   ├── submitFeedback/  # 提交反馈
│   ├── offlineStall/    # 下线摊位
│   ├── updateReliability/# 更新可信度状态
│   ├── bindStallOwner/  # 绑定摊主
│   ├── unbindStallOwner/# 解绑摊主
│   └── checkCitySupport/# 检查城市支持
├── plan.md              # 产品规划文档
├── README.md           # 项目说明文档
└── database-init.md    # 数据库初始化指南
```

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
   - `feedbacks`（反馈表）

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
| ~~favorites~~ | ~~Array~~ | ~~收藏的摊位ID列表~~（暂不实现） |
| createTime | Date | 注册时间 |
| updateTime | Date | 更新时间 |

### stalls（地摊主表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| displayName | String | 展示名（系统生成） |
| categoryId | String | 分类ID |
| goodsTags | Array | 商品标签列表 |
| location | Object | 地理位置（用户手动选择） |
| address | String | 常出没区域描述 |
| city | String | 城市 |
| schedule | Object | 出摊时间 |
| images | Array | 图片URL数组 |
| status | Number | 状态：0待审核 1已上架 2已下架 3已下线 |
| reliability | Number | 可信度状态：0近期确认 1可能还在 2信息过期 |
| lastConfirmedAt | Date | 最后确认时间 |
| contact | Object | 联系方式 |
| **ownerUserId** | String | **绑定的摊主用户ID（关联 users._id）** |

### categories（分类表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| name | String | 分类名称 |
| icon | String | 图标 |
| sort | Number | 排序 |

### applications（摊主申请表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | String | 唯一标识 |
| **userId** | String | **申请人用户ID** |
| stallData | Object | 申请数据 |
| status | Number | 0待审核 1已通过 2已拒绝 |
| audit | Object | 审核信息 {adminId, result, remark, time} |
| submitTime | Date | 申请时间 |
| updateTime | Date | 更新时间 |

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

初期仅在广东汕尾市开放，包含：
- 城区
- 海丰县
- 陆河县
- 陆丰市

### 定位处理策略

- 如果用户定位不在汕尾市，**自动切换到汕尾市城区二马路**
- 显示提示："已为您切换到汕尾市，目前仅支持该地区"
- 多城市支持开关位于 `app.js` 的 `CITY_CONFIG.multiCityEnabled`，设为 `true` 即可开放多城市支持

## 注意事项

1. 本项目仅用于信息展示，不涉及交易功能
2. 摊位为流动经营，信息可能变化
3. 用户应自行判断信息准确性，平台不承担任何责任

## 许可证

本项目仅供学习参考使用。
