<template>
	<view class="content">
		<view class="navbar">
			<view 
				v-for="(item, index) in navList" :key="index" 
				class="nav-item" 
				:class="{current: tabCurrentIndex === index}"
				@click="tabClick(index)"
			>
				{{item.text}}
			</view>
		</view>

		<swiper :current="tabCurrentIndex" class="swiper-box" duration="300" @change="changeTab">
			<swiper-item class="tab-content" v-for="(tabItem,tabIndex) in navList" :key="tabIndex">
				<scroll-view 
					class="list-scroll-content" 
					scroll-y
				>
					<!-- 空白页 -->
					<empty emptyWords="您还没有相关订单哦~" v-if="tabItem.loaded === true && tabItem.orderList.length === 0" />
					
					<!-- 订单列表 -->
					<view v-for="(item,index) in tabItem.orderList" :key="index" class="order-item">
						<view class="i-top b-b">
							<text class="time">{{item.time}}</text>
							<text class="state" :style="{color: item.stateTipColor}">{{item.stateTip}}</text>
						</view>
						
						<scroll-view v-if="item.goodsList.length > 1" class="goods-box" scroll-x>
							<view
								v-for="(goodsItem, goodsIndex) in item.goodsList" :key="goodsIndex"
								class="goods-item"
							>
								<image class="goods-img" :src="goodsItem.goods_thumb" mode="aspectFill" />
							</view>
						</scroll-view>
						<view v-if="item.goodsList.length === 1">
							<view 
								class="goods-box-single"
								v-for="(goodsItem, goodsIndex) in item.goodsList" :key="goodsIndex"
							>
								<image class="goods-img" :src="goodsItem.goods_thumb" mode="aspectFill" />
								<view class="right">
									<text class="title clamp">{{goodsItem.title}}</text>
									<text class="attr-box"> {{ goodsItem.color ? goodsItem.color : '' }} {{goodsItem.size}}</text>
									<text class="price">{{goodsItem.price}}</text>
								</view>
							</view>
						</view>
						<view class="price-box">
							<text class="num">共{{item.amount}} 件商品 实付款 {{item.total_fee}}</text>
						</view>
						<view class="action-box b-t" v-if="item.status === 9">
							<button class="action-btn" @click="deleteOrder(item)">删除订单</button>
						</view>
						<view class="action-box b-t" v-else-if="item.status !== 5">
							<button class="action-btn" @click="cancelOrder(item)">取消订单</button>
						</view>
					</view>

					<uni-load-more :status="tabItem.loadingType" />
				</scroll-view>
			</swiper-item>
		</swiper>
	</view>
</template> 

