<template>
    <div ref="container" id="scene">
        <div class="close" @click="close">×</div>
    </div>
</template>
<script setup>
import { onMounted, ref, watchEffect, defineEmits } from 'vue';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import TWEEN from '@tweenjs/tween.js';

import Base from '../js/Base';
import Utils from '../js/Utils';

import right from '../assets/skybox/Cartoon Base NightSky_Cam_3_Right-X.png'
import left from '../assets/skybox/Cartoon Base NightSky_Cam_2_Left+X.png'
import top from '../assets/skybox/Cartoon Base NightSky_Cam_4_Up+Y.png'
import bottom from '../assets/skybox/Cartoon Base NightSky_Cam_5_Down-Y.png'
import backe from '../assets/skybox/Cartoon Base NightSky_Cam_1_Back-Z.png'
import front from '../assets/skybox/Cartoon Base NightSky_Cam_0_Front+Z.png'

const emit = defineEmits(['close'])//初始化组件传值

const _this = {}

function init(container) {
    const base = new Base()
    _this.scene = base.initScene();
    const light = base.initLight(_this.scene);
    _this.camera = base.initCamera(_this.scene, container.offsetWidth, container.offsetHeight)
    _this.renderer = base.initRenderer(container.offsetWidth, container.offsetHeight, container)
    _this.oribitControl = base.initOrbitControl(_this.camera, _this.renderer)
    base.initAxesHelper(_this.scene)
    const skyboxCubemap = new THREE.CubeTextureLoader().load([
        right, left, top, bottom, backe, front
    ]);
    _this.scene.background = skyboxCubemap;

    render()

    _this.camera.position.set(150, 150, 150)
    _this.oribitControl.target = new THREE.Vector3(0, 30, 0)

    _this.targetPosition = []
    _this.originalPosition = []
    _this.moveObjects = []

    //加载模型
    loadModel('model/longmendiao_box.fbx', function (fbx) {
        fbx.position.set(0, 0, 0)
        console.log(fbx);

        for (let i = 0; i < 5; i++) {
            fbx.children[i].visible = false
            _this.targetPosition.push(fbx.children[i].position.clone())
        }

        _this.longmendiao = fbx
        _this.scene.add(_this.longmendiao)

        _this.longmendiao.menjia = _this.longmendiao.getObjectByName('jisheng')//门架
        _this.longmendiao.zuozhu = _this.longmendiao.getObjectByName('zhuzi_zuo')//左柱
        _this.longmendiao.youzhu = _this.longmendiao.getObjectByName('zhuzi_you')//右柱
        _this.longmendiao.diaocang = _this.longmendiao.getObjectByName('obj')//吊舱
        _this.longmendiao.diaogou = _this.longmendiao.getObjectByName('diaogou')//吊钩
        _this.originalPosition.push(_this.longmendiao.zuozhu.position.clone())
        _this.originalPosition.push(_this.longmendiao.diaocang.position.clone())
        _this.originalPosition.push(_this.longmendiao.menjia.position.clone())
        _this.originalPosition.push(_this.longmendiao.youzhu.position.clone())
        _this.originalPosition.push(_this.longmendiao.diaogou.position.clone())
        _this.moveObjects.push(_this.longmendiao.zuozhu)
        _this.moveObjects.push(_this.longmendiao.diaocang)
        _this.moveObjects.push(_this.longmendiao.menjia)
        _this.moveObjects.push(_this.longmendiao.youzhu)
        _this.moveObjects.push(_this.longmendiao.diaogou)

        drawLongmendiaoLine(_this.longmendiao)

        // _this.longmendiaoC = _this.longmendiao.clone()
        // _this.longmendiaoC.position.set(0, 0, -0)
        dismanteAndInstall()
    })


}

function dismanteAndInstall() {
    for (let i = 0; i < 5; i++) {
        // _this.moveObjects[i].position.set(_this.targetPosition[i].x, _this.targetPosition[i].y, _this.targetPosition[i].z)

        new TWEEN.Tween({
            x: _this.originalPosition[i].x,
            y: _this.originalPosition[i].y,
            z: _this.originalPosition[i].z,

            opacity: 0
        })
            .to({
                x: _this.targetPosition[i].x,
                y: _this.targetPosition[i].y,
                z: _this.targetPosition[i].z,
                opacity: 1
            }, 1000)
            .onUpdate(function (obj) {
                _this.moveObjects[i].position.set(obj.x, obj.y, obj.z)
            })
            .delay(800)
            .start();

        new TWEEN.Tween({
            x: _this.targetPosition[i].x,
            y: _this.targetPosition[i].y,
            z: _this.targetPosition[i].z,
            opacity: 0
        })
            .to({
                x: _this.originalPosition[i].x,
                y: _this.originalPosition[i].y,
                z: _this.originalPosition[i].z,
                opacity: 1
            }, 1000)
            .onUpdate(function (obj) {
                _this.moveObjects[i].position.set(obj.x, obj.y, obj.z)
            })
            .delay(800 * 4)
            .start();
    }
    const diaoxian = _this.longmendiao.getObjectByName('吊线')
    if (diaoxian) {
        setTimeout(function () {
            diaoxian.parent.remove(diaoxian)
        }, 800)


        setTimeout(function () {
            drawLongmendiaoLine(_this.longmendiao)
        }, 800 * 5.5)

    }
}

//加载模型
function loadModel(path, callback) {
    let loader = new FBXLoader()
    loader.load(path, function (fbx) {
        callback(fbx)
        loader = null
    })
}
function drawLongmendiaoLine(group) {
    const downPoints = group.children[5].children[1].children[0].children
    const upPoints = group.children[5].children[1].children
    const upPt = [upPoints[4], upPoints[2], upPoints[3], upPoints[1]]
    const downPt = [downPoints[3], downPoints[4], downPoints[5], downPoints[6]]

    let lineGroup = new THREE.Group()
    lineGroup.name = '吊线'
    for (let i = 0; i < 4; i++) {
        const modifyPosition = downPt[i].position.clone().applyMatrix4(downPoints[0].parent.matrix.clone())//点的位置乘父节点位置才能得到正确的连线位置
        drawLine(upPt[i].position, modifyPosition, lineGroup)

        upPt[i].isPoint = true
        downPt[i].isPoint = true
    }

    group.children[5].children[1].add(lineGroup)
}
//绘制吊线
function drawLine(start, end, group) {
    const material = new THREE.LineBasicMaterial({
        color: 0x000000
    });
    const points = [
        start,
        end
    ]
    // console.log(points);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material)
    group.add(line)
}


function render() {
    TWEEN.update();

    _this.renderer.render(_this.scene, _this.camera)
    _this.oribitControl.update()
    requestAnimationFrame(render)
}

const isClose = ref(true)
function close() {
    emit('close', isClose.value)//将关闭状态传递给父组件
}

const container = ref(null)//场景容器元素
onMounted(() => {
    init(container.value)
})
</script>
<style scoped lang="less">
// #scene {
//     width: 100%;
//     height: 100%;

.close {
    position: absolute;
    top: -5px;
    right: 0px;
    padding-right: 5px;
    margin: 0px;
    font-size: 24px;
    cursor: pointer;
}

// }
</style>