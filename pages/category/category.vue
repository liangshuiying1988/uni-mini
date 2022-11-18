<template>
	<view class="content">
		<scroll-view scroll-y class="left-aside">
			<view v-for="item in cateList"
				:key="item._id" class="f-item"
				:class="{active: item._id === currentId}" 
				@click="tabtap(item)"
			>
				{{item.name}}
			</view>
		</scroll-view>
		<scroll-view scroll-with-animation scroll-y class="right-aside">
			<view v-for="sitem in rightList" :key="sitem._id" class="s-list" :id="sitem._id">
				<text class="s-item">{{sitem.name}}</text>
				<view class="t-list" v-if="sitem.children">
					<view v-for="titem in sitem.children" @click="navToList(titem._id)" class="t-item" :key="titem._id">
						<image :src="titem.icon" />
						<text>{{titem.name}}</text>
					</view>
				</view>
			</view>
		</scroll-view> 
	</view>
</template>

<script>
	export default {
		data() {
			return {
				sizeCalcState: false,
				currentId: null,
				cateList: [], //一级、二级、三级分类所有数据
				rightList:[]//选中的二级、三级数据
			}
		},
		onLoad(){
			this.loadData();
		},
		methods: {
			loadData() {
				uniCloud.database().collection('goods-category')
					.field('_id,name,parent_id,icon').get().then(res => {
						let cateList = res.result.data
						cateList.length > 0 && cateList.forEach((item) => {
							// 所有数据统一加children
							item.children = [];
						})

						cateList.length > 0 && cateList.forEach((item) => {
							cateList.forEach((item2) => {
								if (item2.parent_id === item._id) {
									item.children.push(item2)
								}
							})
						})
						let resData = cateList.filter(i => i.parent_id === '');
						this.currentId = resData[0]._id;
						this.rightList = resData[0].children;
						this.cateList = resData;
						this.loading = false;
					});
				
				
			},
			//一级分类点击
			tabtap(item){
				this.currentId = item._id;
				this.rightList = this.cateList.filter(i => i._id === item._id)[0].children;
				// console.log('this.rightList===========',this.cateList,this.rightList)
			},
			navToList(id){
				uni.navigateTo({
					url: `/pages/product/list?id=${id}`
				})
			}
		}
	}
</script>

<style lang='scss'>
	page,
	.content {
		height: 100%;
		background-color: #fff;
	}

	.content {
		display: flex;
	}
	.left-aside {
		flex-shrink: 0;
		width: 200rpx;
		height: 100%;
		background-color: #f8f8f8;
	}
	.f-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100rpx;
		font-size: 28rpx;
		color: $font-color-base;
		position: relative;
		&.active{
			color: $base-color;
			background: #fff;
			&:before{
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				height: 36rpx;
				width: 8rpx;
				background-color: $base-color;
				border-radius: 0 4px 4px 0;
				opacity: 0.8;
			}
		}
	}

	.right-aside{
		flex: 1;
		overflow: hidden;
		padding-left: 40rpx;
	}
	.s-item{
		display: flex;
		align-items: center;
		height: 70rpx;
		padding-top: 8rpx;
		font-size: 28rpx;
		color: $font-color-dark;
	}
	.t-list{
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		background: #fff;
		padding-top: 12rpx;
		&:after{
			content: '';
			flex: 99;
			height: 0;
		}
	}
	.t-item{
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		width: 176rpx;
		font-size: 26rpx;
		color: #666;
		padding-bottom: 20rpx;
		
		image{
			width: 140rpx;
			height: 140rpx;
		}
	}
</style>
