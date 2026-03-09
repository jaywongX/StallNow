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
    // 使用 db.command.set 直接替换整个 audit 字段，避免 null 无法更新的问题
    await db.collection('applications').doc(applicationId).update({
      data: {
        status: status,
        audit: _.set({
          adminId: wxContext.OPENID,
          result: status === 1 ? 'approve' : 'reject',
          remark: remark,
          time: now
        }),
        updateTime: now
      }
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
        goodsTags: stallData.goodsTags || [], // 商品标签
        landmark: stallData.landmark || '', // 外观特征
        address: stallData.address || (stallData.location ? stallData.location.address : ''),
        city: stallData.city || '汕尾市',
        location: stallData.location ? {
          latitude: stallData.location.latitude,
          longitude: stallData.location.longitude
        } : null,
        schedule: {
          // 优先使用新的 schedule 数据结构
          types: stallData.scheduleTypes || (stallData.schedule ? [stallData.schedule.type] : ['unfixed']),
          display: stallData.schedule?.display || '不固定',
          customTime: stallData.schedule?.customTime || '',
          customTimeStart: stallData.schedule?.customTimeStart || '',
          customTimeEnd: stallData.schedule?.customTimeEnd || '',
          // 兼容旧数据结构
          type: stallData.schedule?.type || '不固定',
          timeRange: stallData.schedule?.timeRange || '',
          note: stallData.schedule?.note || ''
        },
        contact: {
          hasContact: !!(stallData.contact && (stallData.contact.phone || stallData.contact.wechatQR)),
          phone: stallData.contact?.phone || '',
          wechatQR: stallData.contact?.wechatQR || ''
        },
        images: stallData.images || [], // 摊位图片
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
        likeCount: 0,
        favoriteCount: 0,
        priceRange: stallData.priceRange || null, // 价格区间
        createTime: now,
        updateTime: now
      };

      const stallRes = await db.collection('stalls').add({
        data: stall
      });

      // 更新用户角色为 vendor，并绑定摊位
      // 使用 _.set 设置 vendorInfo，避免 null 无法更新的问题
      const userUpdateRes = await db.collection('users').doc(userId).update({
        data: {
          role: 'vendor',
          stallIds: _.push(stallRes._id),
          vendorInfo: _.set({
            approvedTime: now
          }),
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
