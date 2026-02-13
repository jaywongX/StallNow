const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 获取摊位认领申请列表
 * 管理员：获取所有申请
 * 普通用户：获取自己的申请
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { 
    status,   // 筛选状态：0待审核 1已通过 2已拒绝，不传则返回全部
    page = 1,
    pageSize = 20,
    isAdmin = false // 是否以管理员身份查询
  } = event;

  try {
    // 1. 获取当前用户信息
    const userRes = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (!userRes.data.length) {
      return { code: -1, message: '用户不存在' };
    }

    const user = userRes.data[0];
    const userRole = user.role;

    // 2. 构建查询条件
    let whereCondition = {};

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      const statusNum = parseInt(status);
      if ([0, 1, 2].includes(statusNum)) {
        whereCondition.status = statusNum;
      }
    }

    // 非管理员只能查看自己的申请
    if (!isAdmin || userRole !== 'admin') {
      whereCondition.userId = user._id;
    }

    // 3. 查询总数
    const countRes = await db.collection('stallClaims').where(whereCondition).count();
    const total = countRes.total;

    // 4. 查询列表
    const skip = (page - 1) * pageSize;
    let query = db.collection('stallClaims')
      .where(whereCondition)
      .orderBy('submitTime', 'desc')
      .skip(skip)
      .limit(pageSize);

    const claimsRes = await query.get();
    let claims = claimsRes.data;

    // 5. 补充关联信息
    if (claims.length > 0) {
      // 获取所有相关摊位ID和申请人ID
      const stallIds = [...new Set(claims.map(c => c.stallId))];
      const userIds = [...new Set(claims.map(c => c.userId))];

      // 批量获取摊位信息
      const stallsRes = await db.collection('stalls').where({
        _id: _.in(stallIds)
      }).get();
      const stallsMap = {};
      stallsRes.data.forEach(s => {
        stallsMap[s._id] = s;
      });

      // 批量获取申请人信息
      const usersRes = await db.collection('users').where({
        _id: _.in(userIds)
      }).get();
      const usersMap = {};
      usersRes.data.forEach(u => {
        usersMap[u._id] = u;
      });

      // 合并数据
      claims = claims.map(claim => {
        const stall = stallsMap[claim.stallId] || {};
        const applicant = usersMap[claim.userId] || {};

        return {
          ...claim,
          stallInfo: {
            displayName: stall.displayName || '未知摊位',
            address: stall.address || '',
            images: stall.images || []
          },
          applicantInfo: {
            nickName: applicant.nickName || '未知用户',
            avatarUrl: applicant.avatarUrl || ''
          }
        };
      });
    }

    // 6. 统计各状态数量（管理员视图）
    let statusStats = null;
    if (userRole === 'admin' && isAdmin) {
      const pendingCount = await db.collection('stallClaims').where({ status: 0 }).count();
      const passedCount = await db.collection('stallClaims').where({ status: 1 }).count();
      const rejectedCount = await db.collection('stallClaims').where({ status: 2 }).count();

      statusStats = {
        pending: pendingCount.total,
        passed: passedCount.total,
        rejected: rejectedCount.total,
        total: pendingCount.total + passedCount.total + rejectedCount.total
      };
    }

    return {
      code: 0,
      data: {
        list: claims,
        total: total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + claims.length < total,
        statusStats: statusStats
      },
      message: '获取成功'
    };

  } catch (err) {
    console.error('[DEBUG getClaimApplications] 获取失败:', err);
    return {
      code: -1,
      message: '获取失败: ' + err.message
    };
  }
};
