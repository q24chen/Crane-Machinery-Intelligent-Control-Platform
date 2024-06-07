<template>
    <div ref="container" id="scene"></div>
    <div id="controlTools">
        <div id="show">
            <el-button type="primary" @click="reinitScene">展示场景</el-button>
            <div id="showEquipment">
                <el-button type="primary" @click="flyToQizhongji">展示起重机</el-button>
                <el-button type="primary" @click="flyToLongmendiao">展示龙门吊</el-button>
            </div>
        </div>
        <div id="animation">
            <el-button type="primary" @click="qizhongjiAnimation">起画</el-button>
            <el-button type="primary" @click="longmendiaoAnimation">龙门吊动画</el-button>
        </div>
        <div id="warning">
            <el-button type="primary" @click="qizhongjiWarning">起重机告警</el-button>
            <el-button type="primary" @click="longmendiaoWarning">龙门吊告警</el-button>
        </div>
        <div id="demonstrate">
            <el-button type="primary" @click="dismanteAndInstall">龙门吊拆解安装</el-button>
            <el-button type="primary">推演展示</el-button>
        </div>

    </div>
    <div id="info">
        <div id="warningInfo" v-show="warningCheck">
            <div class="title">告警信息</div>
            <div class="close" @click="closeText('warningInfo')">×</div>
            <el-table :data="warningInfo" border style="width: 100%" :show-header="false">
                <el-table-column prop="type" />
                <el-table-column prop="content" />
            </el-table>
        </div>
        <div id="equipmentInfo" v-show="equipmentInfoCheck">
            <div class="title">设备信息</div>
            <div class="close" @click="closeText('equipmentInfo')">×</div>
            <el-table :data="equipmentInfo" border style="width: 100%" :show-header="false">
                <el-table-column prop="type" />
                <el-table-column prop="content" />
            </el-table>
        </div>
    </div>
</template>
<script setup>
import { onMounted, ref, watchEffect } from 'vue';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

import * as Map from 'geo-three';
import TWEEN from '@tweenjs/tween.js';

import UrlTileProvider from '../js/UrlTileProvider';
import Base from '../js/Base';
import Utils from '../js/Utils';

//天空盒图片
// import App  from '../../node_modules';
import right from '../assets/skybox/Cartoon Base NightSky_Cam_3_Right-X.png'
import left from '../assets/skybox/Cartoon Base NightSky_Cam_2_Left+X.png'
import top from '../assets/skybox/Cartoon Base NightSky_Cam_4_Up+Y.png'
import bottom from '../assets/skybox/Cartoon Base NightSky_Cam_5_Down-Y.png'
import backe from '../assets/skybox/Cartoon Base NightSky_Cam_1_Back-Z.png'
import front from '../assets/skybox/Cartoon Base NightSky_Cam_0_Front+Z.png'

const _this = {}


