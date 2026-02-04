const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 检查摊主入驻状态
 * 返回用户的角色状态和申请记录
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  try {
    // 1. 获取用户信息（使用 _openid 字段）
    const userRes = await db.collection('users').where({
      _openid: openId
    }).get();

    if (userRes.data.length === 0) {
      return {
        code: -1,
        message: '用户未注册，请先访问首页完成自动注册'
      };
    }

    const userInfo = userRes.data[0];
    const role = userInfo.role || 'user';

    // 2. 如果已经是摊主，直接返回
    if (role === 'vendor') {
      return {
        code: 0,
        data: {
          role: 'vendor',
          stallIds: userInfo.stallIds || [],
          application: null
        },
        message: '已是摊主'
      };
    }

    // 3. 检查是否有待审核的申请
    const applicationRes = await db.collection('applications').where({
      userId: userInfo._id,
      status: 0 // 待审核状态
    }).orderBy('submitTime', 'desc').get();

    let application = null;
    if (applicationRes.data.length > 0) {
      application = applicationRes.data[0];
      // 格式化时间
      application.submitTime = formatTime(application.submitTime);
    }

    return {
      code: 0,
      data: {
        role: role,
        application: application
      },
      message: 'success'
    };
  } catch (err) {
    console.error('检查状态失败', err);
    return {
      code: -1,
      message: '检查状态失败: ' + err.message
    };
  }
};

/**
 * 格式化时间
 */
function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
