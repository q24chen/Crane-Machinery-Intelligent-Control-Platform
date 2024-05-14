import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module"

export default class Base {
    constructor() {

    }
    /**
     * 初始化场景
     */
    initScene() {
        const scene = new THREE.Scene();
        return scene;
    }
    /**
     * 初始化灯光
     * @param {*} scene 
     */
    initLight(scene) {
        const light = new THREE.AmbientLight(0xffffff, 0.5);//环境光
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xA4D6F7, 5);//顶光
        directionalLight.position.set(0, 10000, 0);
        directionalLight.castShadow = true; // 设置平行光投射投影

        const intensity = 2.0;
        const color = 0xffffff;
        const directionalLight1 = new THREE.DirectionalLight(color, intensity);
        directionalLight1.position.set(10000, 10000, 0);

        const directionalLight2 = new THREE.DirectionalLight(color, intensity);
        directionalLight2.position.set(0, 10000, 10000);

        // const directionalLight3 = new THREE.DirectionalLight(color, intensity);
        // directionalLight3.position.set(0, -10000, -10000);

        // const directionalLight4 = new THREE.DirectionalLight(color, intensity);
        // directionalLight4.position.set(0, -10000, 10000);

        
        let directionalLightGroup = new THREE.Group();
        directionalLightGroup.add(directionalLight)
        directionalLightGroup.add(directionalLight1)
        directionalLightGroup.add(directionalLight2)

        scene.add(directionalLightGroup);


        // return new THREE.Group();
        // return directionalLightGroup;
        // return directionalLight
    }
    /**
     * 初始化相机
     * @param {*} scene 
     * @param {*} width 
     * @param {*} height 
     */
    initCamera(scene, width, height) {
        const camera = new THREE.PerspectiveCamera(40, width / height, 1, 40000000);
        scene.add(camera);
        return camera;
    }
    /**
     * 初始化控制器
     * @param {*} camera 
     * @param {*} render 
     */
    initOrbitControl(camera, render) {
        const control = new OrbitControls(camera, render.domElement);
        control.enableDamping = false;
        control.screenSpacePanning = false;
        control.minPolarAngle = 0;
        control.maxPolarAngle = Math.PI / 18 * 9;
        control.target = new THREE.Vector3(0, 0, 0);
        //control.autoRotate = true;
        control.update();
        return control;
    }
    /**
     * 初始化渲染器
     * @param {*} width 
     * @param {*} height 
     */
    initRenderer(width, height, container) {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,//抗锯齿
            //precision: "lowp",//着色器精度
            alpha: true,//默认透明度
            //premultipliedAlpha: false,//是否假设颜色已经设置了Alpha
            // preserveDrawingBuffer: true //是否保存绘图缓冲
            logarithmicDepthBuffer: true//是否使用对数深度缓冲区
        });
        //renderer.setClearColor( 0xff0000);
        //renderer.setClearColorHex(0xFFFFFF, 1.0);
        renderer.setSize(width, height, container);
        renderer.autoClear = false;//是否清除上一帧输出

        renderer.sortObjects = true//是否对对象排序
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        //renderer.toneMapping = THREE.ReinhardToneMapping;
        container.appendChild(renderer.domElement);
        // renderer.gammaInput = true;//如果设置了该参数，表示所有纹理和颜色应当使用预乘的gamma值来输入。
        // renderer.gammaOutput = true;
        renderer.shadowMap.enabled = true;//场景阴影映射
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        return renderer;
    }
    /**
     * 初始化坐标轴辅助
     * @param {*} scene 
     */
    initAxesHelper(scene) {
        const axesHelper = new THREE.AxesHelper(100000);
        scene.add(axesHelper);
    }
    /**
     * 初始化帧数显示
     * @param {*} scene 
     */
    initStats(container) {
        const stats = new Stats();
        //document.getElementById("container").appendChild( stats.dom );
        container.appendChild(stats.dom);
        return stats;
    }

}
