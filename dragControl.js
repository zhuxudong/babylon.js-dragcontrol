/*@author 祝旭东 https://github.com/zhuxudong/babylon.js-dragcontrol
 *@time 2017/3/12
 *BABYLON.JS V2.5
 *
 * 使用方法
 * var control=new DragControl(scene,{option...});
 *
 * 添加需要拖拽的物体(支持单个mesh，数组形式)
 * control.add(mesh)
 *
 * 将需要可以拖拽的DOM设置mesh保存到DOM的part中
 * dom.part=mesh;
 *
 * 添加需要可以拖拽的DOM(支持单个DOM，数组，HTMLCollection格式)
 * control.add(dom)
 *
 *
 * */
function DragControl(_scene, custom) {
    var _this = this;
    var _canvas = _scene.getEngine().getRenderingCanvas()
    var _default =
    {
        // edge: true,
        drawOutline: true,
        outlineColor: new BABYLON.Color3(0, 1, 1),
        outlineWidth: 200,
        //outlineColor: new BABYLON.Color4(1, 0, 0,1),
        keyUp: "ArrowUp",
        keyDown: "ArrowDown",
        keyLeft: "ArrowLeft",
        keyRight: "ArrowRight",
        //centralRotation:true
    }
    _this.scene = _scene;
    _this.opration = Object.assign(_default, custom);
    _this.draggableMeshes = [];
    _this._draggingMesh = null;
    _this._dragStatus = false;
    var _positionStart = null;
    var _pointerNow = null;

    function init() {
        if (_this.opration.drawOutline) {
             //_this._draggingMesh.renderOutline = true;
             //_this._draggingMesh.outlineWidth = _this.opration.outlineWidth;
             //_this._draggingMesh.outlineColor = _this.opration.outlineColor;
            _this._draggingMesh.enableEdgesRendering()
            _this._draggingMesh.edgesColor = _this.opration.outlineColor;
            _this._draggingMesh.edgesWidth = _this.opration.outlineWidth;
        }
    }
    function dispose() {
        // _this._draggingMesh.renderOutline = false;
        _this._draggingMesh.disableEdgesRendering();
        _this._dragStatus = false;
        _this._draggingMesh = null;
        _positionStart = null;
        _pointerNow = null;
        _scene.activeCamera.attachControl(_canvas, true);
    }

    function collideTest() {
        var ground = _scene.getMeshByName("ground");
        if (_scene.getMeshByName("test").intersectsMesh(ground, true)) {
            ground.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
            // _dragStatus = false;
        } else {
            ground.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            // _dragStatus = true;
        }
    }
    function onmousedown(e) {
        var pickInfo = _this.getPickInfo(_scene);
        if (pickInfo && e.button == 0) {
            _this.draggableMeshes.forEach(function (mesh) {
                if (pickInfo.pickedMesh == mesh) {
                    console.log("当前拾取目标:"+mesh.name)
                    _this._draggingMesh = mesh;
                    _pointerNow = pickInfo.pickedPoint.clone();
                    _this._dragStatus = true;
                    _positionStart = mesh.getAbsolutePosition();
                    _this._draggingMesh.unfreezeWorldMatrix();
                    _scene.activeCamera.detachControl(_canvas, false);
                    init();
                }
            })
        }
    }

    function onmousemove() {
        var _diff = 0;
        var _pickInfo=null;
        // collideTest()
        if(_this._dragStatus){
            if( (_pickInfo=_this.getPickInfo(_scene))&&_this._draggingMesh._initParent){
                //没有_pointerNow代表物体是拖拽进来的
                if(!_pointerNow){
                    _this._draggingMesh.parent.computeWorldMatrix(true)
                    //防止先后顺序
                    _pointerNow = _this._draggingMesh.parent.position;
                    init();
                }
                else{
                    _diff = _pickInfo.pickedPoint.subtract(_pointerNow);
                    _pointerNow = _pickInfo.pickedPoint.clone();
                    _this._draggingMesh.parent.unfreezeWorldMatrix()
                    _this._draggingMesh.parent.translate(_diff, 1, BABYLON.Space.WORLD);
                }
            }
        }
    }

    function onmouseup() {
        if (_this._dragStatus) {
            dispose();
        }
    }

    function customRotate(step) {
        var _rotationY = 0;
        //每次按键都要更新父元素
        if (_this._draggingMesh.parent && _this._draggingMesh.parent.name.match(/Parent/)) {
            _rotationY = _this._draggingMesh.parent.rotation.y;
        }
        else {
            console.error("需要先调用controls.add(meshes)")
        }
        _this._draggingMesh.parent.rotation.y = step + _rotationY;

    }

    function onkeydown(e) {
        if (_this._dragStatus) {
            switch (e.code) {
                case _this.opration.keyUp:
                {
                    _this._draggingMesh.parent.translate(_scene.activeCamera.position.subtract(_pointerNow).normalize(), -10, BABYLON.Space.WORLD);
                }
                    break;
                case _this.opration.keyDown:
                {
                    _this._draggingMesh.parent.translate(_scene.activeCamera.position.subtract(_pointerNow).normalize(), 10, BABYLON.Space.WORLD);
                }
                    break;
                case _this.opration.keyLeft:
                {
                    customRotate(Math.PI / 2);
                }
                    break;
                case _this.opration.keyRight:
                {
                    customRotate(-Math.PI / 2);
                }
                    break;
            }
        }

    }
    //keydown事件的target会随着点击物体的变化而变化，所以只能直接绑定在window上
    window.addEventListener("keydown", onkeydown);
    _canvas.addEventListener("mousedown", onmousedown);
    _canvas.addEventListener("mousemove", onmousemove);
    _canvas.addEventListener("mouseup", onmouseup)
}

