const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 获取当前用户对某摊位的认领状态
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { stallId } = event;

  // 1. 参数校验
  if (!stallId) {
    return { code: -1, message: '摊位ID不能为空' };
  }

  try {
    // 2. 获取当前用户信息
    const userRes = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (!userRes.data.length) {
      return { code: -1, message: '用户不存在' };
    }

    const user = userRes.data[0];
    const userId = user._id;

    // 3. 获取摊位信息
    const stallRes = await db.collection('stalls').doc(stallId).get();
    if (!stallRes.data) {
      return { code: -1, message: '摊位不存在' };
    }

    const stall = stallRes.data;

    // 4. 检查用户是否是摊主
    const isOwner = stall.ownerUserId === userId;
    const isClaimed = stall.claimStatus === 'claimed';

    // 5. 查询用户的认领申请记录
    const claimsRes = await db.collection('stallClaims').where({
      stallId: stallId,
      userId: userId
    }).orderBy('submitTime', 'desc').get();

    const claims = claimsRes.data;
    let myClaim = null;

    if (claims.length > 0) {
      // 获取最新的申请记录
      const latestClaim = claims[0];
      
      // 状态文本映射
      const statusTextMap = {
        0: '审核中',
        1: '已通过',
        2: '已拒绝'
      };

      myClaim = {
        claimId: latestClaim._id,
        status: latestClaim.status,
        statusText: statusTextMap[latestClaim.status],
        remark: latestClaim.remark || '',
        submitTime: latestClaim.submitTime,
        auditTime: latestClaim.auditTime || ''
      };
    }

    // 6. 判断是否可以申请
    const canApply = stall.createdBy === 'admin_proxy' && 
                     (stall.claimStatus === 'unclaimed' || stall.claimStatus === 'rejected');

    // 7. 是否可以重新申请（被拒绝后）
    const canReapply = stall.claimStatus === 'rejected' && 
                       myClaim && 
                       myClaim.status === 2;

    return {
      code: 0,
      data: {
        stallId: stallId,
        claimStatus: stall.claimStatus, // unclaimed/pending/claimed/rejected
        isOwner: isOwner,
        isClaimed: isClaimed,
        myClaim: myClaim,
        canApply: canApply,
        canReapply: canReapply
      },
      message: '获取成功'
    };

  } catch (err) {
    console.error('[DEBUG getMyClaimStatus] 获取失败:', err);
    return {
      code: -1,
      message: '获取失败: ' + err.message
    };
  }
};
