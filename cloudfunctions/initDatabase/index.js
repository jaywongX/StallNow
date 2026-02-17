// 数据库初始化脚本
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

// 汕尾市城区位置范围（大致经纬度）
const SHANWEI_BOUNDS = {
  latMin: 22.75,
  latMax: 22.80,
  lngMin: 115.35,
  lngMax: 115.45
};

// 随机摊位名称
const STALL_NAMES = [
  '老李烧烤摊', '阿妈手工饼', '汕尾特色牛腩', '海边水果档', '文创手作店',
  '潮汕牛肉丸', '糖葫芦小铺', '手工编织坊', '鲜榨果汁摊', '老字号肠粉',
  '网红奶茶店', '传统糕点铺', '特色卤味摊', '手工皮具店', '鲜花小站',
  '炸串小食档', '冰淇淋车', '铁板鱿鱼摊', '网红打卡点', '手工陶瓷坊',
  '汕尾海鲜档', '传统糖画摊', '手工香皂铺', '特色腌水果', '爆款零食店',
  '怀旧小卖部', '创意手作坊', '地方特产店', '便民早餐点', '夜宵烧烤王'
];

// 随机摊位描述
const STALL_DESCRIPTIONS = [
  '祖传秘方，地道口味，欢迎品尝！',
  '新鲜食材，每日现做，健康美味！',
  '汕尾本地人最爱，来就对了！',
  '纯手工制作，匠心工艺，品质保证！',
  '网红推荐，人气爆棚，排队也要吃！',
  '价格实惠，分量十足，童叟无欺！',
  '传统工艺，正宗味道，不容错过！',
  '每日新鲜到货，精选优质食材！',
  '用心做好每一份，顾客满意是我们的追求！',
  '地方特色小吃，带你品尝汕尾味道！'
];

// 随机图片
const IMAGES = [
  'cloud://cloudbase-3g9hw9hm1c01fd63.636c-cloudbase-3g9hw9hm1c01fd63-1401768961/stalls/default1.jpg',
  'cloud://cloudbase-3g9hw9hm1c01fd63.636c-cloudbase-3g9hw9hm1c01fd63-1401768961/stalls/default2.jpg',
  'cloud://cloudbase-3g9hw9hm1c01fd63.636c-cloudbase-3g9hw9hm1c01fd63-1401768961/stalls/default3.jpg'
];

// 随机街道地址
const STREETS = ['二马路', '三马路', '翠园街', '香洲路', '金鹏路', '汕尾大道', '信利城市广场'];

// 生成随机数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成随机坐标（汕尾市城区范围内）
function randomLocation() {
  return {
    latitude: parseFloat((Math.random() * (SHANWEI_BOUNDS.latMax - SHANWEI_BOUNDS.latMin) + SHANWEI_BOUNDS.latMin).toFixed(6)),
    longitude: parseFloat((Math.random() * (SHANWEI_BOUNDS.lngMax - SHANWEI_BOUNDS.lngMin) + SHANWEI_BOUNDS.lngMin).toFixed(6))
  };
}

// 生成随机营业时间
function randomSchedule() {
  const types = [['morning'], ['evening'], ['night'], ['morning', 'evening'], ['all_day']];
  const type = types[randomInt(0, types.length - 1)];
  const displayMap = {
    'morning': '早上',
    'evening': '晚上',
    'night': '深夜',
    'all_day': '全天'
  };
  const timeRangeMap = {
    'morning': '06:00 - 12:00',
    'evening': '17:00 - 22:00',
    'night': '22:00 - 02:00',
    'all_day': '06:00 - 23:00'
  };
  const display = type.map(t => displayMap[t]).join('、');
  const timeRange = type.map(t => timeRangeMap[t]).join('，');
  
  return {
    types: type,
    display: display,
    customTime: '',
    customTimeStart: '',
    customTimeEnd: '',
    type: type.includes('all_day') ? '固定' : '不固定',
    timeRange: timeRange,
    note: ''
  };
}

