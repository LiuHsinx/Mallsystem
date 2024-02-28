
const app = getApp()
let searchKey = '' //搜索词

Page({
  data: {
    banner: [],
  },
  //页面可见
  onShow() {
    this.getTopBanner(); //请求顶部轮播图
    this.getRecommend();  //请求算法
  },

  //获取用户输入的搜索词
  getSearchKey(e) {
    searchKey = e.detail.value
  },
  //搜索点击事件
  goSearch() {
    wx.navigateTo({
      url: '/pages/search/search?searchKey=' + searchKey,
    })
  },
  //获取首页顶部轮播图
  getTopBanner() {
    wx.cloud.database().collection("lunbotu")
      .get()
      .then(res => {
        console.log("首页banner成功", res.data)
        if (res.data && res.data.length > 0) {
          //如果后台配置轮播图就用后台的，没有的话就用默认的
          this.setData({
            banner: res.data
          })
        }
      }).catch(res => {
        console.log("首页banner失败", res)
      })
  },

    //获取协同过滤算法推荐的商品
    getRecommend(){
      var that = this
      wx.cloud.callFunction({
        name: "suanFa",
        data: {
          action: 'getHot'
        },
        success(res) {
          console.log("获取推荐列表成功",res.result)
          that.setData({
            goodList: res.result,
          }) 
        },
        fall(res){
          console.log("获取推荐列表失败",res.result)
        }
      })   
    },


  //去商品详情页
  goDetail(e) {
    wx.navigateTo({
      url: '/pages/detail/detail?goodid=' + e.currentTarget.dataset.id
    })
  },
})