<script>
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import empty from "@/components/empty";
	const db = uniCloud.database();
	const dbName = 'order';
	export default {
		components: {
			uniLoadMore,
			empty
		},
		data() {
			return {
				tabCurrentIndex: 0,
				navList: [{
						state: 0,
						text: '全部订单',
						loadingType: 'more',
						orderList: []
					},
					{
						state: 1,
						text: '待付款',
						loadingType: 'more',
						orderList: []
					},
					{
						state: 2,
						text: '待发货',
						loadingType: 'more',
						orderList: []
					},
					{
						state: 3,
						text: '待收货',
						loadingType: 'more',
						orderList: []
					},
					{
						state: 4,
						text: '售后/退款',
						loadingType: 'more',
						orderList: []
					}
				],
			};
		},
		
		onLoad(options){
			/**
			 * 修复app端点击除全部订单外的按钮进入时不加载数据的问题
			 * 替换onLoad下代码即可
			 */
			this.tabCurrentIndex = +options.state;
			// #ifndef MP
			this.loadData()
			// #endif
			// #ifdef MP
			if(options.state == 0){
				this.loadData()
			}
			// #endif
			
		},
		 
		methods: {
			//获取订单列表
			loadData(source){
				//这里是将订单挂载到tab列表下
				let index = this.tabCurrentIndex;
				let navItem = this.navList[index];
				let state = navItem.state;

				console.log('source========',source,navItem)
				if(source === 'tabChange' && navItem.loaded === true){
					//tab切换只有第一次需要加载数据
					return;
				}
				if(navItem.loadingType === 'loading'){
					//防止重复加载
					return;
				}
				
				navItem.loadingType = 'loading';
				
				setTimeout(() => {
					uni.showLoading({
						mask: true
					})
					uniCloud.callFunction({
						name: 'get-order-detail',
						data: {
							state
						}
					}).then((res) => {
						uni.hideLoading()
						let orderList = res.result;
						// console.log('orderList==========', orderList)
						if (orderList.length) {
							orderList.length && orderList.filter(item => {
								//添加不同状态下订单的表现形式
								item = Object.assign(item, this.orderStateExp(item.status));
								//演示数据所以自己进行状态筛选
								if (state === 0) {
									//0为全部订单
									return item;
								}
								return item.state === state
							});
							if (source === 'refresh') {
								console.log('refresh')
								navItem.orderList = [];
							}
							
							orderList.forEach(item => {
								navItem.orderList.push(item);
							})
							// console.log('navItem===========',navItem.orderList)
							//loaded新字段用于表示数据加载完毕，如果为空可以显示空白页
							this.$set(navItem, 'loaded', true);
							navItem.loadingType = 'noMore';
						} else {
							this.navList[index].orderList = []
							navItem.loadingType = 'noMore';
							this.$set(navItem, 'loaded', true);
						}
					}).catch((err) => {
						console.log(err);
						uni.hideLoading()
						uni.showModal({
							content: err.message || '获取商品失败',
							showCancel: false
						})
					})
				}, 500);	
			}, 

			//swiper 切换
			changeTab(e){
				// this.tabCurrentIndex = e.target.current;
				this.loadData('tabChange');
			},
			//顶部tab点击
			tabClick(index) {
				this.tabCurrentIndex = index;
			},
			//删除订单
			async deleteOrder(item){
				uni.showLoading({
					mask: true
				})
				let res = await db.collection(dbName).doc(item._id).remove();
				if (res.result && res.result.code === 0) {
					this.loadData('refresh');
				}
			},
			//取消订单
			async cancelOrder(item) {
				uni.showLoading({
					mask: true
				})
				let res = await db.collection(dbName).doc(item._id).update({ status: 9 });
				if (res.result && res.result.code === 0) {
					this.loadData('refresh');
				}
			},

			//订单状态文字和颜色
			orderStateExp(state){
				let stateTip = '',
					stateTipColor = '#fa436a';
				switch(+state){
					case 1:
						stateTip = '待付款'; break;
					case 2:
						stateTip = '待发货'; break;
					case 9:
						stateTip = '订单已关闭'; 
						stateTipColor = '#909399';
						break;
						
					//更多自定义
				}
				return {stateTip, stateTipColor};
			}
		},
	}
</script>

