# 摆摊了么 - 测试执行指南

> 单人开发者的测试操作手册，帮助你快速验证代码正确性

---

## 一、测试环境准备

### 1. 安装 Node.js 依赖

```bash
# 在项目根目录执行
npm install
```

**预期输出**：
```
added 300+ packages in 10s
```

### 2. 验证安装

```bash
# 检查 Jest 是否安装成功
npx jest --version

# 预期输出：29.7.0 或更高版本
```

---

## 二、快速开始（3分钟上手）

### 运行所有测试

```bash
npm test
```

**预期输出**：
```
PASS  tests/cloudfunctions/getStalls.test.js
PASS  tests/cloudfunctions/submitApplication.test.js
PASS  tests/cloudfunctions/adminGetApplications.test.js

Test Suites: 3 passed, 3 total
Tests:       50+ passed, 50+ total
```

### 查看测试详情

```bash
npm test -- --verbose
```

这会显示每个测试用例的执行情况。

---

## 三、常用测试命令

| 命令 | 作用 | 使用场景 |
|------|------|----------|
| `npm test` | 运行所有测试 | 提交代码前验证 |
| `npm run test:watch` | 监听模式 | 开发时实时测试 |
| `npm run test:coverage` | 生成覆盖率报告 | 检查测试完整度 |
| `npx jest getStalls` | 运行指定测试 | 只测改动的云函数 |
| `npx jest -t "关键词"` | 按名称匹配 | 运行特定测试场景 |

### 监听模式使用技巧

```bash
npm run test:watch
```

进入监听模式后，可以按以下按键：
- `a` - 运行所有测试
- `f` - 只运行失败的测试
- `p` - 按文件名模式过滤
- `t` - 按测试名模式过滤
- `q` - 退出监听模式

**推荐工作流程**：
1. 开两个终端窗口
2. 一个运行 `npm run test:watch`
3. 一个正常开发代码
4. 保存代码后自动运行相关测试

---

## 四、测试场景速查表

### 场景1：修改了 getStalls 云函数

```bash
# 只运行 getStalls 的测试
npx jest getStalls

# 预期：所有测试通过
```

**重点验证的测试用例**：
- ✓ 分类筛选正确
- ✓ 分页功能正常
- ✓ 关键词搜索有效
- ✓ 只返回已上架摊位

### 场景2：修改了 submitApplication 云函数

```bash
# 只运行 submitApplication 的测试
npx jest submitApplication
```

**重点验证的测试用例**：
- ✓ 正常提交成功
- ✓ 重复提交被拦截
- ✓ 已是摊主被拦截
- ✓ 未注册用户报错

### 场景3：修改了 adminGetApplications 云函数

```bash
# 只运行 adminGetApplications 的测试
npx jest adminGetApplications
```

**重点验证的测试用例**：
- ✓ 图片URL转换成功
- ✓ 用户信息关联正确
- ✓ 状态筛选有效

### 场景4：新增了一个云函数

1. 创建测试文件 `tests/cloudfunctions/newFunction.test.js`
2. 复制现有测试文件结构
3. 在 `tests/cloudfunctions/index.test.js` 中引入
4. 运行测试：

```bash
npx jest newFunction
```

---

## 五、Mock 数据使用指南

### 查看 Mock 数据

```bash
# 摊位数据
cat tests/mock/data/stalls.js

# 申请数据
cat tests/mock/data/applications.js
```

### 修改 Mock 数据

编辑对应的 `.js` 文件即可，修改后测试会自动使用新数据。

**注意**：
- 修改 Mock 数据可能影响多个测试
- 运行 `npm test` 确保没有破坏现有测试

### 添加新的 Mock 数据

在 `tests/mock/data/` 目录下创建新的数据文件，然后在 `tests/mock/index.js` 中导出。

---

## 六、覆盖率报告解读

### 生成报告

```bash
npm run test:coverage
```

### 查看报告

```bash
# 方式1：命令行输出（简略）
# 测试结束后自动显示

# 方式2：HTML 报告（详细）
# 打开以下文件
start coverage/lcov-report/index.html  # Windows
open coverage/lcov-report/index.html   # Mac
```

### 关键指标说明

| 指标 | 含义 | 建议值 |
|------|------|--------|
| Statements | 语句覆盖率 | > 70% |
| Branches | 分支覆盖率 | > 60% |
| Functions | 函数覆盖率 | > 80% |
| Lines | 行覆盖率 | > 70% |

### 查看未覆盖的代码

在 HTML 报告中：
- 红色区域 = 未覆盖的代码
- 黄色区域 = 部分覆盖的代码
- 绿色区域 = 已覆盖的代码

**单人开发建议**：
- 核心云函数（getStalls、submitApplication）追求 80%+ 覆盖率
- 其他云函数追求 60%+ 覆盖率
- 不要为追求 100% 覆盖率而过度测试

---

## 七、调试失败的测试

### 1. 查看详细错误信息

```bash
npx jest --verbose --no-coverage
```

