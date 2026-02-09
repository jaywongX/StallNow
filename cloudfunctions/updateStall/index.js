const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 更新摊位信息（摊主编辑）
 * 只能修改特定字段：displayName, goodsTags, address, scheduleTypes, schedule, images, contact
 * 不能修改：categoryId, categoryName, location（定位位置）
 */
exports.main = async (event, context) => {
  const { stallId, updateData } = event;
  const { OPENID } = cloud.getWXContext();

  if (!stallId || !updateData) {
    return {
      code: -1,
      message: '参数错误'
    };
  }

  try {
    // 1. 验证摊主身份 - 检查当前用户是否是该摊位的摊主
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get();

    if (userRes.data.length === 0) {
      return {
        code: -1,
        message: '用户未登录'
      };
    }

    const user = userRes.data[0];
    
    // 检查用户是否绑定了该摊位
    if (!user.stallIds || !user.stallIds.includes(stallId)) {
      return {
        code: -1,
        message: '您没有权限编辑此摊位'
      };
    }

    // 2. 获取摊位信息验证存在性
    const stallRes = await db.collection('stalls').doc(stallId).get();
    if (!stallRes.data) {
      return {
        code: -1,
        message: '摊位不存在'
      };
    }

    const stall = stallRes.data;
    
    // 3. 构建允许更新的字段
    const allowedFields = ['displayName', 'goodsTags', 'address', 'scheduleTypes', 'schedule', 'images', 'contact'];
    const updateFields = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    // 4. 数据验证
    // 验证摊位名称
    if (updateFields.displayName !== undefined) {
      if (!updateFields.displayName || updateFields.displayName.trim().length === 0) {
        return {
          code: -1,
          message: '摊位名称不能为空'
        };
      }
      if (updateFields.displayName.length > 20) {
        return {
          code: -1,
          message: '摊位名称不能超过20个字'
        };
      }
    }

    // 验证商品标签
    if (updateFields.goodsTags !== undefined) {
      if (!Array.isArray(updateFields.goodsTags) || updateFields.goodsTags.length === 0) {
        return {
          code: -1,
          message: '请至少选择一个商品标签'
        };
      }
      if (updateFields.goodsTags.length > 5) {
        return {
          code: -1,
          message: '商品标签最多选择5个'
        };
      }
    }

    // 验证出摊时间
    if (updateFields.scheduleTypes !== undefined) {
      if (!Array.isArray(updateFields.scheduleTypes) || updateFields.scheduleTypes.length === 0) {
        return {
          code: -1,
          message: '请至少选择一个出摊时间'
        };
      }
      
      // 如果选择了不固定，需要验证自定义时间
      if (updateFields.scheduleTypes.includes('unfixed')) {
        if (!updateFields.schedule || !updateFields.schedule.customTimeStart || !updateFields.schedule.customTimeEnd) {
          return {
            code: -1,
            message: '选择"不固定"时需要设置自定义时间段'
          };
        }
      }
    }

    // 验证图片数量
    if (updateFields.images !== undefined) {
      if (!Array.isArray(updateFields.images)) {
        return {
          code: -1,
          message: '图片数据格式错误'
        };
      }
      if (updateFields.images.length > 3) {
        return {
          code: -1,
          message: '最多上传3张图片'
        };
      }
    }

    // 5. 执行更新
    await db.collection('stalls').doc(stallId).update({
      data: {
        ...updateFields,
        updateTime: db.serverDate()
      }
    });

    // 6. 记录编辑历史（可选，用于追踪）
    await db.collection('stallEditLogs').add({
      data: {
        stallId: stallId,
        vendorId: user._id,
        vendorOpenId: OPENID,
        editTime: db.serverDate(),
        editedFields: Object.keys(updateFields),
        // 不记录敏感信息，只记录字段名
      }
    });

    return {
      code: 0,
      message: '更新成功',
      data: {
        stallId: stallId,
        updatedFields: Object.keys(updateFields)
      }
    };

  } catch (err) {
    console.error('更新摊位失败', err);
    return {
      code: -1,
      message: '更新失败: ' + err.message
    };
  }
};
