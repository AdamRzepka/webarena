'use strict';

goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');

//goog.require('resources');
goog.require('gl-matrix');
goog.require('q3ShaderLoader');
goog.require('q3GlShader');
goog.provide('renderer');
goog.require('common');

/**
 * @constructor
 * @param {WebGLRenderingContext} gl
 * @param {resources.ResourceManager} resourcemanager
 */
renderer.Renderer = function(gl, resourceManager) {

    /**
     * @type {WebGLRenderingContext}
     */
    this.gl = gl;
    /**
     * @type {resources.ResourceManager}
     */
    this.resourceManager = resourceManager;

    /**
     * @type {Array.<WebGLBuffer>}
     */
    this.arrayBuffers = [];
    /**
     * @type {Array.<WebGLBuffer>}
     */
    this.elementArrayBuffers = [];

    /**
     * @type {?}
     */
    this.lightmap = null;

    /**
     * @type {Array.<Model>}
     */
    this.models = [];

    /**
     * @type {Array.<ModelInstance>}
     */
    this.modelsInstances = [];

    /**
     * @type {Array.<Mesh>}
     */
    this.meshes = [];

    /**
     * @type {Array.<MeshInstance>}
     * Mesh instances sorted by shader and model
     */
    this.meshesInstances = [];

    /**
     * @type {mat4}
     */
    this.viewMtx = mat4.identity();
    /**
     * @type {mat4}
     */
    this.projectionMtx = mat4.perspective(90, 1.6, 0.1, 4096);

    /**
     * @type {mat4}
     * Temp matrix used in rendering
     */
    this.modelViewMtx = mat4.create();

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.enable(gl.CULL_FACE);

    Q3ShaderLoader.loadAll(resourceManager);
    Q3GlShader.init(gl, resourceManager);
};

renderer.Renderer.prototype.render = function () {
    // TODO: sort meshes to limit state changes
    var i, j, length,
        meshInst, modelInst, meshBase,
        skinNum,
        shader, stage,
        time = 0, // @todo
        gl = this.gl;

    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    for (i = this.meshesInstances.length - 1; i >= 0; --i) {
	meshInst = this.meshesInstances[i];
	modelInst = meshInst.modelInstance;
	meshBase = meshInst.baseMesh;

	if (meshInst.culled || !modelInst.visible) {
	    continue;
	}

	skinNum = modelInst.skinId;
	shader = meshBase.materials[skinNum].shader;

	Q3GlShader.setShader(gl, shader);
	length = shader.stages.length;
	for (j = 0; j < length; ++j) {
	    stage = shader.stages[j];
	    Q3GlShader.setShaderStage(gl, shader, stage, time);
	    if (shader === Q3GlShader.defaultShader || shader === Q3GlShader.modelShader) {
		// if it is default shader, use texture from meshBase
		Q3GlShader.bindTexture(gl, meshBase.materials[skinNum].defaultTexture, stage.program);
	    }

	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementArrayBuffers[meshBase.elementsArrayId]);
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBuffers[meshBase.frames[modelInst.frame].arrayBufferId]);

	    mat4.multiply(modelInst.matrix, this.viewMtx, this.modelViewMtx);

	    this.bindShaderAttribs(stage.program, this.modelViewMtx, this.projectionMtx);

	    gl.drawElements(gl.TRIANGLES, meshBase.elementsCount, gl.UNSIGNED_SHORT, meshBase.elementsOffset);
	}

    }

};

renderer.Renderer.prototype.bindShaderAttribs = function(shader, modelViewMat, projectionMat) {
    var gl = this.gl;

    var vertexStride = 56;

    // Set uniforms
    gl.uniformMatrix4fv(shader.uniform.modelViewMat, false, modelViewMat);
    gl.uniformMatrix4fv(shader.uniform.projectionMat, false, projectionMat);

    // Setup vertex attributes
    gl.enableVertexAttribArray(shader.attrib.position);
    gl.vertexAttribPointer(shader.attrib.position, 3, gl.FLOAT, false, vertexStride, 0);

    if(shader.attrib.texCoord !== undefined) {
        gl.enableVertexAttribArray(shader.attrib.texCoord);
        gl.vertexAttribPointer(shader.attrib.texCoord, 2, gl.FLOAT, false, vertexStride, 3*4);
    }

    if(shader.attrib.lightCoord !== undefined) {
        gl.enableVertexAttribArray(shader.attrib.lightCoord);
        gl.vertexAttribPointer(shader.attrib.lightCoord, 2, gl.FLOAT, false, vertexStride, 5*4);
    }

    if(shader.attrib.normal !== undefined) {
        gl.enableVertexAttribArray(shader.attrib.normal);
        gl.vertexAttribPointer(shader.attrib.normal, 3, gl.FLOAT, false, vertexStride, 7*4);
    }

    if(shader.attrib.color !== undefined) {
        gl.enableVertexAttribArray(shader.attrib.color);
        gl.vertexAttribPointer(shader.attrib.color, 4, gl.FLOAT, false, vertexStride, 10*4);
    }
};

