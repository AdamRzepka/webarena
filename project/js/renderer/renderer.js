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
goog.require('base.Mat4');
goog.require('base.Vec3');
goog.require('renderer.MaterialManager');
goog.require('renderer.Material');
goog.require('renderer.Shader');
goog.require('renderer.Stage');
goog.require('renderer.ShaderProgram');
goog.require('renderer.State');

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
     * @type {base.Mat4}
     */
    this.viewMtx_ = base.Mat4.identity();
    /**
     * @private
     * @type {base.Mat4}
     */
    this.projectionMtx_ = base.Mat4.perspective(90, 1.6, 0.1, 4096);
    
    this.viewProjMtx_ = base.Mat4.create();

    this.state_ = new renderer.State();

    this.meshBinders_ = [
        renderer.Renderer.bspBindMesh,
        renderer.Renderer.md3BindMesh
    ];
    
    this.meshInstanceBinders_ = [
        renderer.Renderer.bspBindMeshInstance,
        renderer.Renderer.md3BindMeshInstance
    ];
    
    /**
     * @private
     * @type {number}
     */
    this.startTime_ = Date.now();
    /**
     * @private
     * @type {boolean}
     */
    this.sortNeeded_ = true;

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

/**
 * @public
 * @param {base.Map.LightmapData} lightmapData
 */
renderer.Renderer.prototype.buildLightmap = function (lightmapData) {
    this.materialManager_.buildLightmap(lightmapData);
};

/**
 * @public
 * Where the magic happens...
 */
renderer.Renderer.prototype.render = function () {
    // TODO: sort meshes to limit state changes
    var i = 0, j = 0, length = 0,
        meshInst, modelInst, meshBase,
        prevMeshInst,
        type,
        skinNum = 0,
        shader, stage,
        frameA = 0, frameB = 0, lerpWeight = 0, indexId = 0, vertexId = 0, vertex2Id = 0,
        time = 0, // @todo
        gl = this.gl_;

    time = (Date.now() - this.startTime_) / 1000;
    
    if (this.sortNeeded_) {
        this.sort();
        this.sortNeeded_ = false;
    }
    
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    this.state_.prevMeshInstance = null;
    this.state_.prevStage = null;
    
    for (i = 0; i < this.meshInstances_.length; ++i) {
	meshInst = this.meshInstances_[i];
        if (!meshInst) {
            continue;
        }
	modelInst = meshInst.modelInstance;
	meshBase = meshInst.baseMesh;

	if (meshInst.culled || !modelInst.getVisibility()) {
	    continue;
	}

        type = modelInst.baseModel.type;
        this.state_.meshInstance = meshInst;
	shader = meshInst.material.shader;

	this.materialManager_.setShader(shader);
	length = shader.stages.length;
	for (j = 0; j < length; ++j) {
	    stage = shader.stages[j];
	    this.materialManager_.setShaderStage(shader, stage, time);
            this.state_.stage = stage;
	    if (meshInst.material.customTexture) {
		// if it is default shader, use texture from meshBase
		this.materialManager_.bindTexture(meshInst.material.customTexture, stage.program);
	    }
            // frameA = modelInst.getFrameA();
            // frameB = modelInst.getFrameB();
            // lerpWeight = modelInst.getLerp();
            // indexId = this.indexBuffers_[meshBase.geometry.indexBufferId];
            // vertexId = this.vertexBuffers_[meshBase.geometry.vertexBufferIds[frameA]];
            // vertex2Id = this.vertexBuffers_[meshBase.geometry.vertexBufferIds[frameB]]
            //         || vertexId;
            
	    base.Mat4.multiply(this.viewProjMtx_, modelInst.getMatrix(), this.state_.mvpMat);
//            base.Mat4.multiply(this.projectionMtx_, this.modelViewMtx_, this.modelViewMtx_);
	    // this.bindShaderAttribs_(stage.program, this.modelViewMtx_,
	    //     		    modelInst.baseModel.type, indexId, vertexId, vertex2Id,
            //                         lerpWeight);
            this.meshBinders_[type](gl, this.state_, this.indexBuffers_, this.vertexBuffers_);
            this.meshInstanceBinders_[type](gl, this.state_, this.indexBuffers_,
                                            this.vertexBuffers_);
            
	    gl.drawElements(gl.TRIANGLES,
			    meshBase.indicesCount,
			    gl.UNSIGNED_SHORT,
			    meshBase.indicesOffset);
            this.state_.prevStage = stage;
	}
        this.state_.prevMeshInstance = meshInst;

    }

};

