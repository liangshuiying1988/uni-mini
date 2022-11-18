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