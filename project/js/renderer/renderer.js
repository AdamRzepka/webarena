/**
 * @license
 * Copyright (C) 2012 Adam Rzepka
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');

goog.require('base');
goog.require('base.Mat4');
goog.require('base.Vec3');
goog.require('renderer.Mesh');
goog.require('renderer.Material');
goog.require('renderer.MaterialManager');

goog.provide('renderer.Renderer');

/**
 * @constructor
 * @param {WebGLRenderingContext} gl
 */
renderer.Renderer = function(gl) {

    /**
     * @private
     * @type {WebGLRenderingContext}
     */
    this.gl_ = gl;

    /**
     * @private
     * @type {Array.<WebGLBuffer>}
     */
    this.vertexBuffers_ = [];

    /**
     * @private
     * @type {Array.<WebGLBuffer>}
     */
    this.indexBuffers_ = [];

    /**
     * @private
     * @type {Array.<base.Model>}
     */
    this.models_ = [];

    /**
     * @private
     * @type {Array.<base.ModelInstance>}
     */
    this.modelInstances_ = [];

    /**
     * @private
     * @type {Array.<renderer.Mesh>}
     */
    this.meshes_ = [];

    /**
     * @private
     * @type {Array.<renderer.MeshInstance>}
     * Mesh instances sorted by shader and model
     */
    this.meshInstances_ = [];

    /**
     * @private
     * @type {base.Mat4}
     */
    this.viewMtx_ = base.Mat4.identity();
    /**
     * @private
     * @type {base.Mat4}
     */
    this.projectionMtx_ = base.Mat4.perspective(90, 1.6, 0.1, 4096);

    /**
     * @private
     * @type {base.Mat4}
     * Temp matrix used in rendering
     */
    this.modelViewMtx_ = base.Mat4.create();

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
};

/**
 * @public
 * @param {Array.<base.ShaderScript>} shaderScripts
 * @param {Object.<string,string>} texturesUrls blob URIs of images
 */
renderer.Renderer.prototype.buildShaders = function(shaderScripts, texturesUrls) {
    this.materialManager.buildShaders(shaderScripts, texturesUrls);
};

/**
 * @public
 * Where the magic happens...
 */
renderer.Renderer.prototype.render = function () {
    // TODO: sort meshes to limit state changes
    var i, j, length,
        meshInst, modelInst, meshBase,
        skinNum,
        shader, stage,
        time = 0, // @todo
        gl = this.gl_;

    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    for (i = this.meshInstances_.length - 1; i >= 0; --i) {
	meshInst = this.meshInstances_[i];
	modelInst = meshInst.modelInstance;
	meshBase = meshInst.baseMesh;

	if (meshInst.culled || !modelInst.visible) {
	    continue;
	}

	shader = meshInst.material.shader;

	this.materialManager.setShader(shader);
	length = shader.stages.length;
	for (j = 0; j < length; ++j) {
	    stage = shader.stages[j];
	    this.materialManager.setShaderStage(shader, stage, time);
	    if (meshInst.material.defaultTexture) {
		// if it is default shader, use texture from meshBase
		this.materialManager.bindTexture(meshInst.material.defaultTexture, stage.program);
	    }

	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
			  this.indexBuffers_[meshBase.elementsArrayId]);
	    gl.bindBuffer(gl.ARRAY_BUFFER,
			  this.vertexBuffers_[meshBase.frames[modelInst.frame].arrayBufferId]);

	    base.Mat4.multiply(this.viewMtx_, modelInst.matrix, this.modelViewMtx_);
	    this.bindShaderAttribs(stage.program, this.modelViewMtx_, this.projectionMtx_);

	    gl.drawElements(gl.TRIANGLES,
			    meshBase.indicesCount,
			    gl.UNSIGNED_SHORT,
			    meshBase.indicesOffset);
	}

    }

};

/**
 * @public
 * @param {Array.<base.Model>} models
 * @param {base.GeometryData} geometryData
 * @param {base.Map.LightmapData} lightmapData
 */
renderer.Renderer.prototype.registerMap = function (models, geometryData, lightmapData) {

    var i, j;
    var gl = this.gl_;
    var model, mesh, meshes, materials;
    var vertexBufferSize = this.vertexBuffers_.length;
    var indexBufferSize = this.indexBuffers_.length;
    
    var vertexBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometryData.vertices[0]), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometryData.indices), gl.STATIC_DRAW);

    this.vertexBuffers_.push(vertexBuffer);
    this.indexBuffers_.push(indexBuffer);

    this.materialManager.buildLightmap(lightmapData);

    for (i = 0; i < models.length; ++i) {
	model = models[i];

	meshes.length = 0;
	for (j = 0; j < model.meshes.length; ++j) {
	    materials = model.meshes[j].materialNames.map(function (name) {
		this.materialManager.getMaterial(
		    name,
		    renderer.LightningType.LIGHT_MAP);
	    });

	    mesh = new renderer.Mesh(
		model.meshes[j],
		materials,
		indexBufferSize,
		vertexBufferSize);

//	    meshes.push(mesh);
	    this.meshes_.push(mesh);
	}
	model.meshes = meshes;
	this.addModel(model);
    }
};

// /**
//  * @param {renderer.Model} model
//  * @param {{vertices: Float32Array, frames: Array<{indices: Uint16Array}>}} vertexData
//  * @return {number} id of added model
//  */
// renderer.Renderer.prototype.registerMd3 = function (model, vertexData) {
//     var i, j;
//     var firstArrayIndex;
//     var gl = this.gl_;

//     var indexBuffer = this.gl_.createBuffer();
//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
//     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexData.indices, gl.STATIC_DRAW);

