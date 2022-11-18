<template>
	<view class="index-pages">
		<!-- #ifndef H5 -->
		<status-bar />
		<!-- #endif -->

		<!-- 搜索功能 -->
		<view class="uni-search-box">
			<uni-search-bar v-model="keyword" ref="searchBar" radius="100" cancelButton="none" disabled
				placeholder="请输入搜索内容" />
			<view class="cover-search-bar" @click="searchClick"></view>
		</view>

		<!-- 头部轮播 -->
		<view class="carousel-section">
			<unicloud-db ref="bannerdb" v-slot:default="{data, loading}" collection="opendb-banner"
				field="img_url,open_url">
				<!-- 当无banner数据时显示占位图 -->
				<image v-if="!(loading||data.length)" class="banner-image" src="/static/banner/empty.jpeg" mode="aspectFill" :draggable="false" />
				<swiper v-else class="swiper-box" circular :indicator-dots="indicatorDots" :autoplay="autoplay" :interval="interval"
				:duration="duration">
					<swiper-item v-for="(item) in data" :key="item._id">
						<view class="uni-swiper-dot-box">
							<image class="banner-image" :src="item.img_url" mode="aspectFill" :draggable="false" @click="clickBannerItem(item)"/>
						</view>
					</swiper-item>
				</swiper>
			</unicloud-db>
		</view>

		<!-- 分类导航 -->
		<view>
			<unicloud-db ref="classify" v-slot:default="{data}" collection="classify"
				field="classify_name,img_url,open_url" class="cate-section">
				<view class="cate-item" v-for="(item) in data" :key="item.img_url">
					<image :src='item.img_url' />
					<text>{{item.classify_name}}</text>
				</view>
			</unicloud-db>
		</view>

		<!-- 热门推荐 -->
		<view class="f-header m-t">
			<text class="iconfont icon-huore hot" />
			<view class="tit-box">
				<text class="tit">热门推荐</text>
			</view>
			<text class="iconfont icon-gengduo more" />
		</view>
		<view class="guess-section">
			<view 
				v-for="(item, index) in goodsList" :key="index"
				class="guess-item"
				@click="navToDetailPage(item)"
			>
				<view class="image-wrapper">
					<image :src="item.goods_thumb" mode="aspectFill"></image>
				</view>
				<text class="title">{{item.name}}</text>
				<text class="price">￥{{item.minPrice}} 起</text>
			</view>
		</view>

	</view>
</template>

<script>
import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";

import Gps from '@/uni_modules/json-gps/js_sdk/gps.js';
const gps = new Gps(); //定位

export default {
	components: {
		statusBar
	},
	data() {
		return {
			keyword: "",
			indicatorDots: true,
			autoplay: true,
			interval: 2000,
			duration: 500,
			goodsList: []
		}
	},
	watch: {
	},
	onReady() {
		this.gtGoodList();
	},
	async onShow() {
		this.keyword = getApp().globalData.searchText
		getApp().globalData.searchText = ''
		//这里仅演示如何，在onShow生命周期获取设备位置，并在设备或者应用没有权限时自动引导。设置完毕自动重新获取。
		//你可以基于他做自己的业务，比如：根据距离由近到远排序列表数据等
		// uni.showLoading({
		// 	title:"获取定位中"
		// });
		//默认h5端不获取定位
		// #ifndef H5
		let location = await gps.getLocation({
			geocode: true
		})
		// console.log(location);
		// #endif
		// if(location){
		// 	uni.showToast({
		// 		title: JSON.stringify(location),
		// 		icon: 'none'
		// 	});
		// }
		// uni.hideLoading()
	},
	methods: {
		findLowerPrice(list) { // 找最低价
			let copyList = JSON.parse(JSON.stringify(list));
			if (list.length) {
				list.map((item,index) => {
					let minMun = 0;
					if (item.goods_sku.length) {
						item.goods_sku.map((i,idx) => {
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
		},
		async gtGoodList() {
			const res = await uniCloud.database().collection('open-goods')
				.field('goods_sku,name,_id,goods_thumb').get();
			const list = res.result.data;
			this.goodsList = this.findLowerPrice(list);
			console.log('goodsList=========',this.goodsList)
		},
		//详情页
		navToDetailPage(item) {
			let id = item._id;
			uni.navigateTo({
				url: `/pages/product/product?id=${id}`
			})
		},
		searchClick(e) { //点击搜索框
			uni.hideKeyboard();
			uni.navigateTo({
				url: '/pages/home/search/search',
				animationType: 'fade-in'
			});
		},
		/**
		 * 点击banner的处理
		 */
		clickBannerItem(item) {
			// 跳转url
			if (item.open_url) {
				uni.navigateTo({
					url: item.open_url
				});
			}
		}
	}
}
</script>

<style lang="scss">
.index-pages {
	background: #f5f5f5;
}

.carousel-section {
	margin-top: 20rpx;
	padding: 10rpx;
	border-radius: 10px;

	.banner-image {
		width: 100%;
		border-radius: 10px;
		height: 300rpx;
	}

	.swiper-box {
		width: 100%;
		
	}
}

.cate-section {
	display: flex;
  justify-content: space-around;
	padding: 30rpx 22rpx; 
	background: #fff;
	.cate-item {
		font-size: $uni-font-size-sm + 2rpx;
		color: $uni-text-color;
		display: flex;
    flex-direction: column;
    align-items: center;
		cursor: pointer;
	}
	image {
		width: 88rpx;
		height: 88rpx;
		margin-bottom: 14rpx;
		border-radius: 50%;
		box-shadow: 4rpx 4rpx 20rpx rgba(250, 67, 106, 0.3);
	}
}

.uni-search-box {
	background-color: #FFFFFF;
	position: sticky;
	height: 50px;
	top: 0;
	left: 0;
	/* #ifndef APP-PLUS */
	z-index: 9;
	/* #endif */
	/* #ifdef MP-WEIXIN */
	width: 580rpx;
	/* #endif */
}

.cover-search-bar {
	height: 50px;
	position: relative;
	top: -50px;
	margin-bottom: -50px;
	/* #ifndef APP-NVUE */
	z-index: 999;
	/* #endif */
}

.f-header{
	display:flex;
	flex-direction: row;
	height: 100rpx;
	padding: 30rpx 30rpx 8rpx;
	background: #fff;
	.hot{
		color:$uni-color-primary;
		font-size: $uni-img-size-base;
		font-weight: 700;
		line-height: $uni-img-size-lg - 2rpx;
		margin-right: 16rpx;
	}
	.tit-box{
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.tit,.more{
		font-size: $uni-img-size-base;
		color: $uni-text-color;
	}
}
.m-t{
	margin-top: 16rpx;
}

/* 猜你喜欢 */
.guess-section{
	display:flex;
	flex-wrap:wrap;
	padding: 0 30rpx;
	background: #fff;
	.guess-item{
		display:flex;
		flex-direction: column;
		width: 48%;
		padding-bottom: 40rpx;
		&:nth-child(2n+1){
			margin-right: 4%;
		}
	}
	.image-wrapper{
		width: 100%;
		height: 330rpx;
		border-radius: 20rpx;
		overflow: hidden;
		image{
			width: 100%;
			height: 100%;
			opacity: 1;
		}
	}
	.title{
		font-size: $uni-font-size-lg;
		color: $uni-text-color;
		line-height: $uni-font-size-lg + 40rpx;
		overflow: hidden;//溢出隐藏
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.price{
		font-size: $uni-font-size-lg;
		color: $uni-color-primary;
		line-height: 1;
		font-weight: 600;
	}
}
</style>
