<template>
	<view class="content b-t">
		<view class="list b-b" v-for="(item, index) in addressList" :key="index" @click="checkAddress(item)">
			<view class="wrapper">
				<view class="address-box">
					<text v-if="item.default" class="tag">默认</text>
					<text class="address">{{item.addressName}}</text>
				</view>
				<view class="u-box">
					<text class="name">{{item.name}}</text>
					<text class="mobile">{{item.mobile}}</text>
				</view>
			</view>
			<text class="iconfont icon-bianji" @click.stop="addOrEditAddress('edit', item)"></text>
		</view>
		
		
		<button class="add-btn" @click="addOrEditAddress('add')">新增地址</button>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				source: 0,
				addressList: [
					{
						name: '梁水英',
						mobile: '1348094****',
						addressName: '沙河街道白石洲西二坊14号202', // 门牌号
						address: '广东省深圳市南山区',
						default: true
					},
					{
						name: '梁水英2',
						mobile: '1348094****',
						addressName: '沙河街道白石洲西二坊14号202',
						address: '广东省深圳市南山区',
						default: false
					}
				]
			}
		},
		onLoad(option){
			console.log(option.source);
			this.source = option.source;
		},
		methods: {
			//选择地址
			checkAddress(item){
				if(this.source == 1){
					//this.$api.prePage()获取上一页实例，在App.vue定义
					// this.$api.prePage().addressData = item;
					uni.navigateBack()
				}
			},
			addOrEditAddress(type, item) {
				console.log('type========',type,item)
				uni.navigateTo({
					url: `/pages/address/addressManage?type=${type}&data=${JSON.stringify(item)}`
				})
			},
			//添加或修改成功之后回调
			refreshList(data, type){
				//添加或修改后事件，这里直接在最前面添加了一条数据，实际应用中直接刷新地址列表即可
				this.addressList.unshift(data);
				
				console.log(data, type);
			}
		}
	}
</script>

<style lang='scss'>
	page{
		padding-bottom: 120rpx;
	}
	.content{
		position: relative;
	}
	.list{
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;;
		background: #fff;
		position: relative;
	}
	.wrapper{
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.address-box{
		display: flex;
		align-items: center;
		.tag{
			font-size: 24rpx;
			color: $base-color;
			margin-right: 10rpx;
			background: #fffafb;
			border: 1px solid #ffb4c7;
			border-radius: 4rpx;
			padding: 4rpx 10rpx;
			line-height: 1;
		}
		.address{
			font-size: 30rpx;
			color: $font-color-dark;
		}
	}
	.u-box{
		font-size: 28rpx;
		color: $font-color-light;
		margin-top: 16rpx;
		.name{
			margin-right: 30rpx;
		}
	}
	.icon-bianji{
		display: flex;
		align-items: center;
		height: 80rpx;
		font-size: 40rpx;
		color: $font-color-light;
		padding-left: 30rpx;
	}
	
	.add-btn{
		position: fixed;
		left: 30rpx;
		right: 30rpx;
		bottom: 16rpx;
		z-index: 95;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 690rpx;
		height: 80rpx;
		font-size: 32rpx;
		color: #fff;
		background-color: $base-color;
		border-radius: 10rpx;
		box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);		
	}
</style>
