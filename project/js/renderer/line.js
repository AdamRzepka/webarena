goog.require('base.Model');
goog.require('base.Mesh');
goog.require('base.Vec3');
goog.require('base.Mat4');
goog.require('renderer');
goog.require('renderer.Renderer');

goog.provide('renderer.line');

/**
 * param {renderer.Renderer} rend
 */
renderer.line.init = function (rend) {
    var vertices = [0, 0, 0,
                    0,
                    1, 0, 0,
                    1];
    var indices = [0, 1];
    var vertexShader =
            'precision highp float;\n' +
            'attribute vec3 position;\n' +
            'attribute float vertNum;\n' +

            'varying vec4 color;\n' +
            'uniform vec4 colors[2];\n' +
            'uniform mat4 mvpMat; \n' +

            'void main(void) {\n' +
                'color = colors[int(vertNum)];\n' +
                'gl_Position = mvpMat * vec4(position, 1.0);\n' +
            '}\n';
    var fragmentShader =
            'precision highp float;\n' +
            'varying vec4 color;\n' +
            'void main(void) {\n' +
                'gl_FragColor = color;\n' +
            '}\n';

    rend.buildSpecialMaterial('__LINE__', vertexShader, fragmentShader);
    rend.registerMeshCallbacks(base.Model.Type.LINE, renderer.line.bindMesh,
                               renderer.line.renderMeshInstance);
    
    var geometry = new base.GeometryData(new Uint16Array(indices), [new Float32Array(vertices)]);
    
    var mesh = new base.Mesh(geometry, 0, 2, ['__LINE__'], base.LightningType.LIGHT_CUSTOM);
    renderer.line.model = new base.Model(renderer.SpecialModelId.LINE, [mesh], 1, [],
                               base.Model.Type.LINE);
    rend.addModel(renderer.line.model);
};

/**
 * @type {base.Model}
 */
renderer.line.model = null;

/**
 * @param {number} id
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 * @param {base.Vec4} fromColor
 * @param {base.Vec4} toColor
 * @return {base.ModelInstance}
 */
renderer.line.create = function (id, from, to, fromColor, toColor) {

    goog.asserts.assert(renderer.line.model);

    var local = base.Vec3.pool.acquire();
    base.Vec3.subtract(to, from, local);

    var mtx = base.Mat4.identity();
    mtx[0] = local[0];
    mtx[1] = local[1];
    mtx[2] = local[2];

    mtx[12] = from[0];
    mtx[13] = from[1];
    mtx[14] = from[2];
    
    base.Vec3.pool.release(local);

    var modelInst = new base.ModelInstance(id, renderer.line.model, 0);
    modelInst.setMatrix(mtx);
    modelInst.customData = new renderer.line.ColorData(fromColor, toColor);
    return modelInst;
};

/**
 * @param {base.ModelInstance} model
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 */
renderer.line.update = function (model, from, to) {
    var local = base.Vec3.pool.acquire();
    base.Vec3.subtract(to, from, local);

    var mtx = model.getMatrix();
    mtx[0] = local[0];
    mtx[1] = local[1];
    mtx[2] = local[2];

    mtx[12] = from[0];
    mtx[13] = from[1];
    mtx[14] = from[2];
    
    model.setMatrix(mtx); // redundant, but for clarification
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {renderer.State} state
 * @param {Array.<WebGLBuffer>} indexBuffers
 * @param {Array.<WebGLBuffer>} vertexBuffers
 * Callback fired by renderer just before drawElements to set uniforms and attribs.
 * Called once for mesh type (in this case once for all lines).
 */
renderer.line.bindMesh = function (gl, state, indexBuffers, vertexBuffers) {
    var meshInstance = state.meshInstance;
    var indexBufferId = meshInstance.baseMesh.geometry.indexBufferId;
    var vertexBufferId = meshInstance.baseMesh.geometry.vertexBufferIds[0];

    goog.asserts.assert(meshInstance.modelInstance.baseModel.type === base.Model.Type.LINE);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
		  indexBuffers[indexBufferId]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[vertexBufferId]);

};

/**
 * @param {WebGLRenderingContext} gl
 * @param {renderer.State} state
 * @param {Array.<WebGLBuffer>} indexBuffers
 * @param {Array.<WebGLBuffer>} vertexBuffers
 * Callback fired by renderer for every meshInstance.
 */
renderer.line.renderMeshInstance = function (gl, state, indexBuffers, vertexBuffers) {
    var vertexStride = 16, numOffset = 12;
    var shader = state.stage.program;
    var colors = /**@type{renderer.line.ColorData}*/state.meshInstance.modelInstance.customData;
    
    // Set uniforms
    gl.uniformMatrix4fv(shader.uniforms['mvpMat'], false, state.mvpMat);
    gl.uniform4fv(shader.uniforms['colors[0]'], colors.combinedColor);

    // Setup vertex attributes
    gl.enableVertexAttribArray(shader.attribs['position']);
    gl.vertexAttribPointer(shader.attribs['position'], 3, gl.FLOAT, false, vertexStride, 0);

    gl.enableVertexAttribArray(shader.attribs['vertNum']);
    gl.vertexAttribPointer(shader.attribs['vertNum'], 1, gl.FLOAT, false,
			   vertexStride, numOffset);

    gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, 0);
};

/**
 * @private
 * @constructor
 * @param {base.Vec4} fromColor
 * @param {base.Vec4} toColor
 */
 renderer.line.ColorData = function (fromColor, toColor) {
     var array = [].concat(Array.apply(null, fromColor), Array.apply(null, toColor));
     /**
      * @type {base.Vec4}
      */
     this.combinedColor = new Float32Array(array);
};
