<script setup>
import Card from "@/components/MdCard.vue";
import { ref, onMounted, onBeforeUnmount, onUnmounted, watch } from "vue";
import "@mdui/icons/autorenew--rounded.js";
import "@mdui/icons/do-not-disturb-alt--rounded.js";
import "@mdui/icons/explore.js";
import "@mdui/icons/done--rounded.js";
import { snackbar } from "mdui/functions/snackbar.js";

import { Abracadabra } from "abracadabra-cn";

const InputMode = ref("TEXT");
const OutputMode = ref("TEXT");
const ShowPWAButton = ref(true);
const ForceEnc = ref(false);
const ForceDec = ref(false);
const ForceEncq = ref(false);
const FileCardColor = ref("#5b6169");
var dropzoneActive = false;
var filess = ref(new Array());
const INFILE = ref(null);
const FILENAME = ref("");

watch(
  () => filess.value[0],
  (newFile) => {
    INFILE.value = newFile;
    FILENAME.value = newFile.name;
    window.inputfile = newFile;
  }
);

function fileToUint8Array(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      // 当FileReader读取操作完成时，event.target.result将包含读取的结果
      const uint8Array = new Uint8Array(event.target.result);
      resolve(uint8Array);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file); // 读取文件内容，结果为ArrayBuffer
  });
}
function uint8ArrayToFile(uint8Array, fileName, mimeType) {
  const blob = new Blob([uint8Array], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}
/**
 * 处理拖拽区域的拖入事件
 * @param {Event} event - 拖入事件对象
 */
function dragEnter(event) {
  event.preventDefault();
  dropzoneActive = true;
  document.getElementById("FileCard").style.background = "#6ea0be";
}
/**
 * 处理拖拽区域的拖离事件
 * @param {Event} event - 拖离事件对象
 */
function dragLeave(event) {
  event.preventDefault();
  dropzoneActive = false;
  document.getElementById("FileCard").style.background = "#5b6169";
}
/**
 * 处理拖拽区域的拖放事件
 * @param {Event} event - 拖放事件对象
 */
function dragOver(event) {
  event.preventDefault();
}
/**
 * 处理文件的拖放上传
 * @param {Event} event - 拖放事件对象
 */
function dropFile(event) {
  event.preventDefault();
  dropzoneActive = false;
  document.getElementById("FileCard").style.background = "#5b6169";
  const files = event.dataTransfer.files;
  handleFiles(files);
}
/**
 * 处理选择文件按钮的上传事件
 * @param {Event} event - 选择文件事件对象
 */
function selectFile(event) {
  const files = event.target.files;
  handleFiles(files);
  //console.log(files);
}
function triggers(event) {
  document.querySelector("#fileIn").click();
}
/**
 * 处理上传的文件列表
 * @param {FileList} files - 文件列表
 */
function handleFiles(files) {
  filess.value = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    filess.value.push(file);
    // 在这里可以执行文件上传的相关操作
  }
}

const isPWA = () => {
  const displayModes = ["fullscreen", "standalone", "minimal-ui"];
  const matchesPwa = displayModes.some(
    (displayMode) => window.matchMedia("(display-mode: " + displayMode + ")").matches
  );
  return matchesPwa || window.navigator?.standalone || document.referrer.includes("android-app://");
};

function ControlEnc() {
  if (document.getElementById("ForceEnc").checked == true) {
    document.getElementById("ForceDec").disabled = true;
    document.getElementById("ForceDec").checked = false;
    ForceEnc.value = true;
    ForceDec.value = false;
  } else if (document.getElementById("ForceDec").checked == true) {
    document.getElementById("ForceEnc").disabled = true;
    document.getElementById("Forceq").disabled = true;
    document.getElementById("ForceEnc").checked = false;
    ForceEnc.value = false;
    ForceDec.value = true;
  } else {
    document.getElementById("ForceDec").disabled = false;
    document.getElementById("ForceEnc").disabled = false;
    document.getElementById("Forceq").disabled = false;
    ForceEnc.value = false;
    ForceDec.value = false;
  }
}
function ControlEncq() {
  if (document.getElementById("Forceq").checked == true) {
    ForceEncq.value = true;
  } else {
    ForceEncq.value = false;
  }
}

