const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 提交摊位认领申请
 * 用于摊主认领管理员代录入的摊位
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { 
    stallId,
    realName,
    phone,
    wechatId,
    stallPhotos,
    idCardPhoto,
    businessLicense
  } = event;

  // 1. 参数校验
  if (!stallId) {
    return { code: -1, message: '摊位ID不能为空' };
  }
  if (!realName || realName.trim().length < 2) {
    return { code: -1, message: '请填写真实姓名（至少2个字）' };
  }
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return { code: -1, message: '请输入正确的手机号码' };
  }
  if (!stallPhotos || !Array.isArray(stallPhotos) || stallPhotos.length === 0) {
    return { code: -1, message: '请至少上传1张摊位照片' };
  }
  if (stallPhotos.length > 3) {
    return { code: -1, message: '摊位照片最多上传3张' };
  }

  try {
    // 2. 检查摊位是否存在且为待认领状态
    const stallRes = await db.collection('stalls').doc(stallId).get();
    if (!stallRes.data) {
      return { code: -1, message: '摊位不存在' };
    }

    const stall = stallRes.data;

    // 3. 检查摊位是否为管理员代录入
    if (stall.createdBy !== 'admin_proxy') {
      return { code: -1, message: '该摊位不是代录入摊位，无需认领' };
    }

    // 4. 检查摊位认领状态
    if (stall.claimStatus === 'claimed') {
      return { code: -1, message: '该摊位已被认领' };
    }
    if (stall.claimStatus === 'pending') {
      return { code: -1, message: '该摊位已有认领申请正在审核中' };
    }

    // 5. 获取当前用户信息
    const userRes = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (!userRes.data.length) {
      return { code: -1, message: '用户不存在，请先登录' };
    }

    const user = userRes.data[0];
    const userId = user._id;

    // 6. 检查该用户是否已提交过申请（防止重复提交）
    const existingRes = await db.collection('stallClaims').where({
      stallId: stallId,
      userId: userId,
      status: 0
    }).get();

    if (existingRes.data.length > 0) {
      return { code: -1, message: '您已提交过认领申请，请勿重复提交' };
    }

    const now = new Date().toISOString();

    // 7. 创建认领申请记录
    const claimData = {
      stallId: stallId,
      userId: userId,
      realName: realName.trim(),
      phone: phone,
      wechatId: wechatId ? wechatId.trim() : '',
      stallPhotos: stallPhotos,
      idCardPhoto: idCardPhoto || '',
      businessLicense: businessLicense || '',
      status: 0, // 0待审核 1已通过 2已拒绝
      remark: '',
      submitTime: now,
      auditTime: '',
      auditAdminId: ''
    };

    const claimRes = await db.collection('stallClaims').add({
      data: claimData
    });

    // 8. 更新摊位认领状态为 pending（审核中）
    await db.collection('stalls').doc(stallId).update({
      data: {
        claimStatus: 'pending',
        updateTime: now
      }
    });

    return {
      code: 0,
      data: {
        claimId: claimRes._id,
        stallId: stallId,
        status: 0
      },
      message: '认领申请提交成功，请等待管理员审核'
    };

  } catch (err) {
    console.error('[DEBUG submitClaimApplication] 提交失败:', err);
    return {
      code: -1,
      message: '提交失败: ' + err.message
    };
  }
};
