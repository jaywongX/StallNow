// 数据库初始化脚本
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 初始化分类数据（与前端页面使用的一致）
    const categories = [
      {
        _id: 'food_snack',
        name: '小吃/烧烤',
        icon: '🍢',
        sort: 1,
        createTime: new Date().toISOString()
      },
      {
        _id: 'food_fruit',
        name: '水果/零食',
        icon: '🍉',
        sort: 2,
        createTime: new Date().toISOString()
      },
      {
        _id: 'handicraft',
        name: '手工/饰品',
        icon: '🎨',
        sort: 3,
        createTime: new Date().toISOString()
      },
      {
        _id: 'toy_culture',
        name: '玩具/文创',
        icon: '🧸',
        sort: 4,
        createTime: new Date().toISOString()
      },
      {
        _id: 'other',
        name: '其他',
        icon: '📦',
        sort: 5,
        createTime: new Date().toISOString()
      }
    ];

    let successCount = 0;
    let existCount = 0;

    // 批量插入或更新分类数据
    for (const category of categories) {
      try {
        const exist = await db.collection('categories').doc(category._id).get();
        console.log(`分类 ${category.name} 已存在，跳过`);
        existCount++;
      } catch (docErr) {
        if (docErr.errCode === -1 && docErr.errMsg.includes('does not exist')) {
          await db.collection('categories').add({
            data: category
          });
          console.log(`分类 ${category.name} 添加成功`);
          successCount++;
        } else {
          console.error(`检查分类 ${category.name} 时出错：`, docErr);
        }
      }
    }

    // 创建索引（如果集合已存在）
    try {
      // users 集合索引
      await db.collection('users').createIndex({
        name: 'openId_index',
        keys: { openId: 1 },
        unique: true
      });
      console.log('users.openId 索引创建成功');
    } catch (indexErr) {
      console.log('users.openId 索引已存在或创建失败:', indexErr.message);
    }

    try {
      // applications 集合索引
      await db.collection('applications').createIndex({
        name: 'userId_status_index',
        keys: { userId: 1, status: 1 }
      });
      console.log('applications.userId_status 索引创建成功');
    } catch (indexErr) {
      console.log('applications 索引已存在或创建失败:', indexErr.message);
    }

    try {
      // stalls 集合索引
      await db.collection('stalls').createIndex({
        name: 'ownerUserId_index',
        keys: { ownerUserId: 1 }
      });
      console.log('stalls.ownerUserId 索引创建成功');
    } catch (indexErr) {
      console.log('stalls 索引已存在或创建失败:', indexErr.message);
    }

    return {
      code: 0,
      data: {
        categoriesAdded: successCount,
        categoriesExist: existCount
      },
      message: `数据库初始化完成：新增 ${successCount} 个分类，跳过 ${existCount} 个已存在的分类`
    };
  } catch (err) {
    console.error('数据库初始化失败', err);
    return {
      code: -1,
      message: '数据库初始化失败：' + err.message
    };
  }
};
