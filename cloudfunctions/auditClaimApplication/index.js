const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 审核摊位认领申请
 * 仅管理员可操作
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { 
    claimId,
    action, // 'pass' 或 'reject'
    remark  // 拒绝原因（拒绝时必填）
  } = event;

  // 1. 参数校验
  if (!claimId) {
    return { code: -1, message: '申请ID不能为空' };
  }
  if (!action || !['pass', 'reject'].includes(action)) {
    return { code: -1, message: '审核操作无效' };
  }
  if (action === 'reject' && (!remark || remark.trim().length === 0)) {
    return { code: -1, message: '拒绝时必须填写原因' };
  }

  try {
    // 2. 检查当前用户是否为管理员
    const userRes = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (!userRes.data.length) {
      return { code: -1, message: '用户不存在' };
    }

    const adminUser = userRes.data[0];
    if (adminUser.role !== 'admin') {
      return { code: -1, message: '权限不足，仅管理员可审核' };
    }

    // 3. 获取认领申请记录
    const claimRes = await db.collection('stallClaims').doc(claimId).get();
    if (!claimRes.data) {
      return { code: -1, message: '认领申请不存在' };
    }

    const claim = claimRes.data;

    // 4. 检查申请状态
    if (claim.status !== 0) {
      return { code: -1, message: '该申请已审核，请勿重复操作' };
    }

    const now = new Date().toISOString();

    // 5. 处理审核通过
    if (action === 'pass') {
      // 更新认领申请状态
      await db.collection('stallClaims').doc(claimId).update({
        data: {
          status: 1, // 已通过
          auditTime: now,
          auditAdminId: adminUser._id
        }
      });

      // 更新摊位信息
      await db.collection('stalls').doc(claim.stallId).update({
        data: {
          claimStatus: 'claimed',
          claimedBy: claim.userId,
          claimedAt: now,
          ownerUserId: claim.userId,
          updateTime: now
        }
      });

      // 更新用户角色为摊主
      const applicantRes = await db.collection('users').doc(claim.userId).get();
      if (applicantRes.data) {
        const applicant = applicantRes.data;
        const _ = db.command;
        const updateData = {
          role: 'vendor',
          updateTime: now
        };

        // 添加摊位到用户的 stallIds
        const currentStallIds = applicant.stallIds || [];
        if (!currentStallIds.includes(claim.stallId)) {
          updateData.stallIds = _.push(claim.stallId);
        }

        // 使用 _.set 覆盖 vendorInfo，避免 null 值导致的更新失败
        updateData.vendorInfo = _.set({
          realName: claim.realName,
          phone: claim.phone,
          approvedTime: now,
          claimMethod: 'audit_claim'
        });

        const userUpdateRes = await db.collection('users').doc(claim.userId).update({
          data: updateData
        });
      }

      return {
        code: 0,
        data: {
          claimId: claimId,
          status: 1,
          stallId: claim.stallId,
          userId: claim.userId
        },
        message: '审核通过，摊主已获得摊位管理权'
      };
    }

    // 6. 处理审核拒绝
    if (action === 'reject') {
      // 更新认领申请状态
      await db.collection('stallClaims').doc(claimId).update({
        data: {
          status: 2, // 已拒绝
          remark: remark.trim(),
          auditTime: now,
          auditAdminId: adminUser._id
        }
      });

      // 更新摊位认领状态为 rejected（被拒绝后可重新申请）
      await db.collection('stalls').doc(claim.stallId).update({
        data: {
          claimStatus: 'rejected',
          updateTime: now
        }
      });

      return {
        code: 0,
        data: {
          claimId: claimId,
          status: 2,
          remark: remark.trim()
        },
        message: '已拒绝认领申请'
      };
    }

  } catch (err) {
    console.error('审核失败:', err);
    return {
      code: -1,
      message: '审核失败: ' + err.message
    };
  }
};
