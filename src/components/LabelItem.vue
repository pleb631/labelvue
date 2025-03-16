<script setup lang="ts" name="LabelItem">

import {onMounted, ref, watch,defineEmits} from 'vue'
import {ClassValue} from "@/tools/type.ts"

const emit = defineEmits(['change_class'])
const props = defineProps<{
  labels: { label: string; [key: string]: any }; // 传入的标注数据
  index: number;
  classValues: Record<string, ClassValue>;
}>()

let mainValue = ref(props.labels.label)
// let subOptionsMap = ref(props.labels);
// let subSelects = ref({});

watch(mainValue, (newVal) => {
  // console.log(newVal);
  if (newVal) {
    emit('change_class', { uuid: props.labels.uuid, label: newVal})
    // subSelects.value = props.classValues[newVal]; // 重置子下拉框的值

  }
});

</script>

<template>
  <el-card class="border">
    <el-row>
      <el-col :span="2">
        {{ index+1 }}
      </el-col>
      <el-col :span="10">
        <div>
          <p>分类</p>
          <el-select
              v-model="mainValue"
              placeholder="选择分类"
          >
            <el-option
                v-for="(item, index) in classValues"
                :key="index"
                :label="index"
                :value="index"
            />
          </el-select>
        </div>
<!--        <div v-for="(value, index) in subSelects" :key="index">-->
<!--          <el-select v-model="subSelects[index]" placeholder="选择属性">-->
<!--            <el-option v-for="option in subOptionsMap[mainValue]" :key="option.value" :label="option.label"-->
<!--                       :value="option.value"/>-->
<!--          </el-select>-->
<!--        </div>-->
      </el-col>
      <el-col :span="2">

      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.border {
  border: 2px solid #000000;
  padding: 5px;
  margin: 5px;
}

</style>