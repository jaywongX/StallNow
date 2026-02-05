const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 获取申请列表（管理员）
 * 关联用户信息显示，转换图片URL
 */
exports.main = async (event, context) => {
  const { status } = event;

  try {
    let query = {};

    // 状态筛选
    if (status !== undefined && status !== null) {
      query.status = status;
    }

    const result = await db.collection('applications')
      .where(query)
      .orderBy('submitTime', 'desc')
      .get();

    // 获取申请人信息
    const userIds = result.data.map(app => app.userId).filter(id => id);
    const uniqueUserIds = [...new Set(userIds)];

    // 批量获取用户信息
    const userMap = {};
    if (uniqueUserIds.length > 0) {
      // 由于云函数限制，需要分批查询
      const batchSize = 50;
      for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        const batch = uniqueUserIds.slice(i, i + batchSize);
        const userRes = await db.collection('users')
          .where({
            _id: db.command.in(batch)
          })
          .get();
        
        userRes.data.forEach(user => {
          userMap[user._id] = user;
        });
      }
    }

    // 收集所有需要转换URL的图片文件ID
    const fileIdList = [];
    result.data.forEach(app => {
      if (app.stallData) {
        // 收集摊位照片
        if (app.stallData.images && app.stallData.images.length > 0) {
          fileIdList.push(...app.stallData.images);
        }
        // 收集微信二维码
        if (app.stallData.contact && app.stallData.contact.wechatQR) {
          fileIdList.push(app.stallData.contact.wechatQR);
        }
      }
    });

    // 批量获取临时URL（去重）
    const uniqueFileIds = [...new Set(fileIdList)];
    const urlMap = {};
    
    if (uniqueFileIds.length > 0) {
      try {
        const tempRes = await cloud.getTempFileURL({
          fileList: uniqueFileIds
        });
        
        if (tempRes.fileList) {
          tempRes.fileList.forEach(item => {
            if (item.status === 0 && item.tempFileURL) {
              urlMap[item.fileID] = item.tempFileURL;
            }
          });
        }
      } catch (err) {
        console.error('获取临时URL失败', err);
      }
    }

    // 合并数据，并转换图片URL
    const applications = result.data.map(app => {
      const stallData = app.stallData || {};
      
      // 转换摊位照片URL
      let imageUrls = [];
      if (stallData.images && stallData.images.length > 0) {
        imageUrls = stallData.images.map(fileId => urlMap[fileId] || fileId);
      }
      
      // 转换微信二维码URL
      let wechatQRUrl = null;
      if (stallData.contact && stallData.contact.wechatQR) {
        wechatQRUrl = urlMap[stallData.contact.wechatQR] || stallData.contact.wechatQR;
      }

      return {
        ...app,
        stallData: {
          ...stallData,
          images: imageUrls,
          contact: {
            ...stallData.contact,
            wechatQR: wechatQRUrl
          }
        },
        userInfo: userMap[app.userId] ? {
          nickName: userMap[app.userId].nickName,
          avatarUrl: userMap[app.userId].avatarUrl,
          role: userMap[app.userId].role
        } : null
      };
    });

    return {
      code: 0,
      data: applications,
      message: 'success'
    };
  } catch (err) {
    console.error('获取申请列表失败', err);
    return {
      code: -1,
      message: '获取申请列表失败: ' + err.message
    };
  }
};
