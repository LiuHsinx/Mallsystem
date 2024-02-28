// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'liuxinru-5gfoief9fdf16fa4'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const res = await cloud.database().collection("pinglun").field({
    goodId: 1,
    _openid: 1,
    scores: 1
  }).get()
  console.log(res.data)
  //构建推荐需要的data
  const data = res.data.map(item => {
    return {
      /*构造数据*/
      userId: item['_openid'],
      goodsId: item['goodId'],
      score: item['scores']
    }
  })
  //找到当前用户openid,将自己买的商品放在第一位
  const wxContext = cloud.getWXContext()
  let openid = wxContext.OPENID
  var t = []
  for (var i = 0; i < data.length; i++) {
    if (openid == data[i].userId) {
      t = data[i]
      data[i] = data[0]
      data[0] = t
      break;
    }
  }
  console.log("当前用户为第一商品数组", data)

  // 1.形成用户{用户：商品：评分}矩阵
  let ans = dataConversion(data)
  console.log("得出三维数组：", ans)

  // 2.得出全部商品排列
  let good = findGood(ans)
  console.log("商品数组", good)

  // 3.得出{用户：评分}矩阵，对应每个商品
  let userscore = findScores(ans, good)
  console.log("评分数组", userscore)

  // 4. 得出相关系数
  let simily = []
  let usco = userscore
  for (var i = 1; i < userscore.length; i++) {

    simily.push({
      value: cal_pearson(usco[0], usco[i]),
      children: [{
        value: usco[i][0]
      }]
    })
  }
  console.log("相关系数-openid",simily)

  // 5.找出前两个相关性最高的用户
  let max = simily[0].value
  let index1 = 0
  for(var i=0;i<simily.length;i++){
    if(max < simily[i].value){
      max = simily[i].value
      index1 = i 
    }
  }
  let second = 0
  let index2 = 0
  if(index1 != 0){
    second = simily[0].value
  }
  else{
    second = simily[simily.length-1].value
  }
  for(var j = 0;j<index1;j++){
    if(second < simily[j].value){
      second = simily[j].value
      index2 = j
    }
  }
  for(var k = index1+1; k<simily.length;k++){
    if(second < simily[k].value){
      second = simily[k].value
      index2 = k
    }
  }
  let user = []
  user.push(simily[index1].children[0].value)
  user.push(simily[index2].children[0].value)
  console.log("相似的用户的openid：",user)
  // 6.得出推荐商品id
  let goodid = []
  for(var i = 0;i<ans.length;i++){
    if((ans[i].value == user[0])||(ans[i].value == user[1])){
      for(var j=0;j<(ans[i].children).length;j++){
        goodid.push((ans[i].children)[j].value)
      }
    }
  }
  // 把自己买过的去除
  let tuijian = []
  for(var j=0;j<goodid.length;j++){
    let f =1
    for(var i = 0;i<ans[0].children.length;i++){
      if( goodid[j] == (ans[0].children)[i].value){
        f = 0
        break;
      }
    }
    if(f == 1){
      tuijian.push(goodid[j])
    }
  }
  console.log("推荐的商品id:",tuijian)

  // 7.得出推荐商品全部信息
  const arr = await cloud.database().collection("goods").get()
  const good1 = arr.data
  console.log("全部商品", good1)
  const tj = []
  for (var i in tuijian) {
    for (var j in good1) {
      if (tuijian[i] == good1[j]._id) {
        tj.push(good1[j])
      }
    }
  }
  return tj

}

