<template>
  <div class="chart mb-2 relative h-48 lg:h-56 xl:h-64 2xl:h-72">
    <div ref="chart" class="absolute inset-0"></div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted, onUpdated } from "vue";
import { use, init } from "echarts/core";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import throttle from "lodash-es/throttle";

use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
]);

const props = defineProps({
  data: Object,
  typeMap: Map,
  i18n: Object,
});

const chart = ref(null);

const colors = [
    "#fac858", "#ee6666", "#5470c6", "#91cc75", "#73c0de", "#7153c6", "#73decc", "#c7bace", "#ff8b52",
    "#7153c6", "#73decc", "#77dfdf", "#77df99"
];

const parseData = (detail, type) => {
  const text = props.i18n.ui.data;
  const keys = [
    [text.chara5, "count5char"],
    [text.weapon5, "count5weap"],
    [text.chara4, "count4char"],
    [text.weapon4, "count4weap"],
    [text.weapon3, "count3weap"],
    [text.cosmeticCat4, "count4ccat"],
    [text.cosmeticCat3, "count3ccat"],
    [text.cosmeticCat2, "count2ccat"],
    [text.cosmeticSet5, "count5cset"],
    [text.cosmeticSet4, "count4cset"],
    [text.cosmeticCom3, "count3ccom"],
    [text.expression3, "count3exp"],
    [text.action3, "count3act"],
  ];
  const result = [];
  const color = [];
  const selected = {
    [text.weapon3]: false,
    [text.cosmeticCat2]: false,
    [text.cosmeticCom3]: false,
  };
  keys.forEach((key, index) => {
    if (!detail[key[1]]) return;
    result.push({
      value: detail[key[1]],
      name: key[0],
    });
    color.push(colors[index]);
  });
  if (
    type === "100" ||
    result.findIndex((item) => item.name.includes("5")) === -1
  ) {
    selected[text.weapon3] = true;
  }
  return [result, color, selected];
};

const getLegendHeight = (pieChart) => {
  let legendHeight = 50
  if (pieChart._componentsViews) {
    const legendView = pieChart._componentsViews.find((entry) => entry.type === "legend.plain")
    if (legendView) {
      legendHeight = Math.max(legendView._backgroundEl.shape.height || legendHeight, 50)
    }
  }
  return legendHeight
}

let pieChart = null;
const updateChart = () => {
  if (!pieChart) {
    pieChart = init(chart.value);
  }

  const colon = props.i18n.symbol.colon;
  const result = parseData(props.data[1], props.data[0]);

  const legendHeight = getLegendHeight(pieChart)

  const option = {
    tooltip: {
      trigger: "item",
      formatter: `{b0}${colon}{c0}`,
      padding: 4,
      textStyle: {
        fontSize: 12,
      },
    },
    legend: {
      top: "2%",
      left: "center",
      selected: result[2],
    },
    selectedMode: "single",
    color: result[1],
    series: [
      {
        name: props.typeMap.get(props.data[0]),
        type: "pie",
        top: legendHeight,
        startAngle: 70,
        radius: ["0%", "90%"],
        // avoidLabelOverlap: false,
        labelLine: {
          length: 0,
          length2: 10,
        },
        label: {
          overflow: "break",
        },
        data: result[0],
      },
    ],
  };

  pieChart.setOption(option);
  pieChart.resize();
  if (legendHeight !== getLegendHeight(pieChart)) {
    updateChart()
  }
}

const updateChartThrottled = throttle(updateChart, 1000);

onUpdated(() => {
  updateChartThrottled();
});

onMounted(() => {
  updateChartThrottled();
  window.addEventListener("resize", updateChartThrottled);
});
</script>
