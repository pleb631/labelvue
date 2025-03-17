<template>
  <div class="card-radio-group" size="large">
    <div ref="referenceEl" class="reference">{{ maxContent }}</div>
    <el-card
      v-for="(item, index) in classValues"
      :key="index"
      :class="{ active: selectClass === index }"
      class="card-option"
      @click="selectClass = index"
    >
      <div class="card-content">
        <div :style="{ backgroundColor: item.color }" class="color-block"></div>
        <div :style="{ minWidth: maxWidth + 'px' }" class="text-block">
          {{ index }}
        </div>
      </div>
    </el-card>
  </div>
  <el-row :gutter="20" class="mgb20">
    <el-col :span="18">
      <canvas ref="canvasRef" class="canvas"></canvas>
    </el-col>
    <el-col :span="5" class="labellist">
      labellist

      <LabelItem
        v-for="(item, index) in labels"
        :key="item.uuid"
        :class="selectedId === item.uuid ? 'is-selected' : ''"
        :classValues="classValues"
        :index="index"
        :labels="item"
        shadow="hover"
        @change_attr="change_attr"
        @change_class="change_class"
        @click="selectItem(item.uuid)"
        @delete_label="delete_label"
      >
      </LabelItem>
    </el-col>
  </el-row>
  <el-row>
    <el-button ref="editRef" type="primary" @click="change_mode($event)"
      >{{ editText }}
    </el-button>
    <el-button type="primary" @click="reset_editPanel()">原始大小</el-button>
    <el-button type="primary" @click="onFocus()">{{ onFocusText }}</el-button>
    <el-button type="primary" @click="hideLabel()"
      >{{ hideLabelText }}
    </el-button>
    <el-button type="primary" @click="test_update()">test_update</el-button>
    <el-button type="primary" @click="test_update_attr()"
      >test_update_attr
    </el-button>
  </el-row>
  <el-row>
    <!--            鼠标状态：{{ isMouseDown }}-->
  </el-row>
</template>

<script lang="ts" name="Det" setup>
import CanvasSelect from "canvas-select";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { createUuid } from "@/tools/uuid.ts";
import LabelItem from "@/components/LabelItem.vue";
import { ClassValue } from "@/tools/type.ts";
import _ from "lodash";

const classValues: Record<string, ClassValue> = {
  person: {
    value: 0,
    color: "#f00",
    attr: {
      attr1: ["1", "2"],
      attr2: ["3", "4"],
      attr3: ["5", "6"],
    },
  },
  car: {
    value: 1,
    color: "#0000ff",
    attr: {
      attr4: ["11", "12"],
      attr5: ["31", "114"],
      attr6: ["51", "16"],
    },
  },
  truck: {
    value: 2,
    color: "#00ff00",
    attr: {
      attr7: ["1a1", "aa12"],
      attr8: ["3a1", "1a14"],
    },
  },
  bus: {
    value: 3,
    color: "#ff00ff",
  },
};

const props = withDefaults(
  defineProps<{
    imageUrl: string; // 图片 URL
    labels: any[]; // 传入的标注数据
    classValues: Record<string, ClassValue>;
  }>(),
  {
    imageUrl:
      "https://cdn.jsdelivr.net/npm/@heylight/cdn@%5E1/img/onepiece.png",
    labels: () => [
      {
        label: "person",
        coor: [
          [184, 183],
          [275, 238],
        ],
        attr: {
          attr1: "1",
          attr2: "4",
          attr3: "6",
        },
      },
      {
        label: "car",
        coor: [
          [300, 300],
          [400, 400],
        ],
        attr: {
          attr4: "11",
          attr5: "4",
          attr6: "6",
        },
      },
    ],
    classValues: {
      person: {
        value: 0,
        color: "#f00",
        attr: {
          attr1: ["1", "2"],
          attr2: ["3", "4"],
          attr3: ["5", "6"],
        },
      },
      car: {
        value: 1,
        color: "#0000ff",
        attr: {
          attr4: ["11", "12"],
          attr5: ["31", "114"],
          attr6: ["51", "16"],
        },
      },
      truck: {
        value: 2,
        color: "#00ff00",
      },
      bus: {
        value: 3,
        color: "#ff00ff",
      },
    },
  },
);

let labels = reactive(getdata(props.labels));

const canvasRef = ref();
const editRef = ref();

const hideLabelRef = ref(false);
const createType = ref(1);

const classnames = Object.keys(classValues);
const selectClass = ref(classnames[0]);
const instance = ref<CanvasSelect>();

