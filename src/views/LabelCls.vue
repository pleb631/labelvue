<template>
  <el-radio-group v-model="selectClass" class="classlist">
    <el-radio
        v-for="(item, index) in classValues"
        :key="index"
        :label="index">
      {{ index }}
    </el-radio>
  </el-radio-group>
  <el-row :gutter="20" class="mgb20">
    <el-col :span="18">
      <canvas ref="canvasRef" class="canvas"></canvas>
    </el-col>
    <el-col :span="5" class="labellist">
      labellist
      <!--      <LabelItem index="1" :labels="{class:'car'}" uuid="1" :classValues="classValues"></LabelItem>-->
      <LabelItem @change_class="change_class" v-for="(item, index) in labels" :key="item.uuid" :labels="item"
                 :index="index"
                 :classValues="classValues"
                 :class="selectedId === item.uuid ? 'is-selected' : ''"
                 @click="selectItem(item.uuid)"
                 shadow="hover"
      ></LabelItem>
    </el-col>
  </el-row>
  <el-row>
    <el-button ref="editRef" type="primary" @click="change($event)">{{editText}}</el-button>
    <el-button type="primary" @click="fitting()">原始大小</el-button>
    <el-button type="primary" @click="onFocus()">专注模式</el-button>
<!--    <el-button type="primary" @click="hideLabel()">隐藏标签</el-button>-->
  </el-row>
  <el-row>
    鼠标状态：{{ isMouseDown }}
  </el-row>
</template>


<script setup lang="ts" name="Cls">
import CanvasSelect from "canvas-select";
import {onMounted, ref, watch, computed, onUnmounted} from 'vue'
import {createUuid} from "@/tools/uuid.ts";
import LabelItem from "@/components/LabelItem.vue"
import {ClassValue} from "@/tools/type.ts"
import _ from "lodash"

const classValues: Record<string, ClassValue> = {
  person: {
    value: 0,
    color: "#f00",
    attr: {
      attr1: ["1", "2"],
      attr2: ["3", "4"],
      attr3: ["5", "6"],
    }

  },
  car: {
    value: 1,
    color: "#0000ff",
    attr: {
      attr4: ["11", "12"],
      attr5: ["31", "114"],
      attr6: ["51", "16"],
    }

  },
  truck: {
    value: 2,
    color: "#00ff00",

  },
  bus: {
    value: 3,
    color: "#ff00ff",
  },
};

const props = withDefaults(defineProps<{
  imageUrl: string; // 图片 URL
  labels: any[]; // 传入的标注数据

}>(), {
  imageUrl: 'https://cdn.jsdelivr.net/npm/@heylight/cdn@%5E1/img/onepiece.png', labels: () => [
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
      }
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
      }
    },
  ]
})

let imageUrl = ref(props.imageUrl)
let labels = ref(props.labels);
const canvasRef = ref()
const editRef = ref()

let createType = ref(1);
let selectClass = ref(Object.keys(classValues)[0]);
let instance = ref<CanvasSelect | null>(null);

function fitting() {
  // instance.value?.fitZoom()
  if (instance.value) {
    instance.value.fitZoom()
  }

}

// function hideLabel(){
//   // instance.value?.fitZoom()
//   if (instance.value) {
//     instance.value.dataset
//     for (let i = 0; i < instance.value.dataset.length; i++) {
//       instance.value.dataset[i].hideLabel=!instance.value.dataset[i].hideLabel;
//     }
//     instance.value?.update()
//   }
// }


function onFocus() {
  if (instance.value) {
    instance.value.setFocusMode(!instance.value.focusMode);
  }
}

// 检测鼠标是否按下，在按下的状态下不同步dataset
let isMouseDown = ref(false)
const handleMouseDown = () => {
  isMouseDown.value = true
}
const handleMouseUp = () => {
  isMouseDown.value = false
}


const selectedId = ref(null)

const selectItem = (id) => {
  selectedId.value = id
  for (let i = 0; i < labels.value.length; i++) {
    labels.value[i].active=false;
    if (labels.value[i].uuid === id) {
      // createType.value=0;
      labels.value[i].active=true;
    }
  }
  instance.value?.update()
}


