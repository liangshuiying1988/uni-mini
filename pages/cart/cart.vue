<template>
	<view class="container">
		<!-- 空白页 -->
		<view v-if="!hasLogin || empty===true" class="empty">
			<image src="/static/emptyCart.jpg" mode="aspectFit"></image>
			<view v-if="hasLogin" class="empty-tips">
				空空如也
				<navigator class="navigator" v-if="hasLogin" url="../index/index" open-type="switchTab">随便逛逛></navigator>
			</view>
			<view v-else class="empty-tips">
				空空如也
				<view class="navigator" @click="navToLogin">去登录></view>
			</view>
		</view>
		<view v-else>
			<!-- 列表 -->
			<view class="cart-list">
				<block v-for="(item, index) in cartList" :key="item.id">
					<view
						class="cart-item" 
						:class="{'b-b': index!==cartList.length-1}"
					>
						<view class="image-wrapper">
							<image :src="item.image" 
								mode="aspectFill" 
								class="goods-image"
								lazy-load 
								@load="onImageLoad('cartList', index)" 
								@error="onImageError('cartList', index)"
							></image>
							<view 
								:class="{checked: item.checked}"
								@click="check('item', index)"
							>
								<image class='checkbox' :src="item.checked ? '/static/selected.png' : '/static/select.png'"/>
							</view>
						</view>
						<view class="item-right">
							<text class="clamp title">{{item.name}}</text>
							<text class="attr">{{item.color}}{{item.size}}</text>
							<text class="price">¥{{item.price}}</text>
							<!-- 加减组件 -->
							<view class="button-box">
								<uni-number-box 
									class="step"
									:min="1" 
									:max="item.num"
									:value="item.goods_num"
									:isMax="item.goods_num>=item.num ? true : false"
									:isMin="item.goods_num===1"
									:index="index"
									@eventChange="numberChange"
								/>
							<!-- 删除 -->
							<text class="iconfont icon-shanchu del_btn" @click="deleteCartItem(index)" />
							</view>
						</view>
						
					</view>
				</block>
			</view>
			<!-- 底部菜单栏 -->
			<view class="jiesuan">
				<view class="action-section">
					<view class="checkbox">
						<image 
							:src="allChecked?'/static/selected.png':'/static/select.png'" 
							mode="aspectFit"
							@click="check('all')"
						></image>
						<view class="clear-btn" :class="{show: allChecked}" @click="clearCart">
							清空
						</view>
					</view>
					<view class="total-box">
						<text class="price">¥{{total}}</text>
						<text class="coupon">
							已优惠
							<text>0</text>
							元
						</text>
					</view>
					<button type="primary" class="no-border confirm-btn" @click="createOrder">去结算</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { store } from '@/uni_modules/uni-id-pages/common/store.js'
	import uniNumberBox from '@/components/uni-number-box.vue'
	import { findRepeatGoods } from '@/utils/util.js'
	const db = uniCloud.database();
	const dbname = 'open-cart,open-goods';
	export default {
		components: {
			uniNumberBox
		},
		data() {
			return {
				total: 0, //总价格
				allChecked: false, //全选状态  true|false
				empty: false, //空白页  true|false
				cartList: [],
			};
		},
		onShow(){
			this.loadData();
		},
		onReady(){
			this.loadData();
		},
		watch:{
			//显示空白页
			cartList(e){
				let empty = e.length === 0 ? true: false;
				if(this.empty !== empty){
					this.empty = empty;
				}
			}
		},
		computed:{
			hasLogin() {
				// console.log('store========',store)
				return store.hasLogin
			}
		},
		methods: {
			//请求数据
			async loadData() {
				uni.showLoading({
					mask: true
				})
				let a = "user_id=='" + store.userInfo._id + "'";
				const res = await db.collection(dbname).where(a).field('goods_id{_id,goods_thumb,name,goods_sku},sku_id,goods_num').get();
				if (res.result && res.result.data) {
					const list = res.result.data;
					//过滤重复商品
					let cartList = findRepeatGoods(list);
					this.cartList = cartList;
					// console.log('cartList===========',cartList)
					//计算总价
					this.calcTotal();
				}
				uni.hideLoading()
			},
			//监听image加载完成
			onImageLoad(key, index) {
				this.$set(this[key][index], 'loaded', 'loaded');
			},
			//监听image加载失败
			onImageError(key, index) {
				this[key][index].image = '/static/errorImage.jpg';
			},
			navToLogin(){
				uni.navigateTo({
					url: '/pages/public/login'
				})
			},
			 //选中状态处理
			check(type, index){
				if(type === 'item'){
					this.cartList[index].checked = !this.cartList[index].checked;
				}else{
					const checked = !this.allChecked
					const list = this.cartList;
					list.forEach(item=>{
						item.checked = checked;
					})
					this.allChecked = checked;
				}
				this.calcTotal(type);
			},
			//数量
			numberChange(data){
				this.cartList[data.index].goods_num = data.number;
				this.calcTotal();
			},
			//删除
			async deleteCartItem(index) {
				uni.showLoading({
					mask: true
				})
				let list = this.cartList;
				let row = list[index];
				let id = row.cart_id;
				console.log('id========', id)
				let idarr = id.split(',');
				console.log('idarr========', idarr)
				let res;
				if (id && idarr.length > 1) { //有多个id
					// let par = {},a;
					const _ = db.command;
					let par = idarr.reduce((prev, cur, index)=>{
						console.log(prev, cur, index);
						return  '_.eq("'+prev + '").or(_.eq("' + cur +'"))'
					})

					console.log('par=============', par)
					// idarr.forEach((item, idx) => {
					// 	// if (idx > 0) {
					// 	// 	a = a + '.or(_.eq("'+ item +'")';
					// 	// } else {
					// 	// 	a = '{"_id":' +'"_.eq("'+ item +'")';
					// 	// }
					// 	if (idx > 0) {
					// 		// a = a + '.or(_.eq("' + item + '")';
					// 		a = a.or(_.eq(+ "'" + item + "'"));
					// 	} else {
					// 		// a = '"_.eq("' + item + '")';
					// 		a = _.eq(+"'" + item + "'");
					// 	}
					// })
					// a = a + '"}';
					// a = a + '"';
					// console.log('a=============', a)
					// par =JSON.parse(JSON.stringify(a));
					// console.log('par=============', par)
					// par ={_id:_.eq('637d79f36742b700010be4ae').or(_.eq('637d7a0b188fab0001de3135'))}
					res = await db.collection('open-cart').where({ _id: par }).remove();
				} else {
					res = await db.collection('open-cart').doc(id).remove()
				}
				if (res && res.result && res.result.errCode === 0) {
						this.loadData();
					}
			},
			//清空
			clearCart(){
				uni.showModal({
					content: '清空购物车？',
					success: async (e)=>{
						if (e.confirm) {
							let a = "user_id=='" + store.userInfo._id + "'";
							const res = await db.collection('open-cart').where(a).remove();
							console.log('res=========',res)
							this.cartList = [];
						}
					}
				})
			},
			//计算总价
			calcTotal(){
				let list = this.cartList;
				if(list.length === 0){
					this.empty = true;
					return;
				}
				let total = 0;
				let checked = true;
				list.forEach(item=>{
					if(item.checked === true){
						total += item.price * item.goods_num;
					}else if(checked === true){
						checked = false;
					}
				})
				this.allChecked = checked;
				this.total = Number(total.toFixed(2));
			},
			//创建订单
			createOrder(){
				let list = this.cartList;
				uni.setStorageSync('CARTLIST', list)
				uni.navigateTo({
					url: '/pages/order/createOrder'
				})
			}
		}
	}
