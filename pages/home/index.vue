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
				field="img_url,open_url" @load="onqueryload">
				<!-- 当无banner数据时显示占位图 -->
				<image v-if="!(loading||data.length)" class="banner-image" src="/static/banner/empty.jpeg" mode="aspectFill" :draggable="false" />
				<swiper v-else class="swiper-box" circular :indicator-dots="indicatorDots" :autoplay="autoplay" :interval="interval"
				:duration="duration">
					<swiper-item v-for="(item) in data" :key="item._id">
						<view class="uni-swiper-dot-box" @click="clickItem(item)">
							<image class="banner-image" :src="item.img_url" mode="aspectFill" :draggable="false" />
						</view>
					</swiper-item>
				</swiper>
			</unicloud-db>
		</view>

		<!-- 分类 -->
		<view>
			<unicloud-db ref="classify" v-slot:default="{data}" collection="classify"
				field="classify_name,img_url,open_url" @load="onqueryload" class="cate-section">
				<view class="cate-item" v-for="(item) in data" :key="item.img_url">
					<image :src='item.img_url' />
					<text>{{item.classify_name}}</text>
				</view>
			</unicloud-db>
		</view>

		

	</view>
</template>

<script>
import statusBar from "@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-status-bar";

import Gps from '@/uni_modules/json-gps/js_sdk/gps.js';
const gps = new Gps(), db = uniCloud.database();

export default {
	components: {
		statusBar,
		listTitle
	},
	computed: {
		
	},
	data() {
		return {
			keyword: "",
			listHight: 0,
			indicatorDots: true,
			autoplay: true,
			interval: 2000,
			duration: 500
		}
	},
	watch: {
	},
	async onReady() {
		// #ifdef APP-NVUE
		/* 可用窗口高度 - 搜索框高 - 状态栏高 */
		this.listHight = uni.getSystemInfoSync().windowHeight - uni.getSystemInfoSync().statusBarHeight - 50 + 'px';
		// #endif
		// #ifndef APP-NVUE
		this.listHight = 'auto'
		// #endif
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
		searchClick(e) { //点击搜索框
			uni.hideKeyboard();
			uni.navigateTo({
				url: '/pages/home/search/search',
				animationType: 'fade-in'
			});
		},
		retry() {
			this.refresh()
		},
		/**
		 * banner加载后触发的回调
		 */
		onqueryload(data) {
		},
		changeSwiper(e) {
			this.current = e.detail.current
		},
		clickItem(e) {
			this.swiperDotIndex = e
		},
		/**
		 * 点击banner的处理
		 */
		clickBannerItem(item) {
			// 有外部链接-跳转url
			if (item.open_url) {
				uni.navigateTo({
					url: '/pages/common/webview/webview?url=' + item.open_url + '&title=' + item.title,
					success: res => {},
					fail: () => {},
					complete: () => {}
				});
			}
		}
	}
}
</script>

<style scoped lang="scss">
/* #ifndef APP-NVUE */
view {
	display: flex;
	box-sizing: border-box;
	flex-direction: column;
}

/* #endif */
.index-pages {
	background-color: #FFF;
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
	padding: 30rpx 22rpx; 
	background: #fff;
	flex-direction:row;
	.cate-item {
		flex:1;
		align-items: center;
		font-size: $uni-font-size-sm + 2rpx;
		color: $uni-text-color;
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
</style>
