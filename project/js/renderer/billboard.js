goog.require('base.Model');
goog.require('base.Mesh');
goog.require('renderer');
goog.require('renderer.Renderer');

goog.provide('renderer.billboard');

renderer.billboard.init = function (rend) {
    var vertices = [-0.5, -0.5,
                    0, 0,
                    0.5, -0.5,
                    1, 0,
                    0.5, 0.5,
                    1, 1,
                    -0.5, 0.5,
                    0, 1];
    var indices = [1, 2, 0, 3];
    var vertexShader =
            'precision highp float;\n' +
            'attribute vec2 position;\n' +
            'attribute vec2 texCoord;\n' +

            'varying vec2 vTexCoord;\n' +
            'uniform mat4 mMat; \n' +
            'uniform mat4 vMat; \n' +
            'uniform mat4 pMat; \n' +
            'uniform float rot;\n' +
            
            'void main(void) {\n' +
                'mat4 mv = vMat * mMat;\n' +
                'vec4 centerPos = mv[3];\n' +
                'mat2 rotMat = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));\n' +
                'vec2 pos = centerPos.xy;\n' +
                'pos += position * vec2(length(mv[0]), length(mv[1]));\n' +
                'centerPos.xy = rotMat * pos;\n' +
                'gl_Position = pMat * centerPos;\n' +
                'vTexCoord = texCoord;\n' +

            '}\n';

    var fragmentShader =
            'precision highp float;\n' +
            'varying vec2 vTexCoord; \n' +
            'uniform sampler2D texture; \n' +
            'uniform float alpha;\n' +

            'void main(void) { \n' +
                //'gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
                'vec4 color = texture2D(texture, vTexCoord);\n' +
                'color.w *= alpha;\n' +
                'gl_FragColor = color\n;' +
            '} \n';
    
    rend.buildSpecialMaterial('__BILLBOARD__', vertexShader, fragmentShader);
    rend.registerMeshCallbacks(base.Model.Type.BILLBOARD, renderer.billboard.bindMesh,
                               renderer.billboard.renderMeshInstance);
    
    var geometry = new base.GeometryData(new Uint16Array(indices), [new Float32Array(vertices)]);
    
    var mesh = new base.Mesh(geometry, 0, indices.length, ['__BILLBOARD__'],
                             base.LightningType.LIGHT_CUSTOM);
    
    renderer.billboard.model = new base.Model(renderer.SpecialModelId.BILLBOARD, [mesh], 1, [],
                               base.Model.Type.BILLBOARD);
    rend.addModel(renderer.billboard.model);
};

/**
 * @type {base.Model}
 */
renderer.billboard.model = null;

/**
 * @param {number} id
 * @param {base.Vec3} center
 * @param {number} sizeX
 * @param {number} sizeY
 * @param {number} rotation 
 * @param {WebGLTexture} texture
 * @param {number} alpha
 */
renderer.billboard.create = function (id, center, sizeX, sizeY, rotation, texture, alpha) {
    goog.asserts.assert(renderer.billboard.model);

    var mtx = base.Mat4.identity();
    mtx[0] = sizeX;
    mtx[5] = sizeY;

    mtx[12] = center[0];
    mtx[13] = center[1];
    mtx[14] = center[2];

    var modelInst = new base.ModelInstance(id, renderer.billboard.model, 0);
    modelInst.setMatrix(mtx);
    modelInst.customData = new renderer.billboard.Data(texture, rotation, alpha);
    return modelInst;
};

/**
 * @param {base.ModelInstance} model
 * @param {base.Vec3} center
 * @param {number} sizeX
 * @param {number} sizeY
 * @param {number} rotation 
 * @param {number} alpha
 */
renderer.billboard.update = function (model, center, sizeX, sizeY, rotation, alpha) {
    var mtx = model.getMatrix();
    mtx[0] = sizeX;
    mtx[5] = sizeY;

    mtx[12] = center[0];
    mtx[13] = center[1];
    mtx[14] = center[2];
    model.setMatrix(mtx); // redundant, but for clarification
    model.customData.rotation = rotation;
    model.customData.alpha = alpha;
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {renderer.State} state
 * @param {Array.<WebGLBuffer>} indexBuffers
 * @param {Array.<WebGLBuffer>} vertexBuffers
 * Callback fired by renderer just before drawElements to set uniforms and attribs.
 * Called once for mesh type (in this case once for all lines).
 */
renderer.billboard.bindMesh = function (gl, state, indexBuffers, vertexBuffers) {
    var meshInstance = state.meshInstance;
    var indexBufferId = meshInstance.baseMesh.geometry.indexBufferId;
    var vertexBufferId = meshInstance.baseMesh.geometry.vertexBufferIds[0];
    var shader = state.stage.program;

    goog.asserts.assert(meshInstance.modelInstance.baseModel.type === base.Model.Type.BILLBOARD);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
		  indexBuffers[indexBufferId]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[vertexBufferId]);
    
    gl.uniformMatrix4fv(shader.uniforms['vMat'], false, state.viewMat);
    gl.uniformMatrix4fv(shader.uniforms['pMat'], false, state.projectionMat);

};

/**
 * @param {WebGLRenderingContext} gl
 * @param {renderer.State} state
 * @param {Array.<WebGLBuffer>} indexBuffers
 * @param {Array.<WebGLBuffer>} vertexBuffers
 * Callback fired by renderer for every meshInstance.
 */
renderer.billboard.renderMeshInstance = function (gl, state, indexBuffers, vertexBuffers) {
    var vertexStride = 16, texOffset = 8;
    var shader = state.stage.program;
    var data = /**@type{renderer.billboard.Data}*/state.meshInstance.modelInstance.customData;
    var mesh = state.meshInstance.baseMesh;

    // // Set uniforms
    gl.uniformMatrix4fv(shader.uniforms['mMat'], false,
                        state.meshInstance.modelInstance.getMatrix());
    gl.uniform1f(shader.uniforms['rot'], data.rotation);
    gl.uniform1f(shader.uniforms['alpha'], data.alpha);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(shader.uniforms['texture'], 0);
    gl.bindTexture(gl.TEXTURE_2D, data.texture);

    // Setup vertex attributes
    gl.enableVertexAttribArray(shader.attribs['position']);
    gl.vertexAttribPointer(shader.attribs['position'], 2, gl.FLOAT, false, vertexStride, 0);

    gl.enableVertexAttribArray(shader.attribs['texCoord']);
    gl.vertexAttribPointer(shader.attribs['texCoord'], 2, gl.FLOAT, false,
         		   vertexStride, texOffset);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawElements(gl.TRIANGLE_STRIP, mesh.indicesCount, gl.UNSIGNED_SHORT, mesh.indicesOffset);
};

/**
 * @private
 * @constructor
 * @param {WebGLTexture} texture
 * @param {number} rotation
 * @param {number} alpha
 */
renderer.billboard.Data = function (texture, rotation, alpha) {
    /**
     * @type {WebGLTexture}
     */
    this.texture = texture;
    /**
     * @type {number}
     */
    this.rotation = rotation;
    /**
     * @type {number}
     */
    this.alpha = alpha;
};