let renderPass, outlinePass, composer;
function init(container) {
    const base = new Base()
    _this.scene = base.initScene();
    const light = base.initLight(_this.scene);
    _this.camera = base.initCamera(_this.scene, container.offsetWidth, container.offsetHeight)
    _this.renderer = base.initRenderer(container.offsetWidth, container.offsetHeight, container)
    _this.oribitControl = base.initOrbitControl(_this.camera, _this.renderer)
    base.initAxesHelper(_this.scene)
    const skyboxCubemap = new THREE.CubeTextureLoader().load([
        // '../assets/skybox/Cartoon Base NightSky_Cam_3_Right-X.png', // right
        // '../assets/skybox/Cartoon Base NightSky_Cam_2_Left+X.png', // left
        // '../assets/skybox/Cartoon Base NightSky_Cam_4_Up+Y.png', // top
        // '../assets/skybox/Cartoon Base NightSky_Cam_5_Down-Y.png', // bottom
        // '../assets/skybox/Cartoon Base NightSky_Cam_1_Back-Z.png', // back
        // '../assets/skybox/Cartoon Base NightSky_Cam_0_Front+Z.png'  // front
        right, left, top, bottom, backe, front
    ]);
    _this.scene.background = skyboxCubemap;

    window.onresize = function () {
        // 重新设置相机宽高比例
        _this.camera.aspect = container.offsetWidth / container.offsetHeight;
        // 更新相机投影矩阵
        _this.camera.updateProjectionMatrix();
        // 重新设置渲染器渲染范围
        _this.renderer.setSize(container.offsetWidth, container.offsetHeight);

    };

    container.addEventListener('mousedown', function (event) {
        if (container.mouseDownPt) {
            container.mouseDownPt.x = event.clientX;
            container.mouseDownPt.y = event.clientY;
        } else {
            container.mouseDownPt = { x: event.clientX, y: event.clientY };
        }
        //按下右键
        if (event.button == 2) {
            console.log(_this.camera);
            Utils.getCameraInfo(_this.camera)
        }
    })
    container.addEventListener('click', function (event) {
        event.preventDefault();
        //鼠标的移动大于5个像素，被认为不是点击
        if (Math.abs(event.clientX - container.mouseDownPt.x) > 5 || Math.abs(event.clientY - container.mouseDownPt.y) > 5) {
            return;
        }
        const intersects = Utils.getIntersectByMouse(container, _this.camera, event, _this.scene, true)
        if (intersects.object.isMesh == true && !intersects.object.hasOwnProperty("x")) {
            console.log(intersects);
        }

        const qzjIntersect = Utils.getIntersectByMouse(container, _this.camera, event, _this.qizhongji, true)
        if (qzjIntersect) {
            removeInformation()
            equipmentInfoCheck.value = true
            equipmentInfo = [
                {
                    type: '设备名：',
                    content: '单臂式起重机',

                },
                {
                    type: '型号：',
                    content: 'DB-QZJ-34Dfa',

                },
                {
                    type: '设备编号：',
                    content: 'TJY-24426',
                },
                {
                    type: '最大起重量(吨)：',
                    content: '34.0',
                },
            ]
        }
        const lmdIntersect = Utils.getIntersectByMouse(container, _this.camera, event, _this.longmendiao, true)
        if (lmdIntersect) {
            removeInformation()
            equipmentInfoCheck.value = true
            equipmentInfo = [
                {
                    type: '设备名：',
                    content: '门式起重机',

                },
                {
                    type: '型号：',
                    content: 'DB-MSQZJ-78Tga',

                },
                {
                    type: '设备编号：',
                    content: 'TJY-18239',
                },
                {
                    type: '最大起重量(吨)：',
                    content: '78.0',
                },
            ]
        }
    })

    renderPass = new RenderPass(_this.scene, _this.camera)
    outlinePass = new OutlinePass(new THREE.Vector2(container.offsetWidth, container.offsetHeight), _this.scene, _this.camera)
    composer = new EffectComposer(_this.renderer)
    composer.addPass(renderPass);


    render()

    //加载地图
    // const map=new Map.MapView(
    //     Map.MapView.PLANAR,
    //     new Map.OpenStreetMapsProvider()
    // )
    const map = new Map.MapView(
        Map.MapView.PLANAR,
        new UrlTileProvider(
            {
                minZoom: 0,
                maxZoom: 16,
                // url: 'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
                url: 'http://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
            }
        )
    );
    map.name = 'Map'
    // const initPosition = Map.UnitsUtils.datumsToSpherical(32, 118)//第一个参数是纬度
    // console.log(initPosition);
    console.log(map);

    _this.scene.add(map)
    map.updateMatrixWorld(true)

    _this.initialCameraPosition = new THREE.Vector3(13217785.82643542, 195.32863035323572, -3780141.465246376)
    _this.initialCameraLookPosition = new THREE.Vector3(13217785, 10, -3780141)
    _this.initialOrbitControlPosition = new THREE.Vector3(13217727, 10, -3780408)

    _this.initialLongmendiaoPosition = new THREE.Vector3(13217630, 10, -3780348)
    _this.initialQizhongjiPosition = new THREE.Vector3(13217740, 10, -3780310)


    _this.camera.position.set(_this.initialCameraPosition.x, _this.initialCameraPosition.y, _this.initialCameraPosition.z)
    _this.camera.lookAt(_this.initialCameraLookPosition.x, _this.initialCameraLookPosition.y, _this.initialCameraLookPosition.z);
    // _this.camera.quaternion.set(-0.24347504414351884, -0.34533697302271027, -0.09326426827398515, 0.9015342778875031)
    _this.oribitControl.target = new THREE.Vector3(_this.initialOrbitControlPosition.x, _this.initialOrbitControlPosition.y, _this.initialOrbitControlPosition.z)

    loadGangkou('model/gangkou6.glb', function (glb) {
        console.log(glb);
        glb.position.set(13218312, 10, -3781377)
        _this.gangkou = glb
        glb.receiveShadow = true; //可以接收阴影
        _this.scene.add(glb)
    })
    //加载模型
    loadModel('model/longmendiao.fbx', function (fbx) {
        fbx.position.set(_this.initialLongmendiaoPosition.x, _this.initialLongmendiaoPosition.y, _this.initialLongmendiaoPosition.z)
        // fbx.rotateY(-(Math.PI/36)*8)

        const meshAxesHelper = new THREE.AxesHelper(500000);
        fbx.add(meshAxesHelper)

        fbx.scale.set(0.00125, 0.00125, 0.00125)
        _this.longmendiao = fbx
        _this.longmendiao.castShadow = true
        _this.scene.add(_this.longmendiao)

        const downPoints = _this.longmendiao.children[0].children[1].children[0].children
        const upPoints = _this.longmendiao.children[0].children[1].children
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

        _this.longmendiao.children[0].children[1].add(lineGroup)
        console.log(_this.longmendiao);

        _this.longmendiaoC = _this.longmendiao.clone()
        _this.longmendiaoC.position.set(0, 0, -0)

        // const meshAxesHelper = new THREE.AxesHelper(50);
        // const points = _this.qizhongji.children[1].children[1].children[0].children
        // points[0].add(meshAxesHelper)
    })
    loadModel('model/qizhongji.fbx', function (fbx) {
        fbx.position.set(_this.initialQizhongjiPosition.x, _this.initialQizhongjiPosition.y, _this.initialQizhongjiPosition.z)
        fbx.rotateY((Math.PI / 36) * 2)
        fbx.updateMatrix()
        const meshAxesHelper = new THREE.AxesHelper(500000);
        fbx.add(meshAxesHelper)

        _this.qizhongji = fbx
        _this.qizhongji.castShadow = true
        _this.scene.add(_this.qizhongji)

        let lineGroup = new THREE.Group()
        lineGroup.name = '吊线'
        const start = _this.qizhongji.children[1].children[1].children[1].position
        const points = _this.qizhongji.children[1].children[1].children[0].children
        for (let i = 1; i < points.length; i++) {
            drawLine(start, points[i].position, lineGroup)

            points[i].isPoint = true
        }

        _this.qizhongji.children[1].children[1].add(lineGroup)
        console.log(_this.qizhongji);

        _this.qizhongjiC = _this.qizhongji.clone()
        _this.qizhongjiC.position.set(0, 0, -0)
    })


    //初始化告警状态
    _this.originalMaterial = []
    _this.nowWarningObject = null
}
function loadGangkou(path, callback) {
    const loader = new GLTFLoader()
    console.log(loader);

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('../../node_modules/three/examples/jsm/libs/draco/')
    const ktx2Loader = new KTX2Loader()
    ktx2Loader.setTranscoderPath('../../node_modules/three/examples/jsm/libs/basis/')
    ktx2Loader.detectSupport(_this.renderer)

    loader.setDRACOLoader(dracoLoader)
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.setKTX2Loader(ktx2Loader)

    loader.load(path, function (gltf) {
        callback(gltf.scene)
        // loader=null
    })
}
//加载模型
function loadModel(path, callback) {
    let loader = new FBXLoader()
    loader.load(path, function (fbx) {
        callback(fbx)
        loader = null
    })
}
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

