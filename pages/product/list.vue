<template>
	<view class="content">
		<view class="navbar">
			<view class="nav-item" :class="{current: filterIndex === 0}" @click="tabClick(0)">
				综合排序
			</view>
			<view class="nav-item" :class="{current: filterIndex === 1}" @click="tabClick(1)">
				<text>价格</text>
				<view class="p-box">
					<text :class="{active: priceOrder === 1 && filterIndex === 1}" class="iconfont icon-xiangshang" @click.stop="tabClick(1)"/>
					<text :class="{active: priceOrder === 2 && filterIndex === 1}" class="iconfont icon-xiangxia" @click.stop="tabClick(2)"/>
				</view>
			</view>
		</view>
		<view class="goods-list" v-if="goodsList.length>0">
			<view 
				v-for="item in goodsList" :key="item._id"
				class="goods-item"
				@click="navToDetailPage(item)"
			>
				<view class="image-wrapper">
					<image :src="item.goods_thumb" mode="aspectFill" />
				</view>
				<text class="title">{{item.name}}</text>
				<view class="price-box">
					<text class="price">{{item.minPrice}}起</text>
				</view>
			</view>
		</view>
		<!-- <uni-load-more :status="loadingType"></uni-load-more> -->
		
	</view>
</template>

<script>
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import { findLowerPrice } from '@/utils/util.js';
	const db = uniCloud.database();
	const dbCollName = 'open-goods';
	export default {
		components: {
			uniLoadMore	
		},
		data() {
			return {
				loadingType: 'more', //加载更多状态
				filterIndex: 0, // tab选中标识
				id: 0, //已选三级分类id
				priceOrder: 0, //1 价格从低到高 2价格从高到低
				goodsList: [],
				orgList:[] // 原始数据
			};
		},
		
		onReady(){
			this.id = this.$page.options.id;
			
			this.loadList();
		},
		//下拉刷新
		onPullDownRefresh(){
			this.loadData('refresh');
		},
		//加载更多
		onReachBottom(){
			this.loadData();
		},
		methods: {
			loadList() {
				uni.showLoading({
					mask: true
				})
				let a = 'category_id =="' + this.id+'"';
				db.collection(dbCollName).where(a).field('goods_sku,name,_id,goods_thumb,goods_desc').get().then((res) => {
					const list = res.result.data
					const goodsList = findLowerPrice(list);
					// console.log('goodsList===========',goodsList)
					this.goodsList = goodsList;
					this.orgList = JSON.parse(JSON.stringify(goodsList));
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
				
			},
			//筛选点击
			tabClick(index) {
				// console.log('index=======', index)
				uni.showLoading({
					mask: true
				})
				this.filterIndex = 1;
				this.priceOrder = index;
				if(index === 1){ // 从低到高
					this.goodsList.sort((a,b)=> a.minPrice - b.minPrice)
				} else if(index === 2) {
					this.goodsList.sort((a,b)=> b.minPrice - a.minPrice)
				} else { // 按综合排序
					this.goodsList = JSON.parse(JSON.stringify(this.orgList));
				}
				uni.hideLoading()
				
			},
			//详情
			navToDetailPage(item){
				let id = item._id;
				uni.navigateTo({
					url: `/pages/product/product?id=${id}`
				})
			},
			stopPrevent(){}
		},
	}
</script>

<style lang="scss">
	page, .content{
		background: $page-color-base;
	}
	.content{
		padding-top: 96rpx;
	}

	.navbar{
		position: fixed;
		left: 0;
		top: 0;
		display: flex;
		width: 100%;
		height: 80rpx;
		background: #fff;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,.06);
		z-index: 10;
		.nav-item{
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			font-size: 30rpx;
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
					width: 120rpx;
					height: 0;
					border-bottom: 4rpx solid $base-color;
				}
			}
		}
		.p-box{
			display: flex;
			flex-direction: column;
			.iconfont{
				display: flex;
				align-items: center;
				justify-content: center;
				width: 30rpx;
				height: 14rpx;
				line-height: 1;
				margin-left: 4rpx;
				font-size: 26rpx;
				color: #888;
				&.active{
					color: $base-color;
				}
			}
		}
	}

	/* 商品列表 */
	.goods-list{
		display:flex;
		flex-wrap:wrap;
		padding: 0 30rpx;
		background: #fff;
		.goods-item{
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
			border-radius: 3px;
			overflow: hidden;
			image{
				width: 100%;
				height: 100%;
				opacity: 1;
			}
		}
		.title{
			font-size: $uni-font-size-lg;
			color: $font-color-dark;
			line-height: 80rpx;
			overflow: hidden;//溢出隐藏
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.price-box{
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding-right: 10rpx;
			font-size: 24rpx;
			color: $font-color-light;
		}
		.price{
			font-size: $uni-font-size-lg;
			color: $uni-color-primary;
			line-height: 1;
			&:before{
				content: '￥';
				font-size: 26rpx;
			}
		}
	}
	

</style>
