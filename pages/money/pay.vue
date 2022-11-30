<template>
	<view class="app">
		<view class="price-box">
			<text>支付金额</text>
			<text class="price">{{total}}</text>
		</view>

		<view class="pay-type-list">

			<view class="type-item" @click="changePayType(1)">
				<text class="iconfont icon-weixinzhifu"></text>
				<view class="con">
					<text class="tit">微信支付</text>
					<text>推荐使用微信支付</text>
				</view>
				<label class="radio">
					<radio value="" color="#fa436a" :checked='payType == 1' />
				</label>
			</view>
			<view class="type-item" @click="changePayType(2)">
				<text class="iconfont icon-zhifubao"></text>
				<view class="con">
					<text class="tit">支付宝支付</text>
				</view>
				<label class="radio">
					<radio value="" color="#fa436a" :checked='payType == 2' />
				</label>
			</view>
		</view>
		<!-- #ifndef H5 -->
    <button v-if="status !== 2" type="primary" @click="pay">支付</button>
    <!-- #endif -->
    <!-- #ifdef H5 -->
    <button v-if="!codeUrl && status !== 2" type="primary" @click="pay">获取支付二维码</button>
    <template v-if="codeUrl && status !== 2">
      <canvas canvas-id="qrcode" style="width: 300px;height: 300px;" />
      <button type="primary" @click="orderQuery">我已完成支付</button>
    </template>
    <!-- #endif -->
	</view>
</template>

<script>
	const db = uniCloud.database();
	const dbname = 'order';
	export default {
		data() {
			return {
				payType: 1,
				id: null,
				total:0,
				orderInfo: {}
			};
		},
		onReady() {
			this.id = this.$page.options.id;
			this.loadList();
		},
		methods: {
			loadList() {
				uni.showLoading({
					mask: true
				})
				let a = '_id =="' + this.id+'"';
				db.collection(dbname).where(a).field('total_fee,pay_type').get().then((res) => {
					const data = res.result.data[0]
					this.payType = data.pay_type;
					this.total = data.total_fee;
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
				
			},
			//选择支付方式
			changePayType(type) {
				this.payType = type;
				let selectedProvider = '';
				if (type === 1) {//微信支付
					selectedProvider = 'wxpay'
				}
				if (type === 2) {//支付宝支付
					selectedProvider = 'alipay'
				} 
				this.selectedProvider = selectedProvider;
				
			},
			// #ifdef H5
			pay() {
        uniCloud.callFunction({
					name: 'pay',
					data: {
						provider:this.selectedProvider,
						outTradeNo: this.outTradeNo
					}
				}).then((res) => {
				console.log(res);
				this.codeUrl = res.result.orderInfo.codeUrl
				return uQRCode.make({
					canvasId: 'qrcode',
					componentInstance: this,
					text: this.codeUrl,
					size: 300,
					margin: 10,
					backgroundColor: '#ffffff',
					foregroundColor: '#000000',
					fileType: 'jpg',
					correctLevel: uQRCode.errorCorrectLevel.H
				})
        }).catch((err) => {
          uni.showModal({
            content: err.message || '获取支付二维码失败',
            showCancel: false
          })
        })
      },
      orderQuery() {
        uniCloud.callFunction({
          name: 'order-query',
          data: {
            outTradeNo: this.outTradeNo
          }
        }).then((res) => {
          if (res.result.orderPaid) {
            this.status = 2
            uni.showModal({
              content: '订单已支付',
              showCancel: false
						})
						uni.redirectTo({
							url: '/pages/money/paySuccess'
						})
          } else {
            uni.showModal({
              content: '订单未支付',
              showCancel: false
            })
          }
        }).catch((e) => {
          uni.showModal({
            content: '查询订单状态失败，请稍后再试',
            showCancel: false
          })
        })
      },
      // #endif
      // #ifndef H5
      pay() {
        uniCloud.callFunction({
					name: 'pay',
					data: {
						provider:this.selectedProvider,
						outTradeNo: this.outTradeNo
					}
				}).then((res) => {
					console.log(res);
					if (res.result.orderInfo) {
						return new Promise((resolve) => {
							uni.requestPayment({
								// #ifdef APP-PLUS
								provider: selectedProvider,
								// #endif
								// #ifdef MP-WEIXIN
								...res.result.orderInfo,
								// #endif
								// #ifdef APP-PLUS || MP-ALIPAY
								orderInfo: res.result.orderInfo,
								// #endif
								complete() {
									resolve(res.result.outTradeNo)
								}
							})
						})
					} else {
						throw new Error(res.result.msg)
					}
        }).then((outTradeNo) => {
          return uniCloud.callFunction({
            name: 'order-query',
            data: {
              outTradeNo
            }
          })
        }).then((res) => {
          if (res.result.orderPaid) {
            this.status = 2
            uni.showModal({
              content: '订单已支付',
              showCancel: false
						})
						uni.redirectTo({
							url: '/pages/money/paySuccess'
						})
          } else {
            uni.showModal({
              content: '订单未支付',
              showCancel: false
            })
          }
        }).catch((err) => {
          uni.showModal({
            content: err.message || '支付失败',
            showCancel: false
          })
        })

      },
      // #endif
		}
	}
</script>

<style lang='scss'>
	.app {
		width: 100%;
	}

	.price-box {
		background-color: #fff;
		height: 265rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		font-size: 28rpx;
		color: #909399;

		.price{
			font-size: 50rpx;
			color: #303133;
			margin-top: 12rpx;
			&:before{
				content: '￥';
				font-size: 40rpx;
			}
		}
	}

	.pay-type-list {
		margin-top: 20rpx;
		background-color: #fff;
		padding-left: 60rpx;
		
		.type-item{
			height: 120rpx;
			padding: 20rpx 0;
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-right: 60rpx;
			font-size: 30rpx;
			position:relative;
		}

		.icon-weixinzhifu {
			color: #36cb59;
			font-size: 60rpx;
			width: 80rpx;
		}
		.icon-zhifubao {
			color: #01aaef;
			font-size: 46rpx;
			width: 70rpx;
		}

		.tit{
			font-size: $uni-font-size-lg;
			color: $font-color-dark;
			margin-bottom: 4rpx;
		}
		.con{
			flex: 1;
			display: flex;
			flex-direction: column;
			font-size: $uni-font-size-sm;
			color: $font-color-light;
		}
	}
	.mix-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 630rpx;
		height: 80rpx;
		margin: 80rpx auto 30rpx;
		font-size: $uni-font-size-lg;
		color: #fff;
		background-color: $base-color;
		border-radius: 10rpx;
		box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);
	}

</style>
