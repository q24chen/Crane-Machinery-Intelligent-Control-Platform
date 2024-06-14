<template>
    <div ref="container" id="scene"></div>
    <dismanteAndInstallVue id="dismanteAndInstallVue" v-if="newDAI" @close="newDAI=false"/>
    <div id="controlTools" v-if="controlToolsVisible">
        <!-- <div class="console"> 控制台 </div> -->
        <div id="show">
            <el-button type="primary"  @click="reinitScene">展示场景</el-button>
            <div id="showEquipment">
                <el-button type="primary"  @click="flyToQizhongji">展示起重机</el-button>
                <el-button type="primary"  @click="flyToLongmendiao">展示龙门吊</el-button>
            </div>
        </div>
        <div id="animation">
            <el-button type="primary"   @click="qizhongjiAnimation">起重机动画</el-button>
            <el-button type="primary"   @click="longmendiaoAnimation">龙门吊动画</el-button>
        </div>
        <div id="warning">
            <el-button type="primary"  @click="qizhongjiWarning">起重机告警</el-button>
            <el-button type="primary"  @click="longmendiaoWarning">龙门吊告警</el-button>
        </div>
        <div id="demonstrate">
            <el-button type="primary"  @click="dismanteAndInstall">龙门吊拆解安装1</el-button>
            <el-button type="primary"  @click="newDismanteAndInstall">龙门吊拆解安装2</el-button>
            <el-button type="primary"  >推演展示</el-button>
        </div>

        <div id="collapse" >
             <el-button icon="CircleClose"  type="primary" @click="toggleControlTools" >关闭控制台</el-button>
        </div>

    </div>

    <div id="openControlTools" v-else>
        <el-button icon="Expand" type="primary" @click="toggleControlTools">打开控制台</el-button>
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
import { onMounted, ref, watchEffect, createApp } from 'vue';
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
import {Water} from '../js/effect/water/Water';