//     this.elementArrayBuffers.push(indexBuffer);

//     firstArrayIndex = this.arrayBuffers.length;
//     for (i = 0; i < vertexData.frames.length; ++i) {
// 	var vertexBuffer = gl.createBuffer();
// 	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
// 	gl.bufferData(gl.ARRAY_BUFFER, vertexData.frames[i].vertices, gl.STATIC_DRAW);

// 	this.arrayBuffers.push(vertexBuffer);
//     }

//     this.models_.push(model);
//     for (i = 0; i < model.meshes.length; ++i) {
// 	var mesh = model.meshes[i];
// 	mesh.id = this.meshes_.length;
// 	mesh.elementsArrayId = this.elementArrayBuffers.length - 1;

// 	this.meshes_.push(mesh);
// 	for (j = 0; j < model.framesCount; ++j) {
// 	    mesh.frames[j].arrayBufferId = firstArrayIndex + j;
// 	}

// 	for (j = 0; j < mesh.materials.length; ++j) {
// 	    mesh.materials[j] = Q3GlShader.getMaterial(mesh.materials[j].shaderName, LightningType.LIGHT_DYNAMIC);
// 	}
//     }
//     return this.models_.length - 1; // index of added model
// };

/**
 * @public
 * @param {number} modelBaseId id of model
 * @param {mat4} matrix
 * @param {string} [skinName]
 */
renderer.Renderer.prototype.registerModelInstance = function (id, modelBaseId, matrix, skinName) {
    var i,
        baseModel = this.models_[modelBaseId],
        skinId = -1,
        instance = null,
        baseMesh,
        meshInstance;
    
    if (!baseModel) {
	this.logger_.log(goog.debug.Logger.Level.SEVERE,
			"Wrong model index in registerModelInstance: " + modelBaseId);
	return;
    }

    skinId = baseModel.skins.indexOf(skinName || '__default__');
    if (skinId === -1) { // default skin
	skinId = 0;
	this.logger_.log(goog.debug.Logger.Level.WARNING,
			"Wrong skin name in makeModelInstance: "
			+ skinName + ". Replaced with default.");
    }

    instance = new base.ModelInstance(
	id,
	baseModel,
	skinId
    );

    base.Model.setMatrix(matrix);
    this.addModelInstance(instance);
    
    for (i = 0; i < baseModel.meshes.length; ++i){
	baseMesh = baseModel.meshes[i];
	meshInstance = new renderer.MeshInstance(baseMesh, instance, baseMesh.materials[skinId]);
	this.meshInstances_.push(meshInstance);
    }
};

// renderer.Renderer.prototype.prepareForRendering = function() {
//     // @todo
// };

/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<mat4>} matrices
 * @param {Array.<number>} frames
 */
renderer.Renderer.prototype.updateModels = function (modelsInstancesIds, matrices, frames) {
    var i,
        model;

    if (modelsInstancesIds.length != matrices.length || matrices.length != frames.length) {
	this.logger_.log(goog.debug.Logger.Level.SEVERE,
			"Arrays passed to updateModels must have the same length");
	return;
    }

    for (i = 0; i < modelsInstancesIds.length; ++i) {
	model = this.modelInstances_[modelsInstancesIds[i]];
	if (!model) {
	    this.logger_.log(goog.debug.Logger.Level.WARNING,
			    ("Invalid model instance id passed to updateModels: "
			     + modelsInstancesIds[i]));
	    continue;
	}
	model.setMatrix(matrices[i]);
	model.setFrame(frames[i]);
    }
};

// renderer.Renderer.prototype.updateModel = function (modelInstanceId, matrix, frame) {
//     var model = this.modelInstances_[modelInstanceId];
//     if (model === undefined) {
// 	console.log("Invalid model instance id passed to updateModels: " + modelInstanceId);
//     }
//     model.matrix = matrix;
//     model.frame = frame;
// };

/**
 * @public
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
 * @public
 * @param {mat4} cameraMatrix inversed view matrix
 */
renderer.Renderer.prototype.updateCamera = function (cameraMatrix) {
    base.Mat4.inverse(cameraMatrix, this.viewMtx_);
};

/**
 * @private
 */
renderer.Renderer.prototype.logger_ = goog.debug.Logger.getLogger('renderer.Renderer');

/**
 * @private
 * @param {base.Model}
 * Functions inserts model to proper position in this.models_ table
 */
renderer.Renderer.prototype.addModel = function(model) {
    var size = this.models_.length;
    var id = model.id;
    var i;
    goog.asserts.assert(!this.models_[id]); // is undefined or null - slot is empty
    
    // Filling gap between size and id with null to ensure, that the table
    // won't be treated as a hash map by js engine.
    for (i = size; i < id; ++i) {
	this.models_[i] = null;
    }
    this.models_[id] = model;
};

/**
 * @private
 * @param {base.Model}
 * Functions inserts model to proper position in this.models_ table
 */
renderer.Renderer.prototype.addModelInstance = function(model) {
    var size = this.modelInstances_.length;
    var id = model.id;
    var i;
    goog.asserts.assert(!this.modelInstances_[id]); // is undefined or null - slot is empty
    
    // Filling gap between size and id with null to ensure, that the table
    // won't be treated as a hash map by js engine.
    for (i = size; i < id; ++i) {
	this.modelInstances_[i] = null;
    }
    this.modelInstances_[id] = model;
};


/**
 * @private
 * @param {renderer.ShaderProgram} shader
 * @param {base.Mat4} modelViewMat
 * @param {base.Mat4} projectionMat
 */
renderer.Renderer.prototype.bindShaderAttribs = function(shader, modelViewMat, projectionMat) {
    var gl = this.gl_;

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
