<script setup lang="ts" name="LabelItem">
import { ref, computed, watch, defineEmits, toRef, toRefs } from "vue";
import { ClassValue } from "@/tools/type.ts";

const emit = defineEmits(["change_class", "change_attr"]);
const props = defineProps<{
  labels: { label: string; attr: { [key: string]: any }; uuid: string };
  index: number;
  classValues: Record<string, ClassValue>;
}>();

let mainValue = ref(props.labels.label);
let subattr = ref({ ...props.labels.attr });
let subSelects = computed(() => props.classValues[mainValue.value]?.attr || {});

watch(props.labels.attr, (newVal) => {
  subattr.value = newVal;
});
watch(
  subattr,
  (newVal) => {
    console.log("Updated subattr:", newVal); // 用来确认更新的内容
    if (newVal) {
      emit("change_attr", { uuid: props.labels.uuid, attr: newVal }); // 发送更新的 attr 给父组件
    }
  },
  { deep: true }
);

watch(mainValue, (newVal) => {
  if (newVal) {
    emit("change_class", { uuid: props.labels.uuid, label: newVal }); // 发送分类选择的更
  }
});
</script>

<template>
  <el-card class="border">
    <el-row>
      <el-col :span="2"> [{{ index + 1 }}] </el-col>
      <el-col :span="18">
        <div>
          <span class="nowarp">分类:</span>
          <el-select v-model="mainValue" placeholder="选择分类">
            <el-option
              v-for="(item, index) in classValues"
              :key="index"
              :label="index"
              :value="index"
            />
          </el-select>
        </div>
        <div v-for="(item, key) in subSelects" :key="key">
          <span class="nowarp">{{ key }}:</span>
          <el-select v-model="subattr[key]" placeholder="选择属性">
            <el-option
              v-for="(option, index) in item"
              :key="index"
              :label="option"
              :value="option"
            />
          </el-select>
        </div>
      </el-col>
      <el-col :span="2">x</el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.border {
  border: 2px solid #000000;
  padding: 5px;
  margin: 5px;
}

.nowarp {
  white-space: nowrap;
}
</style>
