Page({
  data: {
    appName: '摆地摊了么',
    version: '1.0.0',
    wechatId: 'wxid_z3wss3eme2lm12',
    sections: []
  },

  onLoad() {
    this.loadAboutContent();
  },

  // 复制微信号
  copyWechatId() {
    wx.setClipboardData({
      data: this.data.wechatId,
      success: () => {
        wx.showToast({
          title: '已复制微信号',
          icon: 'success'
        });
      }
    });
  },

  // 预览二维码
  previewQRCode() {
    wx.previewImage({
      urls: ['/images/wechat.png']
    });
  },

  loadAboutContent() {
    const sections = [
      {
        title: '产品介绍',
        content: '"摆地摊了么"是一款地摊分布与发现工具小程序，旨在推广家乡美食文化，方便游客发现地摊、帮助商贩展示信息。\n\n我们不是一个"商家平台"，而是一个"帮人找到摊位的本地指南"。'
      },
      {
        title: '我们做什么',
        hasSubsection: true,
        items: [
          {
            subtitle: '地摊信息展示',
            content: '展示本地流动摊位的基本信息，提供摊位位置、出摊时间等信息，帮助用户找到附近的摊位'
          },
          {
            subtitle: '摊主信息发布',
            content: '允许摊主自主发布摊位信息，简单快捷的入驻流程，灵活的信息更新机制'
          }
        ]
      },
      {
        title: '我们不做什么',
        hasSubsection: true,
        items: [
          {
            subtitle: '不涉及交易',
            content: '不提供在线下单功能\n不提供支付服务\n不提供商品比价'
          },
          {
            subtitle: '不提供排名',
            content: '不对摊位进行排名\n不提供评分功能\n不提供评论功能'
          },
          {
            subtitle: '不参与交易',
            content: '不参与任何交易过程\n不收取交易佣金\n不提供交易保障'
          }
        ]
      },
      {
        title: '免责声明',
        hasSubsection: true,
        items: [
          {
            subtitle: '信息仅供参考',
            content: '本小程序用于展示本地流动摊位信息，仅供参考，不涉及商品交易。摊位为流动经营，信息可能随时变化，请以现场实际情况为准。'
          },
          {
            subtitle: '风险提示',
            content: '1. 信息准确性\n摊位信息由摊主或志愿收集提供，信息可能随时变化，请以现场实际情况为准\n\n2. 交易风险\n平台不参与任何交易，如有任何交易纠纷，平台不承担责任，请用户自行判断和承担风险\n\n3. 联系方式\n联系方式由摊主自行提供，平台不保证联系方式的有效性，请谨慎使用'
          }
        ]
      },
      // {
      //   title: '服务范围',
      //   content: '目前仅在广东省汕尾市开放，包含：\n• 城区\n• 海丰县\n• 陆河县\n• 陆丰市\n\n我们计划在未来扩展到更多城市，敬请期待。'
      // },
      {
        title: '数据说明',
        hasSubsection: true,
        items: [
          {
            subtitle: '信息来源',
            content: '• 摊主自主提交\n• 志愿者收集\n• 管理员录入'
          },
          {
            subtitle: '信息更新',
            content: '• 摊主可自主更新信息\n• 用户可反馈信息不准确\n• 定期清理过期信息'
          },
          {
            subtitle: '信息隐私',
            content: '• 不收集用户的敏感个人信息\n• 位置信息仅用于推荐\n• 联系方式由摊主自主提供'
          }
        ]
      },
      {
        title: '用户反馈',
        content: '如果您发现信息不准确或有任何问题，欢迎通过以下方式反馈：\n\n• 点击摊位详情页的"信息有变化？"\n• 通过管理后台提交反馈\n\n我们会及时处理您的反馈。'
      },
      {
        title: '联系我们',
        content: '如果您有任何问题或建议，欢迎联系我们：\n\n邮箱：stallnow@163.com\n反馈渠道：微信小程序内的反馈功能'
      },
      {
        title: '版权声明',
        content: '本小程序的所有内容，包括但不限于文字、图片、视频等，均受版权保护。未经我们书面许可，任何人不得以任何形式使用、复制、传播。'
      }
    ];

    this.setData({ sections });
  }
});
