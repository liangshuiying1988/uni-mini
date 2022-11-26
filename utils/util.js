// 找最低价
export function findLowerPrice(list) {
  let copyList = JSON.parse(JSON.stringify(list));
  if (list.length) {
    list.map((item, index) => {
      let minMun = 0;
      if (item.goods_sku.length) {
        item.goods_sku.map((i, idx) => {
          if (idx === 0) {
            minMun = i.price
          } else {
            if (i.price < minMun) {
              minMun = i.price
            }
          }
        })
        copyList[index].minPrice = minMun;
      }
    })
  }
  return copyList
}

//处理数据结构并查找有无重复商品
// goods_id 下的数据都一致则是重复商品
export function findRepeatGoods(list) {
  let copyList = JSON.parse(JSON.stringify(list));
  let res = [], res2 = [];
  if (copyList.length) {
    //先将多维数据转换成1维数组
    copyList.forEach((item, idx) => {
      console.log('item===========', item)
      let selectedSku = item.goods_id[0].goods_sku.filter(i => i.sku_id === item.sku_id);
      res[idx] = selectedSku[0];
      res[idx].checked = true;
      res[idx].goods_num = item.goods_num;
      res[idx].image = item.goods_id[0].goods_thumb;
      res[idx].name = item.goods_id[0].name;
      res[idx].goods_id = item.goods_id[0]._id;
      res[idx].cart_id = item._id;
      // cart数据库表里的_id：2个商品重复但在cart表中的_id不同，保存起来，后期支付后要删除cart表的这个数据
    });

    //根据res中的id和sku_id来判断商品是否有重复
    res.forEach((item) => {
      if (res2.length) {
        let isRepeat = false, idx, cart_id, goods_num;
        res2.map((i, j) => {
          if (i.id === item.id && i.sku_id === item.sku_id) { //重复
            // console.log('item==========', item)
            // console.log('i==========', i, j)
            isRepeat = true;
            idx = j;
            cart_id = item.cart_id;
            goods_num = item.goods_num;

            return;
          }
        })

        if (isRepeat) {
          res2[idx].goods_num = res2[idx].goods_num + goods_num;
          res2[idx].cart_id = res2[idx].cart_id + ',' + cart_id;
        } else {
          res2.push(item)
        }
      } else {
        res2.push(item)
      }

    })
  }
  return res2;
}