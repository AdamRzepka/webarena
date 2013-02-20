/**
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
goog.require('base.IRenderer');
goog.require('base.Mat4');
goog.require('base.Vec3');
goog.require('renderer.MaterialManager');
goog.require('renderer.Sky');

goog.provide('renderer.Renderer');

/**
 * @constructor
 * @implements {base.IRenderer}
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
     * @type {Array.<base.Mesh>}
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
     * @type {renderer.MaterialManager}
     */
    this.materialManager_ = new renderer.MaterialManager(gl);
    /**
     * @private
     * @type {renderer.Sky}
     */
    this.sky_ = new renderer.Sky();
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

    this.startTime_ = Date.now();

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
    this.materialManager_.buildShaders(shaderScripts, texturesUrls);
};

base.makeUnremovable(renderer.Renderer.prototype.buildShaders);

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
        intFrame, nextFrame, lerpWeight, indexId, vertexId, vertex2Id,
        time = 0, // @todo
        gl = this.gl_;

    time = (Date.now() - this.startTime_) / 1000;
    
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    for (i = 0; i < this.meshInstances_.length; ++i) {
	meshInst = this.meshInstances_[i];
	modelInst = meshInst.modelInstance;
	meshBase = meshInst.baseMesh;

	if (meshInst.culled || !modelInst.getVisibility()) {
	    continue;
	}

	shader = meshInst.material.shader;

	this.materialManager_.setShader(shader);
	length = shader.stages.length;
	for (j = 0; j < length; ++j) {
	    stage = shader.stages[j];
	    this.materialManager_.setShaderStage(shader, stage, time);
	    if (meshInst.material.defaultTexture) {
		// if it is default shader, use texture from meshBase
		this.materialManager_.bindTexture(meshInst.material.defaultTexture, stage.program);
	    }
            intFrame = Math.floor(modelInst.getFrame());
            nextFrame = Math.ceil(modelInst.getFrame());
            lerpWeight = modelInst.getFrame() - intFrame;
            indexId = this.indexBuffers_[meshBase.geometry.indexBufferId];
            vertexId = this.vertexBuffers_[meshBase.geometry.vertexBufferIds[intFrame]];
            vertex2Id = this.vertexBuffers_[meshBase.geometry.vertexBufferIds[nextFrame]]
                    || vertexId;
            
	    base.Mat4.multiply(this.viewMtx_, modelInst.getMatrix(), this.modelViewMtx_);
	    this.bindShaderAttribs_(stage.program, this.modelViewMtx_, this.projectionMtx_,
				    meshBase.geometry.layout, indexId, vertexId, vertex2Id,
                                    lerpWeight);

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
 * @param {base.Map.LightmapData} lightmapData
 */
renderer.Renderer.prototype.registerMap = function (models, lightmapData) {
    var i, j;

    this.materialManager_.buildLightmap(lightmapData);

    for (i = 0; i < models.length; ++i) {
	this.addMeshes(models[i]);
	this.insertModel_(models[i]);
	// find mesh with sky material
	for (j = 0; j < models[i].meshes.length; ++j) {
	    if (models[i].meshes[j].materials[0].shader.sky) {
		this.sky_.build(models[i].meshes[j].materials[0], this);
	    }
	}
    }

};

base.makeUnremovable(renderer.Renderer.prototype.registerMap);

/**
 * @public
 * @param {base.Model} model
 */
renderer.Renderer.prototype.registerMd3 = function (model) {
    this.addMeshes(model);
    this.insertModel_(model);
};

base.makeUnremovable(renderer.Renderer.prototype.registerMd3);

/**
 * @public
 * @param {number} id of modelInstance
 * @param {number} modelBaseId id of model
 * @param {base.Mat4} matrix
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

    skinId = baseModel.skins.indexOf(skinName || base.Model.DEFAULT_SKIN);
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

    instance.setMatrix(matrix);
    i = this.meshInstances_.length;
    this.addMeshInstances(instance);
    // cull mesh if it has sky material
    for (; i < this.meshInstances_.length; ++i) {
	if (this.meshInstances_[i].material.shader.sky) {
	    this.meshInstances_[i].culled = true;
	}
    }

    this.insertModelInstance_(instance);
};

base.makeUnremovable(renderer.Renderer.prototype.registerModelInstance);

/**
 * @public
 * @param {base.Model} model
 */
renderer.Renderer.prototype.addMeshes = function (model) {
    var gl = this.gl_;
    var meshes = model.meshes;
    var j, materials, mesh;
    
    for (j = 0; j < meshes.length; ++j) {
	mesh = meshes[j];

	materials = mesh.materialNames.map(goog.bind(function (name) {
	    return this.materialManager_.getMaterial(
		name,
		mesh.lightningType);
	}, this));

	mesh.materials = materials;

	if (mesh.geometry.indexBufferId < 0) {
	    this.createBuffers_(mesh.geometry);
	}

	this.meshes_.push(mesh);
    }
};

/**
 * @public
 * @param {base.ModelInstance} modelInstance
 */
renderer.Renderer.prototype.addMeshInstances = function (modelInstance) {
    var i, baseMesh, meshInstance;
    var baseModel = modelInstance.baseModel;
    var skinId = modelInstance.skinId;
    
    for (i = 0; i < baseModel.meshes.length; ++i){
	baseMesh = baseModel.meshes[i];
	meshInstance =
	    new renderer.MeshInstance(baseMesh, modelInstance,
				      /**@type{renderer.Material}*/(baseMesh.materials[skinId]));
	this.meshInstances_.push(meshInstance);
    }
    
};

// renderer.Renderer.prototype.prepareForRendering = function() {
//     // @todo
// };

/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<base.Mat4>} matrices
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

base.makeUnremovable(renderer.Renderer.prototype.updateModels);

/**
 * @public
 * @param {number} modelInstanceId
 * @param {base.Mat4} matrix
 * @param {number} frame
 */
renderer.Renderer.prototype.updateModel = function (modelInstanceId, matrix, frame) {
     var model = this.modelInstances_[modelInstanceId];
     if (model === undefined) {
	 this.logger_.log(goog.debug.Logger.Level.WARNING,
 			  "Invalid model instance id passed to updateModels: "
			  + modelInstanceId);
     }
     model.setMatrix(matrix);
     model.setFrame(frame);
};

base.makeUnremovable(renderer.Renderer.prototype.updateModel);

/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<boolean>} visibilityArray
 */
