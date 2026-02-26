const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 获取用户收藏的摊位列表
 */
exports.main = async (event, context) => {
  const { page = 1, pageSize = 20 } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 1. 获取用户收藏的摊位ID列表
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).field({
      favorites: true
    }).get();

    if (userRes.data.length === 0 || !userRes.data[0].favorites || userRes.data[0].favorites.length === 0) {
      return {
        code: 0,
        data: {
          list: [],
          total: 0,
          hasMore: false
        }
      };
    }

    const favoriteIds = userRes.data[0].favorites;
    const total = favoriteIds.length;

    // 2. 分页获取摊位详情
    const skip = (page - 1) * pageSize;
    const pageIds = favoriteIds.slice(skip, skip + pageSize);

    if (pageIds.length === 0) {
      return {
        code: 0,
        data: {
          list: [],
          total: total,
          hasMore: false
        }
      };
    }

    // 3. 查询摊位信息
    const stallsRes = await db.collection('stalls').where({
      _id: _.in(pageIds)
    }).get();

    // 4. 按收藏顺序排序（最新的收藏在前面）
    const stallsMap = {};
    stallsRes.data.forEach(stall => {
      stallsMap[stall._id] = stall;
    });

    const list = pageIds
      .filter(id => stallsMap[id])
      .map(id => {
        const stall = stallsMap[id];
        return {
          _id: stall._id,
          displayName: stall.displayName,
          address: stall.address,
          images: stall.images,
          goodsTags: stall.goodsTags,
          status: stall.status,
          activeStatus: stall.activeStatus,
          location: stall.location,
          schedule: stall.schedule,
          reliability: stall.reliability
        };
      });

    return {
      code: 0,
      data: {
        list: list,
        total: total,
        hasMore: skip + pageSize < total
      }
    };

  } catch (err) {
    console.error('获取收藏列表失败', err);
    return {
      code: -1,
      message: '获取失败: ' + err.message
    };
  }
};
