const app = getApp()
let DB = wx.cloud.database()
Page({
  data: {
    list: []
  },

  //去商品详情页
  goDetail(e) {
    wx.navigateTo({
      url: '/pages/detail/detail?goodid=' + e.currentTarget.dataset.goodid
    })
  },
  onLoad() {
    this.getMyCommentList();
  },
  //获取我的所有评论列表
  getMyCommentList() {
    //请求自己后台获取用户openid
    let that=this;
    let openid = app._checkOpenid();
    if (openid) {
      DB.collection("pinglun").where({_openid: openid}).get()
      .then(res => {
        console.log("查询评论成功", res)
        if (res && res.data) {
          let dataList = res.data;
          that.setData({
            list: dataList
          })
        } else {
          that.setData({
            list: []
          })
        }
      }).catch(res => {
        console.log("查询评论失败", res)
      })
    }
  },
})