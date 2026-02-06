/**
 * Jest 配置文件
 * 用于微信小程序云函数单元测试
 */
module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // 覆盖率收集目录
  collectCoverageFrom: [
    'cloudfunctions/**/*.js',
    '!cloudfunctions/**/node_modules/**',
    '!cloudfunctions/**/*.config.js'
  ],

  // 覆盖率报告输出目录
  coverageDirectory: 'coverage',

  // 覆盖率阈值（可选，开启后会强制要求达到指定覆盖率）
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50
  //   }
  // },

  // 测试超时时间（云函数测试可能需要较长时间）
  testTimeout: 10000,

  // 模块路径别名（方便导入）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@cloudfunctions/(.*)$': '<rootDir>/cloudfunctions/$1'
  },

  // 测试前置脚本
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 忽略转换的目录（提高性能）
  transformIgnorePatterns: [
    '/node_modules/(?!wx-server-sdk)/'
  ],

  // 测试报告格式
  reporters: [
    'default'
    // 如需 XML 报告，可安装 jest-junit: npm install --save-dev jest-junit
    // [
    //   'jest-junit',
    //   {
    //     outputDirectory: './reports',
    //     outputName: 'junit.xml'
    //   }
    // ]
  ]
};
