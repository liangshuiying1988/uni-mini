<template>
	<view class="container">
		<!-- 轮播图 -->
		<view class="carousel">
			<swiper indicator-dots circular=true duration="500" autoplay=true>
				<swiper-item class="swiper-item" v-for="(item,index) in imgList" :key="index">
					<view class="image-wrapper">
						<image
							:src="item" 
							class="loaded" 
							mode="aspectFill"
						></image>
					</view>
				</swiper-item>
			</swiper>
		</view>
		
		<view class="introduce-section">
			<text class="title">{{name}}</text>
			<view class="price-box">
				<text class="price-tip">¥</text>
				<text class="price">{{specSelected.price}}</text>
			</view>
		</view>
		
		<!-- 购买类型+促销活动 -->
		<view class="c-list">
			<view class="c-row b-b" @click="toggleSpec">
				<text class="tit">购买类型</text>
				<view class="con">
					<text class="selected-text">
						{{specSelected.size}}
						{{specSelected.color ? specSelected.color : ''}}
					</text>
				</view>
				<text class="iconfont icon-gengduo" />
			</view>
			<view class="c-row b-b">
				<text class="tit">促销活动</text>
				<view class="con-list">
					<text>新人首单送20元无门槛代金券</text>
					<text>订单满50减10</text>
					<text>订单满100减30</text>
					<text>单笔购买满两件免邮费</text>
				</view>
			</view>
			<view class="c-row b-b">
				<text class="tit">服务</text>
				<view class="bz-list con">
					<text>7天无理由退换货 ·</text>
					<text>假一赔十 ·</text>
				</view>
			</view>
		</view>
		
		<!-- 图文详情 -->
		<view class="detail-desc">
			<view class="d-header">
				<text>图文详情</text>
			</view>
			<rich-text :nodes="desc" />
		</view>
		
		<!-- 底部操作菜单 -->
		<view class="page-bottom">
			<navigator url="/pages/cart/cart" open-type="switchTab" class="p-b-btn">
				<text class="iconfont icon-gouwuche"></text>
				<text>购物车</text>
			</navigator>
			<view class="p-b-btn" :class="{active: favorite}" @click="toFavorite">
				<text class="iconfont" :class="favorite ? 'icon-shoucang' : 'icon-shoucang1'"></text>
				<text>{{favorite ? '已' : ''}}收藏</text>
			</view>
			
			<view class="action-btn-group">
				<button type="primary" class=" action-btn no-border buy-now-btn" @click="buy">立即购买</button>
				<button type="primary" class=" action-btn no-border add-cart-btn">加入购物车</button>
			</view>
		</view>
		
		<!-- 规格-模态层弹窗 -->
		<view 
			class="popup spec" 
			:class="specClass"
			@touchmove.stop.prevent="stopPrevent"
			@click="toggleSpec"
		>
			<!-- 遮罩层 -->
			<view class="mask"></view>
			<view class="jiesuan">
				<view class="layer attr-content" @click.stop="stopPrevent">
					<view class="a-t">
						<image :src="img"/>
						<view class="right">
							<text class="price">¥ {{specSelected.price}}</text>
							<text class="stock">库存：{{specSelected.num}}件</text>
							<view class="selected">
								已选：
								<text class="selected-text">
									{{specSelected.size}}
									{{specSelected.color ? specSelected.color : ''}}
								</text>
							</view>
						</view>
					</view>
					<view class="sku-box">
						<view class="attr-list">
							<text>{{specList.sizename}}</text>
							<view class="item-list">
								<text 
									v-for="(item, index) in specList.sizes" 
									:key="index" class="tit"
									:class="{selected: item.size === specSelected.size}"
									@click="selectSize(item.size,item.colors)"
								>
									{{item.size}}
								</text>
							</view>
							<!-- 普通商品有颜色、生鲜没有 -->
							<text v-if="specList.colorname">{{specList.colorname}}</text>
							<view class="item-list" v-if="specList.colorname">
								<text 
									v-for="(item) in selectedColor" 
									:key="item.id" class="tit"
									:class="{selected: item.color === specSelected.color}"
									@click="selectSpec(item)"
								>
									{{item.color}}
								</text>
							</view>
						</view>
					</view>
					<button class="btn" @click="toggleSpec">完成</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database();
