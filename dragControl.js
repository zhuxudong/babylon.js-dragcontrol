/*@author 祝旭东 https://github.com/zhuxudong/workdesk
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
        edge: true,
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
        var _pickInfo = null;
        var _diff = 0;
        // collideTest()
        var pickInfos = _this.getPickInfos(_scene);
        if (pickInfos) {
            edge: for (var i = 0; i < pickInfos.length; i++) {
                // 如果开启了延边检测，沿着最近的那个可拖拽对象移动
                if (_this.opration.edge) {
                    for (var j = 0; j < _this.draggableMeshes.length; j++) {
                        if (pickInfos[i].pickedMesh == _this.draggableMeshes[j]) {
                            _pickInfo = pickInfos[i];
                            break edge;
                        }
                    }
                }
                //如果不开启，则贴边移动
                else if (pickInfos[i].pickedMesh == _this._draggingMesh) {
                    _pickInfo = pickInfos[i];
                    break edge;
                }
            }
        }
        if (_pickInfo && _this._dragStatus) {
            //没有_pointerNow代表物体是拖拽进来的
            if (!_pointerNow) {
                _this._draggingMesh.parent.computeWorldMatrix(true)
                _pointerNow = _this._draggingMesh.parent.position;
                init();
            }
            else {
                _diff = _pickInfo.pickedPoint.subtract(_pointerNow);
                _pointerNow = _pickInfo.pickedPoint.clone();
                _this._draggingMesh.parent.unfreezeWorldMatrix()
                _this._draggingMesh.parent.translate(_diff, 1, BABYLON.Space.WORLD);
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
            console.error("需要调用controls.add(meshes)")
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
            //第一次add mesh且不为DOM
            if (!mesh._diff && !(mesh instanceof Element)) {
                //设置本地轴偏差
                mesh.computeWorldMatrix(true);
                var _diff = mesh.getAbsolutePosition().subtract(mesh.getBoundingInfo().boundingBox.center.clone());
                mesh._diff = _diff;
                mesh.parent = new BABYLON.Mesh.CreateBox(mesh.name + "Parent", 5, scene);
                //如果有parentPosition，则时由进入场景事件触发的add，并不是手动触发
                if (parentPosition) {
                    mesh.parent.position = parentPosition;
                } else {
                    mesh.parent.position = mesh.getBoundingInfo().boundingBox.center.clone()
                }
                mesh.position = mesh._diff;
            }
            //第一次添加DOM且设置了可以拖拽的mesh
            else if ((mesh instanceof Element) && mesh.part && !mesh._active) {
                var _dom = mesh;
                _dom.part = _dom.part.clone(_dom.part.name, null, false)
                //激活dom
                _dom._active = true;
                _dom.addEventListener("mousedown", _onmousedown);
                _this.scene.getEngine().getRenderingCanvas().addEventListener("mousemove", _onmousemove)
            }
            function _onmousedown() {
                //_this._enterScene代表着当前拖拽物体是否进入了拖拽场景中
                _this._enterScene = false;
                //每次按下时候克隆一份dom绑定的mesh并克隆子节点，不需要可以改为true
                var clone = _dom.part.clone(_dom.part.name, null, false);
                //设置为拖拽状态
                _this._draggingMesh = clone;
                _this._dragStatus = true;
            }
            function _onmousemove() {
                var pickInfo = _this.getPickInfo(_this.scene);
                if (pickInfo && _this._dragStatus && !_this._enterScene) {
                    _this._enterScene = true;
                    _this.add(_this._draggingMesh, pickInfo.pickedPoint);
                    _this.scene.addMesh(_this._draggingMesh);
                }
            }
        })
    }
}