const selectedId = ref<String>("");
const isMouseDown = ref(false);

const maxContent = ref("");
const maxWidth = ref(0);
const referenceEl = ref();

// 检测鼠标是否按下，在按下的状态下不同步dataset
const handleMouseDown = () => {
  isMouseDown.value = true;
};
const handleMouseUp = () => {
  isMouseDown.value = false;
};

function get_classinfo(label: string) {
  let classinfo = classValues[label];
  let labelFillStyle = classinfo["color"];
  let strokeStyle = classinfo["color"];
  let textFillStyle = "#fff";
  return {
    labelFillStyle,
    strokeStyle,
    textFillStyle,
  };
}

// createType
function change_mode(event: PointerEvent) {
  createType.value = 1 - createType.value;
}

const editText = computed(() => (createType.value ? "编辑/移动" : "创建标注"));
watch(createType, (val) => {
  if (instance.value) instance.value.createType = val;
});

// 还原画面大小
function reset_editPanel() {
  if (instance.value) {
    instance.value.fitZoom();
  }
}

// 聚焦模式
function onFocus() {
  if (instance.value) {
    instance.value.setFocusMode(!instance.value.focusMode);
  }
}

const onFocusText = computed(() =>
  instance.value?.focusMode ? "取消聚焦" : "聚焦",
);

// 隐藏标签
function hideLabel() {
  if (!instance.value) {
    return;
  }
  hideLabelRef.value = !hideLabelRef.value;
  let data = instance.value.dataset;
  for (let i = 0; i < data.length; i++) {
    data[i].hideLabel = hideLabelRef.value;
  }
  instance.value?.update();
}

const hideLabelText = computed(() =>
  hideLabelRef.value ? "显示标签" : "隐藏标签",
);

//test
function test_update() {
  if (instance.value) {
    place_data();
  }
}

function test_update_attr() {
  console.log(labels);
}

// 选择标注，有高亮效果
const selectItem = (uuid: string) => {
  selectedId.value = uuid;

  if (instance.value) {
    let dataset = instance.value.dataset;
    for (let i = 0; i < dataset.length; i++) {
      dataset[i].active = dataset[i].uuid === uuid;
    }
    instance.value.update();
  }
};

// 子组件改变分类
function change_class(event: any) {
  // updateLabels(ins.dataset)
  const labelindex = labels.findIndex((item) => item.uuid === event.uuid);
  labels[labelindex].label = event.label;
  for (const innerKey in labels[labelindex].attr) {
    delete labels[labelindex].attr[innerKey]; // 清空属性
  }
  reset_data_item_class(event.uuid, event.label);
}

// 子组件改变属性
function change_attr(event: any) {
  const labelindex = labels.findIndex((item) => item.uuid === event.uuid);
  labels[labelindex].attr = event.attr;
}

// 子组件删除标注
function delete_label(uuid: string) {
  const labelindex = labels.findIndex((item) => item.uuid === uuid);
  if (labelindex === -1) {
    return;
  }

  labels.splice(labelindex, 1);
  if (instance.value) {
    let data = instance.value.dataset;
    let index = data.findIndex((item) => item.uuid === uuid);
    if (index !== -1) {
      data.splice(index, 1);
    }
  }
  if (selectedId.value === uuid) {
    selectedId.value = "";
  }
}

function reset_data_item_class(uuid: string, label: string) {
  if (instance.value === undefined) {
    return;
  }
  let data = instance.value.dataset;
  let index = data.findIndex((item) => item.uuid === uuid);
  if (index !== -1) {
    let { labelFillStyle, strokeStyle, textFillStyle } = get_classinfo(label);
    data[index].labelFillStyle = labelFillStyle;
    data[index].strokeStyle = strokeStyle;
    data[index].textFillStyle = textFillStyle;
    data[index].label = label;
  }
  instance.value.update();
}

//
function getdata(newLabels: any[]) {
  let data = [];
  for (let i = 0; i < newLabels.length; i++) {
    let item = newLabels[i];
    let label = item.label;
    let coor = item.coor;
    let attr = item.attr;
    let uuid = createUuid();
    if (item["uuid"]) {
      uuid = item["uuid"];
    } else {
      item["uuid"] = uuid;
    }
    data.push({
      label,
      coor,
      uuid,
      attr,
    });
  }
  return data;
}