</script>

<style lang='scss'>
	.container{
		padding-bottom: 134rpx;
		/* 空白页 */
		.empty{
			position:fixed;
			left: 0;
			top:0;
			width: 100%;
			height: 100vh;
			padding-bottom:100rpx;
			display:flex;
			justify-content: center;
			flex-direction: column;
			align-items:center;
			background: #fff;
			image{
				width: 240rpx;
				height: 160rpx;
				margin-bottom:30rpx;
			}
			.empty-tips{
				display:flex;
				font-size: $uni-font-size-sm + 2rpx;
				color: $uni-text-color-disable;
				.navigator{
					color: $uni-color-primary;
					margin-left: 16rpx;
				}
			}
		}
	}
	/* 购物车列表项 */
	.cart-item{
		display:flex;
		position:relative;
		padding:30rpx 40rpx;
		.image-wrapper{
			width: 230rpx;
			height: 230rpx;
			flex-shrink: 0;
			position:relative;
		}
		.goods-image{
			border-radius:8rpx;
			width: 230rpx;
			height: 230rpx;
		}
		.checkbox{
			position:absolute;
			left:-16rpx;
			top: -16rpx;
			width: 32rpx;
			height: 32rpx;
			z-index: 8;
			line-height: 1;
			padding: 4rpx;
			color: $uni-text-color-disable;
			background:#fff;
			border-radius: 50px;
		}
		.item-right{
			display:flex;
			flex-direction: column;
			flex: 1;
			overflow: hidden;
			position:relative;
			padding-left: 30rpx;
			.title{
				font-size:$uni-font-size-sm + 2rpx;
				color: $font-color-dark;
				height: 40rpx;
				line-height: 40rpx;
				overflow: hidden;//溢出隐藏
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.attr{
				font-size: $uni-font-size-sm + 2rpx;
				color: $font-color-light;
				height: 50rpx;
				line-height: 50rpx;
			}
			.price{
				font-size:$uni-font-size-sm + 2rpx;
				color: $font-color-dark;
				height: 50rpx;
				line-height:50rpx;
			}
		}
	}
	.button-box{
		position: relative;
		height: 80rpx;
		width:100%;

		.del_btn{
			top: 20rpx;
			right: 0;
			position: absolute;
			font-size: $uni-img-size-sm;
		}
	}
	/* 底部栏 */
	.jiesuan{
		/* #ifdef H5 */
		margin-bottom:100rpx;
		/* #endif */
		position:fixed;
		bottom:2rpx;
		z-index: 95;
		width: 100%;
		height: 118rpx;
	}
	.action-section{
		display: flex;
		align-items: center;
		margin: 0 30rpx;
		padding: 20rpx 30rpx;
		background: rgba(255,255,255,.9);
		box-shadow: 0 0 20rpx 0 rgba(0,0,0,.5);
		border-radius: 16rpx;
		.checkbox{
			height:52rpx;
			position:relative;
			image{
				width: 52rpx;
				height: 100%;
				position:relative;
				z-index: 5;
			}
		}
		.clear-btn{
			position:absolute;
			left: 26rpx;
			top: 0;
			z-index: 4;
			width: 0;
			height: 52rpx;
			line-height: 52rpx;
			padding-left: 50rpx;
			font-size: $uni-font-size-sm;
			color: #fff;
			background: $uni-text-color-disable;
			border-radius:0 50px 50px 0;
			opacity: 0;
			transition: .2s;
			&.show{
				opacity: 1;
				width: 120rpx;
			}
		}
		.total-box{
			flex: 1;
			display:flex;
			flex-direction: column;
			text-align:right;
			padding-right: 40rpx;
			.price{
				font-size: $uni-font-size-base;
				color: $font-color-dark;
			}
			.coupon{
				font-size: $uni-font-size-sm;
				color: $font-color-light;
				text{
					color: $font-color-dark;
				}
			}
		}
		.confirm-btn{
			padding: 0 38rpx;
			margin: 0;
			border-radius: 100px;
			height: 76rpx;
			line-height: 76rpx;
			font-size: $uni-font-size-sm + 2rpx;
			background: $uni-color-primary;
			box-shadow: 1px 2px 5px rgba(217, 60, 93, 0.72)
		}
	}
	/* 复选框选中状态 */
	.action-section .checkbox.checked,
	.cart-item .checkbox.checked{
		color: $uni-color-primary;
	}
</style>
