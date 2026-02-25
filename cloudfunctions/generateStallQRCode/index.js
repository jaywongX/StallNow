const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数需要配置权限才能调用 wxacode.getUnlimited
// 在微信开发者工具中：
// 1. 右键云函数文件夹 -> 创建并部署：云端安装依赖
// 2. 或到微信云开发控制台 -> 云函数 -> 权限设置 -> 添加 openapi 权限

/**
 * 生成摊位小程序码
 * 使用微信接口：wxacode.getUnlimited
 * 场景值：stallId=xxx
 */
exports.main = async (event, context) => {
  const { stallId } = event;
  const { OPENID } = cloud.getWXContext();

  if (!stallId) {
    return {
      code: -1,
      message: '摊位ID不能为空'
    };
  }

  try {
    const db = cloud.database();
    
    console.log('开始生成小程序码，stallId:', stallId, 'OPENID:', OPENID);
    
    // 1. 验证摊主身份
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get();
    
    console.log('用户查询结果:', userRes.data.length, '条记录');

    if (userRes.data.length === 0) {
      return {
        code: -1,
        message: '用户未登录'
      };
    }

    const user = userRes.data[0];
    console.log('用户stallIds:', user.stallIds);
    
    if (!user.stallIds || !user.stallIds.includes(stallId)) {
      return {
        code: -1,
        message: '您没有权限生成此摊位的小程序码'
      };
    }

    // 2. 获取摊位信息
    const stallRes = await db.collection('stalls').doc(stallId).get();
    console.log('摊位查询结果:', stallRes.data ? '存在' : '不存在');
    
    if (!stallRes.data) {
      return {
        code: -1,
        message: '摊位不存在'
      };
    }

    const stall = stallRes.data;

    // 3. 如果已存在二维码 fileID，获取新的临时链接（避免过期）
    if (stall.qrCodeFileID) {
      console.log('已存在小程序码fileID，获取新的临时链接');
      try {
        const tempUrlRes = await cloud.getTempFileURL({
          fileList: [stall.qrCodeFileID]
        });
        
        if (tempUrlRes.fileList && tempUrlRes.fileList[0] && tempUrlRes.fileList[0].tempFileURL) {
          return {
            code: 0,
            message: '获取成功',
            data: {
              qrCodeUrl: tempUrlRes.fileList[0].tempFileURL,
              qrCodeFileID: stall.qrCodeFileID,
              stallName: stall.displayName,
              permanent: true
            }
          };
        }
      } catch (err) {
        console.log('获取临时链接失败，将重新生成', err);
        // 继续执行生成新二维码的逻辑
      }
    }

    // 4. 生成小程序码
    // scene 参数最大32个字符，直接使用 stallId
    const scene = stallId;
    console.log('scene长度:', scene.length, 'scene:', scene);
    
    // 注意：page 必须是已发布的页面，否则会报错 41030
    // 发布后可启用下面这行，使用详情页作为落地页
    const page = 'pages/detail/detail';
    
    const requestParams = {
      scene: scene,
      page: page, // 暂不指定，默认跳首页
      width: 280,
      autoColor: false,
      lineColor: {
        r: 255,
        g: 107,
        b: 53
      },
      isHyaline: false
    };
    console.log('调用getUnlimited参数:', JSON.stringify(requestParams));

    const result = await cloud.openapi.wxacode.getUnlimited(requestParams);
    console.log('getUnlimited调用成功');

    // result 是 Buffer
    const qrCodeBuffer = result.buffer;

    // 5. 上传到云存储
    const cloudPath = `qrcodes/stall_${stallId}_${Date.now()}.png`;
    const uploadRes = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: qrCodeBuffer
    });

    // 6. 获取临时链接（长期有效）
    const fileID = uploadRes.fileID;
    const tempUrlRes = await cloud.getTempFileURL({
      fileList: [fileID]
    });

    const qrCodeUrl = tempUrlRes.fileList[0].tempFileURL;

    // 7. 保存到数据库（永久有效，无过期时间）
    await db.collection('stalls').doc(stallId).update({
      data: {
        qrCodeUrl: qrCodeUrl,
        qrCodeFileID: fileID,
        qrCodeUpdateTime: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '生成成功',
      data: {
        qrCodeUrl: qrCodeUrl,
        qrCodeFileID: fileID,
        stallName: stall.displayName,
        permanent: true
      }
    };

  } catch (err) {
    console.error('生成小程序码失败', err);
    console.error('错误详情:', {
      errCode: err.errCode,
      errMsg: err.errMsg,
      message: err.message,
      stack: err.stack
    });
    
    // 处理特定错误
    if (err.errCode === 41030) {
      return {
        code: -1,
        message: '页面路径错误，请检查页面是否已发布'
      };
    }
    if (err.errCode === 45009) {
      return {
        code: -1,
        message: '生成频率超限，请稍后再试'
      };
    }
    if (err.errCode === 40169) {
      return {
        code: -1,
        message: 'scene参数错误: ' + err.errMsg
      };
    }
    
    return {
      code: -1,
      message: '生成失败: ' + (err.errMsg || err.message || '未知错误')
    };
  }
};
