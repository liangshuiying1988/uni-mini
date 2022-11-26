'use strict';
let uniID = require('uni-id')

const db = uniCloud.database()
exports.main = async (event, context) => {
  uniID = uniID.createInstance({
    context
  })
  const {
    state,
    uniIdToken
  } = event
  const payload = await uniID.checkToken(uniIdToken)
  if (payload.code > 0) {
    return {
      code: 1001,
      msg: '用户身份验证失败，请重新登录'
    }
  }
  const uid = payload.uid
  const order = db.collection('order')
  let pars = { user_id: uid }
  if (state) {
    pars.status = state
  }
  // 获取订单中的商品信息
  const orderList = await order.aggregate().match(pars).unwind('$goodsInOrder').lookup({
    from: 'open-goods',
    localField: 'goodsInOrder.id',
    foreignField: '_id',
    as: 'goodsDetail'
  }).end()


  let res = orderList.data;

  if (res.length === 0) {
    return {
      code: -1,
      msg: '订单不存在'
    }
  }

  //提取每个订单中对应的商品sku
  res.map((item) => {
    let a = item.goodsDetail[0].goods_sku
    if (a.length) {
      let selectedSku = a.filter(i => i.sku_id === item.goodsInOrder.sku_id);
      selectedSku[0].goods_thumb = item.goodsDetail[0].goods_thumb;
      selectedSku[0].title = item.goodsDetail[0].name;
      item.goodsList = selectedSku
    }
  })

  let resList = [];
  let copyList = JSON.parse(JSON.stringify(res))

  // 将同一订单数据合并
  copyList.forEach((item) => {
    if (resList.length) {
      let isRepeat = false, index, goodsList, amounts;
      resList.map((ritem, j) => {
        if (item._id === ritem._id) { //重复
          isRepeat = true;
          index = j;
          goodsList = item.goodsList[0];
          amounts = item.goodsInOrder.amount
          return;
        }
      })
      if (isRepeat) {
        resList[index].goodsList.push(goodsList)
        resList[index].amount = resList[index].goodsInOrder.amount + amounts;
      } else {
        item.amount = item.goodsInOrder.amount
        resList.push(item)
      }

    } else {
      item.amount = item.goodsInOrder.amount
      resList.push(item)
    }
  })

  return resList;

};
