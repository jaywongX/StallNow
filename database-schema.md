# 数据库设计文档

本文档详细描述"摆摊了么"小程序的云数据库集合结构设计。

## 目录

1. [核心设计原则](#核心设计原则)
2. [集合列表](#集合列表)
3. [详细字段说明](#详细字段说明)
4. [索引设计](#索引设计)
5. [权限配置](#权限配置)

---

## 核心设计原则

### 人（User）和摊位（Stall）分离设计

- 一个用户可以管理多个摊位
- 身份通过 `role` 字段控制，不是通过摊位存在与否
- 摊主申请入驻 ≠ 直接变摊主，需审核通过

### 数据安全原则

- 敏感信息（如手机号）仅在必要时展示
- 地理位置存储为大致范围，非精确坐标
- 所有数据修改通过云函数进行，前端仅查询

---

## 集合列表

| 集合名 | 说明 | 主要用途 |
|--------|------|----------|
| `users` | 用户表 | 存储用户基本信息、角色、绑定摊位 |
| `stalls` | 地摊主表 | 存储摊位详细信息 |
| `categories` | 分类表 | 商品分类数据 |
| `applications` | 摊主申请表 | 摊主入驻申请记录 |
| `feedbacks` | 反馈表 | 用户反馈和意见 |

---

## 详细字段说明

### 1. users（用户表）

存储用户基本信息和角色权限。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | 是 | 唯一标识，系统自动生成 |
| `_openid` | String | 是 | 微信 OpenID（云开发数据库自动注入字段）|
| `nickName` | String | 否 | 微信昵称 |
| `avatarUrl` | String | 否 | 头像 URL |
| `role` | String | 是 | 身份角色：`user`(普通用户) / `vendor`(摊主) / `admin`(管理员) |
| `vendorInfo` | Object | 否 | 摊主额外信息 |
| `vendorInfo.realName` | String | 否 | 真实姓名 |
| `vendorInfo.phone` | String | 否 | 联系电话 |
| `vendorInfo.applyTime` | Date | 否 | 申请时间 |
| `vendorInfo.approvedTime` | Date | 否 | 审核通过时间 |
| `stallIds` | Array | 否 | 绑定的摊位ID列表（一个用户可管理多个摊位）|
| ~~`favorites`~~ | ~~Array~~ | ~~否~~ | ~~收藏的摊位ID列表~~（暂不实现） |
| ~~`recentViews`~~ | ~~Array~~ | ~~否~~ | ~~最近浏览记录~~（暂不实现） |
| `createTime` | Date | 是 | 注册时间 |
| `updateTime` | Date | 是 | 更新时间 |

> **注意**：云开发数据库会自动为每个记录注入 `_openid` 字段（当前用户的 OpenID），这是云开发的安全特性。我们显式存储 `_openid` 是为了便于查询和管理。

**role 权限说明**：

| 角色 | 权限 |
|------|------|
| `user` | 浏览摊位、提交反馈 |
| `vendor` | 以上 + 管理自己的摊位 |
| `admin` | 以上 + 审核申请、管理所有摊位、进入后台 |

---

### 2. stalls（地摊主表）

存储摊位的核心信息。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | 是 | 唯一标识 |
| `displayName` | String | 是 | 展示名（系统生成或摊主自定义） |
| `categoryId` | String | 是 | 分类ID（关联 categories._id） |
| `landmark` | String | 否 | 外观/地标特征，如"红色棚子"、"白色推车" |
| `location` | Object | 是 | 地理位置（用户手动选择的地图位置） |
| `location.latitude` | Number | 是 | 纬度 |
| `location.longitude` | Number | 是 | 经度 |
| `location.name` | String | 是 | 位置名称 |
| `location.address` | String | 是 | 详细地址 |
| `address` | String | 否 | 常出没区域描述，如"老街夜市"、"广场附近" |
| `city` | String | 是 | 城市，如"汕尾市" |
| `district` | String | 否 | 区县，如"城区" |
| `schedule` | Object | 是 | 出摊时间信息 |
| `schedule.type` | String | 是 | 时间类型：afternoon/evening/weekend/irregular |
| `schedule.timeRange` | String | 否 | 具体时间范围，如"18:00-23:00" |
| `schedule.note` | String | 否 | 时间备注 |
| `images` | Array | 否 | 图片URL数组（1-3张摊位实拍图） |
| `status` | Number | 是 | 状态：0待审核 1已上架 2已下架 3已下线 |
| `reliability` | Number | 是 | 可信度：0近期确认(30天内) 1可能还在(31-90天) 2信息过期(>90天) |
| `lastConfirmedAt` | Date | 是 | 最后确认时间 |
| `confirmMethod` | String | 否 | 确认方式：owner_scan/visitor_view/admin_check |
| `consentStatus` | Object | 否 | 采集同意状态 |
| `consentStatus.hasConsent` | Boolean | 否 | 是否已获取同意 |
| `consentStatus.consentDate` | Date | 否 | 同意时间 |
| `consentStatus.consentMethod` | String | 否 | 同意方式：verbal/online/written |
| `contact` | Object | 否 | 联系方式 |
| `contact.hasContact` | Boolean | 否 | 是否有联系方式 |
| `contact.phone` | String | 否 | 联系电话 |
| `contact.wechatQR` | String | 否 | 微信二维码图片URL |
| `ownerUserId` | String | 否 | 绑定的摊主用户ID（关联 users._id） |
| `createdBy` | String | 否 | 创建方式：`vendor_self`（摊主申请）/ `admin_proxy`（管理员代录） |
| `claimStatus` | String | 否 | 认领状态：`unclaimed`（待认领）/ `pending`（审核中）/ `claimed`（已认领）/ `rejected`（审核拒绝） |
| `claimedBy` | String | 否 | 认领摊主的用户ID |
| `claimedAt` | Date | 否 | 认领时间 |
| `viewCount` | Number | 是 | 访问计数（用于可信度计算） |
| `createTime` | Date | 是 | 创建时间 |
| `updateTime` | Date | 是 | 更新时间 |

**status 状态说明**：

| 值 | 状态 | 说明 |
|----|------|------|
| 0 | 待审核 | 新提交申请，等待管理员审核 |
| 1 | 已上架 | 审核通过，正常展示 |
| 2 | 已下架 | 摊主或管理员手动下架 |
| 3 | 已下线 | 长期未确认或违规被强制下线 |

**reliability 可信度说明**：

| 值 | 状态 | 说明 | 展示策略 |
|----|------|------|----------|
| 0 | 近期确认 | 30天内有确认 | 正常展示，显示🟢 |
| 1 | 可能还在 | 31-90天未确认 | 折叠展示，显示🟡 |
| 2 | 信息过期 | 超过90天未确认 | 默认不展示，显示🔴 |

**claimStatus 认领状态说明**（仅适用于 `createdBy='admin_proxy'` 的摊位）：

| 值 | 状态 | 说明 |
|----|------|------|
| `unclaimed` | 待认领 | 管理员代录入，等待摊主认领 |
| `pending` | 审核中 | 摊主已提交认领申请，等待管理员审核 |
| `claimed` | 已认领 | 审核通过，摊主已获得管理权 |
| `rejected` | 审核拒绝 | 认领申请被拒绝，摊主可重新申请 |

---

### 3. categories（分类表）

存储商品分类数据。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | 是 | 唯一标识 |
| `name` | String | 是 | 分类名称，如"小吃/烧烤"、"手工/饰品" |
| `icon` | String | 否 | 图标URL或图标类名 |
| `sort` | Number | 是 | 排序权重，数字越小越靠前 |
| `createTime` | Date | 是 | 创建时间 |

**初始分类数据**：

| name | sort |
|------|------|
| 小吃/烧烤 | 1 |
| 手工/饰品 | 2 |
| 玩具/文创 | 3 |
| 水果/零食 | 4 |
| 其他 | 5 |

---

### 4. applications（摊主申请表）

存储摊主入驻申请记录。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | 是 | 唯一标识 |
| `userId` | String | 是 | 申请人用户ID（关联 users._id） |
| `stallData` | Object | 是 | 申请时填写的摊位信息 |
| `stallData.categoryId` | String | 是 | 商品分类ID |
| `stallData.goodsTags` | Array | 是 | 商品标签列表 |
| `stallData.location` | Object | 是 | 定位位置（用户手动在地图选择） |
| `stallData.location.latitude` | Number | 是 | 纬度 |
| `stallData.location.longitude` | Number | 是 | 经度 |
| `stallData.location.name` | String | 是 | 位置名称 |
| `stallData.location.address` | String | 是 | 详细地址 |
| `stallData.address` | String | 否 | 常出没区域描述（选填） |
| `stallData.city` | String | 是 | 城市 |
| `stallData.schedule` | Object | 是 | 出摊时间 |
| `stallData.contact` | Object | 否 | 联系方式 |
| `stallData.displayName` | String | 否 | 自定义商家名称 |
| `status` | Number | 是 | 申请状态：0待审核 1已通过 2已拒绝 |
| `audit` | Object | 否 | 审核信息 |
| `audit.adminId` | String | 否 | 审核管理员ID |
| `audit.result` | String | 否 | 审核结果：pass/reject |
| `audit.remark` | String | 否 | 审核备注 |
| `audit.time` | Date | 否 | 审核时间 |
| `submitTime` | Date | 是 | 申请提交时间 |
| `updateTime` | Date | 是 | 更新时间 |

---

### 5. stallClaims（摊位认领申请表）⭐ 新增

存储摊主认领管理员代录入摊位的申请记录。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | 是 | 唯一标识 |
| `stallId` | String | 是 | 关联摊位ID（关联 stalls._id） |
| `userId` | String | 是 | 申请人用户ID（关联 users._id） |
| `realName` | String | 是 | 真实姓名 |
| `phone` | String | 是 | 手机号码 |
| `wechatId` | String | 否 | 微信号 |
| `idCardNumber` | String | 否 | 身份证号（加密存储）|
| `stallPhotos` | Array | 是 | 摊位实拍照片URL数组（1-3张）|
| `idCardPhoto` | String | 否 | 身份证照片URL |
| `businessLicense` | String | 否 | 营业执照照片URL |
| `status` | Number | 是 | 认领状态：0待审核 1已通过 2已拒绝 |
| `remark` | String | 否 | 审核备注（拒绝时填写原因）|
| `submitTime` | Date | 是 | 提交时间 |
| `auditTime` | Date | 否 | 审核时间 |
| `auditAdminId` | String | 否 | 审核管理员ID |

**认领流程说明**：
1. 管理员代录入的摊位 `createdBy='admin_proxy'`，`claimStatus='unclaimed'`
2. 摊主扫码后提交认领申请，创建 stallClaims 记录，`status=0`
3. 摊位状态更新为 `claimStatus='pending'`
4. 管理员审核通过后：`stallClaims.status=1`，`stalls.claimStatus='claimed'`，`stalls.claimedBy=userId`
5. 管理员审核拒绝后：`stallClaims.status=2`，`stalls.claimStatus='rejected'`（摊主可重新申请）

---

### 6. feedbacks（反馈表）

存储用户反馈和意见。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `_id` | String | 是 | 唯一标识 |
| `stallId` | String | 否 | 关联地摊ID（摊位反馈时填写） |
| `userId` | String | 否 | 提交反馈的用户ID |
| `type` | String | 是 | 反馈类型 |
| `content` | String | 是 | 反馈内容详情 |
| `contact` | String | 否 | 联系方式（可选，方便回复） |
| `status` | Number | 是 | 处理状态：0待处理 1已标记 2已处理 |
| `processNote` | String | 否 | 处理备注 |
| `createTime` | Date | 是 | 创建时间 |
| `processedAt` | Date | 否 | 处理时间 |

**type 反馈类型**：

| 值 | 说明 |
|----|------|
| wrong_location | 位置不对 |
| wrong_info | 商品信息不符 |
| not_exist | 摊位已不存在 |
| feature_bug | 功能问题/Bug |
| content_error | 内容错误 |
| other | 其他 |

---

## 索引设计

为提高查询效率，建议在以下字段创建索引：

### users 集合

```javascript
// 按 _openid 查询用户（云开发自动注入字段）
{ _openid: 1 }

// 按角色查询
{ role: 1 }
```

### stalls 集合

```javascript
// 地理位置索引（用于附近查询）
{ location: "2dsphere" }

// 按城市查询
{ city: 1 }

// 按状态查询
{ status: 1 }

// 按分类查询
{ categoryId: 1 }

// 复合索引：城市+状态（常用查询）
{ city: 1, status: 1 }

// 复合索引：状态+可信度（用于定时任务）
{ status: 1, reliability: 1 }

// 按摊主查询
{ ownerUserId: 1 }

// 按认领状态查询（认领审核列表）
{ claimStatus: 1 }

// 复合索引：创建方式+认领状态（代录入摊位筛选）
{ createdBy: 1, claimStatus: 1 }
```

### applications 集合

```javascript
// 按用户查询申请记录
{ userId: 1 }

// 按状态查询（审核列表）
{ status: 1 }

// 复合索引：状态+提交时间
{ status: 1, submitTime: -1 }
```

### stallClaims 集合 ⭐ 新增

```javascript
// 按摊位查询认领申请
{ stallId: 1 }

// 按用户查询认领申请
{ userId: 1 }

// 按状态查询（审核列表）
{ status: 1 }

// 复合索引：摊位+用户（检查是否已申请）
{ stallId: 1, userId: 1 }

// 复合索引：状态+提交时间
{ status: 1, submitTime: -1 }
```

### feedbacks 集合

```javascript
// 按摊位查询反馈
{ stallId: 1 }

// 按状态查询
{ status: 1 }

// 按类型查询
{ type: 1 }
```

---

## 权限配置

### 安全规则建议

```javascript
// users 集合
{
  "read": "doc.openId == auth.openid || doc._id == auth.openid",
  "write": "doc.openId == auth.openid"
}

// stalls 集合
{
  "read": "doc.status == 1",  // 只允许读取已上架的摊位
  "write": false  // 只能通过云函数写入
}

// applications 集合
{
  "read": "doc.userId == auth.openid",
  "write": "doc.userId == auth.openid && doc.status == 0"  // 只能写自己的待审核申请
}

// stallClaims 集合（认领申请）
{
  "read": "doc.userId == auth.openid",  // 用户只能读自己的认领申请
  "write": "doc.userId == auth.openid && doc.status == 0"  // 只能写自己的待审核申请
}

// feedbacks 集合
{
  "read": false,  // 只能通过云函数读取
  "write": "doc.userId == auth.openid"  // 只能提交自己的反馈
}

// categories 集合
{
  "read": true,   // 所有人可读
  "write": false  // 只能通过云函数写入
}
```

---

## 数据流转图

```
┌─────────────┐     申请入驻      ┌───────────────┐
│   普通用户    │ ───────────────→ │  applications  │
│  (role=user)  │                  │   (待审核状态)   │
└─────────────┘                  └───────┬───────┘
                                         │
                                         │ 管理员审核
                                         ▼
┌─────────────┐     审核通过      ┌───────────────┐
│   摊主用户    │ ←─────────────── │   stalls      │
│ (role=vendor)│                  │  (创建摊位记录)  │
└──────┬──────┘                  └───────────────┘
       │
       │ 管理摊位
       ▼
┌───────────────┐
│  更新摊位信息   │
│  确认摊位状态   │
│  一键下线     │
└───────────────┘
```

### 摊主认领摊位流程（代录入摊位）

```
┌─────────────┐     管理员代录入     ┌───────────────┐
│   管理员      │ ───────────────→ │     stalls      │
│  (role=admin) │                  │ createdBy='admin_proxy'
└─────────────┘                  │ claimStatus='unclaimed'
                                 └────────┬──────┘
                                          │
                                          │ 摊主扫码
                                          ▼
                                 ┌─────────────────┐
                                 │   填写认证信息    │
                                 │  - 真实姓名      │
                                 │  - 手机号码      │
                                 │  - 摊位照片      │
                                 └────────┬────────┘
                                          │
                                          │ 提交认领申请
                                          ▼
                                 ┌─────────────────┐
                                 │   stallClaims   │
                                 │    status=0     │
                                 │   (待审核状态)   │
                                 └────────┬────────┘
                                          │
                                          │ 管理员审核
                                          ▼
                    ┌─────────────────────┴─────────────────────┐
                    │ 通过                                      │ 拒绝
                    ▼                                           ▼
           ┌─────────────────┐                        ┌─────────────────┐
           │  stalls.claimStatus    │                        │  stalls.claimStatus    │
           │   → 'claimed'    │                        │   → 'rejected'   │
           │ 摊主获得管理权    │                        │ 摊主可重新申请    │
           └─────────────────┘                        └─────────────────┘
```

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2025-02-03 | 初始版本，包含5个核心集合 |
| v1.1 | 2025-02-11 | 新增认领审核功能，新增 `stallClaims` 集合，扩展 `stalls.claimStatus` 枚举值 |
