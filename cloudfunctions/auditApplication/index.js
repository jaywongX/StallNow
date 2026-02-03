const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 审核申请
 */
exports.main = async (event, context) => {
  const { applicationId, status } = event;

  try {
    // 获取申请信息
    const application = await db.collection('applications').doc(applicationId).get();

    if (!application.data) {
      return {
        success: false,
        message: '申请不存在'
      };
    }

    // 更新申请状态
    await db.collection('applications').doc(applicationId).update({
      data: {
        status,
        updateTime: new Date().toISOString()
      }
    });

    // 如果通过审核，创建地摊记录
    if (status === 1) {
      const stallData = application.data.stallData;

      // 检查商家名称唯一性
      if (stallData.vendorName) {
        const existStall = await db.collection('stalls').where({
          vendorName: stallData.vendorName,
          status: _.neq(3)
        }).count();

        if (existStall.total > 0) {
          return {
            success: false,
            message: '商家名称已被使用，请更换'
          };
        }
      }

      // 创建地摊
      const stall = {
        displayName: stallData.displayName,
        vendorName: stallData.vendorName,
        categoryId: stallData.categoryId,
        categoryName: stallData.categoryName,
        landmark: stallData.landmark,
        location: stallData.location,
        address: stallData.address,
        city: stallData.city,
        schedule: stallData.schedule,
        contact: stallData.contact,
        images: [], // 初始为空，后续可上传
        status: 1, // 1已上架
        reliability: 0, // 0近期确认
        lastConfirmedAt: new Date().toISOString(),
        confirmMethod: 'owner_scan',
        consentStatus: {
          hasConsent: true,
          consentDate: new Date().toISOString(),
          consentMethod: 'online'
        },
        ownerOpenId: '',
        bindStatus: 0, // 0未绑定
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        viewCount: 0
      };

      await db.collection('stalls').add({
        data: stall
      });
    }

    return {
      success: true
    };
  } catch (err) {
    console.error('审核申请失败', err);
    return {
      success: false,
      message: '审核申请失败'
    };
  }
};