DragControl.prototype = {
    _init: function iterator(meshes) {
        var _this = this;
        if (meshes instanceof Array) {
            meshes.forEach(function (mesh) {
                iterator.call(_this, mesh)
            })
        } else if (!(meshes instanceof Element)) {
            _this.draggableMeshes.push(meshes)
        }
    },
    getPickInfo: function (scene) {
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY)
        return pickInfo.hit ? pickInfo : null;
    },
    getPickInfos: function (scene) {
        var pickInfos = scene.multiPick(scene.pointerX, scene.pointerY);
        return pickInfos ? pickInfos : null;
    },
    add: function (meshes, parentPosition) {
        var _this = this;
        this._init(meshes);
        (meshes instanceof HTMLCollection ? [].slice.call(meshes) : [].concat.call(meshes)).forEach(function (mesh) {
            //不为dom的情况
            if (!(mesh instanceof Element)) {
                mesh.parent = new BABYLON.Mesh.CreateBox(mesh.name +"Parent", 20, scene);
                //mesh.parent.isVisible=false;
                mesh._initParent=true;
                //如果有parentPosition，则时由进入场景事件触发的add，并不是手动触发
                if (parentPosition) {
                    mesh.parent.position = parentPosition;
                }
                //防止重复add了同一个mesh
                else if(!mesh._diff){
                    mesh.computeWorldMatrix(true);
                    var _center=mesh.getBoundingInfo().boundingBox.center.clone();
                    var _diff = mesh.position.subtract(_center);
                    mesh.parent.position =_center;
                    mesh._diff = _diff;
                }
                mesh.position = mesh._diff;
            }
            //第一次添加DOM且设置了可以拖拽的mesh
            else if ((mesh instanceof Element) && mesh.part && !mesh._active) {
                var _dom = mesh;
                //添加clone防止原mesh被dispose
                if(!_dom.part){console.error("请设置dom.part=mesh!")};
                var clone= _dom.part.clone(_dom.part.name,null,false);
                clone._diff=_dom.part._diff;
                _this.scene.removeMesh(clone);
                _dom.part=clone;
                //激活dom防止重复添加DOM
                _dom._active = true;
                _dom.addEventListener("mousedown", _onmousedown);
                _this.scene.getEngine().getRenderingCanvas().addEventListener("mousemove", _onmousemove)
            }
            function _onmousedown() {
                //每次按下时候克隆一份dom绑定的mesh并克隆子节点，不需要可以改为true
                var clone = _dom.part.clone(_dom.part.name, null, false);
                //将本地偏移量保存到拷贝的对象中
                clone._diff=_dom.part._diff;
                //先隐藏拷贝的对象
                clone.isVisible=false;
                _this._draggingMesh = clone;
                _this._dragStatus = true;
                //第一次进入场景时才进行复制
                _this._draggingMesh._copy=true;
            }
            function _onmousemove() {
                if(_this._dragStatus&& _this._draggingMesh._copy){
                    var pickInfo = _this.getPickInfo(_this.scene);
                    if (pickInfo) {
                        _this._draggingMesh._copy=false;
                        _this.add(_this._draggingMesh, pickInfo.pickedPoint);
                        //拖入场景中再进行显示
                        _this._draggingMesh.isVisible=true;
                    }
                }
            }
        })
    }
}