//构造三维数组
function dataConversion(arr) {
  let keys = Object.keys(arr[0])
  let level1 = keys[0]//获取一级属性名称
  let level2 = keys[1]//获取二级属性名称
  let level3 = keys[2]//获取三级属性名称
  let list = Array.from(new Set(
    arr.map(item => {
      return item[level1]
    })))
  let subList = []
  list.forEach(res => {
    arr.forEach(ele => {
      if (ele[level1] === res) {
        let nameArr = subList.map(item => item.value)
        if (nameArr.indexOf(res) !== -1) {
          let nameArr2 = subList[nameArr.indexOf(res)].children.map(item => item.value)
          if (nameArr2.indexOf(ele[level2]) !== -1) {
            subList[nameArr.indexOf(res)].children[nameArr2.indexOf(ele[level2])].children.push({
              value: ele[level3],
              label: ele[level3],
            })
          } else {
            subList[nameArr.indexOf(res)].children.push({
              value: ele[level2],
              label: ele[level2],
              children: [{
                value: ele[level3],
                label: ele[level3],
              }]
            })
          }
        } else {
          subList.push({
            value: res,
            label: res,
            children: [{
              value: ele[level2],
              label: ele[level2],
              children: [{
                value: ele[level3],
                label: ele[level3],
              }]
            }]
          })
        }
      }
    })

  })
  return subList

}
//找寻用户评价的全部商品
function findGood(good) {
  let goods = []
  for (var i = 0; i < good.length; i++) {
    for (var j = 0; j < good[i].children.length; j++) {
      let f = 1
      for (var k = 0; k < goods.length; k++) {
        if (((good[i].children)[j].value) == goods[k]) {
          f = 0;
          break;
        }
      }
      if (f == 1) {
        goods.push((good[i].children)[j].value)
      }
    }
  }
  return goods
}


// 找寻每个用户对商品的评分，未购买评分为1
function findScores(data, good) {
  // 构造一个二维数组
  var score = new Array(data.length)
  for (var w = 0; w < data.length; w++) {
    score[w] = []
  }
  // 用评分填充二维数组,第一个元素为用户openid
  for (var i = 0; i < data.length; i++) {
    score[i].push(data[i].value)
    for (var k = 0; k < good.length; k++) {
      let f = 1
      for (var j = 0; j < data[i].children.length; j++) {
        if ((data[i].children)[j].value == good[k]) {
          f = 0
          score[i].push((((data[i].children)[j]).children)[0].value)
          break;
        }
      }
      if (f == 1) {
        score[i].push(0)
      }
    }

  }
  return score
}

// 皮尔逊相关系数算法
/**根据其相似公式
 * 设X、Y为评分矩阵
 *
 *              ∑XY - (∑X.∑Y)/N   
 * Pxy = ----------------------------------
 *         √(∑X²- (∑X)²/N).(∑Y²- (∑Y)²/N) 
 */
function multiply(a, b) {
  // a,b为两个列表的评分数据(去除第一个元素openid)—∑XY
  let sum_ab = 0
  for (var i = 1; i < a.length; i++) {
    let temp = 0
    let x = a[i]
    let y = b[i]
    if(x==0){
      x=1
    }
    if(y==0){
      y=1
    }
    temp = x*y
    sum_ab = sum_ab + temp
  }
  return sum_ab
}
function summ(arr) {
  // 单个列表求和 ∑X 和 ∑Y
  let su = 0
  for (var i = 1; i < arr.length; i++) {
    su = su + arr[i]
  }
  return su
}
function sum_a2(x) {
  // 数据平方和——∑X²
  let su2 = 0
  for (var i = 1; i < x.length; i++) {
    let temp = 0
    let k = x[i]
    temp = k*k
    su2 = temp+su2
  }
  return su2
}

function cal_pearson(x, y) {
  let n = x.length - 1
  // 求 ∑X 和 ∑Y
  let sum_x = summ(x)
  let sum_y = summ(y)
  // 求 ∑XY
  let sum_xy = multiply(x, y)
  // 求 ∑X² 和 ∑Y²
  let sum_x2 = sum_a2(x)
  let sum_y2 = sum_a2(y)
  //分子
  let molecular = sum_xy - ((sum_x * sum_y) / n)
  //分母
  let denominator = Math.sqrt((sum_x2 - (sum_x * sum_x) / n) * (sum_y2 - (sum_y * sum_y) / n))
  return molecular / denominator
}