//恢复初始场景
function reinitScene() {
    removeAllStatus();
}

//相机飞行
function cameraFly(cameraTarget, oribitControlTarget,) {
    new TWEEN.Tween({
        // 相机开始坐标
        x: _this.camera.position.x,
        y: _this.camera.position.y,
        z: _this.camera.position.z,
        // 相机开始指向的目标观察点
        lx: _this.oribitControl.target.x,
        ly: _this.oribitControl.target.y,
        lz: _this.oribitControl.target.z,

    })
        .to({
            // 相机结束坐标
            x: cameraTarget.x,
            y: cameraTarget.y,
            z: cameraTarget.z,
            // 相机结束指向的目标观察点
            lx: oribitControlTarget.x,
            ly: oribitControlTarget.y,
            lz: oribitControlTarget.z,
        }, 1000)
        .onUpdate(function (obj) {
            // 动态改变相机位置
            _this.camera.position.set(obj.x, obj.y, obj.z);
            // 动态计算相机视线
            _this.oribitControl.target.set(obj.lx, obj.ly, obj.lz)

        })
        .start();
}
function flyToQizhongji() {
    const cameraTarget = new THREE.Vector3(
        _this.qizhongji.position.x - 100,
        _this.qizhongji.position.y + 100,
        _this.qizhongji.position.z + 100,
    )
    const oribitControlTarget = new THREE.Vector3(
        _this.qizhongji.position.x,
        _this.qizhongji.position.y / 2,
        _this.qizhongji.position.z,
    )
    cameraFly(cameraTarget, oribitControlTarget)
    // cameraFly(_this.qizhongji.position, 100)
}
function flyToLongmendiao() {
    const cameraTarget = new THREE.Vector3(
        _this.longmendiao.position.x + 100,
        _this.longmendiao.position.y + 100,
        _this.longmendiao.position.z + 100,
    )
    const oribitControlTarget = new THREE.Vector3(
        _this.longmendiao.position.x,
        _this.longmendiao.position.y,
        _this.longmendiao.position.z,
    )
    cameraFly(cameraTarget, oribitControlTarget)
    // cameraFly(_this.longmendiao.position, 100)
}
function flyToInitialPosition() {
    _this.camera.position.set(_this.initialCameraPosition.x, _this.initialCameraPosition.y, _this.initialCameraPosition.z)
    _this.camera.lookAt(_this.initialCameraLookPosition.x, _this.initialCameraLookPosition.y, _this.initialCameraLookPosition.z);
    // _this.camera.quaternion.set(-0.24347504414351884, -0.34533697302271027, -0.09326426827398515, 0.9015342778875031)
    _this.oribitControl.target = new THREE.Vector3(_this.initialOrbitControlPosition.x, _this.initialOrbitControlPosition.y, _this.initialOrbitControlPosition.z)

    // const position = new THREE.Vector3(13218094, 189, -3781134)
    // _this.oribitControl.target =  new THREE.Vector3(13218312, 0, -3781377)
    // const targetPosition = position.clone().addScalar(100);
    // new TWEEN.Tween({
    //         // 相机开始坐标
    //         x: _this.camera.position.x,
    //         y: _this.camera.position.y,
    //         z: _this.camera.position.z,
    //         // 相机开始指向的目标观察点
    //         tx: _this.camera.position.x,
    //         ty: _this.camera.position.y,
    //         ty: _this.camera.position.z,
    //     })
    //     .to({
    //         // 相机结束坐标
    //         x: targetPosition.x,
    //         y: targetPosition.y,
    //         z: targetPosition.z,
    //         // 相机结束指向的目标观察点
    //         tx: position.x,
    //         ty: position.y,
    //         tz: position.z,
    //     }, 2000)
    //     .onUpdate(function (obj) {
    //         // 动态改变相机位置
    //         _this.camera.position.set(obj.x, obj.y, obj.z);
    //         // 动态计算相机视线
    //         // _this.camera.lookAt(obj.tx, obj.ty, obj.tz);
    //         _this.camera.quaternion.set(-0.24347504414351884, -0.34533697302271027, -0.09326426827398515, 0.9015342778875031)
    //     })
    //     .start();
}


