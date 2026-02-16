const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 摊主认领摊位
 * 用于管理员代录入的摊位，摊主扫码后进行认领
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { stallId } = event;

  try {
    // 1. 检查摊位是否存在
    const stallRes = await db.collection('stalls').doc(stallId).get();
    if (!stallRes.data) {
      return {
        code: -1,
        message: '摊位不存在'
      };
    }

    const stall = stallRes.data;

    // 2. 检查摊位是否为待认领状态
    if (stall.createdBy !== 'admin_proxy') {
      return {
        code: -1,
        message: '该摊位不是代录入摊位，无需认领'
      };
    }

    if (stall.claimStatus === 'claimed') {
      return {
        code: -1,
        message: '该摊位已被认领'
      };
    }

    // 3. 获取当前用户信息
    const userRes = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (!userRes.data.length) {
      return {
        code: -1,
        message: '用户不存在，请先登录'
      };
    }

    const user = userRes.data[0];
    const userId = user._id;

    // 4. 检查用户是否已有其他摊位
    if (user.role === 'vendor' && user.stallIds && user.stallIds.length > 0) {
      // 允许一个摊主认领多个摊位
    }

    const now = new Date().toISOString();

    // 5. 更新摊位信息（认领）
    await db.collection('stalls').doc(stallId).update({
      data: {
        claimStatus: 'claimed',
        claimedBy: userId,
        claimedAt: now,
        ownerUserId: userId,
        updateTime: now
      }
    });

    // 6. 更新用户角色和摊位绑定
    const updateData = {
      role: 'vendor',
      stallIds: db.command.push(stallId),
      updateTime: now
    };

    // 如果用户没有 vendorInfo，添加它
    if (!user.vendorInfo) {
      updateData.vendorInfo = {
        approvedTime: now,
        claimMethod: 'scan_qr'
      };
    }

    await db.collection('users').doc(userId).update({
      data: updateData
    });

    return {
      code: 0,
      data: {
        stallId: stallId,
        claimedAt: now
      },
      message: '摊位认领成功，您现在可以管理这个摊位了'
    };

  } catch (err) {
    console.error('认领失败:', err);
    return {
      code: -1,
      message: '认领失败: ' + err.message
    };
  }
};