// 生成摊位测试数据（匹配实际数据结构）
function generateStallData(index, categoryIds) {
  const location = randomLocation();
  const categoryId = categoryIds[randomInt(0, categoryIds.length - 1)];
  const name = STALL_NAMES[index % STALL_NAMES.length];
  const now = new Date();
  const createTime = new Date(Date.now() - randomInt(0, 30 * 24 * 60 * 60 * 1000));
  
  // 随机决定是摊主申请还是管理员代录
  const createdBy = Math.random() > 0.8 ? 'admin_proxy' : 'vendor_self';
  const isProxy = createdBy === 'admin_proxy';
  
  return {
    displayName: name,
    categoryId: categoryId,
    categoryName: '', // 查询时会动态填充
    landmark: '',
    address: `${STREETS[randomInt(0, STREETS.length - 1)]}${randomInt(1, 200)}号附近`,
    city: '汕尾市',
    location: {
      latitude: location.latitude,
      longitude: location.longitude
    },
    schedule: randomSchedule(),
    contact: {
      hasContact: Math.random() > 0.3,
      phone: `138${randomInt(10000000, 99999999)}`,
      wechatQR: ''
    },
    images: [IMAGES[randomInt(0, IMAGES.length - 1)]],
    status: 1, // 1=已上架（getStalls查询条件）
    reliability: randomInt(0, 1), // 0=近期确认, 1=可能还在
    lastConfirmedAt: createTime.toISOString(),
    confirmMethod: 'admin_check',
    consentStatus: {
      hasConsent: true,
      consentDate: createTime.toISOString(),
      consentMethod: 'online'
    },
    // v2.0 新增字段：代申请功能
    createdBy: createdBy, // admin_proxy（管理员代录）/ vendor_self（摊主申请）
    claimStatus: isProxy ? 'unclaimed' : 'claimed', // unclaimed（待认领）/ claimed（已认领）
    claimedBy: isProxy ? '' : `test_user_${randomInt(1, 10)}`,
    claimedAt: isProxy ? null : createTime.toISOString(),
    ownerUserId: isProxy ? '' : `test_user_${randomInt(1, 10)}`,
    viewCount: randomInt(10, 500),
    favoriteCount: randomInt(0, 100),
    createTime: createTime.toISOString(),
    updateTime: now.toISOString()
  };
}

exports.main = async (event, context) => {
  try {
    // ===== 1. 初始化分类数据 =====
    const categories = [
      {
        _id: 'food_snack',
        name: '小吃/烧烤',
        icon: '🍢',
        sort: 1,
        createTime: new Date()
      },
      {
        _id: 'handicraft',
        name: '手工/饰品',
        icon: '🎨',
        sort: 2,
        createTime: new Date()
      },
      {
        _id: 'toy_culture',
        name: '玩具/文创',
        icon: '🧸',
        sort: 3,
        createTime: new Date()
      },
      {
        _id: 'food_fruit',
        name: '水果/零食',
        icon: '🍎',
        sort: 4,
        createTime: new Date()
      },
      {
        _id: 'other',
        name: '其他',
        icon: '📦',
        sort: 5,
        createTime: new Date()
      }
    ];

    let categorySuccessCount = 0;
    let categoryExistCount = 0;

    // 批量插入或更新分类数据
    for (const category of categories) {
      try {
        // 尝试获取文档，如果不存在会抛错
        const exist = await db.collection('categories').doc(category._id).get();
        console.log(`分类 ${category.name} 已存在，跳过`);
        categoryExistCount++;
      } catch (docErr) {
        // 文档不存在，执行插入
        if (docErr.errCode === -1 && docErr.errMsg.includes('does not exist')) {
          await db.collection('categories').add({
            data: category
          });
          console.log(`分类 ${category.name} 添加成功`);
          categorySuccessCount++;
        } else {
          console.error(`检查分类 ${category.name} 时出错：`, docErr);
        }
      }
    }

    // ===== 2. 生成10个摊位测试数据 =====
    const categoryIds = categories.map(c => c._id);
    let stallSuccessCount = 0;
    let stallExistCount = 0;

    // 先检查 stalls 集合中是否已有测试数据
    const existingStalls = await db.collection('stalls').where({
      ownerUserId: /^test_user_/
    }).count();

    if (existingStalls.total >= 10) {
      console.log(`已存在 ${existingStalls.total} 个测试摊位数据，跳过生成`);
      stallExistCount = existingStalls.total;
    } else {
      // 生成10个摊位数据
      const batchSize = 10; // 每批插入10个，避免超限
      const totalStalls = 10;

      for (let batch = 0; batch < Math.ceil(totalStalls / batchSize); batch++) {
        const batchPromises = [];
        const startIdx = batch * batchSize;
        const endIdx = Math.min(startIdx + batchSize, totalStalls);

        for (let i = startIdx; i < endIdx; i++) {
          const stallData = generateStallData(i, categoryIds);
          batchPromises.push(
            db.collection('stalls').add({ data: stallData })
              .then(() => {
                console.log(`摊位 ${stallData.name} 添加成功`);
                return { success: true };
              })
              .catch(err => {
                console.error(`摊位 ${stallData.name} 添加失败：`, err);
                return { success: false, error: err };
              })
          );
        }

        const results = await Promise.all(batchPromises);
        stallSuccessCount += results.filter(r => r.success).length;
        
        // 避免请求过快
        if (batch < Math.ceil(totalStalls / batchSize) - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return {
      success: true,
      message: `数据库初始化完成：\n- 分类：新增 ${categorySuccessCount} 个，跳过 ${categoryExistCount} 个已存在\n- 摊位：新增 ${stallSuccessCount} 个测试摊位，跳过 ${stallExistCount} 个已存在`
    };
  } catch (err) {
    console.error('数据库初始化失败', err);
    return {
      success: false,
      message: '数据库初始化失败：' + err.message
    };
  }
};