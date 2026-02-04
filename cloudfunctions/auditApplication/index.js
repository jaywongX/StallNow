const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 审核申请
 * 通过审核时：创建摊位 + 更新用户角色为 vendor
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { applicationId, status, remark = '' } = event;

  try {
    // 1. 获取申请信息
    const application = await db.collection('applications').doc(applicationId).get();

    if (!application.data) {
      return {
        code: -1,
        message: '申请不存在'
      };
    }

    const appData = application.data;
    const now = new Date().toISOString();

    // 2. 更新申请状态
    const updateData = {
      status: status,
      'audit.adminId': wxContext.OPENID,
      'audit.result': status === 1 ? 'approve' : 'reject',
      'audit.remark': remark,
      'audit.time': now,
      updateTime: now
    };

    await db.collection('applications').doc(applicationId).update({
      data: updateData
    });

    // 3. 如果通过审核，创建摊位并更新用户角色
    if (status === 1) {
      const stallData = appData.stallData;
      const userId = appData.userId;

      // 创建摊位记录
      const stall = {
        displayName: stallData.displayName,
        categoryId: stallData.categoryId,
        categoryName: stallData.categoryName,
        goodsTags: stallData.goodsTags || [],
        landmark: '', // 地标特征，后续可补充
        address: stallData.address || (stallData.location ? stallData.location.address : ''),
        city: '汕尾市', // 默认城市
        location: stallData.location ? {
          latitude: stallData.location.latitude,
          longitude: stallData.location.longitude
        } : null, // 使用申请时的定位位置
        schedule: {
          type: stallData.scheduleTypes ? stallData.scheduleTypes.join('/') : '不固定',
          timeRange: '',
          note: ''
        },
        contact: {
          hasContact: !!(stallData.contact && (stallData.contact.phone || stallData.contact.wechatId)),
          phone: stallData.contact?.phone || '',
          wechatQR: ''
        },
        images: [],
        status: 1, // 1已上架
        reliability: 0, // 0近期确认
        lastConfirmedAt: now,
        confirmMethod: 'admin_check',
        consentStatus: {
          hasConsent: true,
          consentDate: now,
          consentMethod: 'online'
        },
        ownerUserId: userId, // 关联摊主用户ID
        viewCount: 0,
        createTime: now,
        updateTime: now
      };

      const stallRes = await db.collection('stalls').add({
        data: stall
      });

      // 更新用户角色为 vendor，并绑定摊位
      await db.collection('users').doc(userId).update({
        data: {
          role: 'vendor',
          stallIds: _.push(stallRes._id),
          'vendorInfo.approvedTime': now,
          updateTime: now
        }
      });

      return {
        code: 0,
        data: {
          stallId: stallRes._id
        },
        message: '审核通过，摊位已创建'
      };
    }

    return {
      code: 0,
      message: status === 1 ? '审核通过' : '审核拒绝'
    };
  } catch (err) {
    console.error('审核申请失败', err);
    return {
      code: -1,
      message: '审核申请失败: ' + err.message
    };
  }
};
