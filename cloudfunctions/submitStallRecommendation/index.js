const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 提交游客推荐的摊位
 * 创建 stalls 记录，status=0（待审核），createdBy='user_recommend'
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { stallData } = event;

  try {
    // 1. 获取用户信息
    const userRes = await db.collection('users').where({
      _openid: openId
    }).get();

    if (userRes.data.length === 0) {
      return {
        code: -1,
        message: '用户未注册'
      };
    }

    const userInfo = userRes.data[0];

    // 2. 生成展示名
    let displayName = '';
    if (stallData.displayName && stallData.displayName.trim()) {
      displayName = stallData.displayName.trim();
    } else {
      // 系统生成展示名：[商品类型]｜[区域]
      const categoryName = stallData.categoryName || '其他';
      const addressShort = stallData.location && stallData.location.address 
        ? stallData.location.address.substring(0, 4) 
        : '附近';
      displayName = `${categoryName}｜${addressShort}`;
    }

    // 3. 处理出摊时间数据
    let scheduleInfo = stallData.schedule || {};
    
    // 构建出摊时间显示文本
    let scheduleDisplay = '';
    if (stallData.scheduleTypes && stallData.scheduleTypes.length > 0) {
      const typeNames = {
        'afternoon': '下午',
        'evening': '晚上',
        'weekend': '周末',
        'unfixed': '不确定'
      };
      scheduleDisplay = stallData.scheduleTypes.map(t => typeNames[t] || t).join('、');
    }
    
    // 4. 创建摊位记录（直接存入 stalls 表，状态为待审核）
    const now = new Date();
    const stall = {
      displayName,
      categoryId: stallData.categoryId,
      categoryName: stallData.categoryName,
      goodsTags: stallData.goodsTags || [],
      landmark: stallData.landmark || '',
      images: stallData.images || [],
      location: stallData.location ? {
        type: 'Point',
        coordinates: [stallData.location.longitude, stallData.location.latitude],
        ...stallData.location
      } : null,
      address: stallData.location ? stallData.location.address : '',
      city: stallData.city || '汕尾市',
      scheduleTypes: stallData.scheduleTypes || [],
      schedule: {
        ...scheduleInfo,
        display: scheduleDisplay
      },
      contact: stallData.contact || {},
      status: 0, // 0待审核 1已上架 2已下架 3已下线
      reliability: 1, // 1可能还在（游客推荐默认）
      lastConfirmedAt: now.toISOString(),
      
      // 创建方式：游客推荐
      createdBy: 'user_recommend',
      
      // 推荐人信息
      recommendedBy: userInfo._id,
      recommendedAt: now.toISOString(),
      
      // 认领状态：待认领
      claimStatus: 'unclaimed',
      claimedBy: '',
      
      // 时间戳
      createTime: now.toISOString(),
      updateTime: now.toISOString()
    };

    const result = await db.collection('stalls').add({
      data: stall
    });

    return {
      code: 0,
      data: {
        stallId: result._id
      },
      message: '推荐提交成功'
    };
  } catch (err) {
    console.error('提交推荐失败', err);
    return {
      code: -1,
      message: '提交推荐失败: ' + err.message
    };
  }
};
