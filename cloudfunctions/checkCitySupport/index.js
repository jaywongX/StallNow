const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 检查城市是否支持
 * 支持通过城市名或经纬度检查
 */
exports.main = async (event, context) => {
  const { city, latitude, longitude, checkLocation } = event;

  // 当前仅支持汕尾市及其区县
  const supportedCities = ['汕尾市', '汕尾', '城区', '海丰县', '陆河县', '陆丰市'];

  try {
    let isSupported = false;
    let detectedCity = '';

    // 如果传入了城市名，直接检查
    if (city) {
      isSupported = supportedCities.some(c => city && city.includes(c));
      detectedCity = city;
    }
    
    // 如果需要根据位置检查
    if (checkLocation && latitude && longitude) {
      // 汕尾市的大致边界（简化判断）
      // 纬度范围：22.5 - 23.5
      // 经度范围：114.8 - 115.8
      const isInShanweiRange = 
        latitude >= 22.5 && latitude <= 23.5 &&
        longitude >= 114.8 && longitude <= 115.8;
      
      if (isInShanweiRange) {
        isSupported = true;
        detectedCity = '汕尾市';
      } else {
        isSupported = false;
        detectedCity = '其他地区';
      }
    }

    return {
      success: true,
      supported: isSupported,
      city: detectedCity,
      defaultCity: {
        name: '汕尾市',
        district: '城区',
        address: '二马路',
        location: {
          latitude: 22.7863,
          longitude: 115.3650
        }
      }
    };
  } catch (err) {
    console.error('检查城市支持失败', err);
    return {
      success: false,
      supported: false,
      city: '',
      message: err.message
    };
  }
};
