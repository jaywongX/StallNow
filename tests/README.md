# 摆摊了么 - 测试文档

## 测试框架概述

本项目使用 **Jest** 作为测试框架，为微信小程序云函数提供单元测试支持。

## 目录结构

```
tests/
├── README.md                      # 本文件
├── setup.js                       # Jest 测试前置配置
├── cloudfunctions/                # 云函数测试文件
│   ├── index.test.js             # 测试入口和冒烟测试
│   ├── getStalls.test.js         # 获取摊位列表测试
│   ├── submitApplication.test.js # 提交入驻申请测试
│   └── adminGetApplications.test.js # 管理员获取申请列表测试
├── mock/                          # 模拟数据
│   ├── index.js                  # Mock 数据导出
│   ├── data/
│   │   ├── stalls.js             # 摊位模拟数据
│   │   └── applications.js       # 申请和用户模拟数据
│   └── utils/
│       └── test-helpers.js       # 测试辅助函数
└── coverage/                      # 测试覆盖率报告（生成后）
```

## 已覆盖的测试场景

### 1. getStalls（获取摊位列表）
- ✅ 基础查询（返回所有已上架摊位）
- ✅ 分类筛选
- ✅ 时间类型筛选
- ✅ 城市筛选
- ✅ 关键词搜索
- ✅ 分页功能
- ✅ 组合筛选
- ✅ 异常情况处理
- ✅ 数据过滤规则（只返回 status=1）

### 2. submitApplication（提交入驻申请）
- ✅ 完整数据提交
- ✅ 最小数据提交
- ✅ 自定义展示名
- ✅ 不固定时间（自定义时间段）
- ✅ 多时间段选择
- ✅ 未注册用户拦截
- ✅ 重复提交拦截
- ✅ 已是摊主拦截
- ✅ 展示名自动生成
- ✅ 申请记录状态和时间
- ✅ 用户ID关联
- ✅ 可选字段处理
- ✅ 异常情况处理

### 3. adminGetApplications（获取申请列表）
- ✅ 基础查询（所有申请）
- ✅ 状态筛选（待审核/已通过/已拒绝）
- ✅ 图片URL转换
- ✅ 微信二维码URL转换
- ✅ 用户信息关联
- ✅ 数据完整性检查
- ✅ 边界情况处理
- ✅ 异常情况处理

## 如何运行测试

### 1. 安装依赖

```bash
npm install
```

### 2. 运行所有测试

```bash
npm test
```

或

```bash
npx jest
```

### 3. 监听模式（开发时使用）

```bash
npm run test:watch
```

测试会自动重新运行当文件修改时。

### 4. 生成覆盖率报告

```bash
npm run test:coverage
```

报告会生成在 `coverage/` 目录下，可以查看 `coverage/lcov-report/index.html`。

### 5. 运行单个测试文件

```bash
npx jest tests/cloudfunctions/getStalls.test.js
```

### 6. 运行包含特定关键词的测试

```bash
npx jest -t "基础查询"
```

## Mock 数据说明

### 摊位数据（mockStalls）
- 5 条模拟摊位数据
- 包含不同状态、分类、时间段
- 涵盖各种字段填充情况

### 申请数据（mockApplications）
- 3 条模拟申请数据
- 覆盖待审核、已通过、已拒绝三种状态
- 包含完整和缺失图片的场景

### 用户数据（mockUsers）
- 3 个普通用户
- 1 个管理员
- 不同角色（user/vendor/admin）

## 添加新测试

### 为现有云函数添加测试用例

在对应的 `.test.js` 文件中添加：

```javascript
describe('新功能描述', () => {
  test('具体测试场景', async () => {
    const event = { /* 测试数据 */ };
    const result = await cloudFunction.main(event, {});
    
    expect(result.code).toBe(0);
    // 更多断言...
  });
});
```

### 为新云函数创建测试文件

1. 在 `tests/cloudfunctions/` 下创建 `functionName.test.js`
2. 参考现有测试文件结构
3. 在 `index.test.js` 中引入新测试文件

### 添加 Mock 数据

在 `tests/mock/data/` 下创建新的数据文件，然后在 `tests/mock/index.js` 中导出。

## 测试最佳实践

1. **每个测试独立**：使用 `beforeEach` 重置 mock 数据
2. **测试描述清晰**：用中文描述测试场景
3. **断言具体**：不要只测 `toBeDefined`，要测具体值
4. **覆盖边界情况**：空数据、最大值、异常情况
5. **模拟外部依赖**：数据库、云存储等使用 mock

## 常见问题

### 测试运行缓慢
- 检查是否有异步操作未正确 mock
- 使用 `jest.setTimeout()` 增加超时时间

### 测试间数据相互影响
- 确保每个测试后重置 mock 数据
- 使用 `jest.clearAllMocks()` 清理 mock

### 覆盖率不够
- 查看 `coverage/` 目录下的报告
- 针对未覆盖的分支添加测试用例

## 持续集成建议

可以将测试加入 CI/CD 流程：

```yaml
# .github/workflows/test.yml 示例
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## 联系与反馈

如有测试相关问题，请查看：
- [Jest 官方文档](https://jestjs.io/)
- [微信小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
