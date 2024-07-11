<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Autocomplete, InputChip, popup } from '@skeletonlabs/skeleton';
	import type { AutocompleteOption, PopupSettings } from '@skeletonlabs/skeleton';
	import * as echarts from 'echarts';
	import type { GeoJSON } from 'echarts/types/src/coord/geo/geoTypes.d.ts';
	import worldJSON from '@/assets/map/world.json';
	import { mapZHName } from '@/lib/mapZHName.ts';

	let popupSettings: PopupSettings = {
		event: 'focus-click',
		target: 'popupAutocomplete',
		placement: 'bottom'
	};

	let geoMap: echarts.ECharts | null = null;
	let inputChip: string = '';
	let inputChipList: string[] = [];
	let countryOptions: AutocompleteOption[] = [];

	const initMap = () => {
		// 初始化echarts实例
		geoMap = echarts.init(document.getElementById('echarts'));
		echarts.registerMap('world', worldJSON as GeoJSON);

		// 重置后重新渲染选中区域
		geoMap.on('restore', () => {
			setMap(inputChipList.map((name) => ({ name, value: 1 })));
		});
	};
	const setMap = (data?: object[]) => {
		// 绘制图表
		geoMap && geoMap.setOption({
			toolbox: {
				show: true,
				left: 'right',
				top: 'top',
				feature: {
					restore: {
						show: true,
						title: 'resize'
					}
				}
			},
			visualMap: {
				type: 'piecewise',
				show: false,
				pieces: [
					{ value: 1, color: '#FF4646', label: '选中' },
					{ value: -1, color: '#93B8F8', label: '默认' }
				]
			},
			tooltip: {
				trigger: 'item',
				formatter: (params: any) => {
					return params.name;
				}
			},
			series: [
				{
					selectedMode: false,
					name: '国家',
					type: 'map',
					map: 'world',
					roam: true,
					zoom: 1,
					scaleLimit: {
						min: 1,
						max: 5
					},
					itemStyle: {
						borderColor: '#aaa', // 边界线
						areaColor: '#93B8F8' // 区域
					},
					emphasis: {
						itemStyle: {
							show: true,
							areaColor: '#fff' // hover颜色
						}
					},
					data
				}
			]
		});
	};

	const initData = (): void => {
		countryOptions = worldJSON.features.map((item) => {
			const value = item.properties.name;
			const label = mapZHName[value] || value || '';
			item.properties.name = label;
			return {
				label,
				value: label,
				keywords: `${label}, ${value}`,
				meta: { healthy: false }
			};
		})
		countryOptions = countryOptions.filter(f => f.label);
	}

	const onInputChipSelect = (event: CustomEvent): void => {
		inputChipList = [...inputChipList, event.detail.label];
		inputChip = '';
	};

	$: if (geoMap) {
		setMap(inputChipList.map((name) => ({ name, value: 1 })));
	}

	onMount(() => {
		initData();

		initMap();
		setMap();

		window.onresize = () => geoMap && geoMap.resize();
	});

	onDestroy(() => {
		if (geoMap) {
			geoMap.dispose();
			geoMap = null;
			window.onresize = null;
		}
	});
</script>

<div class="w-full max-w-sm selectCss" use:popup={popupSettings}>
	<InputChip
		bind:input={inputChip}
		bind:value={inputChipList}
		placeholder="Search country"
		name="chips"
	/>

	<div
		data-popup="popupAutocomplete"
		class="card w-full max-w-sm max-h-56 p-2 overflow-y-auto"
		tabindex="-1"
		style="z-index: 1"
	>
		<Autocomplete
			bind:input={inputChip}
			options={countryOptions}
			denylist={inputChipList}
			on:selection={onInputChipSelect}
		/>
	</div>
</div>

<div id="echarts" class="w-full h-full"></div>

<style lang="postcss">
	.selectCss {
		position: absolute;
		z-index: 2;
		padding-left: 8px;
		padding-top: 8px;
	}
</style>
