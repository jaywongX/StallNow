const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 管理员代录入摊位
 * 无需审核，直接上架，状态为"营业中（待认领）"
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { stallData } = event;

  try {
    // 1. 检查调用者是否为管理员
    const adminUser = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (!adminUser.data.length || adminUser.data[0].role !== 'admin') {
      return {
        code: -1,
        message: '无权限，仅管理员可操作'
      };
    }

    const now = new Date().toISOString();

    // 2. 创建摊位记录
    const stall = {
      displayName: stallData.displayName,
      categoryId: stallData.categoryId,
      categoryName: stallData.categoryName,
      goodsTags: stallData.goodsTags || [], // 商品标签
      landmark: stallData.landmark || '',
      address: stallData.address || (stallData.location ? stallData.location.address : ''),
      city: stallData.city || '汕尾市',
      location: stallData.location ? {
        latitude: stallData.location.latitude,
        longitude: stallData.location.longitude
      } : null,
      schedule: {
        types: stallData.scheduleTypes || ['unfixed'],
        display: stallData.schedule?.display || '不固定',
        customTime: stallData.schedule?.customTime || '',
        customTimeStart: stallData.schedule?.customTimeStart || '',
        customTimeEnd: stallData.schedule?.customTimeEnd || '',
        type: stallData.schedule?.type || '不固定',
        timeRange: stallData.schedule?.timeRange || '',
        note: stallData.schedule?.note || ''
      },
      contact: {
        hasContact: !!(stallData.contact && (stallData.contact.phone || stallData.contact.wechatQR)),
        phone: stallData.contact?.phone || '',
        wechatQR: stallData.contact?.wechatQR || ''
      },
      images: stallData.images || [],
      status: 1, // 1=已上架
      reliability: 0, // 0=近期确认
      lastConfirmedAt: now,
      confirmMethod: 'admin_check',
      consentStatus: {
        hasConsent: true,
        consentDate: now,
        consentMethod: 'admin_proxy'
      },
      // 代录入特有字段
      createdBy: 'admin_proxy', // admin_proxy（管理员代录）/ vendor_self（摊主申请）
      claimStatus: 'unclaimed', // unclaimed（待认领）/ claimed（已认领）
      claimedBy: '',
      claimedAt: null,
      ownerUserId: '', // 暂未绑定摊主
      viewCount: 0,
      favoriteCount: 0,
      createTime: now,
      updateTime: now,
      // 记录代录入信息
      proxyInfo: {
        adminId: wxContext.OPENID,
        adminName: adminUser.data[0].nickName || '管理员',
        proxyTime: now,
        remark: stallData.remark || ''
      }
    };

    console.log('[DEBUG createStallByAdmin] 准备创建摊位:', JSON.stringify(stall));
    const stallRes = await db.collection('stalls').add({
      data: stall
    });
    console.log('[DEBUG createStallByAdmin] 摊位创建成功，ID:', stallRes._id);

    return {
      code: 0,
      data: {
        stallId: stallRes._id
      },
      message: '摊位录入成功，状态：营业中（待认领）'
    };

  } catch (err) {
    console.error('[DEBUG createStallByAdmin] 代录入失败:', err);
    return {
      code: -1,
      message: '代录入失败: ' + err.message
    };
  }
};
