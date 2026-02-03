// 数据库初始化脚本
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 初始化分类数据
    const categories = [
      {
        _id: 'cat_001',
        name: '小吃/烧烤',
        icon: '🍢',
        sort: 1,
        createTime: new Date()
      },
      {
        _id: 'cat_002',
        name: '手工/饰品',
        icon: '🎨',
        sort: 2,
        createTime: new Date()
      },
      {
        _id: 'cat_003',
        name: '玩具/文创',
        icon: '🧸',
        sort: 3,
        createTime: new Date()
      },
      {
        _id: 'cat_004',
        name: '水果/零食',
        icon: '🍎',
        sort: 4,
        createTime: new Date()
      },
      {
        _id: 'cat_005',
        name: '其他',
        icon: '📦',
        sort: 5,
        createTime: new Date()
      }
    ];

    let successCount = 0;
    let existCount = 0;

    // 批量插入或更新数据
    for (const category of categories) {
      try {
        // 尝试获取文档，如果不存在会抛错
        const exist = await db.collection('categories').doc(category._id).get();
        console.log(`分类 ${category.name} 已存在，跳过`);
        existCount++;
      } catch (docErr) {
        // 文档不存在，执行插入
        if (docErr.errCode === -1 && docErr.errMsg.includes('does not exist')) {
          await db.collection('categories').add({
            data: category
          });
          console.log(`分类 ${category.name} 添加成功`);
          successCount++;
        } else {
          // 其他错误
          console.error(`检查分类 ${category.name} 时出错：`, docErr);
        }
      }
    }

    return {
      success: true,
      message: `数据库初始化完成：新增 ${successCount} 个分类，跳过 ${existCount} 个已存在的分类`
    };
  } catch (err) {
    console.error('数据库初始化失败', err);
    return {
      success: false,
      message: '数据库初始化失败：' + err.message
    };
  }
};