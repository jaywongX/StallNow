const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 获取地摊详情
 * 增加访问计数
 */
exports.main = async (event, context) => {
  const { stallId } = event;

  try {
    // 获取地摊详情
    const stall = await db.collection('stalls').doc(stallId).get();

    if (!stall.data) {
      return {
        code: -1,
        message: '地摊不存在'
      };
    }

    // 增加访问计数
    await db.collection('stalls').doc(stallId).update({
      data: {
        viewCount: _.inc(1)
      }
    });

    // 获取分类名称
    let categoryName = '其他';
    if (stall.data.categoryId) {
      try {
        const category = await db.collection('categories')
          .doc(stall.data.categoryId)
          .get();
        categoryName = category.data ? category.data.name : '其他';
      } catch (catErr) {
        // 获取分类失败，使用默认值
      }
    }

    // 转换图片 URL（cloud:// -> 临时 URL）
    const resultData = { ...stall.data, categoryName };
    if (resultData.images && resultData.images.length > 0) {
      const cloudImages = resultData.images.filter(img => img && img.startsWith('cloud://'));
      if (cloudImages.length > 0) {
        try {
          const tempRes = await cloud.getTempFileURL({
            fileList: cloudImages
          });
          const urlMap = {};
          if (tempRes.fileList) {
            tempRes.fileList.forEach(item => {
              if (item.status === 0 && item.tempFileURL) {
                urlMap[item.fileID] = item.tempFileURL;
              }
            });
          }
          resultData.images = resultData.images.map(img => urlMap[img] || img);
        } catch (urlErr) {
          console.error('转换图片URL失败:', urlErr);
        }
      }
    }

    return {
      code: 0,
      data: resultData
    };
  } catch (err) {
    console.error('获取地摊详情失败:', err);
    return {
      code: -1,
      message: '获取地摊详情失败: ' + err.message
    };
  }
};