//动画
function qizhongjiAnimation() {
    animation(_this.qizhongji.children[1], 'rotate', 'y', 'qizhongji', 0, Math.PI * 2, 3, function () {
        animation(_this.qizhongji.children[1].children[1], 'rotate', 'y', 'qizhongji', 0, Math.PI * 2, 3, function () {
            animation(_this.qizhongji.children[1].children[1].children[0], 'move', 'y', 'qizhongji', 0, -10, 3, function () { })
        })
    })

    // const group=_this.qizhongji.children[1].children[1].children[0]
    // new TWEEN.Tween({
    //     x: group.position.x,
    //     y: group.position.y,
    //     z: group.position.z,

    // })
    //     .to({
    //         x: group.position.x,
    //         y: group.position.y-10,
    //         z: group.position.z,

    //     }, 2000)
    //     .onUpdate(function (obj) {
    //         // 动态改变相机位置
    //         group.position.set(obj.x, obj.y, obj.z);
    //         // 动态计算相机视线
    //         // _this.camera.lookAt(obj.tx, obj.ty, obj.tz);
    //         const diaoxian = _this.qizhongji.children[1].children[1].getObjectByName('吊线')
    //         if (diaoxian) {
    //             diaoxian.parent.remove(diaoxian)
    //             // group.parent.traverse(function (child) {
    //             //     child.updateMatrix()
    //             //     child.updateMatrixWorld(true)
    //             // })

    //             let lineGroup = new THREE.Group()
    //             lineGroup.name = '吊线'
    //             const start = _this.qizhongji.children[1].children[1].children[1].position
    //             const points = _this.qizhongji.children[1].children[1].children[0].children

    //             const parentMatrix=_this.qizhongji.children[1].children[1].matrix
    //             for (let i = 1; i < points.length; i++) {
    //                 const modifyPosition=points[i].position.clone().applyMatrix4(group.matrix)//点的位置乘父节点位置才能得到正确的连线位置
    //                 drawLine(start, modifyPosition, lineGroup)
    //             }

    //             _this.qizhongji.children[1].children[1].add(lineGroup)
    //         }
    //     })
    //     .start();
}
function longmendiaoAnimation() {
    animation(_this.longmendiao, 'move', 'z', 'longmendiao', 0, 100, 3, function () {
        animation(_this.longmendiao.children[0], 'move', 'x', 'longmendiao', 0, 10000, 3, function () {
            animation(_this.longmendiao.children[0].children[1].children[0], 'move', 'y', 'longmendiao', 0, 10000, 3, function () { })
        })
    })



}

