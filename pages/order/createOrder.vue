<template>
	<view>
		<!-- 地址 -->
		<navigator url="/pages/address/address?source=1" class="address-section">
			<view class="order-content">
				<text class="yticon icon-shouhuodizhi"></text>
				<view class="cen">
					<view class="top">
						<text class="name">{{addressData.name}}</text>
						<text class="mobile">{{addressData.mobile}}</text>
					</view>
					<text class="address els">{{addressData.address}} {{addressData.area}} {{addressData.addressName}}</text>
				</view>
				<text class="yticon icon-you"></text>
			</view>
		</navigator>

		<view class="goods-section">
			<!-- 商品列表 -->
			<view v-for="item in orderList"  class="g-item" :key="item._id">
				<image :src="item.image" />
				<view class="right">
					<text class="title clamp els">{{item.name}}</text>
					<text class="spec">{{item.size}} {{item.color}} {{item.goods_num}}件</text>
					<view class="price-box">
						<text class="price">￥{{item.price}}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 优惠明细 -->
		<view class="yt-list">
			<view class="yt-list-cell b-b" @click="toggleMask('show')">
				<view class="cell-icon">
					券
				</view>
				<text class="cell-tit clamp">优惠券</text>
				<text class="cell-tip active">
					
					{{selectedCou.id ? ("减"+selectedCou.price+"元") : '选择优惠券'}}
				</text>
				<text class="cell-more wanjia wanjia-gengduo-d"></text>
			</view>
			<view class="yt-list-cell b-b">
				<view class="cell-icon hb">
					减
				</view>
				<text class="cell-tit clamp">商家促销</text>
				<text class="cell-tip disabled">暂无可用优惠</text>
			</view>
		</view>
		<!-- 金额明细 -->
		<view class="yt-list">
			<view class="yt-list-cell b-b">
				<text class="cell-tit clamp">商品金额</text>
				<text class="cell-tip">￥{{total}}</text>
			</view>
			<view class="yt-list-cell b-b">
				<text class="cell-tit clamp">优惠金额</text>
				<text class="cell-tip red">-￥{{selectedCou.id ? selectedCou.price :'0'}}</text>
			</view>
			<view class="yt-list-cell b-b">
				<text class="cell-tit clamp">运费</text>
				<text class="cell-tip">免运费</text>
			</view>
			<view class="yt-list-cell desc-cell">
				<text class="cell-tit clamp">备注</text>
				<input class="desc" type="text" v-model="desc" placeholder="请填写备注信息" placeholder-class="placeholder" />
			</view>
		</view>
		
		<!-- 底部 -->
		<view class="footer">
			<view class="price-content">
				<text>实付款</text>
				<text class="price-tip">￥</text>
				<text class="price">{{tealTotal}}</text>
			</view>
			<text class="submit" @click="submit">去付款</text>
		</view>
		
		<!-- 优惠券面板 -->
		<view class="mask" :class="maskState===0 ? 'none' : maskState===1 ? 'show' : ''" @click="toggleMask">
			<view class="mask-content" @click.stop.prevent="stopPrevent">
				<!-- 优惠券页面 -->
				<view class="coupon-item" v-for="item in couponList" :key="item.id" 
				@click="selCoupon(item)" :class="item.id === selectedCou.id ? 'active': ''">
					<view class="con">
						<view class="left">
							<text class="title">{{item.title}}</text>
							<text class="time">有效期至2019-06-30</text>
						</view>
						<view class="right">
							<text class="price">{{item.price}}</text>
							<text>满30可用</text>
						</view>
						
						<view class="circle l"></view>
						<view class="circle r"></view>
					</view>
					<text class="tips">限新用户使用</text>
				</view>
			</view>
		</view>
	</view>