const dbCollName = 'open-goods';
	export default{
		data() {
			return {
				specClass: 'none',
				specSelected: {}, // 选中的规格数据，尺码颜色等
				favorite: true,
				desc: '',
				name: '',
				img:'',
				imgList: [],
				selectedColor:[], // 选完尺寸后的颜色数据
				specList: {}// 所有可选的规格数据
			};
		},
		onReady() {
			let id = this.$page.options.id;
			this.getDetail(id);
			
		},
		methods: {
			changeData(list) {
				if (!list.length) return;
				let res = {},isordinary,sizes=[];
				
				list.map((item, idx) => { // 将一维数组改成二维数组
					if (idx === 0) {
						if (item.size && item.color) { // 普通商品
							isordinary = true
						} else { // 生鲜
							isordinary = false
						}
					}
					if (item.size) {
						let index = sizes.findIndex((itm) => { return itm.size === item.size })
						if (index === -1) { //没找到
							sizes.push({
								'size': item.size,
								'colors': [item]
							});
						} else {
							sizes[index].colors.push(item);
						}
					}
					res.sizes = sizes
					
				})
				if (isordinary === true) {
					res.sizename = '尺码'
					res.colorname = '颜色'
				} else {
					res.sizename = '规格'
				} 
				return res;
			},
			getDetail(id) {
				uni.showLoading({
					mask: true
				})
				db.collection(dbCollName).doc(id).field('goods_sku,name,_id,goods_thumb,goods_desc,goods_banner_imgs').get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						this.imgList = data.goods_banner_imgs;

						//详情内容处理
						let html = '<p>';
						data.goods_banner_imgs.forEach((val) => {
							html += "<img style ='width:100%' src=" + val + " />";
						})
						this.desc = html+'</p>'; 
						this.name = data.name;

						// 将goods_sku处理成页面想要的数据格式
						const specList = this.changeData(data.goods_sku);
						this.img = data.goods_thumb;
						this.specList = specList;
						this.selectedColor = specList.sizes[0].colors;
						this.specSelected = this.selectedColor[0];
						console.log('selectedColor==========',this.selectedColor)
					}
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			},
			//规格弹窗开关
			toggleSpec() {
				if(this.specClass === 'show'){
					this.specClass = 'hide';
					setTimeout(() => {
						this.specClass = 'none';
					}, 250);
				}else if(this.specClass === 'none'){
					this.specClass = 'show';
				}
			},
			//选择尺寸
			selectSize(size,colors) {
				this.specSelected.size = size
				this.selectedColor = colors
				this.specSelected = colors[0]
			},
			//选择颜色
			selectSpec(item) {
				this.specSelected = item
			},
			//收藏
			toFavorite(){
				this.favorite = !this.favorite;
			},
			buy(){
				uni.navigateTo({
					url: `/pages/order/createOrder`
				})
			},
			stopPrevent(){}
		},

	}
</script>

