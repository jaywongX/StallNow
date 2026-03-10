const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 审核游客推荐的摊位
 * @param {String} stallId - 摊位ID
 * @param {String} action - approve（通过）或 reject（拒绝）
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { stallId, action } = event;

  try {
    // 1. 验证管理员权限
    const userRes = await db.collection('users').where({
      _openid: openId
    }).get();

    if (userRes.data.length === 0 || userRes.data[0].role !== 'admin') {
      return {
        code: -1,
        message: '无权限操作'
      };
    }

    // 2. 验证摊位存在且是游客推荐
    const stallRes = await db.collection('stalls').doc(stallId).get();
    
    if (!stallRes.data) {
      return {
        code: -1,
        message: '摊位不存在'
      };
    }

    if (stallRes.data.createdBy !== 'user_recommend') {
      return {
        code: -1,
        message: '该摊位不是游客推荐'
      };
    }

    // 3. 执行审核操作
    const now = new Date().toISOString();
    
    if (action === 'approve') {
      // 通过：更新状态为已上架，同时保留所有原有字段
      const originalStall = stallRes.data;
      await db.collection('stalls').doc(stallId).update({
        data: {
          status: 1,
          reliability: 1,
          updateTime: now,
          auditAt: now,
          auditBy: userRes.data[0]._id,
          // 确保保留关键字段
          priceRange: originalStall.priceRange || null,
          goodsTags: originalStall.goodsTags || [],
          scheduleTypes: originalStall.scheduleTypes || [],
          schedule: originalStall.schedule || {},
          location: originalStall.location || null,
          images: originalStall.images || [],
          contact: originalStall.contact || {}
        }
      });
    } else if (action === 'reject') {
      // 拒绝：更新状态为已下线
      await db.collection('stalls').doc(stallId).update({
        data: {
          status: 3,
          updateTime: now,
          auditAt: now,
          auditBy: userRes.data[0]._id
        }
      });
    } else {
      return {
        code: -1,
        message: '无效的操作类型'
      };
    }

    return {
      code: 0,
      message: action === 'approve' ? '审核通过，摊位已上架' : '已拒绝该推荐'
    };
  } catch (err) {
    console.error('审核推荐失败', err);
    return {
      code: -1,
      message: '操作失败: ' + err.message
    };
  }
};
