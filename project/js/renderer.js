'use strict';

goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');

//goog.require('resources');
goog.require('gl-matrix');
goog.require('q3ShaderLoader');
goog.provide('renderer');

/**
 * @enum
 */
renderer.LightningType = {
    LIGHT_2D: -4,
    LIGHT_VERTEX: -3,
    LIGHT_WHITE: -2,
    LIGHT_DYNAMIC: -1,
    LIGHT_MAP: 0
};

/**
 * @constructor
 */
renderer.Mesh = function() {
    /**
     * @type {renderer.LightningType}
     */
    this.lightningType = LIGHT_2D;
    /**
     * @type {number}
     */
    this.elementsArrayId = -1;
    /**
     * @type {number}
     */
    this.elementsOffest = 0;
    /**
     * @type {number}
     */
    this.elementsCount = 0;
    /**
     * @type {Array.<{arrayBuffer: number}>}
     */
    this.frames = [{arrayBuffer: -1}];
    /**
     * @type {Array.<{shader: ?, defaultTexture: ?}>}
     */
    this.materials = [{shader: null, defaultTexture: null}]; // defaultTexture is used with default shader
};

/**
 * @constructor
 */
renderer.MeshInstance = function() {
    /**
     * @type {number}
     */
    this.id = -1;
    /**
     * @type {Mesh}
     */
    this.baseMesh = null;
    /**
     * @type {boolean}
     */
    this.culled = false;
    /**
     * @type {ModelInstance}
     */
    this.modelInstance = null;
    /**
     * @type {?}
     */
    this.material = null;
};

/**
 * @constructor
 */
renderer.Model = function() {
    /**
     * @type {number}
     */
    this.id = -1;
    /**
     * @type {Array.<Mesh>}
     */
    this.meshes = [];
    /**
     * @type {number}
     */
    this.framesCount = 1;
    /**
     * @type {Object.<string,number>}
     */
    this.skinsIndices = {}; // { NAME: materialIndexInMesh }
    /**
     * @type {number}
     */
    this.skinsCount = 1;
};

/**
 * @constructor
 */
renderer.ModelInstance = function() {
    /**
     * @type {number}
     */
    this.id = -1;
    /**
     * @type {Model}
     */
    this.baseModel = null;

    /**
     * @type {number}
     */
    this.skin = 0;
    /**
     * @type {mat4}
     */
    this.matrix = null;
    /**
     * @type {number}
     */
    this.frame = 0;
    /**
     * @type {boolean}
     */
    this.visible = false;
};

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
     * @type {Array.<MeshInstance>}
     * Mesh instances sorted by shader, and model
     */
    this.meshesInstances = [];

    /**
     * @type {mat4}
     */
    this.viewMtx = null;
    /**
     * @type {mat4}
     */
    this.perspectiveMtx = null;

    Q3ShaderLoader.loadAll(resourceManager);
};

renderer.Renderer.prototype.render = function () {
    // iterate by meshInstances and draw
    var i, meshInst, modelInst, meshBase;
    for (i = this.meshesInstances.length; i >= 0; --i) {
	meshInst = this.meshesInstances[i];
	modelInst = meshInst.modelInstance;
	meshBase = meshInst.baseMesh;

	if (meshInst.culled || !modelInst.visible) {
	    continue;
	}

	

    }

};

/**
 * @param {Array.<renderer.Model>} models
 * @param {{vertices: Float32Array, indices: Uint16Array}} vertexData
 * @param {?}
 * @return {Array.<number>} ids of added models
 */
renderer.Renderer.prototype.registerMap = function (models, vertexData, lightmap) {

    var i, j;
    var gl = this.gl;
    var resultIndices = [];

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData.vertices, gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexData.indices, gl.STATIC_DRAW);

    var arrayBufferSize = this.arrayBuffers.length;
    var elementBufferSize = this.elementArrayBuffers.length;
    this.arrayBuffers.push(vertexBuffer);
    this.elementArrayBuffers.push(indexBuffer);

    this.lightmap = lightmap;

    for (i = 0; i < models.length; ++i) {
	var model = models[i];
	model.id = i;
	this.models.push(model);

	for (j = 0; j < model.meshes.length; ++j) {
	    var mesh = model.meshes[j];
	    mesh.id = this.meshes.length;
	    mesh.elementsArray = this.elementArrayBuffers[elementBufferSize];
	    mesh.frames[0].arrayBuffer = this.arrayBuffers[arrayBufferSize];
	    mesh.materials[0] = Q3GlShader.getMaterial(mesh.materials[0].shaderName, mesh.lightningType);
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
	mesh.elementArrayBuffer = this.elementArrayBuffers[this.elementArrayBuffers.length - 1];

	this.meshes.push(mesh);
	for (j = 0; j < model.framesNum; ++j) {
	    mesh.frames[j].arrayBuffer = this.arrayBuffers[firstArrayIndex + j];
	}

	for (j = 0; j < mesh.materials.length; ++j) {
	    mesh.materials[j] = Q3GlShader.getMaterial(mesh.materials[j].shaderName);
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
        skinId = baseModel.skinsIndices[skinName],
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

