
App({
  //创建towxml对象，供小程序页面使用
  globalData: {
    userInfo: {},
    openid: null,
  },
  onLaunch: function () {
    //云开发初始化
    wx.cloud.init({
      env: 'liuxinru-5gfoief9fdf16fa4',   //改成你的环境id
      traceUser: true,
    })
    this.getOpenid();
  },
  // 获取用户openid
  getOpenid: function () {
    var app = this;
    var openidStor = wx.getStorageSync('openid');
    if (openidStor) {
      console.log('本地获取openid:' + openidStor);
      app.globalData.openid = openidStor;
      app._getMyUserInfo();
    } else {
      wx.cloud.callFunction({
        name: 'getOpenid',
        success(res) {
          console.log('云函数获取openid成功', res.result.openid)
          var openid = res.result.openid;
          wx.setStorageSync('openid', openid)
          app.globalData.openid = openid;
          app._getMyUserInfo();
        },
        fail(res) {
          console.log('云函数获取失败', res)
        }
      })
    }
  },
  //获取自己后台的user信息
  _getMyUserInfo() {
    let app = this
    var userStor = wx.getStorageSync('user');
    if (userStor) {
      console.log('本地获取user', userStor)
      app.globalData.userInfo = userStor;
    }
  },
  _checkOpenid() {
    let app = this
    let openid = this.globalData.openid;
    if (!openid) {
      app.getOpenid();
      wx.showLoading({
        title: 'openid不能为空，请重新登录',
      })
      return null;
    } else {
      return openid;
    }
  },
  // 保存userinfo
  _saveUserInfo: function (user) {
    this.globalData.userInfo = user;
    wx.setStorageSync('user', user)
  },

 
  // 获取当前时间
  _getCurrentTime() {
    var d = new Date();
    var month = d.getMonth() + 1;
    var date = d.getDate();
    var day = d.getDay();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();
    var ms = d.getMilliseconds();

    var curDateTime = d.getFullYear() + '年';
    if (month > 9)
      curDateTime += month + '月';
    else
      curDateTime += month + '月';

    if (date > 9)
      curDateTime = curDateTime + date + "日";
    else
      curDateTime = curDateTime + date + "日";
    if (hours > 9)
      curDateTime = curDateTime + hours + "时";
    else
      curDateTime = curDateTime + hours + "时";
    if (minutes > 9)
      curDateTime = curDateTime + minutes + "分";
    else
      curDateTime = curDateTime + minutes + "分";
    return curDateTime;
  },
  // 获取当前的年月日
  _getNianYuiRi() {
    let date = new Date()
    let year = date.getFullYear()
    // 我们的月份是从0开始的 0代表1月份，11代表12月
    let month = date.getMonth() + 1
    let day = date.getDate()
    let key = '' + year + month + day
    console.log('当前的年月日', key)
    return key
  },
 
  // 保存收获地址:地址里包含用户姓名，电话，地址信息
  _saveAddress: function (address) {
    //缓存到sd卡里
    wx.setStorageSync('address', address);
    console.log(address);
    console.log('地址里的电话：' + address.telNumber);
  },
  // 拼接地址信息
  _getAddress: function (address) {
    var desc = null;
    if (address) {
      desc = address.provinceName + address.cityName + address.countyName + address.detailInfo;
    }
    return desc;
  },
  // 获取用户所在城市
  _getCity: function (address) {
    var city = null;
    if (address) {
      city = address.cityName;
    }
    return city;
  },
  // 错误提示
  showErrorToastUtils: function (e) {
    wx.showModal({
      title: '提示！',
      confirmText: '我知道了',
      showCancel: false,
      content: e,
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定')
        }
      }
    })
  },
})