import * as THREE from 'three'
export default class Utils {

}
/**
 * 获取相机信息
 * @param {*} camera 相机
 */
Utils.getCameraInfo = function (camera) {
    let quaternion = "quaternion:" + "{x:" + camera.quaternion.x + ",y:" + camera.quaternion.y + ",z:" + camera.quaternion.z + ",w:" + camera.quaternion.w + "}";
    let position = "postion:" + "{x:" + camera.position.x + ",y:" + camera.position.y + ",z:" + camera.position.z + "}";
    console.log(camera);
    console.log("{" + position + "," + quaternion + "},");
}
/**
 * 获取鼠标事件触发位置的相交对象
 * @param {*} container 场景容器
 * @param {*} camera 相机
 * @param {*} event 鼠标事件
 * @param {*} groups 相交对象组
 * @param {*} recursive 是否递归
 */
Utils.getIntersectByMouse = function (container,camera,event, groups, recursive) {
    const mouse = {};
    mouse.x = (event.clientX / container.offsetWidth) * 2 - 1;
    mouse.y = -(event.clientY / container.offsetHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    //从groups中找出与射线相交的
    const intersects = raycaster.intersectObject(groups, recursive);
    if (intersects.length > 0) {      
        return intersects[0];
    }
    return null;
}