//告警
function qizhongjiWarning() {
    if (_this.nowWarningObject != null) {
        removeWarning()
    }

    _this.nowWarningObject = _this.qizhongji.children[1]
    _this.nowWarningObject.traverse(function (child) {
        if (child.isMesh == true) {
            _this.originalMaterial.push(child.material)
        }
    })

    highLight(_this.qizhongji.children[1], container.value)
    cameraFly(
        new THREE.Vector3(
            _this.qizhongji.children[1].localToWorld(_this.qizhongji.children[1].position.clone()).x - 100,
            _this.qizhongji.children[1].localToWorld(_this.qizhongji.children[1].position.clone()).y + 100,
            _this.qizhongji.children[1].localToWorld(_this.qizhongji.children[1].position.clone()).z + 100
        ), 
        _this.qizhongji.position
    )

    warningCheck.value = true
    warningInfo = [
        {
            type: '告警源：',
            content: '吊臂',

        },
        {
            type: '告警原因：',
            content: '机械臂故障',
        },
    ]
}
function longmendiaoWarning() {
    if (_this.nowWarningObject != null) {
        removeWarning()
    }

    _this.nowWarningObject = _this.longmendiao.children[0]
    _this.nowWarningObject.traverse(function (child) {
        if (child.isMesh == true) {
            _this.originalMaterial.push(child.material)
        }
    })

    highLight(_this.longmendiao.children[0], container.value)
    cameraFly(
        new THREE.Vector3(
            _this.longmendiao.children[0].localToWorld(_this.longmendiao.children[0].position.clone()).x + 100,
            _this.longmendiao.children[0].localToWorld(_this.longmendiao.children[0].position.clone()).y + 100,
            _this.longmendiao.children[0].localToWorld(_this.longmendiao.children[0].position.clone()).z + 100,
        ),
        _this.longmendiao.position
    )

    warningCheck.value = true
    warningInfo = [
        {
            type: '告警源：',
            content: '吊钩',

        },
        {
            type: '告警原因：',
            content: '吊钩轮组故障',
        },
    ]
}