/**
 * @public
 * @param {base.Model} model
 */
renderer.Renderer.prototype.addModel = function (model) {
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
renderer.Renderer.prototype.addModelInstance = function (modelInstance) {
    var i, baseMesh, meshInstance;
    var baseModel = modelInstance.baseModel;
    var skinId = modelInstance.skinId;
    
    for (i = 0; i < baseModel.meshes.length; ++i){
	baseMesh = baseModel.meshes[i];
        if (baseMesh.geometry && baseMesh.indicesCount > 0) {
	    meshInstance =
	        new renderer.MeshInstance(baseMesh,
                                          modelInstance,
				          /**@type{renderer.Material}*/
                                          (baseMesh.materials[skinId]));
	    this.meshInstances_.push(meshInstance);
        }
    }
    
    this.sortNeeded_ = true;
};

/**
 * @public
 * @param {base.ModelInstance} modelInstance
 */
renderer.Renderer.prototype.removeModelInstance = function (modelInstance) {
    var i;
    for (i = 0; i < this.meshInstances_.length; ++i) {
        if (this.meshInstances_[i].modelInstance === modelInstance) {
            this.meshInstances_[i] = null;
        }
    }
    this.sortNeeded_ = true;
};

/**
 * @public
 * @param {base.Mat4} cameraMatrix inversed view matrix
 */
renderer.Renderer.prototype.updateCameraMatrix = function (cameraMatrix) {
    base.Mat4.inverse(cameraMatrix, this.viewMtx_);
    base.Mat4.multiply(this.projectionMtx_, this.viewMtx_, this.viewProjMtx_);
};

renderer.Renderer.prototype.registerBinders = function (modelType,
                                                        meshBinder,
                                                        meshInstanceBinder) {
    this.meshBinders_[modelType] = meshBinder;
    this.meshInstanceBinders_[modelType] = meshInstanceBinder;
};

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


// /**
//  * @private
//  * @param {renderer.ShaderProgram} shader
//  * @param {base.Mat4} mvpMat
//  */
// renderer.Renderer.prototype.bindShaderAttribs_ = function(shader,
// 							  mvpMat,
// 							  modelType,
//                                                           indexBufferId,
//                                                           vertexBufferId,
//                                                           vertexBuffer2Id,
//                                                           lerpWeight) {
//     var gl = this.gl_;

//     var vertexStride = 0, texOffset = 12, lightOffset = -1, normalOffset = -1,
// 	colorOffset = -1;

//     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
// 		  indexBufferId);
//     gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferId);

//     switch (modelType) {
//     case base.Model.Type.BSP:
// 	vertexStride = 56;
// 	lightOffset = 20;
// 	normalOffset = 28;
// 	colorOffset = 40;
// 	break;
//     case base.Model.Type.MD3:
// 	vertexStride = 32;
// 	normalOffset = 20;
// 	break;
//     case base.Model.Type.SKY:
// 	vertexStride = 20;
// 	break;
//     default:
// 	goog.asserts.fail("Strange model type in bindShaderAttribs: " + modelType);
//     }
    
//     // Set uniforms
//     gl.uniformMatrix4fv(shader.uniforms['mvpMat'], false, mvpMat);

//     // Setup vertex attributes
//     gl.enableVertexAttribArray(shader.attribs['position']);
//     gl.vertexAttribPointer(shader.attribs['position'], 3, gl.FLOAT, false, vertexStride, 0);

//     if(shader.attribs['texCoord'] !== undefined) {
//         gl.enableVertexAttribArray(shader.attribs['texCoord']);
//         gl.vertexAttribPointer(shader.attribs['texCoord'], 2, gl.FLOAT, false,
// 			       vertexStride, texOffset);
//     }

//     if(shader.attribs['lightCoord'] !== undefined
//        && modelType === base.Model.Type.BSP) {
//         gl.enableVertexAttribArray(shader.attribs['lightCoord']);
//         gl.vertexAttribPointer(shader.attribs['lightCoord'], 2, gl.FLOAT, false,
// 			       vertexStride, lightOffset);
//     }

//     if(shader.attribs['normal'] !== undefined
//        && modelType !== base.Model.Type.SKY) {
//         gl.enableVertexAttribArray(shader.attribs['normal']);
//         gl.vertexAttribPointer(shader.attribs['normal'], 3, gl.FLOAT, false,
// 			       vertexStride, normalOffset);
//     }

//     if(shader.attribs['color'] !== undefined
//        && modelType === base.Model.Type.BSP) {
//         gl.enableVertexAttribArray(shader.attribs['color']);
//         gl.vertexAttribPointer(shader.attribs['color'], 4, gl.FLOAT, false,
// 			       vertexStride, colorOffset);
//     }
    
//     // @todo create separate shader whithout colour for md3 and delete this
//     if(shader.attribs['color'] !== undefined
//        && modelType === base.Model.Type.MD3) {
// 	gl.vertexAttrib4fv(shader.attribs['color'], [1,1,1,1]);
//     }
	
//     if (shader.attribs['position2'] !== undefined) {
//         if (vertexBuffer2Id === -1) {
//             vertexBuffer2Id = vertexBufferId;
//         }
//         gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer2Id);
//         gl.enableVertexAttribArray(shader.attribs['position2']);
//         gl.vertexAttribPointer(shader.attribs['position2'], 3, gl.FLOAT, false,
//                                    vertexStride, 0);
//         gl.uniform1f(shader.uniforms['lerpWeight'], lerpWeight);
//     }

// };

/**
 * @private
 */
renderer.Renderer.prototype.sort = function () {
    // @todo
};

renderer.Renderer.bspBindMesh = function (gl, state, indexBuffers, vertexBuffers) {
    var vertexStride = 56,
	lightOffset = 20,
	normalOffset = 28,
	colorOffset = 40,
        texOffset = 12;
    var mesh = state.meshInstance.baseMesh;
    var shader =  state.stage.program;
    var indexBufferId = mesh.geometry.indexBufferId,
        vertexBufferId = mesh.geometry.vertexBufferIds[0];
    var changed = false;

    goog.asserts.assert(state.meshInstance.modelInstance.baseModel.type === base.Model.Type.BSP);

    if (indexBufferId !== state.prevMeshInstance.baseMesh.geometry.indexBufferId) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
		      indexBuffers[indexBufferId]);
    }
    if (vertexBufferId !== state.prevMeshInstance.baseMesh.geometry.vertexBufferIds[0]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[vertexBufferId]);
        changed = true;
    }

    if (changed || state.prevStage !== state.stage) {
        
        gl.enableVertexAttribArray(shader.attribs['position']);
        gl.vertexAttribPointer(shader.attribs['position'], 3, gl.FLOAT, false,
                               vertexStride, 0);

        if(shader.attribs['texCoord'] !== undefined) {
            gl.enableVertexAttribArray(shader.attribs['texCoord']);
            gl.vertexAttribPointer(shader.attribs['texCoord'], 2, gl.FLOAT, false,
			           vertexStride, texOffset);
        }

        if(shader.attribs['lightCoord'] !== undefined) {
            gl.enableVertexAttribArray(shader.attribs['lightCoord']);
            gl.vertexAttribPointer(shader.attribs['lightCoord'], 2, gl.FLOAT, false,
			           vertexStride, lightOffset);
        }

        if(shader.attribs['normal'] !== undefined) {
            gl.enableVertexAttribArray(shader.attribs['normal']);
            gl.vertexAttribPointer(shader.attribs['normal'], 3, gl.FLOAT, false,
			           vertexStride, normalOffset);
        }

        if(shader.attribs['color'] !== undefined) {
            gl.enableVertexAttribArray(shader.attribs['color']);
            gl.vertexAttribPointer(shader.attribs['color'], 4, gl.FLOAT, false,
			           vertexStride, colorOffset);
        }
    }
};