<style lang="scss">
	page, .content{
		background: $page-color-base;
		height: 100%;
	}
	
	.swiper-box{
		height: calc(100% - 40px);
	}
	.list-scroll-content{
		height: 100%;
	}
	
	.navbar{
		display: flex;
		height: 40px;
		padding: 0 5px;
		background: #fff;
		box-shadow: 0 1px 5px rgba(0,0,0,.06);
		position: relative;
		z-index: 10;
		.nav-item{
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			font-size: 15px;
			color: $font-color-dark;
			position: relative;
			&.current{
				color: $base-color;
				&:after{
					content: '';
					position: absolute;
					left: 50%;
					bottom: 0;
					transform: translateX(-50%);
					width: 44px;
					height: 0;
					border-bottom: 2px solid $base-color;
				}
			}
		}
	}

	.uni-swiper-item{
		height: auto;
	}
	.order-item{
		display: flex;
		flex-direction: column;
		padding-left: 30rpx;
		background: #fff;
		margin-top: 16rpx;
		.i-top{
			display: flex;
			align-items: center;
			height: 80rpx;
			padding-right:30rpx;
			font-size: $uni-font-size-base;
			color: $font-color-dark;
			position: relative;
			.time{
				flex: 1;
			}
			.state{
				color: $base-color;
			}
			.del-btn{
				padding: 10rpx 0 10rpx 36rpx;
				font-size: $uni-font-size-lg;
				color: $font-color-light;
				position: relative;
				&:after{
					content: '';
					width: 0;
					height: 30rpx;
					border-left: 1px solid $border-color-dark;
					position: absolute;
					left: 20rpx;
					top: 50%;
					transform: translateY(-50%);
				}
			}
		}
		/* 多条商品 */
		.goods-box{
			height: 160rpx;
			padding: 20rpx 0;
			white-space: nowrap;
			.goods-item{
				width: 120rpx;
				height: 120rpx;
				display: inline-block;
				margin-right: 24rpx;
			}
			.goods-img{
				display: block;
				width: 100%;
				height: 100%;
			}
		}
		/* 单条商品 */
		.goods-box-single{
			display: flex;
			padding: 20rpx 0;
			.goods-img{
				display: block;
				width: 120rpx;
				height: 120rpx;
			}
			.right{
				flex: 1;
				display: flex;
				flex-direction: column;
				padding: 0 30rpx 0 24rpx;
				overflow: hidden;
				.title{
					font-size: $uni-font-size-base + 2rpx;
					color: $font-color-dark;
					line-height: 1;
					overflow: hidden;//溢出隐藏
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				.attr-box{
					font-size: $uni-font-size-sm + 2rpx;
					color: $font-color-light;
					padding: 10rpx 12rpx;
				}
				.price{
					font-size: $uni-font-size-base + 2rpx;
					color: $font-color-dark;
					&:before{
						content: '￥';
						font-size: $uni-font-size-sm;
						margin: 0 2rpx 0 8rpx;
					}
				}
			}
		}
		
		.price-box{
			display: flex;
			justify-content: flex-end;
			align-items: baseline;
			padding: 20rpx 30rpx;
			font-size: $uni-font-size-sm + 2rpx;
			color: $font-color-light;
			.num{
				margin: 0 8rpx;
				color: $font-color-dark;
			}
			.price{
				font-size: $uni-font-size-lg;
				color: $font-color-dark;
				&:before{
					content: '￥';
					font-size: $uni-font-size-sm;
					margin: 0 2rpx 0 8rpx;
				}
			}
		}
		.action-box{
			display: flex;
			justify-content: flex-end;
			align-items: center;
			height: 100rpx;
			position: relative;
			padding-right: 30rpx;
		}
		.action-btn{
			width: 160rpx;
			height: 60rpx;
			margin: 0;
			margin-left: 24rpx;
			padding: 0;
			text-align: center;
			line-height: 60rpx;
			font-size: $uni-font-size-sm + 2rpx;
			color: $font-color-dark;
			background: #fff;
			border-radius: 100px;
			&:after{
				border-radius: 100px;
			}
			&.recom{
				background: #fff9f9;
				color: $base-color;
				&:after{
					border-color: #f7bcc8;
				}
			}
		}
	}
	
	
	/* load-more */
	.uni-load-more {
		display: flex;
		flex-direction: row;
		height: 80rpx;
		align-items: center;
		justify-content: center
	}
	
	.uni-load-more__text {
		font-size: 28rpx;
		color: #999
	}
	
	.uni-load-more__img {
		height: 24px;
		width: 24px;
		margin-right: 10px
	}
	
	.uni-load-more__img>view {
		position: absolute
	}
	
	.uni-load-more__img>view view {
		width: 6px;
		height: 2px;
		border-top-left-radius: 1px;
		border-bottom-left-radius: 1px;
		background: #999;
		position: absolute;
		opacity: .2;
		transform-origin: 50%;
		animation: load 1.56s ease infinite
	}
	
	.uni-load-more__img>view view:nth-child(1) {
		transform: rotate(90deg);
		top: 2px;
		left: 9px
	}
	
	.uni-load-more__img>view view:nth-child(2) {
		transform: rotate(180deg);
		top: 11px;
		right: 0
	}
	
	.uni-load-more__img>view view:nth-child(3) {
		transform: rotate(270deg);
		bottom: 2px;
		left: 9px
	}
	
	.uni-load-more__img>view view:nth-child(4) {
		top: 11px;
		left: 0
	}
	
	.load1,
	.load2,
	.load3 {
		height: 24px;
		width: 24px
	}
	
	.load2 {
		transform: rotate(30deg)
	}
	
	.load3 {
		transform: rotate(60deg)
	}
	
	.load1 view:nth-child(1) {
		animation-delay: 0s
	}
	
	.load2 view:nth-child(1) {
		animation-delay: .13s
	}
	
	.load3 view:nth-child(1) {
		animation-delay: .26s
	}
	
	.load1 view:nth-child(2) {
		animation-delay: .39s
	}
	
	.load2 view:nth-child(2) {
		animation-delay: .52s
	}
	
	.load3 view:nth-child(2) {
		animation-delay: .65s
	}
	
	.load1 view:nth-child(3) {
		animation-delay: .78s
	}
	
	.load2 view:nth-child(3) {
		animation-delay: .91s
	}
	
	.load3 view:nth-child(3) {
		animation-delay: 1.04s
	}
	
	.load1 view:nth-child(4) {
		animation-delay: 1.17s
	}
	
	.load2 view:nth-child(4) {
		animation-delay: 1.3s
	}
	
	.load3 view:nth-child(4) {
		animation-delay: 1.43s
	}
	
	@-webkit-keyframes load {
		0% {
			opacity: 1
		}
	
		100% {
			opacity: .2
		}
	}
</style>