//拆解安装动画
function dismanteAndInstall() {
    removeAllStatus()
    const downPoints = _this.longmendiao.children[0].children[1].children[0].children
    const upPoints = _this.longmendiao.children[0].children[1].children
    const upPt = [upPoints[4], upPoints[2], upPoints[3], upPoints[1]]
    const downPt = [downPoints[3], downPoints[4], downPoints[5], downPoints[6]]
    const pts = [...upPt, ...downPt]
    for (let i = 0; i < 8; i++) {
        pts[i].isPoint = true
    }

    let i = 10000, objects = []
    _this.longmendiao.traverse(function (child) {
        if (child.isMesh == true && !child.hasOwnProperty('isPoint')) {
            let position = child.position
            child.position.set(position.x, position.y, position.z - i)
            child.material.transparent = true
            child.material.opacity = 0.0
            objects.unshift(child)
            i += 10000
        }
        if (child.name == '吊线') {
            child.parent.remove(child)
        }

    })
    flyToLongmendiao()
    console.log(objects);
    setTimeout(function () {
        for (let j = 0; j < objects.length; j++) {
            if (objects[j].isMesh == true) {
                i -= 10000
                let position = objects[j].position.clone()

                new TWEEN.Tween({
                    x: position.x,
                    y: position.y,
                    z: position.z,
                    opacity: 0
                })
                    .to({
                        x: position.x,
                        y: position.y,
                        z: position.z + i,
                        opacity: 1
                    }, 1000)
                    .onUpdate(function (obj) {
                        // 动态改变相机位置
                        objects[j].position.set(obj.x, obj.y, obj.z)
                        objects[j].material.opacity = obj.opacity
                    })
                    .delay(500 * j)
                    .start();
            }
            if (j == objects.length - 1) {
                setTimeout(function () {
                    const downPoints = _this.longmendiao.children[0].children[1].children[0].children
                    const upPoints = _this.longmendiao.children[0].children[1].children
                    const upPt = [upPoints[4], upPoints[2], upPoints[3], upPoints[1]]
                    const downPt = [downPoints[3], downPoints[4], downPoints[5], downPoints[6]]

                    let lineGroup = new THREE.Group()
                    lineGroup.name = '吊线'
                    for (let i = 0; i < 4; i++) {
                        const modifyPosition = downPt[i].position.clone().applyMatrix4(downPoints[0].parent.matrix.clone())//点的位置乘父节点位置才能得到正确的连线位置
                        drawLine(upPt[i].position, modifyPosition, lineGroup)
                    }


                    _this.longmendiao.children[0].children[1].add(lineGroup)
                }, 500 * (j + 3));
            }
        }
    }, 3000);

}

function animation(group, type1, type2, parent, position0, position1, time, callback) {
    let count = 200, interval
    if (type1 == 'rotate') {
        const step = (position1 - position0) / (time * count)
        interval = window.setInterval(function () {
            count--
            if (count == 0) {
                clearInterval(interval);
                callback()
                return
            }
            group.rotateY(step)
        }, time / 1000)
    }
    if (type1 == 'move') {
        const step = (position1 - position0) / (time * count)
        interval = window.setInterval(function () {
            count--
            if (count == 0) {
                clearInterval(interval);
                callback()
                return
            }
            let position = group.position
            if (type2 == 'x') {
                group.position.set(position.x + step, position.y, position.z)
            }
            else if (type2 == 'y') {
                group.position.set(position.x, position.y + step, position.z)
            }
            else if (type2 == 'z') {
                group.position.set(position.x, position.y, position.z + step)
            }

            if (parent == 'qizhongji') {
                const diaoxian = _this.qizhongji.children[1].children[1].getObjectByName('吊线')
                if (diaoxian) {
                    diaoxian.parent.remove(diaoxian)

                    let lineGroup = new THREE.Group()
                    lineGroup.name = '吊线'
                    const start = _this.qizhongji.children[1].children[1].children[1].position
                    const points = _this.qizhongji.children[1].children[1].children[0].children
                    for (let i = 1; i < points.length; i++) {
                        const modifyPosition = points[i].position.clone().applyMatrix4(group.matrix)//点的位置乘父节点位置才能得到正确的连线位置
                        drawLine(start, modifyPosition, lineGroup)
                    }

                    _this.qizhongji.children[1].children[1].add(lineGroup)
                }
            }
            else if (parent == 'longmendiao') {
                const diaoxian = _this.longmendiao.children[0].children[1].getObjectByName('吊线')
                if (diaoxian) {
                    diaoxian.parent.remove(diaoxian)

                    const downPoints = _this.longmendiao.children[0].children[1].children[0].children
                    const upPoints = _this.longmendiao.children[0].children[1].children
                    const upPt = [upPoints[4], upPoints[2], upPoints[3], upPoints[1]]
                    const downPt = [downPoints[3], downPoints[4], downPoints[5], downPoints[6]]

                    let lineGroup = new THREE.Group()
                    lineGroup.name = '吊线'
                    for (let i = 0; i < 4; i++) {
                        const modifyPosition = downPt[i].position.clone().applyMatrix4(downPoints[0].parent.matrix.clone())//点的位置乘父节点位置才能得到正确的连线位置
                        drawLine(upPt[i].position, modifyPosition, lineGroup)
                    }


                    _this.longmendiao.children[0].children[1].add(lineGroup)
                }
            }


        }, time / 1000)
    }
}

