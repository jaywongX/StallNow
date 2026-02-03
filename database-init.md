# 数据库初始化指南

## 数据库集合创建

### 1. stalls（地摊主表）
创建集合：`stalls`

索引：
- `categoryId` - 分类ID
- `city` - 城市
- `status` - 状态
- `reliability` - 可信度状态
- `vendorName` - 商家名称（唯一）

### 2. categories（分类表）
创建集合：`categories`

索引：
- `sort` - 排序

### 3. applications（入驻申请表）
创建集合：`applications`

索引：
- `status` - 状态
- `submitTime` - 提交时间

### 4. feedbacks（反馈表）
创建集合：`feedbacks`

索引：
- `stallId` - 地摊ID
- `status` - 状态
- `createTime` - 创建时间

## 初始化分类数据

在 `categories` 集合中插入以下数据：

```javascript
[
  {
    "_id": "cat_001",
    "name": "小吃/烧烤",
    "icon": "🍢",
    "sort": 1
  },
  {
    "_id": "cat_002",
    "name": "手工/饰品",
    "icon": "🎨",
    "sort": 2
  },
  {
    "_id": "cat_003",
    "name": "玩具/文创",
    "icon": "🧸",
    "sort": 3
  },
  {
    "_id": "cat_004",
    "name": "水果/零食",
    "icon": "🍎",
    "sort": 4
  },
  {
    "_id": "cat_005",
    "name": "其他",
    "icon": "📦",
    "sort": 5
  }
]
```

## 云存储配置

创建以下文件夹：
- `images/` - 存储地摊图片
- `qrcodes/` - 存储微信二维码

## 权限配置

### 数据库权限
所有集合的权限设置为：
- 仅创建者可读写（初始）
- 后续可根据需要调整为自定义权限

### 云存储权限
设置为：
- 所有用户可读
- 仅创建者可写

## 定时任务配置

配置 `updateReliability` 云函数为定时触发器：
- 触发周期：每天凌晨 2:00
- Cron 表达式：`0 0 2 * * * *`
