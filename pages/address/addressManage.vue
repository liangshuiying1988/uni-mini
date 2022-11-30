<template>
	<view class="content">
		<view class="row">
			<text class="tit">收货人</text>
			<input class="input" type="text" v-model="addressData.name" placeholder="收货人姓名" placeholder-class="placeholder" />
		</view>
		<view class="row">
			<text class="tit">手机号</text>
			<input class="input" type="number" v-model="addressData.mobile" placeholder="收货人手机号码" placeholder-class="placeholder" />
		</view>
		<view class="row">
			<text class="tit2">所在地址</text>
			<view class="flex1" @click="openAddress">{{address }}</view>
			<use-address ref="useAddress" @onConfirm="chooseAddr" cancelColor="#bbb" themeColor="#ff6a6e" />
			<text class="iconfont icon-shouhuodizhi" />
		</view>
		<view class="row">
			<text class="tit2">所在地址</text>
			<text @click="chooseLocation" class="input">
				{{mapAddress}}
			</text>
			<text class="iconfont icon-shouhuodizhi" />
		</view>
		<view class="row"> 
			<text class="tit2">详细地址</text>
			<input class="input" type="text" v-model="addressData.addressName" placeholder="楼号、门牌" placeholder-class="placeholder" />
		</view>
		
		<view class="row default-row">
			<text class="tit">设为默认</text>
			<switch :checked="addressData.defaule" color="#fa436a" @change="switchChange" />
		</view>
		<button class="add-btn" @click="confirm">提交</button>
	</view>
</template>

<script>
	import useAddress from '@/components/use-address/use-address.vue'
	export default {
		components: {
			useAddress
		},
		data() {
			return {
				mapAddress: '从地图中选择',
				address:'请选择地址',
				addressData: {
					name: '',
					mobile: '',
					addressName: '', // 详细地址
					address: ' ', // 省市区等
					default: false
				},
				manageType:'add' // 默认新增
			}
		},
		onLoad(option){
			let title = '新增收货地址';
			if(option.type==='edit'){
				title = '编辑收货地址'
				
				let data = JSON.parse(option.data)
				this.addressData = JSON.parse(option.data)
				this.mapAddress = data.address
				this.address = data.address
			}
			this.manageType = option.type;
			uni.setNavigationBarTitle({
				title
			})
		},
		methods: {
			openAddress() {
				this.$refs.useAddress.open();
			},
			switchChange(e){
				this.addressData.default = e.detail;
			},
			//从下拉数据中选择地址
			chooseAddr(item) {
				console.log('item===========', item);
				this.address = item.label;
			},
			//地图选择地址
			chooseLocation() {
				uni.chooseLocation({
					success: (res) => {
						console.log('位置名称：' + res.name);
						console.log('详细地址：' + res.address);
						this.addressData.addressName = res.address;
						this.mapAddress = res.name;
					}
				})
			},
			
			//提交
			confirm(){
				let data = this.addressData;
				let address = '';
				//如果地图中有选择了地址，就用地图中的
				if (this.mapAddress !== '从地图中选择' && this.mapAddress !== data.address) {
					address = this.mapAddress
				} else if (this.address !== '请选择地址' && this.address !== data.address) {
					address = this.address
				}

				this.addressData.address = address;

				if(!data.name){
					uni.showToast({
						title: '请填写收货人姓名',
					})
					return;
				}

				if(!/(^1[3|4|5|7|8][0-9]{9}$)/.test(data.mobile)){
					uni.showToast({
						title: '请输入正确的手机号码',
					})
					return;
				}
				if(!this.addressData.address){
					uni.showToast({
						title: '请选择地址或在地图选择所在位置',
					})
					return;
				}

				if(!data.addressName){
					uni.showToast({
						title: '请填写详细地址信息',
					})
					return;
				}
				
				//this.$api.prePage()获取上一页实例，可直接调用上页所有数据和方法，在App.vue定义
				this.$api.prePage().refreshList(data, this.manageType);
				this.$api.msg(`地址${ this.manageType == 'edit' ? '修改' : '添加' }成功`);
				
				setTimeout(()=>{
					uni.navigateBack()
				}, 800)
			},
		}
	}
</script>

<style lang="scss">
	page{
		background: $page-color-base;
		padding-top: 16rpx;
	}

	.row{
		display: flex;
		align-items: center;
		position: relative;
		padding:0 30rpx;
		height: 110rpx;
		background: #fff;
		
		.tit{
			flex-shrink: 0;
			width: 120rpx;
			font-size: 30rpx;
			color: $font-color-dark;
		}
		.tit2{
			flex-shrink: 0;
			width: 160rpx;
			font-size: 30rpx;
			color: $font-color-dark;
		}

		.flex1{
			flex: 1;
			color: #333;
		}

		.input{
			flex: 1;
			font-size: 30rpx;
			color: $font-color-dark;
		}
		.icon-shouhuodizhi{
			font-size: 36rpx;
			color: $font-color-light;
		}
	}
	
	
	.default-row{
		margin-top: 16rpx;
		.tit{
			flex: 1;
		}
		switch{
			transform: translateX(16rpx) scale(.9);
		}
	}
	.add-btn{
		display: flex;
		align-items: center;
		justify-content: center;
		width: 690rpx;
		height: 80rpx;
		margin: 60rpx auto;
		font-size: $uni-font-size-lg;
		color: #fff;
		background-color: $base-color;
		border-radius: 10rpx;
		box-shadow: 1px 2px 5px rgba(219, 63, 96, 0.4);
	}
</style>
