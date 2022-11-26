<template>
	<view class="empty-content">
		<image class="empty-content-image" :src="src" mode="aspectFit" />
		<text class="words">{{emptyWords}}</text>
	</view>
</template>

<script>
import imgSrc from '@/static/emptyCart.jpg'
	export default {
		props: {
			src: {
				type: String,
				default: imgSrc
			},
			emptyWords:''
		},

		data() {
			return {}
		}
	}
</script>

<style lang="scss">
	.empty-content {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: $page-color-base;
		padding-bottom: 120upx;

		.words{
			color:$uni-text-color-grey;
			font-size: $uni-font-size-lg;
		}
		&-image {
			width: 200upx;
			height: 200upx;
		}
	}
</style>