let warningInfo = [
    {
        type: '告警源：',
        content: '吊臂',

    },
    {
        type: '告警原因：',
        content: '机械臂故障',
    },
]
let equipmentInfo = [
    {
        type: '设备名：',
        content: '单臂式起重机',

    },
    {
        type: '型号：',
        content: 'DB-QZJ-34Dfa',

    },
    {
        type: '设备编号：',
        content: 'TJY-24426',
    },
    {
        type: '最大起重量(吨)：',
        content: '34.0',
    },
]
let warningCheck = ref(false)
let equipmentInfoCheck = ref(false)
function closeText(type) {
    if (type == 'warningInfo') {
        warningCheck.value = false
    }
    else if (type == 'equipmentInfo') {
        equipmentInfoCheck.value = false
    }
}



function highLight(group) {
    //后处理高亮描边闪烁
    // outlinePass.selectedObjects = [group]
    // outlinePass.visibleEdgeColor.set(0xff0000);
    // outlinePass.edgeThickness = 4; //高亮发光描边厚度
    // outlinePass.edgeStrength = 6;    //高亮描边发光强度
    // outlinePass.pulsePeriod = 2; //模型闪烁频率控制，默认0不闪烁

    // const gammaPass = new ShaderPass(GammaCorrectionShader);//gamma矫正
    // //获取.setPixelRatio()设置的设备像素比
    // const pixelRatio = _this.renderer.getPixelRatio();
    // // width、height是canva画布的宽高度
    // const smaaPass = new SMAAPass(container.offsetWidth * pixelRatio, container.offsetHeight * pixelRatio);
    // composer.addPass(gammaPass);
    // // composer.addPass(smaaPass);
    // composer.addPass(outlinePass)

    console.log(group);
    //改变group的材质
    group.traverse(function (child) {
        if (child.isMesh) {
            child.material = breathOpacity2
        }
    })
}
const breathOpacity1 = new THREE.ShaderMaterial({
    uniforms: {
        opacity: { value: 1.0 }
    },
    vertexShader: `
    varying vec3 vColor;
    void main(){
        vColor = color;
        gl_Position = projectionMatrix*modelViewMatrix*vec4( position, 1.0 );
    }
    `,
    fragmentShader: `
        uniform float opacity;
        varying vec3 vColor;
        void main(){
            gl_FragColor=vec4(vColor,1.0);
            // gl_FragColor=vec4(1.0,0.0,0.0,opacity);
        }
    `,
    side: THREE.DoubleSide,//双面显示 
    vertexColors: true,//允许设置使用顶点颜色渲染
})
let breathOpacity2 = new THREE.MeshLambertMaterial({
    emissive: 0xff0000,
    color: 0xff0000,
    transparent: true,
    opacity: 1.0
})

let add = false, opacity = 1.0
function opacityChange(deltaTime) {

    if (!add) {
        opacity = opacity - deltaTime
        if (opacity <= 0.3) {
            add = true
        }
    }
    else {
        opacity = opacity + deltaTime
        if (opacity >= 0.9) {
            add = false
        }
    }
}