async function KeyEnter() {
  document.getElementById("KeyCard").blur();
  await ProcessGo();
}

async function ProcessGo() {
  let Abra = new Abracadabra(InputMode.value, OutputMode.value);
  let key;
  try {
    if (InputMode.value == "TEXT") {
      if (document.getElementById("InputCard").value == "") {
        return;
      }
      if (document.getElementById("KeyCard").value == "") {
        key = "ABRACADABRA";
        snackbar({
          message: "没有填写魔咒，自动使用默认魔咒",
          autoCloseDelay: 1500
        });
      } else {
        key = document.getElementById("KeyCard").value;
      }
      if (ForceEnc.value) {
        if (ForceEncq.value) {
          Abra.Input(document.getElementById("InputCard").value, "ENCRYPT", key, true);
        } else {
          Abra.Input(document.getElementById("InputCard").value, "ENCRYPT", key, false);
        }
      } else if (ForceDec.value) {
        Abra.Input(document.getElementById("InputCard").value, "DECRYPT", key);
      } else {
        Abra.Input(document.getElementById("InputCard").value, "AUTO", key, ForceEncq.value);
      }
    } else if (InputMode.value == "UINT8") {
      if (window.inputfile == undefined || window.inputfile == null) {
        return;
      }
      if (document.getElementById("KeyCard").value == "") {
        key = "ABRACADABRA";
        snackbar({
          message: "没有填写魔咒，自动使用默认魔咒",
          autoCloseDelay: 1500
        });
      } else {
        key = document.getElementById("KeyCard").value;
      }
      let FileU = await fileToUint8Array(window.inputfile);
      if (ForceEnc.value) {
        if (ForceEncq.value) {
          Abra.Input(FileU, "ENCRYPT", key, true);
        } else {
          Abra.Input(FileU, "ENCRYPT", key, false);
        }
      } else if (ForceDec.value) {
        Abra.Input(FileU, "DECRYPT", key);
      } else {
        Abra.Input(FileU, "AUTO", key, ForceEncq.value);
      }
    }
    if (OutputMode.value == "TEXT") {
      document.getElementById("OutputText").value = Abra.Output();
    } else if (OutputMode.value == "UINT8") {
      let OutUint = Abra.Output();
      let FileOut = uint8ArrayToFile(OutUint, "Abracadabra_Result", "application/octet-stream");

      let aTag = document.createElement("a"); //创建一个a标签
      aTag.download = FileOut.name;
      let href = URL.createObjectURL(FileOut); //获取url
      aTag.href = href;
      aTag.click();
      URL.revokeObjectURL(href); //释放url
    }
  } catch (err) {
    snackbar({
      message: "发生错误, " + err.toString()
    });
  }
}

function copyall() {
  if (document.getElementById("OutputText").value == "") {
    return;
  }
  document.getElementById("OutputText").select();
  navigator.clipboard.writeText(window.getSelection().toString());
}

onMounted(() => {
  if (isPWA()) {
    ShowPWAButton.value = false;
  }
  ControlEnc();
});
onBeforeUnmount(() => {});
</script>

