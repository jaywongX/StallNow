const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 获取用户信息（含角色）
 * 如果用户不存在，自动创建用户记录（静默注册）
 * 
 * 用户注册流程：
 * 1. 用户首次使用小程序时，自动调用此云函数
 * 2. 系统检测到用户不存在，自动创建 users 记录
 * 3. 用户无需感知注册过程，直接以普通用户身份使用
 * 4. 后续申请成为摊主时，使用已注册的用户ID关联
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  try {
    // 查询用户是否存在（使用 _openid 字段，云开发数据库自动注入）
    let userRes = await db.collection('users').where({
      _openid: openId
    }).get();

    let userInfo;

    if (userRes.data.length === 0) {
      // 用户不存在，自动创建新用户（静默注册）
      const newUser = {
        _openid: openId,
        nickName: '',
        avatarUrl: '',
        role: 'user', // user:普通用户, vendor:摊主, admin:管理员
        // vendorInfo 在成为摊主时动态添加
        stallIds: [],
        favorites: [],
        recentViews: [],
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };

      const addRes = await db.collection('users').add({
        data: newUser
      });

      userInfo = {
        _id: addRes._id,
        ...newUser
      };
      
      console.log('新用户自动注册成功:', openId);
    } else {
      userInfo = userRes.data[0];
      
      // 兼容性处理：如果 role 是 vendor 但 stallIds 为空，尝试从 stalls 集合查询
      if (userInfo.role === 'vendor' && (!userInfo.stallIds || userInfo.stallIds.length === 0)) {
        const stallRes = await db.collection('stalls').where({
          ownerUserId: userInfo._id
        }).get();
        
        if (stallRes.data.length > 0) {
          userInfo.stallIds = stallRes.data.map(s => s._id);
          
          // 更新用户的 stallIds
          await db.collection('users').doc(userInfo._id).update({
            data: {
              stallIds: userInfo.stallIds,
              updateTime: new Date().toISOString()
            }
          });
        }
      }
    }

    return {
      code: 0,
      data: userInfo,
      message: 'success'
    };
  } catch (err) {
    console.error('获取用户信息失败', err);
    return {
      code: -1,
      message: '获取用户信息失败: ' + err.message
    };
  }
};