renderer.Renderer.prototype.buildLightmaps = function(size, lightmaps) {
    var gl = this.gl;

    this.lightmap = Q3GlShader.createSolidTexture(gl, [255,255,255,255]);
    gl.bindTexture(gl.TEXTURE_2D, this.lightmap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    for(var i = 0; i < lightmaps.length; ++i) {
        gl.texSubImage2D(
            gl.TEXTURE_2D, 0, lightmaps[i].x, lightmaps[i].y, lightmaps[i].width, lightmaps[i].height,
            gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(lightmaps[i].bytes)
            );
    }

    gl.generateMipmap(gl.TEXTURE_2D);

//    q3glshader.init(gl, this.lightmap);
};

/**
 * @param {Array.<renderer.Model>} models
 * @param {{vertices: Float32Array, indices: Uint16Array}} vertexData
 * @param {?}
 * @return {Array.<number>} ids of added models
 */
renderer.Renderer.prototype.registerMap = function (models, vertexData, lightmapData) {

    var i, j;
    var gl = this.gl;
    var resultIndices = [];

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData.vertices), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexData.indices), gl.STATIC_DRAW);

    var arrayBufferSize = this.arrayBuffers.length;
    var elementBufferSize = this.elementArrayBuffers.length;
    this.arrayBuffers.push(vertexBuffer);
    this.elementArrayBuffers.push(indexBuffer);

    this.buildLightmaps(lightmapData.size, lightmapData.lightmaps);
    Q3GlShader.lightmap = this.lightmap;

    for (i = 0; i < models.length; ++i) {
	var model = models[i];
	model.id = i;
	this.models.push(model);

	for (j = 0; j < model.meshes.length; ++j) {
	    var mesh = model.meshes[j];
	    mesh.id = this.meshes.length;
	    mesh.elementsArrayId = elementBufferSize;
	    mesh.frames[0].arrayBufferId = arrayBufferSize;
	    mesh.materials[0] = Q3GlShader.getMaterial(mesh.materials[0].shader.shaderName, mesh.lightningType);
	    this.meshes.push(mesh);
	}

	// there will be exactly one map instance, so we create it immediately
        resultIndices.push(this.makeModelInstance(this.models.length - 1, mat4.identity(), null));
    }
    return resultIndices;
};

/**
 * @param {renderer.Model} model
 * @param {{vertices: Float32Array, frames: Array<{indices: Uint16Array}>}} vertexData
 * @return {number} id of added model
 */
renderer.Renderer.prototype.registerMd3 = function (model, vertexData) {
    var i, j;
    var firstArrayIndex;
    var gl = this.gl;

    var indexBuffer = this.gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexData.indices, gl.STATIC_DRAW);

    this.elementArrayBuffers.push(indexBuffer);

    firstArrayIndex = this.arrayBuffers.length;
    for (i = 0; i < vertexData.frames.length; ++i) {
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexData.frames[i].vertices, gl.STATIC_DRAW);
    }

    this.models.push(model);
    for (i = 0; i < model.meshes.length; ++i) {
	var mesh = model.meshes[i];
	mesh.id = this.meshes.length;
	mesh.elementArrayId = this.elementArrayBuffers.length - 1;

	this.meshes.push(mesh);
	for (j = 0; j < model.framesNum; ++j) {
	    mesh.frames[j].arrayBufferId = firstArrayIndex + j;
	}

	for (j = 0; j < mesh.materials.length; ++j) {
	    mesh.materials[j] = Q3GlShader.getMaterial(mesh.materials[j].shaderName, renderer.LightningType.LIGHT_DYNAMIC);
	}
    }
    return this.models.length - 1; // index of added model
};

/**
 * @param {number} modelBaseId id of model as returned by registerMap/registerMd3
 * @param {mat4} matrix
 * @param {string} skinName
 * @return {number} model instance id
 */
renderer.Renderer.prototype.makeModelInstance = function (modelBaseId, matrix, skinName) {
    var i,
        baseModel = this.models[modelBaseId],
        skinId = baseModel.skinsIndices[skinName ? skinName : '__default__'],
        instance = null,
        baseMesh,
        meshInstance;

    if (baseModel === undefined) {
	throw "Wrong model index in makeModelInstance: " + modelBaseId;
    }
    if (skinId === undefined) {
	console.log("Wrong skin name in makeModelInstance: " + skinName + ". Replaced with default.");
	skinId = 0;
    }

    instance = {
	id: this.modelsInstances.length,
	baseModel: baseModel,
	skinId: skinId,
	matrix: matrix,
	frame: 0,
	visible: true
    };

    for (i = 0; i < baseModel.meshes.length; ++i){
	baseMesh = baseModel.meshes[i];
	meshInstance = {
	    id: this.meshesInstances.length,
	    baseMesh: baseMesh,
	    modelInstance: instance,
	    material: baseMesh.materials[skinId],
	    culled: false
	};
	this.meshesInstances.push(meshInstance);
    }

    this.modelsInstances.push(instance);

    return instance.id;
};

/**
 *
 */
renderer.Renderer.prototype.prepareForRendering = function() {
    // @todo
};

/**
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<mat4>} matrices
 * @param {Array.<number>} frames
 */
renderer.Renderer.prototype.updateModels = function (modelsInstancesIds, matrices, frames) {
    var i,
        model;

    if (modelsInstancesIds.length != matrices.length || matrices.length != frames.length) {
	throw "Arrays passed to updateModels must have the same length";
    }

    for (i = 0; i < objectsIds.length; ++i) {
	model = this.modelsInstances[objectsIds[i]];
	if (model === undefined) {
	    console.log("Invalid model instance id passed to updateModels: " + objectsIds[i]);
	    continue;
	}
	model.matrix = matrices[i];
	model.frame = frames[i];
    }
};

/**
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<boolean>} visibilityArray
 */
renderer.Renderer.prototype.setModelsVisibility = function (modelsInstancesIds, visibilityArray) {
    // @todo
};

// renderer.Renderer.prototype.setMeshVisibility = function (objectId, meshId, visible) {
//     // @todo
// };

/**
 * @param {mat4} cameraMatrix inversed view matrix
 */
renderer.Renderer.prototype.updateCamera = function (cameraMatrix) {
    mat4.inverse(cameraMatrix, this.viewMtx);
};