renderer.Renderer.prototype.setModelsVisibility = function (modelsInstancesIds, visibilityArray) {
    var i,
        model;

    if (modelsInstancesIds.length != visibilityArray.length) {
	this.logger_.log(goog.debug.Logger.Level.SEVERE,
			"Arrays passed to setModelsVisibility must have the same length");
	return;
    }

    for (i = 0; i < modelsInstancesIds.length; ++i) {
	model = this.modelInstances_[modelsInstancesIds[i]];
	if (!model) {
	    this.logger_.log(goog.debug.Logger.Level.WARNING,
			    ("Invalid model instance id passed to setModelsVisibility: "
			     + modelsInstancesIds[i]));
	    continue;
	}
	model.setVisibility(visibilityArray[i]);
    }
};

base.makeUnremovable(renderer.Renderer.prototype.setModelsVisibility);

// renderer.Renderer.prototype.setMeshVisibility = function (objectId, meshId, visible) {
//     // @todo
// };

/**
 * @public
 * @param {base.Mat4} cameraMatrix inversed view matrix
 */
renderer.Renderer.prototype.updateCamera = function (cameraMatrix) {
    base.Mat4.inverse(cameraMatrix, this.viewMtx_);
    this.sky_.updateMatrix(cameraMatrix);
};

base.makeUnremovable(renderer.Renderer.prototype.updateCamera);

/**
 * @private
 */
renderer.Renderer.prototype.logger_ = goog.debug.Logger.getLogger('renderer.Renderer');

/**
 * @private
 * @param {base.GeometryData} geometryData
 */
renderer.Renderer.prototype.createBuffers_ = function (geometryData) {
    var gl = this.gl_, i;
    var vertexBuffersSize, vertexBuffer, indexBuffer;

    goog.asserts.assert(geometryData.indexBufferId === -1
			&& geometryData.vertexBufferIds.length === 0);
    
    vertexBuffersSize = this.vertexBuffers_.length;
    
    indexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometryData.indices, gl.STATIC_DRAW);

    this.indexBuffers_.push(indexBuffer);
    geometryData.indexBufferId = this.indexBuffers_.length - 1;

    for (i = 0; i < geometryData.vertices.length; ++i) {
        vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, geometryData.vertices[i], gl.STATIC_DRAW);

	this.vertexBuffers_.push(vertexBuffer);
	geometryData.vertexBufferIds.push(this.vertexBuffers_.length - 1);
    }
    
};

