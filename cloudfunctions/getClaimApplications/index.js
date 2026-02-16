const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 在云函数中获取云存储图片的临时链接
 * 云函数有更高权限，可以访问所有用户的云存储文件
 */
async function getTempFileUrls(claims) {
  if (!claims || claims.length === 0) return claims;
  
  // 收集所有需要转换的 fileID
  const fileIds = [];
  
  // 处理单个 claim 或数组
  const claimList = Array.isArray(claims) ? claims : [claims];
  
  claimList.forEach(claim => {
    // 摊位照片
    if (claim.stallPhotos && Array.isArray(claim.stallPhotos)) {
      claim.stallPhotos.forEach(id => {
        if (id && typeof id === 'string' && id.startsWith('cloud://')) {
          fileIds.push(id);
        }
      });
    }
    // 身份证照片
    if (claim.idCardPhoto && typeof claim.idCardPhoto === 'string' && claim.idCardPhoto.startsWith('cloud://')) {
      fileIds.push(claim.idCardPhoto);
    }
  });
  
  // 如果没有需要转换的，直接返回
  if (fileIds.length === 0) {
    return claims;
  }
  
  try {
    const res = await cloud.getTempFileURL({
      fileList: fileIds
    });
    
    // 创建映射表
    const urlMap = {};
    if (res.fileList) {
      res.fileList.forEach(item => {
        if (item.tempFileURL) {
          urlMap[item.fileID] = item.tempFileURL;
        }
      });
    }
    
    // 替换为临时链接
    claimList.forEach(claim => {
      if (claim.stallPhotos && Array.isArray(claim.stallPhotos)) {
        claim.stallPhotos = claim.stallPhotos.map(id => urlMap[id] || id);
      }
      if (claim.idCardPhoto) {
        claim.idCardPhoto = urlMap[claim.idCardPhoto] || claim.idCardPhoto;
      }
    });
    
    console.log('[云函数] 图片链接转换完成, 转换了', Object.keys(urlMap).length, '个文件');
  } catch (err) {
    console.error('[云函数] 获取图片临时链接失败:', err);
  }
  
  return claims;
}

/**
 * 获取摊位认领申请列表
 * 管理员：获取所有申请
 * 普通用户：获取自己的申请
 * 支持：通过 claimId 获取单个申请详情
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { 
    status,   // 筛选状态：0待审核 1已通过 2已拒绝，不传则返回全部
    page = 1,
    pageSize = 20,
    isAdmin = false, // 是否以管理员身份查询
    claimId  // 可选：直接获取单个申请详情
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

    // 如果指定了 claimId，直接获取单个申请
    if (claimId) {
      const claimRes = await db.collection('stallClaims').doc(claimId).get();
      
      if (!claimRes.data) {
        return { code: -1, message: '认领申请不存在' };
      }
      
      const claim = claimRes.data;
      
      // 权限检查：非管理员只能查看自己的申请
      if (!isAdmin && userRole !== 'admin' && claim.userId !== user._id) {
        return { code: -1, message: '无权查看此申请' };
      }
      
      // 获取摊位信息
      const stallRes = await db.collection('stalls').doc(claim.stallId).get();
      const stall = stallRes.data || {};
      
      // 获取申请人信息
      const applicantRes = await db.collection('users').doc(claim.userId).get();
      const applicant = applicantRes.data || {};
      
      // 获取审核人信息（如果有）
      let auditorInfo = null;
      if (claim.auditorId) {
        const auditorRes = await db.collection('users').doc(claim.auditorId).get();
        if (auditorRes.data) {
          auditorInfo = {
            nickName: auditorRes.data.nickName || '管理员',
            avatarUrl: auditorRes.data.avatarUrl || ''
          };
        }
      }
      
      // 转换云存储图片链接
      await getTempFileUrls(claim);
      
      return {
        code: 0,
        data: {
          claim: {
            ...claim,
            stallInfo: {
              displayName: stall.displayName || '未知摊位',
              address: stall.address || '',
              images: stall.images || []
            },
            applicantInfo: {
              nickName: applicant.nickName || '未知用户',
              avatarUrl: applicant.avatarUrl || ''
            },
            auditorInfo: auditorInfo
          }
        },
        message: '获取成功'
      };
    }

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
      
      // 转换云存储图片链接
      claims = await getTempFileUrls(claims);
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
