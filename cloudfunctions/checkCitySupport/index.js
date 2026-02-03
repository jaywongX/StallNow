const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 检查城市是否支持
 */
exports.main = async (event, context) => {
  const { city } = event;

  try {
    // 目前仅支持汕尾市
    const supportedCities = ['汕尾市', '汕尾', '城区', '海丰县', '陆河县', '陆丰市'];

    const isSupported = supportedCities.some(c =>
      city && city.includes(c)
    );

    return {
      success: true,
      supported: isSupported
    };
  } catch (err) {
    console.error('检查城市支持失败', err);
    return {
      success: false,
      supported: false
    };
  }
};