</template>
<script>
	import { store } from '@/uni_modules/uni-id-pages/common/store.js'
	const db = uniCloud.database();
	const dbCollName = 'order';
	const dbCartName = 'open-cart';
	export default {
		data() {
			return {
				maskState: 0, //优惠券面板显示状态
				desc: '', //备注
				payType: 1, //1微信 2支付宝
				couponList: [
					{
						title: '新用户专享优惠券',
						price: 5,
						id:11
					},
					{
						title: '庆五一发一波优惠券',
						price: 10,
						id:21
					},
					{
						title: '优惠券优惠券优惠券优惠券',
						price: 15,
						id:31
					}
				],
				addressData: {
					name: '梁水英',
					mobile: '1348094****',
					addressName: '西二坊14号202',
					address: '广东省深圳市南山区沙河街道',
					area: '白石洲',
					default: true,
				},
				orderList: [],
				total: 0, //总价，未减去优惠券的价格
				tealTotal: 0, //实付金额
				selectedCou: {}
			}
		},
		onReady(){
			this.orderList = uni.getStorageSync('CARTLIST')
			this.calcTotal()
			console.log('this.orderList=========',this.orderList)
		},
		methods: {
			//显示优惠券面板
			toggleMask(type){
				let timer = type === 'show' ? 10 : 300;
				let	state = type === 'show' ? 1 : 0;
				this.maskState = 2;
				setTimeout(()=>{
					this.maskState = state;
				}, timer)
			},
			//选择优惠券
			selCoupon(item) {
				this.selectedCou = item;
				this.calcTotal();
			},
			numberChange(data) {
				this.number = data.number;
			},
			changePayType(type){
				this.payType = type;
			},
			// 提交订单详细信息到数据库，状态为未支付，还需将cart表里的对应商品删除，然后跳转到支付页
			async submit() {
				uni.showLoading({
					mask: true
				})
				let goodsInOrder = [], cart_id = '';
				// console.log('this.orderList=========', this.orderList)
				this.orderList.map((item) => {
					cart_id += item.cart_id;
					goodsInOrder.push({ id: item.goods_id, sku_id: item.sku_id, amount: item.goods_num })
				});
				

				let pars = {
					user_id: store.userInfo._id,
					pay_type: this.payType,
					total_fee: this.tealTotal,
					status: 1,
					info: JSON.stringify(this.addressData),
					goodsInOrder: goodsInOrder,
					create_time:Date.now()
				};

				let res = await db.collection(dbCollName).add(pars); 
				//新增订单成功后，删除购物车数据，跳转到付款页面
				if (res.result && res.result.code === 0) {
					let idarr = cart_id.split(',');
					if (idarr.length > 1) { //有多个id
						const _ = db.command;
						await db.collection(dbCartName).where({ _id: _.in(idarr) }).remove();
					} else {
						await db.collection(dbCartName).doc(cart_id).remove();
					}
					uni.hideLoading();
					uni.redirectTo({
						url: '/pages/money/pay?id='+res.result.id
					})
				}
			},
			//计算总价、实付金额
			calcTotal(){
				let list = this.orderList;
				if(list.length === 0){
					this.empty = true;
					return;
				}
				let total = 0;
				list.forEach((item) =>{
					total += item.price * item.goods_num;
				})
				let tealTotal = this.selectedCou.price ?  (total - this.selectedCou.price) : total;
				this.total = Number(total.toFixed(2)); 
				this.tealTotal = Number(tealTotal.toFixed(2)); 
			},
			stopPrevent(){}
		}
	}
</script>