onMounted(() => {
  let canvas = canvasRef.value

  canvas.addEventListener('mousedown', (e) => {
    handleMouseDown()
  })

  canvas.addEventListener('mouseup', (e) => {
    handleMouseUp()
  })
})


function change_class(event: any) {
  // updateLabels(ins.dataset)
  let labelindex = labels.value.findIndex((item) => item.uuid === event.uuid)
  labels.value[labelindex].label = event.label;
}

function change(event: PointerEvent) {

  createType.value = 1 - createType.value;

}

const editText = computed(() => createType.value ? "编辑/移动" : "创建标注")


function setupMouseState() {
  const downHandler = () => {
    isMouseDown.value = true
  }
  const upHandler = () => {
    isMouseDown.value = false
  }

  onMounted(() => {
    window.addEventListener('mousedown', downHandler)
    window.addEventListener('mouseup', upHandler)
  })

  onUnmounted(() => {
    window.removeEventListener('mousedown', downHandler)
    window.removeEventListener('mouseup', upHandler)
  })
}

// 这个函数是关键
async function waitIfMouseDown(timeout = 5000) {
  if (!isMouseDown.value) {
    return // 没按下，立刻执行
  }

  return new Promise((resolve) => {
    const start = Date.now()
    const checkMouseUp = () => {
      if (!isMouseDown.value) {
        cleanup()
        resolve()
      }
    }

    const timer = setInterval(() => {
      if (!isMouseDown.value || Date.now() - start >= timeout) {
        cleanup()
        resolve()
      }
    }, 50)

    const mouseUpListener = () => {
      cleanup()
      resolve()
    }

    const cleanup = () => {
      clearInterval(timer)
    }
  })
}


async function updateLabels(result: any) {

  await waitIfMouseDown()
  const list = [...result];
  list.sort((a, b) => a.index - b.index);

  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    let index = labels.value.findIndex((i) => item.uuid === i.uuid);
    if (index === -1) {
      continue;
    }
    labels.value[index].coor = item.coor;
  }
}

const throttledUpdate = _.debounce(updateLabels, 1000)

onMounted(() => {
  let ins = new CanvasSelect('canvas');


  watch(() => [imageUrl.value, labels.value], ([newImageUrl, newLabels]) => {
    if (ins) {
      if (newImageUrl) {
        ins.setImage(newImageUrl);
      }
      if (newLabels) {
        let data = [];
        for (let i = 0; i < newLabels.length; i++) {
          let item = newLabels[i];
          let label = item.label;
          let coor = item.coor;
          let type = 1;
          let classinfo = classValues[label]
          let labelFillStyle = classinfo["color"];
          let strokeStyle = classinfo["color"];
          let textFillStyle = "#fff";
          let active = false;
          let uuid = createUuid();
          if (item["uuid"]) {
            uuid = item["uuid"];
          } else {
            item["uuid"] = uuid;
          }
          if(selectedId.value==item["uuid"]){
            active=true;
          }
          data.push({
            label,
            coor,
            type,
            labelFillStyle,
            strokeStyle,
            textFillStyle,
            uuid,
            active
          });
        }
        ins.setData(data);
      }
    }
  }, {immediate: true, deep: true});

  ins.createType = createType.value;
  watch(createType, (val) => {
    ins.createType = val;
  });


  ins.on("updated", (result) => {

    if (result.length !== labels.value.length) {
      return;
    }

    throttledUpdate(result)


  })

  ins.on("select", (info: any) => {
    if(info){
      selectedId.value = info.uuid;
    }
    else {
      selectedId.value = null;
    }

  })
  ins.on("delete", (info: any) => {
    labels.value = labels.value.filter((item) => item.uuid !== info.uuid);
  })

  ins.on("add", (info: any) => {


    info.label = selectClass.value;
    info.textFillStyle = "#fff";
    let classinfo = classValues[info.label]
    info.labelFillStyle = classinfo["color"];
    info.strokeStyle = classinfo["color"];
    selectedId.value = info.uuid

    labels.value.push({
      label: info.label,
      coor: info.coor,
      uuid: info.uuid
    });
  });

  instance.value = ins;
})


</script>

<style scoped>
.canvas {
  width: 100%;
  height: 100%;
}

.labellist {
  height: 600px;
  background-color: gray;
  overflow: scroll;

}

.is-selected {
  border: 2px solid #409EFF;
}
</style>