renderer.Renderer.bspBindMeshInstance = function (gl, state, indexBuffers, vertexBuffers) {
    if (state.prevMeshInstance === null ||
        state.prevStage !== state.stage ||
        state.prevMeshInstance.modelInstance !== state.prevMeshInstance.modelInstance) {
        gl.uniformMatrix4fv(state.stage.program.uniforms['mvpMat'], false, state.mvpMat);
    }
//    gl.uniformMatrix4fv(state.stage.program.uniforms['mvpMat'], false, state.mvpMat);
};

renderer.Renderer.md3BindMesh = function (gl, state, indexBuffers, vertexBuffers) {
    var mesh = state.meshInstance.baseMesh;
    var shader =  state.stage.program;
    var indexBufferId = mesh.geometry.indexBufferId;
    
    goog.asserts.assert(state.meshInstance.modelInstance.baseModel.type === base.Model.Type.MD3);
    
    if (indexBufferId !== state.prevMeshInstance.baseMesh.geometry.indexBufferId) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
		      indexBuffers[indexBufferId]);
    }
};

renderer.Renderer.md3BindMeshInstance = function (gl, state, indexBuffers, vertexBuffers) {
    var vertexStride = 32,
	normalOffset = 20,
        texOffset = 12;
    var vertexBufferIdA = 0, vertexBufferIdB = 0;

    var mesh = state.meshInstance.baseMesh;
    var shader = state.stage.program;
    var modelInst = state.meshInstance.modelInstance;
    var prevModelInst = state.prevMeshInstance.modelInstance;
    var changed = (state.prevStage !== state.stage);

    if (modelInst.baseModel !== prevModelInst.baseModel
        || modelInst.getFrameA() !== prevModelInst.getFrameA()) {
        vertexBufferIdA = mesh.geometry.vertexBufferIds[modelInst.getFrameA()];
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[vertexBufferIdA]);
        changed = true;
    }
    if (changed) {
        // Setup vertex attributes
        gl.enableVertexAttribArray(shader.attribs['position']);
        gl.vertexAttribPointer(shader.attribs['position'], 3, gl.FLOAT, false,
                               vertexStride, 0);

        gl.enableVertexAttribArray(shader.attribs['texCoord']);
        gl.vertexAttribPointer(shader.attribs['texCoord'], 2, gl.FLOAT, false,
			       vertexStride, texOffset);

        gl.enableVertexAttribArray(shader.attribs['normal']);
        gl.vertexAttribPointer(shader.attribs['normal'], 3, gl.FLOAT, false,
			       vertexStride, normalOffset);
//        gl.vertexAttrib4fv(shader.attribs['color'], [1,1,1,1]);
    }

    if (modelInst.baseModel !== prevModelInst.baseModel
        || modelInst.getFrameB() !== prevModelInst.getFrameB()) {
        vertexBufferIdB = mesh.geometry.vertexBufferIds[modelInst.getFrameB()];
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[vertexBufferIdB]
                      || vertexBuffers[vertexBufferIdA]);
        changed = true;
    }    
    if (changed) {
        gl.enableVertexAttribArray(shader.attribs['position2']);
        gl.vertexAttribPointer(shader.attribs['position2'], 3, gl.FLOAT, false,
                               vertexStride, 0);
    }

    if (modelInst !== prevModelInst || changed) {
        gl.uniformMatrix4fv(shader.uniforms['mvpMat'], false, state.mvpMat);
        gl.uniform1f(shader.uniforms['lerpWeight'], modelInst.getLerp());        
    }
};