<style lang='scss'>
	page{
		background: $page-color-base;
		padding-bottom: 160rpx;
	}
	.icon-gengduo{
		font-size: $uni-font-size-sm + 2rpx;
		color: #888;
	}

	.iconfont{
		font-size: 40rpx;
		line-height: 48rpx;
		color: $font-color-light;
	}

	.carousel {
		height: 500rpx;
		position:relative;
		swiper{
			height: 100%;
		}
		.image-wrapper{
			width: 100%;
			height: 100%;
		}
		.swiper-item {
			display: flex;
			justify-content: center;
			align-content: center;
			height: 500rpx;
			overflow: hidden;
			image {
				width: 100%;
				height: 100%;
			}
		}
		
	}
	
	/* 标题简介 */
	.introduce-section{
		background: #fff;
		padding: 20rpx 30rpx;
		
		.title{
			font-size: 32rpx;
			color: $font-color-dark;
			height: 50rpx;
			line-height: 50rpx;
		}
		.price-box{
			display:flex;
			align-items:baseline;
			height: 64rpx;
			padding: 10rpx 0;
			font-size: 26rpx;
			color:$uni-color-primary;
		}
		.price{
			font-size: $uni-font-size-lg + 2rpx;
		}
		.m-price{
			margin:0 12rpx;
			color: $font-color-light;
			text-decoration: line-through;
		}
		.coupon-tip{
			align-items: center;
			padding: 4rpx 10rpx;
			background: $uni-color-primary;
			font-size: $uni-font-size-sm;
			color: #fff;
			border-radius: 6rpx;
			line-height: 1;
			transform: translateY(-4rpx); 
		}
		.bot-row{
			display:flex;
			align-items:center;
			height: 50rpx;
			font-size: $uni-font-size-sm;
			color: $font-color-light;
			text{
				flex: 1;
			}
		}
	}
	
	/* 购买类型+促销活动 */
	.c-list{
		font-size: $uni-font-size-sm;
		color: $font-color-base;
		background: #fff;
		.c-row{
			display:flex;
			align-items:center;
			padding: 20rpx 30rpx;
			position:relative;
		}
		.tit{
			width: 140rpx;
		}
		.con{
			flex: 1;
			color: $font-color-dark;
			.selected-text{
				margin-right: 10rpx;
			}
		}
		.bz-list{
			height: 40rpx;
			font-size: $uni-font-size-sm;
			color: $font-color-dark;
			text{
				display: inline-block;
				margin-right: 30rpx;
			}
		}
		.con-list{
			flex: 1;
			display:flex;
			flex-direction: column;
			color: $font-color-dark;
			line-height: 40rpx;
		}
		.red{
			color: $uni-color-primary;
		}
	}

	/*  详情 */
	.detail-desc{
		background: #fff;
		margin-top: 16rpx;
		.d-header{
			display: flex;
			justify-content: center;
			align-items: center;
			height: 80rpx;
			font-size: $uni-font-size-sm + 2rpx;
			color: $font-color-dark;
			position: relative;
				
			text{
				padding: 0 20rpx;
				background: #fff;
				position: relative;
				z-index: 1;
			}
			&:after{
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translateX(-50%);
				width: 300rpx;
				height: 0;
				content: '';
				border-bottom: 1px solid #ccc; 
			}
		}
	}
	
	/* 规格选择弹窗 */
	.attr-content{
		padding: 10rpx 30rpx;
		.a-t{
			display: flex;
			image{
				width: 170rpx;
				height: 170rpx;
				flex-shrink: 0;
				margin-top: -40rpx;
				border-radius: 8rpx;;
			}
			.right{
				display: flex;
				flex-direction: column;
				padding-left: 24rpx;
				font-size: $uni-font-size-sm + 2rpx;
				color: $font-color-base;
				line-height: 42rpx;
				.price{
					font-size: $uni-font-size-lg;
					color: $uni-color-primary;
					margin-bottom: 10rpx;
				}
				.selected-text{
					margin-right: 10rpx;
				}
			}
		}
		.sku-box{
			display: block;
		}
		.attr-list{
			display: flex;
			flex-direction: column;
			font-size: $uni-font-size-sm + 2rpx;
			color: $font-color-base;
			padding-top: 30rpx;
			padding-left: 10rpx;
		}
		.item-list{
			padding: 20rpx 0 0;
			display: flex;
			flex-wrap: wrap;
			text{
				display: flex;
				align-items: center;
				justify-content: center;
				background: #eee;
				margin-right: 20rpx;
				margin-bottom: 20rpx;
				border-radius: 100rpx;
				min-width: 60rpx;
				height: 60rpx;
				padding: 0 20rpx;
				font-size: $uni-font-size-sm;
				color: $font-color-dark;
			}
			.selected{
				background: #fbebee;
				color: $uni-color-primary;
			}
		}
	}
	
	/*  弹出层 */
	.popup {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 99;
		
		&.show {
			display: block;
			.mask{
				animation: showPopup 0.2s linear both;
			}
			.layer {
				animation: showLayer 0.2s linear both;
			}
		}
		&.hide {
			.mask{
				animation: hidePopup 0.2s linear both;
			}
			.layer {
				animation: hideLayer 0.2s linear both;
			}
		}
		&.none {
			display: none;
		}
		.mask{
			position: fixed;
			top: 0;
			width: 100%;
			height: 100%;
			z-index: 1;
			background-color: rgba(0, 0, 0, 0.4);
		}

		.jiesuan{
			position:fixed;
			bottom:0;
			z-index: 99;
			width: 100%;
			min-height: 300rpx;
			background: rgb(255,255,255,);
		}
		.layer {
			margin: 0 30rpx;
			padding: 20rpx 30rpx;
			border-radius: 16rpx;
			.btn{
				height: 66rpx;
				line-height: 66rpx;
				border-radius: 100rpx;
				background: $uni-color-primary;
				font-size: $uni-font-size-sm;
				color: #fff;
				margin: 30rpx 0 20rpx;
				
			}
		}
		@keyframes showPopup {
			0% {
				opacity: 0;
			}
			100% {
				opacity: 1;
			}
		}
		@keyframes hidePopup {
			0% {
				opacity: 1;
			}
			100% {
				opacity: 0;
			}
		}
		@keyframes showLayer {
			0% {
				transform: translateY(120%);
			}
			100% {
				transform: translateY(0%);
			}
		}
		@keyframes hideLayer {
			0% {
				transform: translateY(0);
			}
			100% {
				transform: translateY(120%);
			}
		}
	}
	
	/* 底部操作菜单 */
	.page-bottom{
		position:fixed;
		left: 2%;
		bottom:20rpx;
		z-index: 95;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 96%;
		height: 100rpx;
		background: rgba(255,255,255,.9);
		box-shadow: 0 0 20rpx 0 rgba(0,0,0,.5);
		border-radius: 16rpx;
		
		.p-b-btn{
			display:flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			font-size: $uni-font-size-sm + 4rpx;
			color: $font-color-base;
			margin-right: 20rpx;
			width: 110rpx;
			height: 80rpx;
			&.active, &.active .iconfont{
				color: $uni-color-primary;
			}
		}
		.action-btn-group{
			display: flex;
			height: 76rpx;
			border-radius: 100px;
			overflow: hidden;
			box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);
			background: linear-gradient(to right, #ffac30,#fa436a,#F56C6C);
			margin-left: 20rpx;
			position:relative;
			&:after{
				content: '';
				position:absolute;
				top: 50%;
				right: 50%;
				transform: translateY(-50%);
				height: 28rpx;
				width: 0;
				border-right: 1px solid rgba(255,255,255,.5);
			}
			.action-btn{
				display:flex;
				align-items: center;
				justify-content: center;
				width: 200rpx;
				height: 100%;
				font-size: $uni-font-size-sm ;
				padding: 0;
				border-radius: 0;
				background: transparent;
			}
		}
	}
</style>
