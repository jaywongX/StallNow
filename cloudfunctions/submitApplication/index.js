const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 提交入驻申请
 * 关联 users 表，记录申请人 userId
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { stallData } = event;

  try {
    // 1. 获取用户信息
    const userRes = await db.collection('users').where({
      openId: openId
    }).get();

    if (userRes.data.length === 0) {
      return {
        code: -1,
        message: '用户未注册'
      };
    }

    const userInfo = userRes.data[0];

    // 2. 检查是否已有待审核的申请
    const pendingRes = await db.collection('applications').where({
      userId: userInfo._id,
      status: 0
    }).count();

    if (pendingRes.total > 0) {
      return {
        code: -1,
        message: '您已有一个待审核的申请，请勿重复提交'
      };
    }

    // 3. 检查是否已是摊主
    if (userInfo.role === 'vendor') {
      return {
        code: -1,
        message: '您已是摊主，请勿重复申请'
      };
    }

    // 4. 生成展示名
    let displayName = '';
    if (stallData.displayName && stallData.displayName.trim()) {
      // 使用自定义名称
      displayName = stallData.displayName.trim();
    } else {
      // 系统生成展示名：[商品类型]｜[区域]
      const categoryName = stallData.categoryName || '其他';
      const addressShort = stallData.address ? stallData.address.substring(0, 4) : '附近';
      displayName = `${categoryName}｜${addressShort}`;
    }

    // 5. 创建申请记录
    const application = {
      userId: userInfo._id, // 关联用户ID
      openId: openId,
      stallData: {
        displayName,
        categoryId: stallData.categoryId,
        categoryName: stallData.categoryName,
        goodsTags: stallData.goodsTags || [],
        location: stallData.location,  // 定位位置（必选）
        address: stallData.address,    // 常出没区域（可选）
        scheduleTypes: stallData.scheduleTypes || [],
        contact: stallData.contact || {}
      },
      status: 0, // 0待审核 1已通过 2已拒绝
      audit: null, // 审核信息
      submitTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };

    const result = await db.collection('applications').add({
      data: application
    });

    return {
      code: 0,
      data: {
        applicationId: result._id
      },
      message: '申请提交成功'
    };
  } catch (err) {
    console.error('提交申请失败', err);
    return {
      code: -1,
      message: '提交申请失败: ' + err.message
    };
  }
};
