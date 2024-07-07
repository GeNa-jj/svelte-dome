<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Autocomplete, InputChip, popup } from '@skeletonlabs/skeleton';
  import type { AutocompleteOption, PopupSettings } from '@skeletonlabs/skeleton';
  import * as echarts from 'echarts';
  import type { GeoJSON } from 'echarts/types/src/coord/geo/geoTypes'
  import worldZH from '../../assets/echarts-master/worldZH.js';

  let popupSettings: PopupSettings = {
    event: 'focus-click',
    target: 'popupAutocomplete',
    placement: 'bottom',
  };

  let geoMap;
  let inputChip: string;
  let inputChipList: string[] = [];
  let flavorOptions: AutocompleteOption<string>[] = [];

  const initMap = () => {
    // 初始化echarts实例
    geoMap = echarts.init(document.getElementById('echarts'));
    echarts.registerMap('world', worldZH as GeoJSON)
  }
  const setMap = (data?:object[]) => {
    // 绘制图表
    geoMap.setOption({
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
        formatter: (params) => {
          return params.name
        }
      },
      series: [
        {
          selectedMode: false,
          name: '国家',
          type: 'map',
          map: 'world',
          roam: true,
          itemStyle: {
            borderColor: '#aaa', //边界线颜色
            areaColor: '#93B8F8' //默认区域颜色
          },
          emphasis: {
            itemStyle: {
              show: true,
              areaColor: '#fff' //鼠标滑过区域颜色
            }
          },
          data
        }
      ]
    });
  }

  const onInputChipSelect = (event: CustomEvent<AutocompleteOption<string>>): void => {
    console.log(event)
    inputChipList = [...inputChipList, event.detail.label];
    inputChip = '';
  }

  $: if (geoMap) {
    setMap(inputChipList.map(name => ({ name, value: 1 })));
  }

  onMount(() => {
    initMap();
    setMap();

    window.onresize = () => geoMap && geoMap.resize();

    flavorOptions = (worldZH.features as any[]).map(item => {
      const label = item.properties.name;
      return {
        label,
        value: label,
        meta: { healthy: false }
      }
    });
  });

  onDestroy(() => {
    if (geoMap) {
      geoMap.dispose();
      geoMap = null;
		}
  })

</script>

<div class="w-full max-w-sm selectCss" use:popup={popupSettings}>
	<InputChip bind:input={inputChip} bind:value={inputChipList} name="chips" />

	<div data-popup="popupAutocomplete" class="card w-full max-w-sm max-h-56 p-2 overflow-y-auto" tabindex="-1" style="z-index: 1">
		<Autocomplete
				bind:input={inputChip}
				options={flavorOptions}
				denylist={inputChipList}
				on:selection={onInputChipSelect}
		/>
	</div>
</div>

<div id="echarts" style="width: 100%;height:100%;"></div>

<style lang="postcss">
	.selectCss {
		position: absolute;
		z-index: 2;
		padding-left: 8px;
		padding-top: 8px;
	}
</style>