//清除所有状态
function removeAllStatus() {
    removeWarning()
    removeInformation()
    reInitModel()
    flyToInitialPosition()
}
//清除告警状态
function removeWarning() {
    if (_this.nowWarningObject) {
        let i = 0
        _this.nowWarningObject.traverse(function (child) {
            if (child.isMesh) {
                console.log(child.material);
                child.material = _this.originalMaterial[i];
                console.log(child.material);
                i++;
            }
        })
        //清空当前告警对象信息
        _this.originalMaterial = []
        _this.nowWarningObject = null
    }
    //清空所有告警状态
    warningCheck.value = false
    warningInfo = []
}
//清除信息显示
function removeInformation() {
    //清空所有信息显示
    equipmentInfoCheck.value = false
    equipmentInfo = []
}
//重新初始化模型
function reInitModel() {
    _this.scene.remove(_this.qizhongji);
    _this.scene.remove(_this.longmendiao);
    _this.qizhongji = _this.qizhongjiC.clone()
    _this.longmendiao = _this.longmendiaoC.clone()
    _this.longmendiao.position.set(_this.initialLongmendiaoPosition.x, _this.initialLongmendiaoPosition.y, _this.initialLongmendiaoPosition.z)
    _this.qizhongji.position.set(_this.initialQizhongjiPosition.x, _this.initialQizhongjiPosition.y, _this.initialQizhongjiPosition.z)
    _this.scene.add(_this.qizhongji);
    _this.scene.add(_this.longmendiao);
}

_this.clock = new THREE.Clock()
_this.deltaTime = 0.0

function render() {
    _this.deltaTime = _this.clock.getDelta()

    opacityChange(_this.deltaTime)
    if (breathOpacity1 && breathOpacity2) {
        breathOpacity1.uniforms.opacity.value = opacity
        breathOpacity2.opacity = opacity
    }

    TWEEN.update();

    _this.renderer.render(_this.scene, _this.camera)
    _this.oribitControl.update()
    requestAnimationFrame(render)
}

function renderHighLight() {
    _this.renderer.render(_this.scene, _this.camera)
    composer.render()
    _this.oribitControl.update()
    requestAnimationFrame(renderHighLight)
}

const container = ref(null)//场景容器元素
onMounted(() => {
    init(container.value)
})

</script>
<style scoped lang="less">
#scene {
    width: 100%;
    height: 100%;
}

#controlTools {
    position: absolute;
    top: 0;
    left: 0;
    width: 240px;
    height: fit-content;
    z-index: 100;
    display: flex;
    flex-direction: column;

    #show,
    #demonstrate {
        width: 100%;
        display: flex;
        flex-direction: column;

        .el-button {
            width: 220px;
            margin-top: 5px;
            margin-left: 10px;
        }
    }

    #showEquipment,
    #animation,
    #warning {
        width: 100%;
        display: flex;
        flex-direction: row;

        .el-button {
            width: 105px;
            margin-top: 5px;
            margin-left: 10px;
        }

    }
}

#info {
    position: absolute;
    top: 0;
    right: 0;
    width: 240px;
    height: fit-content;
    z-index: 100;
    margin: 8px;

    #warningInfo {
        .title {
            color: red;
            background-color: salmon;
            width: 100%;
            height: 40px;
            font-size: larger;
            font-weight: bolder;
            text-align: center;
            /* 水平居中 */
            padding-top: 5px;
        }

        .close {
            position: absolute;
            top: 0px;
            right: 0px;
            padding-top: 0px;
            margin: 0px;
            font-size: 24px;
            cursor: pointer;
        }
    }

    #equipmentInfo {
        .title {
            color: white;
            background-color: rgba(64, 158, 254);
            width: 100%;
            height: 40px;
            font-size: larger;
            font-weight: bolder;
            text-align: center;
            /* 水平居中 */
            padding-top: 5px;
        }

        .close {
            position: absolute;
            top: 0px;
            right: 0px;
            padding-top: 0px;
            margin: 0px;
            font-size: 24px;
            cursor: pointer;
        }
    }

}
</style>