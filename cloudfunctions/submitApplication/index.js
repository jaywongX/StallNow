const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 提交入驻申请
 */
exports.main = async (event, context) => {
  const { categoryId, landmark, location, address, city, schedule, contact, vendorName } = event;

  try {
    // 生成展示名（系统生成规则：[商品类型]｜[区域]）
    let displayName = '';
    if (vendorName) {
      // 如果有自定义商家名称，检查唯一性
      const existStall = await db.collection('stalls').where({
        vendorName: vendorName,
        status: _.neq(3) // 不包含已下线的
      }).count();

      if (existStall.total > 0) {
        return {
          success: false,
          message: '商家名称已被使用，请更换'
        };
      }
      displayName = vendorName;
    } else {
      // 系统生成展示名
      const category = await db.collection('categories').doc(categoryId).get();
      const categoryName = category.data ? category.data.name : '其他';
      displayName = `${categoryName}｜${address.substring(0, 4)}`;
    }

    // 创建申请记录
    const application = {
      stallData: {
        displayName,
        vendorName,
        categoryId,
        landmark,
        location,
        address,
        city,
        schedule,
        contact,
        categoryName: (await db.collection('categories').doc(categoryId).get()).data?.name || '其他'
      },
      status: 0, // 0待审核 1通过 2拒绝
      remark: '',
      submitTime: new Date().toISOString(),
      createTime: new Date().toISOString()
    };

    const result = await db.collection('applications').add({
      data: application
    });

    return {
      success: true,
      data: {
        applicationId: result._id
      }
    };
  } catch (err) {
    console.error('提交申请失败', err);
    return {
      success: false,
      message: '提交申请失败'
    };
  }
};