function place_data() {
  if (instance.value === undefined) {
    return;
  }

  if (labels && labels.length > 0) {
    let data = [];
    for (let i = 0; i < labels.length; i++) {
      let item = labels[i];
      let label = item.label;
      let coor = item.coor;
      let uuid = item.uuid;
      let type = 1;
      let { labelFillStyle, strokeStyle, textFillStyle } = get_classinfo(label);

      data.push({
        label,
        coor,
        type,
        labelFillStyle,
        strokeStyle,
        textFillStyle,
        uuid,
      });
    }
    instance.value.setData(data);
  }
}

// 实时从update的数据同步到ref数据
async function waitIfMouseDown(timeout = 5000) {
  if (!isMouseDown.value) {
    return; // 没按下，立刻执行
  }

  return new Promise((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (!isMouseDown.value || Date.now() - start >= timeout) {
        cleanup();
      }
    }, 50);

    const cleanup = () => {
      clearInterval(timer);
    };
  });
}

async function updateLabels(result: any) {
  if (selectedId.value === "") {
    return;
  }
  await waitIfMouseDown();
  let index = result.findIndex((i) => selectedId.value === i.uuid);
  if (index === -1) {
    return;
  }

  labels[index].coor = result[index].coor;
}

const throttledUpdate = _.debounce(updateLabels, 1000);

//

watch(
  () => [props.imageUrl, props.labels],
  ([newImageUrl, newLabels]) => {
    if (instance.value) {
      instance.value.setImage(newImageUrl);
      labels = reactive(getdata(newLabels));
      place_data();
    }
  },
);

// watch
watch(instance, () => {
  if (instance.value) {
    //设置图片
    instance.value.setImage(props.imageUrl);

    //设置初始标注
    instance.value.on("load", () => {
      place_data();
    });

    //设置创建类型
    instance.value.createType = createType.value;

    //挂载事件
    instance.value.on("add", (info: any) => {
      if (classnames.findIndex((item) => item === selectClass.value) == -1) {
        instance.value?.deleteByIndex(info.index);
        return;
      }
      selectedId.value = info.uuid;
      info.label = selectClass.value;
      info.textFillStyle = "#fff";

      let { labelFillStyle, strokeStyle, textFillStyle } = get_classinfo(
        info.label,
      );
      info.labelFillStyle = labelFillStyle;
      info.strokeStyle = strokeStyle;
      info.textFillStyle = textFillStyle;
      info.hideLabel = hideLabelRef.value;

      labels.push({
        label: info.label,
        coor: info.coor,
        uuid: info.uuid,
        attr: {},
      });
    });

    instance.value.on("delete", (info: any) => {
      let index = labels.findIndex((item: any) => item.uuid === info.uuid);
      if (index === -1) {
        return;
      }
      labels.splice(index, 1);
    });

    instance.value.on("select", (info: any) => {
      if (info) {
        selectedId.value = info.uuid;
      } else {
        selectedId.value = "";
      }
    });

    instance.value.on("updated", (result: any) => {
      throttledUpdate(result);
    });
  }
});

onMounted(() => {
  instance.value = new CanvasSelect("canvas");
});

onMounted(async () => {
  // 找最长内容
  maxContent.value = Object.keys(classValues).reduce((a, b) =>
    a.length > b.length ? a : b,
  );

  await nextTick();
  // 计算最长内容宽度
  if (referenceEl.value) {
    maxWidth.value = referenceEl.value.offsetWidth;
  }
});

onMounted(() => {
  let canvas = canvasRef.value;

  canvas.addEventListener("mousedown", (e: PointerEvent) => {
    handleMouseDown();
  });

  canvas.addEventListener("mouseup", (e: PointerEvent) => {
    handleMouseUp();
  });
});
</script>

<style scoped>
.canvas {
  width: 100%;
  height: 100%;
  border: 3px solid #3a3636;
}

.labellist {
  height: 600px;
  background-color: gray;
  overflow: scroll;
  box-sizing: border-box;
}

.card-radio-group {
  display: flex;
  gap: 12px;
}

.card-option {
  text-align: center;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  transition: 0.3s;
  --el-card-padding: 0px 0px 0px 0px;
}

.card-option.active {
  border-color: #0d56a1;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
  background-color: #3076c1;
}

.card-content {
  display: flex;
  align-items: center;
  height: 25px;
  padding: 5px;
}

.color-block {
  width: 20px;
  height: 50px;
  border-radius: 4px 0 0 4px;
}

.text-block {
  flex: 1;
  text-align: left;
  font-weight: bold;
  font-size: 20px;
}

.reference {
  position: absolute;
  visibility: hidden;
  white-space: nowrap;
  font-weight: bold;
  font-size: 20px;
}

.is-selected {
  border: 3px solid #075eb5;
}
</style>