import dismanteAndInstallVue from './dismanteAndInstall.vue';

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

            qzjIntersect.object.material=qzjIntersect.object.material.clone()
            qzjIntersect.object.material.transparent = true
            qzjIntersect.object.material.opacity = 0.5
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

            lmdIntersect.object.material=qzjIntersect.object.material.clone()
            lmdIntersect.object.material.transparent = true
            lmdIntersect.object.material.opacity = 0.5
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
    // console.log(map);

    _this.scene.add(map)
    map.updateMatrixWorld(true)

    _this.initialCameraPosition = new THREE.Vector3(13217647.683697764,81.3206523993604,-3780000.5982026584)
    _this.initialCameraQuaternion = new THREE.Quaternion(-0.09935636840204319, -0.042352654847408355, -0.004232805302502573, 0.9941411610252363)
    _this.initialCameraLookPosition = new THREE.Vector3(13217785, 10, -3780141)
    _this.initialOrbitControlPosition = new THREE.Vector3(13217681.143300202, 11, -3780322.2190029044)

    _this.initialLongmendiaoPosition = new THREE.Vector3(13217630, 10, -3780348)
    _this.initialQizhongjiPosition = new THREE.Vector3(13217740, 10, -3780310)


    _this.camera.position.set(_this.initialCameraPosition.x, _this.initialCameraPosition.y, _this.initialCameraPosition.z)
    _this.camera.quaternion.set(_this.initialCameraQuaternion.x,_this.initialCameraQuaternion.y,_this.initialCameraQuaternion.z,_this.initialCameraQuaternion.w)
    // _this.camera.lookAt(_this.initialCameraLookPosition.x, _this.initialCameraLookPosition.y, _this.initialCameraLookPosition.z);
    _this.oribitControl.target = new THREE.Vector3(_this.initialOrbitControlPosition.x, _this.initialOrbitControlPosition.y, _this.initialOrbitControlPosition.z)

    loadGangkou('model/gangkou11.glb', function (glb) {
        // console.log(glb);
        glb.position.set(13218312, 10, -3781377)
        _this.gangkou = glb
        _this.scene.add(glb)
        const meshAxesHelper0 = new THREE.AxesHelper(50);
        _this.gangkou.add(meshAxesHelper0)

        _this.scene.traverse(function (child){
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })

        const meshAxesHelper1 = new THREE.AxesHelper(50);
        const meshAxesHelper2 = new THREE.AxesHelper(50);

        _this.longmendiao = _this.gangkou.getObjectByName('longmendiao')
        _this.qizhongji = _this.gangkou.getObjectByName('qizhongji')
        _this.initialLongmendiaoPosition = _this.longmendiao.position.clone()
        _this.initialQizhongjiPosition = _this.qizhongji.position.clone()
        _this.gangkou.getObjectByName('Obj3d66-1378886-329-267').receiveShadow = true; //可以接收阴影
        _this.gangkou.getObjectByName('Obj3d66-1378886-336-504').receiveShadow = true; //可以接收阴影
        _this.longmendiao.castShadow = true
        _this.qizhongji.castShadow = true
        console.log(_this.longmendiao.add(meshAxesHelper1));
        console.log(_this.qizhongji.add(meshAxesHelper2));

        _this.qizhongji.dizuo = _this.qizhongji.getObjectByName('obj1')//底座
        _this.qizhongji.diaobi_and_gouzhua = _this.qizhongji.getObjectByName('zhuandong')//吊臂+钩爪组合
        _this.qizhongji.diaobi = _this.qizhongji.getObjectByName('obj3')//吊臂
        _this.qizhongji.gouzhua = _this.qizhongji.getObjectByName('guagou')//钩爪

        _this.longmendiao.menjia = _this.longmendiao.getObjectByName('jisheng')//门架
        _this.longmendiao.diaocang_and_diaogou = _this.longmendiao.getObjectByName('yidong')//吊舱+吊钩组合
        _this.longmendiao.diaocang = _this.longmendiao.getObjectByName('obj')//吊舱
        _this.longmendiao.diaogou = _this.longmendiao.getObjectByName('diaogou')//吊钩

        //更新龙门吊模型矩阵，防止初始化时连线不正确
        _this.longmendiao.traverse(function (child) {
            child.updateMatrix()
            child.updateMatrixWorld(true)
        })
        drawLongmendiaoLine(_this.longmendiao)
        drawQizhongjiLine(_this.qizhongji)

        _this.longmendiaoC = _this.longmendiao.clone()
        _this.longmendiaoC.position.set(0, -10000, -0)
        _this.qizhongjiC = _this.qizhongji.clone()
        _this.qizhongjiC.position.set(0, -10000, -0)


        _this.gangkou.getObjectByName('longmendiao001').traverse(function (child) {child.updateMatrix();child.updateMatrixWorld(true)})
        _this.gangkou.getObjectByName('longmendiao002').traverse(function (child) {child.updateMatrix();child.updateMatrixWorld(true)})
        _this.gangkou.getObjectByName('longmendiao003').traverse(function (child) {child.updateMatrix();child.updateMatrixWorld(true)})
        drawLongmendiaoLine(_this.gangkou.getObjectByName('longmendiao001'))
        drawLongmendiaoLine(_this.gangkou.getObjectByName('longmendiao002'))
        drawLongmendiaoLine(_this.gangkou.getObjectByName('longmendiao003'))
        _this.gangkou.remove(_this.gangkou.getObjectByName('qizhongji001'))
        _this.gangkou.remove(_this.gangkou.getObjectByName('qizhongji002'))
        // drawQizhongjiLine(_this.gangkou.getObjectByName('qizhongji001'))
        // drawQizhongjiLine(_this.gangkou.getObjectByName('qizhongji002'))
        drawQizhongjiLine(_this.gangkou.getObjectByName('qizhongji003'))

        _this.waterMesh=_this.gangkou.getObjectByName('Obj3d66-1378886-358-212')
        console.log(_this.waterMesh);
        const water=new Water(_this.waterMesh.geometry,{
            color: 0xffffff,
            scale: 2,
            flowDirection: new THREE.Vector2( 1, 1),
            textureWidth: 1024*0.5,
            textureHeight: 1024*0.5,
            normal:new THREE.Vector3(0,1,0)
        })
        water.position.set(_this.waterMesh.position.x,_this.waterMesh.position.y+1,_this.waterMesh.position.z)
        _this.gangkou.add(water)

        // const waterPlane=new THREE.Mesh(
        //     _this.waterMesh.geometry.clone(),
        //     new THREE.MeshBasicMaterial({
        //         color:0x08304B,
        //         opacity:1,
        //         //transparent:true,
        //         side: THREE.DoubleSide,
        //         //depthTest:false
        //         depthWrite:false
        //     })
        // )        
        // waterPlane.renderOrder=10000;
        // waterPlane.position.set(_this.waterMesh.position.x,_this.waterMesh.position.y+0.5,_this.waterMesh.position.z)
        // _this.gangkou.add(waterPlane);
        _this.waterMesh.material= new THREE.MeshBasicMaterial({
            color:0x08304B,
            opacity:1,
            //transparent:true,
            side: THREE.DoubleSide,
            //depthTest:false
            depthWrite:false
        })

    })

    // //加载模型
    // loadModel('model/longmendiao.fbx', function (fbx) {
    //     fbx.position.set(_this.initialLongmendiaoPosition.x, _this.initialLongmendiaoPosition.y, _this.initialLongmendiaoPosition.z)
    //     // fbx.rotateY(-(Math.PI/36)*8)

    //     const meshAxesHelper = new THREE.AxesHelper(500000);
    //     fbx.add(meshAxesHelper)

    //     fbx.scale.set(0.00125,0.00125,0.00125)
    //     _this.longmendiao = fbx
    //     _this.longmendiao.castShadow = true
    //     _this.scene.add(_this.longmendiao)

    //     const downPoints = _this.longmendiao.children[0].children[1].children[0].children
    //     const upPoints = _this.longmendiao.children[0].children[1].children
    //     const upPt = [upPoints[4], upPoints[2], upPoints[3], upPoints[1]]
    //     const downPt = [downPoints[3], downPoints[4], downPoints[5], downPoints[6]]

    //     let lineGroup = new THREE.Group()
    //     lineGroup.name = '吊线'
    //     for (let i = 0; i < 4; i++) {
    //         const modifyPosition = downPt[i].position.clone().applyMatrix4(downPoints[0].parent.matrix.clone())//点的位置乘父节点位置才能得到正确的连线位置
    //         drawLine(upPt[i].position, modifyPosition, lineGroup)

    //         upPt[i].isPoint = true
    //         downPt[i].isPoint = true
    //     }

    //     _this.longmendiao.children[0].children[1].add(lineGroup)
    //     console.log(_this.longmendiao);

    //     _this.longmendiaoC = _this.longmendiao.clone()
    //     _this.longmendiaoC.position.set(0, 0, -0)

    //     // const meshAxesHelper = new THREE.AxesHelper(50);
    //     // const points = _this.qizhongji.children[1].children[1].children[0].children
    //     // points[0].add(meshAxesHelper)
    // })
    // loadModel('model/qizhongji.fbx', function (fbx) {
    //     fbx.position.set(_this.initialQizhongjiPosition.x, _this.initialQizhongjiPosition.y, _this.initialQizhongjiPosition.z)
    //     fbx.rotateY((Math.PI/36)*2)
    //     fbx.updateMatrix()
    //     const meshAxesHelper = new THREE.AxesHelper(500000);
    //     fbx.add(meshAxesHelper)

    //     _this.qizhongji = fbx
    //     _this.qizhongji.castShadow = true
    //     _this.scene.add(_this.qizhongji)

    //     let lineGroup = new THREE.Group()
    //     lineGroup.name = '吊线'
    //     const start = _this.qizhongji.children[1].children[1].children[1].position
    //     const points = _this.qizhongji.children[1].children[1].children[0].children
    //     for (let i = 1; i < points.length; i++) {
    //         drawLine(start, points[i].position, lineGroup)

    //         points[i].isPoint = true
    //     }

    //     _this.qizhongji.children[1].children[1].add(lineGroup)
    //     console.log(_this.qizhongji);

    //     _this.qizhongjiC = _this.qizhongji.clone()
    //     _this.qizhongjiC.position.set(0, 0, -0)
    // })


    //初始化告警状态
    _this.originalMaterial = []
    _this.nowWarningObject = null

    //
    _this.intervals = []
}
function loadGangkou(path, callback) {
    const loader = new GLTFLoader()

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
function drawQizhongjiLine(group) {
    let lineGroup = new THREE.Group()
    lineGroup.name = '吊线'
    const start = group.children[1].children[0].children[1].position
    const points = group.children[1].children[0].children[0].children
    for (let i = 1; i < points.length; i++) {
        const modifyPosition = points[i].position.clone().applyMatrix4(points[0].parent.matrix.clone())//点的位置乘父节点位置才能得到正确的连线位置
        drawLine(start, modifyPosition, lineGroup)

        points[i].isPoint = true
    }

    group.children[1].children[0].add(lineGroup)
    // console.log(group);
}
function drawLongmendiaoLine(group) {
    const downPoints = group.children[1].children[0].children[0].children
    const upPoints = group.children[1].children[0].children
    const upPt = [upPoints[1], upPoints[2], upPoints[3], upPoints[4]]
    const downPt = [downPoints[7], downPoints[8], downPoints[9], downPoints[10]]

    let lineGroup = new THREE.Group()
    lineGroup.name = '吊线'
    for (let i = 0; i < 4; i++) {
        const modifyPosition = downPt[i].position.clone().applyMatrix4(downPoints[0].parent.matrix.clone())//点的位置乘父节点位置才能得到正确的连线位置
        drawLine(upPt[i].position, modifyPosition, lineGroup)
        // drawLine(upPt[i].position, downPt[i].position, lineGroup)

        upPt[i].isPoint = true
        downPt[i].isPoint = true
    }

    group.children[1].children[0].add(lineGroup)
    // console.log(group);
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
            _this.oribitControl.update();//强制更新，去除画面抖动
        })
        .start();
}
function flyToQizhongji() {
    const worldPosition = _this.gangkou.localToWorld(_this.qizhongji.position.clone())
    const cameraTarget = new THREE.Vector3(
        worldPosition.x - 100,
        worldPosition.y + 100,
        worldPosition.z + 100,
    )
    const oribitControlTarget = new THREE.Vector3(
        worldPosition.x,
        worldPosition.y * 2,
        worldPosition.z,
    )
    cameraFly(cameraTarget, oribitControlTarget)
    // cameraFly(_this.qizhongji.position, 100)
}
function flyToLongmendiao() {
    const worldPosition = _this.gangkou.localToWorld(_this.longmendiao.position.clone())
    const cameraTarget = new THREE.Vector3(
        worldPosition.x,
        worldPosition.y + 100,
        worldPosition.z + 100,
    )
    const oribitControlTarget = new THREE.Vector3(
        worldPosition.x,
        worldPosition.y * 2,
        worldPosition.z,
    )
    cameraFly(cameraTarget, oribitControlTarget)
    // cameraFly(_this.longmendiao.position, 100)
}
function flyToInitialPosition() {
    _this.camera.position.set(_this.initialCameraPosition.x, _this.initialCameraPosition.y, _this.initialCameraPosition.z)
    _this.camera.quaternion.set(_this.initialCameraQuaternion.x,_this.initialCameraQuaternion.y,_this.initialCameraQuaternion.z,_this.initialCameraQuaternion.w)
    // _this.camera.lookAt(_this.initialCameraLookPosition.x, _this.initialCameraLookPosition.y, _this.initialCameraLookPosition.z);
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
    flyToQizhongji()
    //钩爪下降
    animation(_this.qizhongji.gouzhua, 'move', 'z', 'qizhongji', 0, 12, 1, function () {
        setTimeout(function () {
            //钩爪上升
            animation(_this.qizhongji.gouzhua, 'move', 'z', 'qizhongji', 0, -12, 3, function () {
                //吊臂旋转
                animation(_this.qizhongji.diaobi_and_gouzhua, 'rotate', 'z', 'qizhongji', 0, Math.PI / 2, 12, function () {
                    //钩爪下降
                    animation(_this.qizhongji.gouzhua, 'move', 'z', 'qizhongji', 0, 12, 3, function () {
                        setTimeout(function () {
                            //钩爪上升
                            animation(_this.qizhongji.gouzhua, 'move', 'z', 'qizhongji', 0, -12, 1, function () {
                                //吊臂旋转
                                animation(_this.qizhongji.diaobi_and_gouzhua, 'rotate', 'z', 'qizhongji', 0, -Math.PI / 2, 12, function () {
                                })
                            })
                        }, 500)

                    })
                })
            })
        }, 500)
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
    flyToLongmendiao()
    const point0 = new THREE.Vector3(13217672.206212798, 10.51653706095459, -3780331.115404205)
    const point1 = new THREE.Vector3(13217584.297401546, 10.448353352546064, -3780231.02575377)
    const direction = point1.clone().sub(point0).normalize()
    const target1 = _this.longmendiao.position.clone().add(direction.clone().multiplyScalar(-30))

    //机身移动
    animation(_this.longmendiao, 'vectorMove', 'x', 'longmendiao', _this.longmendiao.position, target1, 3, function () {
        setTimeout(function () {
            //吊舱移动
            animation(_this.longmendiao.diaocang_and_diaogou, 'move', 'x', 'longmendiao', 0, 15, 3, function () {
                //吊钩下降
                animation(_this.longmendiao.diaogou, 'move', 'z', 'longmendiao', 0, 5, 3, function () {
                    //吊钩上升
                    animation(_this.longmendiao.diaogou, 'move', 'z', 'longmendiao', 0, -5, 3, function () {
                        setTimeout(function () {
                            //吊舱复位
                            animation(_this.longmendiao.diaocang_and_diaogou, 'move', 'x', 'longmendiao', 0, -15, 3, function () {
                                const target2 = _this.longmendiao.position.clone().add(direction.clone().multiplyScalar(30))
                                //机身复位
                                animation(_this.longmendiao, 'vectorMove', 'x', 'longmendiao', _this.longmendiao.position, target2, 3, function () {
                                })
                            })
                        }, 500)

                    })
                })
            })
        }, 500)
    })


}

//告警
function qizhongjiWarning() {
    if (_this.nowWarningObject != null) {
        removeWarning()
    }
    removeInformation()

    _this.nowWarningObject = _this.qizhongji.dizuo
    _this.nowWarningObject.traverse(function (child) {
        if (child.isMesh == true) {
            _this.originalMaterial.push(child.material)
        }
    })

    highLight(_this.qizhongji.dizuo, container.value)
    cameraFly(
        new THREE.Vector3(
            _this.qizhongji.dizuo.localToWorld(_this.qizhongji.dizuo.position.clone()).x - 50,
            _this.qizhongji.dizuo.localToWorld(_this.qizhongji.dizuo.position.clone()).y + 50,
            _this.qizhongji.dizuo.localToWorld(_this.qizhongji.dizuo.position.clone()).z + 50
        ),
        _this.qizhongji.dizuo.localToWorld(_this.qizhongji.dizuo.position.clone())
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
    removeInformation()

    _this.nowWarningObject = _this.longmendiao.diaogou
    _this.nowWarningObject.traverse(function (child) {
        if (child.isMesh == true) {
            _this.originalMaterial.push(child.material)
        }
    })

    highLight(_this.longmendiao.diaogou, container.value)
    cameraFly(
        new THREE.Vector3(
            _this.longmendiao.diaogou.localToWorld(_this.longmendiao.diaogou.position.clone()).x ,
            _this.longmendiao.diaogou.localToWorld(_this.longmendiao.diaogou.position.clone()).y + 50,
            _this.longmendiao.diaogou.localToWorld(_this.longmendiao.diaogou.position.clone()).z + 50,
        ),
        _this.longmendiao.diaogou.localToWorld(_this.longmendiao.diaogou.position.clone())
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

    const downPoints = _this.longmendiao.children[1].children[0].children[0].children
    const upPoints = _this.longmendiao.children[1].children[0].children
    const upPt = [upPoints[1], upPoints[2], upPoints[3], upPoints[4]]
    const downPt = [downPoints[7], downPoints[8], downPoints[9], downPoints[10]]
    const pts = [...upPt, ...downPt]
    for (let i = 0; i < 8; i++) {
        pts[i].isPoint = true
    }

    let i = 1000, objects = []
    _this.longmendiao.traverse(function (child) {
        if (child.isMesh == true && !child.hasOwnProperty('isPoint')) {
            let position = child.position
            child.position.set(position.x, position.y, position.z - i)
            child.material.transparent = true
            child.material.opacity = 0.0
            objects.unshift(child)
            // objects.push(child)
            i += 1000
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
                i -= 1000
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
                    }, 500)
                    .onUpdate(function (obj) {
                        objects[j].position.set(obj.x, obj.y, obj.z)
                        objects[j].material.opacity = obj.opacity
                    })
                    .delay(300 * j)
                    .start();
            }
            if (j == objects.length - 1) {
                setTimeout(function () {
                    drawLongmendiaoLine(_this.longmendiao)
                }, 300 * (j + 3));
            }
        }
    }, 3000);

}
const newDAI=ref(false)
function newDismanteAndInstall() {
    newDAI.value=true
}

function animation(group, type1, type2, parent, position0, position1, time, callback) {
    let count = time * 100, stepTime = 10, interval
    if (type1 == 'rotate') {
        const step = (position1 - position0) / count
        interval = window.setInterval(function () {
            count--
            if (count == 0) {
                clearInterval(interval);
                callback()
                return
            }

            if (type2 == 'x') {
                group.rotateX(step)
            }
            else if (type2 == 'y') {
                group.rotateY(step)
            }
            else if (type2 == 'z') {
                group.rotateZ(step)
            }
        }, stepTime)
    }
    if (type1 == 'vectorMove') {
        const stepX = (position1.x - position0.x) / count
        const stepY = (position1.y - position0.y) / count
        const stepZ = (position1.z - position0.z) / count
        interval = window.setInterval(function () {
            count--
            if (count == 0) {
                clearInterval(interval);
                callback()
                return
            }
            let position = group.position
            group.position.set(position.x + stepX, position.y + stepY, position.z + stepZ)
        }, stepTime)
    }
    if (type1 == 'move') {
        const step = (position1 - position0) / count
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
                const diaoxian = _this.qizhongji.getObjectByName('吊线')
                if (diaoxian) {
                    diaoxian.parent.remove(diaoxian)

                    drawQizhongjiLine(_this.qizhongji)
                }
            }
            else if (parent == 'longmendiao') {
                const diaoxian = _this.longmendiao.getObjectByName('吊线')
                if (diaoxian) {
                    diaoxian.parent.remove(diaoxian)
                    drawLongmendiaoLine(_this.longmendiao)
                }
            }


        }, stepTime)
    }
    if (interval) {
        _this.intervals.push(interval)
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

    //改变group的材质
    group.traverse(function (child) {
        if (child.isMesh) {
            child.material = breathOpacity1
        }
    })
}
const breathOpacity1 = new THREE.ShaderMaterial({
    uniforms: {
        opacity: { value: 1.0 }
    },
    vertexShader: `
    //使用内部着色器块增强自定义着色器(三个include,片元着色器同理),解决开启对数深度缓冲区导致的ShaderMaterial渲染错误问题
    #include <common>
    #include <logdepthbuf_pars_vertex>

    varying vec3 vColor;
    void main(){
        vColor = color;
        gl_Position = projectionMatrix*modelViewMatrix*vec4( position, 1.0 );
        #include <logdepthbuf_vertex>
    }
    `,
    fragmentShader: `
    #include <common>
    #include <logdepthbuf_pars_fragment>
        uniform float opacity;
        varying vec3 vColor;
        void main(){
            #include <logdepthbuf_fragment>
            gl_FragColor=vec4(1.0,0.0,0.0,opacity);
        }
    `,
    // side: THREE.DoubleSide,//双面显示 
    vertexColors: true,//允许设置使用顶点颜色渲染
    transparent: true,
    fog: true,
})
let breathOpacity2 = new THREE.MeshLambertMaterial({
    emissive: 0xff0000,
    color: 0xff0000,
    transparent: true,
    opacity: 1.0
})