<style lang="scss">
	page {
		background: $page-color-base;
		padding-bottom: 100rpx;
	}

	.els{
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.address-section {
		padding: 30rpx 0;
		background: #fff;
		position: relative;

		.order-content {
			display: flex;
			align-items: center;
		}

		.icon-shouhuodizhi {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 90rpx;
			color: #888;
			font-size: 44rpx;
		}

		.cen {
			display: flex;
			flex-direction: column;
			flex: 1;
			font-size: 28rpx;
			color: $font-color-dark;
		}

		.name {
			font-size: 34rpx;
			margin-right: 24rpx;
		}

		.address {
			margin-top: 16rpx;
			margin-right: 20rpx;
			color: $font-color-light;

		}

		.icon-you {
			font-size: 32rpx;
			color: $font-color-light;
			margin-right: 30rpx;
		}

		.a-bg {
			position: absolute;
			left: 0;
			bottom: 0;
			display: block;
			width: 100%;
			height: 5rpx;
		}
	}

	.goods-section {
		margin-top: 16rpx;
		background: #fff;
		padding-bottom: 1px;

		.g-header {
			display: flex;
			align-items: center;
			height: 84rpx;
			padding: 0 30rpx;
			position: relative;
		}

		.logo {
			display: block;
			width: 50rpx;
			height: 50rpx;
			border-radius: 100px;
		}

		.name {
			font-size: 30rpx;
			color: $font-color-base;
			margin-left: 24rpx;
		}

		.g-item {
			display: flex;
			margin: 20rpx 30rpx;

			image {
				flex-shrink: 0;
				display: block;
				width: 140rpx;
				height: 140rpx;
				border-radius: 4rpx;
			}

			.right {
				flex: 1;
				padding-left: 24rpx;
				overflow: hidden;
			}

			.title {
				font-size: 30rpx;
				color: $font-color-dark;
			}

			.spec {
				font-size: 26rpx;
				color: $font-color-light;
			}

			.price-box {
				display: flex;
				align-items: center;
				font-size: 32rpx;
				color: $font-color-dark;
				padding-top: 10rpx;

				.price {
					margin-bottom: 4rpx;
					color:$uni-color-primary;
				}
				.number{
					font-size: 26rpx;
					color: $font-color-base;
					margin-left: 20rpx;
				}
			}

			.step-box {
				position: relative;
			}
		}
	}
	.yt-list {
		margin-top: 16rpx;
		background: #fff;
	}

	.yt-list-cell {
		display: flex;
		align-items: center;
		padding: 10rpx 30rpx 10rpx 40rpx;
		line-height: 70rpx;
		position: relative;

		&.cell-hover {
			background: #fafafa;
		}

		&.b-b:after {
			left: 30rpx;
		}

		.cell-icon {
			height: 32rpx;
			width: 32rpx;
			font-size: 22rpx;
			color: #fff;
			text-align: center;
			line-height: 32rpx;
			background: #f85e52;
			border-radius: 4rpx;
			margin-right: 12rpx;

			&.hb {
				background: #ffaa0e;
			}

			&.lpk {
				background: #3ab54a;
			}

		}

		.cell-more {
			align-self: center;
			font-size: 24rpx;
			color: $font-color-light;
			margin-left: 8rpx;
			margin-right: -10rpx;
		}

		.cell-tit {
			flex: 1;
			font-size: 26rpx;
			color: $font-color-light;
			margin-right: 10rpx;
		}

		.cell-tip {
			font-size: 26rpx;
			color: $font-color-dark;

			&.disabled {
				color: $font-color-light;
			}

			&.active {
				color: $base-color;
			}
			&.red{
				color: $base-color;
			}
		}

		&.desc-cell {
			.cell-tit {
				max-width: 90rpx;
			}
		}

		.desc {
			flex: 1;
			font-size: $uni-font-size-base;
			color: $font-color-dark;
		}
	}
	
	/* 支付列表 */
	.pay-list{
		padding-left: 40rpx;
		margin-top: 16rpx;
		background: #fff;
		.pay-item{
			display: flex;
			align-items: center;
			padding-right: 20rpx;
			line-height: 1;
			height: 110rpx;	
			position: relative;
		}
		.icon-weixinzhifu{
			width: 80rpx;
			font-size: 40rpx;
			color: #6BCC03;
		}
		.icon-alipay{
			width: 80rpx;
			font-size: 40rpx;
			color: #06B4FD;
		}
		.icon-xuanzhong2{
			display: flex;
			align-items: center;
			justify-content: center;
			width: 60rpx;
			height: 60rpx;
			font-size: 40rpx;
			color: $base-color;
		}
		.tit{
			font-size: 32rpx;
			color: $font-color-dark;
			flex: 1;
		}
	}
	
	.footer{
		position: fixed;
		left: 0;
		bottom: 0;
		z-index: 995;
		display: flex;
		align-items: center;
		width: 100%;
		height: 90rpx;
		justify-content: space-between;
		font-size: 30rpx;
		background-color: #fff;
		z-index: 998;
		color: $font-color-base;
		box-shadow: 0 -1px 5px rgba(0,0,0,.1);
		.price-content{
			padding-left: 30rpx;
		}
		.price-tip{
			color: $base-color;
			margin-left: 8rpx;
		}
		.price{
			font-size: 36rpx;
			color: $base-color;
		}
		.submit{
			display:flex;
			align-items:center;
			justify-content: center;
			width: 280rpx;
			height: 100%;
			color: #fff;
			font-size: 32rpx;
			background-color: $base-color;
		}
	}
	
	/* 优惠券面板 */
	.mask{
		display: flex;
		align-items: flex-end;
		position: fixed;
		left: 0;
		top: var(--window-top);
		bottom: 0;
		width: 100%;
		background: rgba(0,0,0,0);
		z-index: 9995;
		transition: .3s;
		
		.mask-content{
			width: 100%;
			min-height: 30vh;
			max-height: 70vh;
			background: #f3f3f3;
			transform: translateY(100%);
			transition: .3s;
			overflow-y:scroll;
		}
		&.none{
			display: none;
		}
		&.show{
			background: rgba(0,0,0,.4);
			
			.mask-content{
				transform: translateY(0);
			}
		}
		/* 优惠券列表 */
		.coupon-item{
			display: flex;
			flex-direction: column;
			margin: 20rpx 24rpx;
			background: #fff;
			.con{
				display: flex;
				align-items: center;
				position: relative;
				height: 120rpx;
				padding: 0 30rpx;
				&:after{
					position: absolute;
					left: 0;
					bottom: 0;
					content: '';
					width: 100%;
					height: 0;
					border-bottom: 1px dashed #f3f3f3;
					transform: scaleY(50%);
				}
			}
			.left{
				display: flex;
				flex-direction: column;
				justify-content: center;
				flex: 1;
				overflow: hidden;
				height: 100rpx;
			}
			.title{
				font-size: 32rpx;
				color: $font-color-dark;
				margin-bottom: 10rpx;
			}
			.time{
				font-size: 24rpx;
				color: $font-color-light;
			}
			.right{
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				font-size: 26rpx;
				color: $font-color-base;
				height: 100rpx;
			}
			.price{
				font-size: 44rpx;
				color: $base-color;
				&:before{
					content: '￥';
					font-size: 34rpx;
				}
			}
			.tips{
				font-size: 24rpx;
				color: $font-color-light;
				line-height: 60rpx;
				padding-left: 30rpx;
			}
			.circle{
				position: absolute;
				left: -12rpx;
				bottom: 15rpx;
				z-index: 10;
				width: 20rpx;
				height: 20rpx;
				background: #f3f3f3;
				border-radius: 100px;
				&.r{
					left: auto;
					right: -12rpx;
				}
			}
		}
		.active{
			border:1px solid $uni-color-primary;
			.circle{
				border:1px solid $uni-color-primary;
			}
		}
	}

	

</style>