<template>
  <Card id="FunctionCard">
    <div
      id="MainContainer"
      style="display: grid; grid-template-rows: 80px 150px 80px; grid-gap: 7px"
    >
      <mdui-text-field
        id="InputCard"
        v-if="InputMode == 'TEXT'"
        variant="outlined"
        rows="2"
        label="话语"
        placeholder="你渴求吟唱的话语"
        style="grid-area: 1; height: 80px; width: 360px"
      ></mdui-text-field>
      <Card
        v-if="InputMode == 'UINT8'"
        id="FileCard"
        Background="#5b6169"
        Width="360px"
        Height="80px"
        :Other="{ 'grid-area': 1, transition: 'all 1s ease' }"
        clickable
        @dragenter="dragEnter"
        @dragleave="dragLeave"
        @dragover="dragOver"
        @drop="dropFile"
        @click="triggers"
      >
        <h1 style="align-self: center; justify-self: center">选择文件</h1>
        <p style="align-self: center; justify-self: center">拖拽或点击</p>
        <p style="align-self: center; justify-self: center; margin-bottom: 0">{{ FILENAME }}</p>
        <input type="file" id="fileIn" style="display: contents" @change="selectFile" />
      </Card>
      <div id="controlBar" style="grid-area: 2; display: grid; grid-template-columns: 360px">
        <mdui-text-field
          @keydown.enter="KeyEnter"
          id="KeyCard"
          variant="outlined"
          rows="1"
          label="魔咒"
          placeholder="将一切雪藏的魔咒"
          style="grid-column: span 3; align-self: center; width: 360px"
        ></mdui-text-field>
        <mdui-button
          icon="arrow_downward--rounded"
          @click="ProcessGo"
          full-width
          style="align-self: center"
          >吟唱你的魔法</mdui-button
        >
      </div>
      <mdui-text-field
        v-if="OutputMode == 'TEXT'"
        id="OutputText"
        variant="outlined"
        rows="4"
        label="符文"
        placeholder="回路末端的符文"
        style="grid-area: 3; height: 120px; width: 360px"
      >
      </mdui-text-field>
      <mdui-button-icon
        icon="content_copy--rounded"
        style="
          position: absolute;
          bottom: 95px;
          right: 22px;
          background: rgb(11 11 11 / 25%);
          backdrop-filter: blur(2px);
        "
        @click="copyall"
      ></mdui-button-icon>
      <Card
        v-if="OutputMode == 'UINT8'"
        id="FileCard2"
        Background="#5b6169"
        Width="360px"
        Height="120px"
        :Other="{ 'grid-area': 3, transition: 'all 1s ease' }"
      >
        <h1 style="align-self: center; justify-self: center">输出文件</h1>
      </Card>
      <div id="CopyrightBadger" style="grid-area: 4; display: grid; grid-template-columns: 50% 50%">
        <p
          style="
            position: relative;
            width: fit-content;
            height: fit-content;
            top: 60px;
            font-size: 1rem;
            font-variant: petite-caps;
            text-align: left;
            padding: 6px;
            border-radius: inherit;
            margin: 0px;
          "
        >
          Abracadabra V2.5.2<br /><a href="https://github.com/SheepChef/Abracadabra">Github Repo</a>
        </p>
        <p
          style="
            position: relative;
            width: fit-content;
            height: fit-content;
            top: 98px;
            font-size: 1rem;
            font-variant: petite-caps;
            text-align: left;
            padding: 0px;
            border-radius: inherit;
            margin: 0px;
            right: 4px;
            justify-self: end;
            opacity: 0.5;
          "
        >
          SheepChef ©
        </p>
      </div>
    </div>
  </Card>
  <Card id="FloatCard">
    <div id="CryptControl">
      <span style="align-self: center; justify-self: right; margin-right: 0px">雪藏话语</span>
      <mdui-switch
        id="ForceEnc"
        style="align-self: center; justify-self: left"
        unchecked-icon="hdr_auto--rounded"
        checked-icon="auto_awesome--rounded"
        @change="ControlEnc"
      ></mdui-switch>
      <span style="align-self: center; justify-self: right; margin-right: 0px">探求真意</span>
      <mdui-switch
        id="ForceDec"
        style="align-self: center; justify-self: left"
        unchecked-icon="hdr_auto--rounded"
        checked-icon="auto_awesome--rounded"
        @change="ControlEnc"
      ></mdui-switch>
      <span style="align-self: center; justify-self: right; margin-right: 0px">去除标志</span>
      <mdui-switch
        id="Forceq"
        checked-icon="auto_awesome--rounded"
        style="align-self: center; justify-self: left"
        @change="ControlEncq"
      ></mdui-switch>
    </div>
  </Card>
  <div id="PositionOccupie"></div>
</template>
<style scoped></style>