let opacityAdd = false,timeAdd=true, opacity = 1.0,time=0.0
function uniformChange(deltaTime) {
    if (!opacityAdd) {
        opacity = opacity - deltaTime
        if (opacity <= 0.3) {
            opacityAdd = true
        }
    }
    else {
        opacity = opacity + deltaTime
        if (opacity >= 0.9) {
            opacityAdd = false
        }
    }

    if(timeAdd){
        time=time+deltaTime*10
        if(time>=30.0){
            timeAdd=false
        }
    }
    else{
        time=0.0
        timeAdd=true

    }
}

//清除所有状态
function removeAllStatus() {
    removeWarning()
    removeInformation()
    removeAllAnimation()
    reInitModel()
    flyToInitialPosition()
}
//清除告警状态
function removeWarning() {
    if (_this.nowWarningObject) {
        let i = 0
        _this.nowWarningObject.traverse(function (child) {
            if (child.isMesh) {
                // console.log(child.material);
                child.material = _this.originalMaterial[i];
                // console.log(child.material);
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
//清除所有动画
function removeAllAnimation() {
    _this.intervals.forEach(interval => {
        clearInterval(interval)
    });
}
//重新初始化模型
function reInitModel() {
    _this.gangkou.remove(_this.qizhongji);
    _this.gangkou.remove(_this.longmendiao);
    _this.qizhongji = _this.qizhongjiC.clone()
    _this.longmendiao = _this.longmendiaoC.clone()
    _this.longmendiao.position.set(_this.initialLongmendiaoPosition.x, _this.initialLongmendiaoPosition.y, _this.initialLongmendiaoPosition.z)
    _this.qizhongji.position.set(_this.initialQizhongjiPosition.x, _this.initialQizhongjiPosition.y, _this.initialQizhongjiPosition.z)
    _this.gangkou.add(_this.qizhongji);
    _this.gangkou.add(_this.longmendiao);

    _this.qizhongji.dizuo = _this.qizhongji.getObjectByName('obj1')//底座
    _this.qizhongji.diaobi_and_gouzhua = _this.qizhongji.getObjectByName('zhuandong')//吊臂+钩爪组合
    _this.qizhongji.diaobi = _this.qizhongji.getObjectByName('obj3')//吊臂
    _this.qizhongji.gouzhua = _this.qizhongji.getObjectByName('guagou')//钩爪

    _this.longmendiao.menjia = _this.longmendiao.getObjectByName('jisheng')//门架
    _this.longmendiao.diaocang_and_diaogou = _this.longmendiao.getObjectByName('yidong')//吊舱+吊钩组合
    _this.longmendiao.diaocang = _this.longmendiao.getObjectByName('obj')//吊舱
    _this.longmendiao.diaogou = _this.longmendiao.getObjectByName('diaogou')//吊钩
}

_this.clock = new THREE.Clock()
_this.deltaTime = 0.0

function render() {
    _this.deltaTime = _this.clock.getDelta()

    uniformChange(_this.deltaTime)
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

const controlToolsVisible = ref(false); //展示控制台
function toggleControlTools() {
    controlToolsVisible.value = !controlToolsVisible.value;
}

</script>
<style scoped lang="less">
#scene {
    width: 100%;
    height: 100%;
}
#dismanteAndInstallVue{
    position: absolute;
    width: 800px;
    height: 600px;
    top: calc(50% - 300px);
    left: calc(50% - 400px);
}

#controlTools {
    position: absolute;
    top: 20px;
    left: 0;
    width: 260px;
    height: fit-content;
    z-index: 100;
    display: flex;
    flex-direction: column;
    background-image: url('../assets/blank.png'); 
    background-size: 100% 100%;
    // opacity: 0.5;
    padding-top: 20px;
    padding-bottom: 30px;
    padding-left: 9px;
    // opacity: 0.8;
    // background-position: 20000000px center;
    // padding-left: 30px;

    #show,
    #demonstrate, #collapse {
        width: 100%;
        display: flex;
        flex-direction: column;

        .el-button {
            width: 220px;
            margin-top: 5px;
            margin-left: 10px;
            opacity: 0.8;
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
            opacity: 0.8;
            // background-color:transparent;
        }

    }
}

#openControlTools {
    position: absolute;
    top: 20px;
    left: 0;
    width: 260px;
    height: fit-content;
    z-index: 100;
    display: flex;
    flex-direction: column;
    padding-top: 10px;
    padding-bottom: 20px;
    padding-left: 9px;
    // background-image: url('../assets/blank.png'); 
    background-size: 100% 100%;
    // opacity: 0.5;
    padding-top: 20px;
    padding-bottom: 30px;
    padding-left: 9px;
        .el-button {
            width: 220px;
            margin-top: 5px;
            margin-left: 10px;
            opacity: 0.8;
            // background-color:transparent;
        }
}

#controlTools .el-button {
    // color:black;
    // font-weight: 100;
    border-width: 2px; /* 边框大小 */
    border-color: #11caea; /* 边框颜色 */
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