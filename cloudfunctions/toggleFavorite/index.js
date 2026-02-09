const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 收藏/取消收藏摊位
 */
exports.main = async (event, context) => {
  const { stallId, action } = event;
  const { OPENID } = cloud.getWXContext();

  if (!stallId || !action) {
    return {
      code: -1,
      message: '参数错误'
    };
  }

  if (!['add', 'remove'].includes(action)) {
    return {
      code: -1,
      message: '操作类型错误'
    };
  }

  try {
    // 1. 获取用户信息
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get();

    let userId;
    if (userRes.data.length === 0) {
      // 创建新用户
      const newUser = await db.collection('users').add({
        data: {
          _openid: OPENID,
          favorites: [],
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
      userId = newUser._id;
    } else {
      userId = userRes.data[0]._id;
    }

    // 2. 验证摊位存在
    const stallRes = await db.collection('stalls').doc(stallId).get();
    if (!stallRes.data) {
      return {
        code: -1,
        message: '摊位不存在'
      };
    }

    // 3. 执行收藏/取消收藏
    if (action === 'add') {
      // 添加到收藏
      await db.collection('users').doc(userId).update({
        data: {
          favorites: _.addToSet(stallId),
          updateTime: db.serverDate()
        }
      });

      // 增加摊位收藏计数
      await db.collection('stalls').doc(stallId).update({
        data: {
          favoriteCount: _.inc(1)
        }
      });

      return {
        code: 0,
        message: '收藏成功'
      };
    } else {
      // 取消收藏
      await db.collection('users').doc(userId).update({
        data: {
          favorites: _.pull(stallId),
          updateTime: db.serverDate()
        }
      });

      // 减少摊位收藏计数
      await db.collection('stalls').doc(stallId).update({
        data: {
          favoriteCount: _.inc(-1)
        }
      });

      return {
        code: 0,
        message: '取消收藏成功'
      };
    }

  } catch (err) {
    console.error('收藏操作失败', err);
    return {
      code: -1,
      message: '操作失败: ' + err.message
    };
  }
};