/**
 * @private
 * @param {base.Model} model
 * Function inserts model to proper position in this.models_ table
 */
renderer.Renderer.prototype.insertModel_ = function(model) {
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
 * @param {base.ModelInstance} model
 * Function inserts model to proper position in this.modelInstances_ table
 */
renderer.Renderer.prototype.insertModelInstance_ = function(model) {
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
renderer.Renderer.prototype.bindShaderAttribs_ = function(shader,
							  modelViewMat,
							  projectionMat,
							  vertexArrayLayout,
                                                          indexBufferId,
                                                          vertexBufferId,
                                                          vertexBuffer2Id,
                                                          lerpWeight) {
    var gl = this.gl_;

    var vertexStride = 0, texOffset = 12, lightOffset = -1, normalOffset = -1,
	colorOffset = -1;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
		  indexBufferId);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferId);


    switch (vertexArrayLayout) {
    case base.GeometryData.Layout.BSP:
	vertexStride = 56;
	lightOffset = 20;
	normalOffset = 28;
	colorOffset = 40;
	break;
    case base.GeometryData.Layout.MD3:
	vertexStride = 32; // @todo: check this
	normalOffset = 20;
	break;
    case base.GeometryData.Layout.SKY:
	vertexStride = 20;
	break;
    default:
	goog.asserts.fail("Strange layout value in bindShaderAttribs: " + vertexArrayLayout);
    }
    
    // Set uniforms
    gl.uniformMatrix4fv(shader.uniforms['modelViewMat'], false, modelViewMat);
    gl.uniformMatrix4fv(shader.uniforms['projectionMat'], false, projectionMat);

    // Setup vertex attributes
    gl.enableVertexAttribArray(shader.attribs['position']);
    gl.vertexAttribPointer(shader.attribs['position'], 3, gl.FLOAT, false, vertexStride, 0);

    if(shader.attribs['texCoord'] !== undefined) {
        gl.enableVertexAttribArray(shader.attribs['texCoord']);
        gl.vertexAttribPointer(shader.attribs['texCoord'], 2, gl.FLOAT, false,
			       vertexStride, texOffset);
    }

    if(shader.attribs['lightCoord'] !== undefined
       && vertexArrayLayout === base.GeometryData.Layout.BSP) {
        gl.enableVertexAttribArray(shader.attribs['lightCoord']);
        gl.vertexAttribPointer(shader.attribs['lightCoord'], 2, gl.FLOAT, false,
			       vertexStride, lightOffset);
    }

    if(shader.attribs['normal'] !== undefined
       && vertexArrayLayout !== base.GeometryData.Layout.SKY) {
        gl.enableVertexAttribArray(shader.attribs['normal']);
        gl.vertexAttribPointer(shader.attribs['normal'], 3, gl.FLOAT, false,
			       vertexStride, normalOffset);
    }

    if(shader.attribs['color'] !== undefined
       && vertexArrayLayout === base.GeometryData.Layout.BSP) {
        gl.enableVertexAttribArray(shader.attribs['color']);
        gl.vertexAttribPointer(shader.attribs['color'], 4, gl.FLOAT, false,
			       vertexStride, colorOffset);
    }
    
    // @todo create separate shader whithout colour for md3 and delete this
    if(shader.attribs['color'] !== undefined
       && vertexArrayLayout === base.GeometryData.Layout.MD3) {
	gl.vertexAttrib4fv(shader.attribs['color'], [1,1,1,1]);
    }
	
    if (shader.attribs['position2'] !== undefined) {
        if (vertexBuffer2Id === -1) {
            vertexBuffer2Id = vertexBufferId;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer2Id);
        gl.enableVertexAttribArray(shader.attribs['position2']);
        gl.vertexAttribPointer(shader.attribs['position2'], 3, gl.FLOAT, false,
                                   vertexStride, 0);
        gl.uniform1f(shader.uniforms['lerpWeight'], lerpWeight);
    }

};

/**
 * @constructor
 * @param {base.Mesh} baseMesh
 * @param {base.ModelInstance} modelInstance
 * @param {renderer.Material} material
 */
renderer.MeshInstance = function(baseMesh, modelInstance, material) {
    /**
     * @const
     * @type {base.Mesh}
     */
    this.baseMesh = baseMesh;
    /**
     * @type {boolean}
     */
    this.culled = false;
    /**
     * @const
     * @type {base.ModelInstance}
     */
    this.modelInstance = modelInstance;
    /**
     * @const
     * @type {renderer.Material}
     */
    this.material = material;
};