### 2. 只运行失败的测试

```bash
# 第一次运行后
npx jest --onlyFailures

# 或在监听模式按 f
```

### 3. 在测试中添加断点

```javascript
test('某个测试', async () => {
  const result = await cloudFunction.main(event, {});
  
  console.log('调试信息:', result);  // 添加这行
  debugger;  // 添加断点
  
  expect(result.code).toBe(0);
});
```

然后运行：

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 4. 常见失败原因

| 现象 | 可能原因 | 解决方案 |
|------|----------|----------|
| `expect(received).toBe(expected)` 数值不对 | Mock 数据不匹配 | 检查 mock 数据和期望值 |
| `Cannot find module` | 路径错误 | 检查 import 路径 |
| `Async callback was not invoked` | 异步未返回 | 检查 async/await |
| 测试超时 | 死循环或阻塞 | 检查循环和递归 |

---

## 八、测试与开发工作流

### 推荐的工作流程

```
┌─────────────────────────────────────────────────────┐
│  1. 修改云函数代码                                   │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  2. 在另一个终端运行 npm run test:watch             │
│     （自动运行相关测试）                             │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  3. 如果测试失败 → 修改代码 → 保存 → 自动重测       │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  4. 如果测试通过 → 在微信开发者工具中真机测试       │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  5. 部署云函数到云端                                 │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│  6. 提交代码前运行 npm test（全量测试）             │
└─────────────────────────────────────────────────────┘
```

### 关键检查点

**每次修改云函数后**：
1. ✅ 本地单元测试通过
2. ✅ 覆盖率没有明显下降
3. ✅ 微信开发者工具模拟器测试
4. ✅ 真机测试（关键功能）

**每次部署前**：
1. ✅ `npm test` 全部通过
2. ✅ 数据库权限检查
3. ✅ 云函数依赖安装（云端）

---

## 九、单人开发测试策略

### 时间分配建议（每周20小时开发）

| 活动 | 时间 | 说明 |
|------|------|------|
| 功能开发 | 12小时 | 核心业务逻辑 |
| 编写测试 | 3小时 | 为新功能补充测试 |
| 运行测试 | 1小时 | 日常测试运行 |
| 调试修复 | 2小时 | 修复测试发现的bug |
| 手动验证 | 2小时 | 真机测试关键流程 |

### 测试优先级

**P0 - 必须测试（每次修改都要验证）**
- getStalls：分类筛选、分页、关键词搜索
- submitApplication：提交、重复提交拦截、权限检查

**P1 - 重要测试（发版前验证）**
- adminGetApplications：图片URL转换、用户关联
- 所有测试的异常处理分支

**P2 - 可选测试（有空时补充）**
- 边界情况测试
- 性能测试（大量数据）

### 快速回归测试清单

每次发版前手动验证：

```
□ 用户查看地图 → 列表 → 详情 → 导航（完整流程）
□ 摊主填写申请 → 上传图片 → 提交
□ 管理员审核通过 → 摊位显示在地图
□ 用户反馈信息有误 → 管理员处理
```

---

## 十、问题排查

### 测试无法运行

```bash
# 1. 检查 Node 版本
node -v
# 需要 v18+，你的版本是 v22.13.0 ✓

# 2. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 检查 Jest 配置
npx jest --showConfig
```

### 测试运行缓慢

```bash
# 检查是否有内存泄漏
npx jest --logHeapUsage

# 跳过覆盖率（加快速度）
npx jest --coverage=false

# 只运行改变的测试
npx jest --onlyChanged
```

### Mock 数据不生效

1. 检查 `beforeEach` 是否调用了 `resetMockData()`
2. 检查测试间是否共享了变量
3. 检查 `jest.clearAllMocks()` 是否调用

---

## 十一、扩展测试

### 添加新的云函数测试

1. 创建测试文件：

```bash
touch tests/cloudfunctions/newFunction.test.js
```

2. 参考模板：

```javascript
/**
 * newFunction 云函数测试
 */

// 模拟 wx-server-sdk
jest.mock('wx-server-sdk', () => ({
  init: jest.fn(),
  DYNAMIC_CURRENT_ENV: 'test-env',
  database: jest.fn(() => ({
    // mock 实现
  }))
}));

const newFunction = require('../../cloudfunctions/newFunction');

describe('newFunction 测试', () => {
  test('正常场景', async () => {
    const event = { /* 测试数据 */ };
    const result = await newFunction.main(event, {});
    
    expect(result.code).toBe(0);
  });
});
```

3. 在 `index.test.js` 中添加：

```javascript
require('./newFunction.test');
```

4. 运行测试：

```bash
npx jest newFunction
```

---

## 十二、联系与资源

### 相关文档
- [Jest 官方文档](https://jestjs.io/)
- [微信小程序云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/)

### 项目文件
- `testing-strategy.md` - 测试策略设计
- `tests/README.md` - 测试框架说明
- `tests/mock/data/` - Mock 数据文件

---

**最后更新**：2025年2月
**适用版本**：v1.0
