/**
 * Copyright (C) 2013 Adam Rzepka
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

goog.require('goog.debug.Logger');

goog.require('base');
goog.require('base.Mat4');
goog.require('base.Vec3');
goog.require('base.IRendererScene');
goog.require('renderer.Renderer');
goog.require('renderer.Sky');
goog.require('renderer.line');
goog.require('renderer.billboard');

goog.provide('renderer.Scene');

/**
 * @constructor
 * @implements base.IRendererScene
 * @param {WebGLRenderingContext} gl
 */
renderer.Scene = function (gl) {
    /**
     * @const
     * @private
     * @type {renderer.Renderer}
     */
    this.renderer_ = new renderer.Renderer(gl);
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
     * @const
     * @private
     * @type {renderer.Sky}
     */
    this.sky_ = new renderer.Sky();

    renderer.line.init(this.renderer_);
    renderer.billboard.init(this.renderer_);
};

/**
 * @public
 * @param {Array.<base.ShaderScript>} shaderScripts
 * @param {Object.<string,string>} texturesUrls blob URIs of images
 */
renderer.Scene.prototype.buildShaders = function(shaderScripts, texturesUrls) {
    this.renderer_.buildShaders(shaderScripts, texturesUrls);
};

base.makeUnremovable(renderer.Scene.prototype.buildShaders);

/**
 * @public
 * @param {base.Model} model
 */
renderer.Scene.prototype.registerMd3 = function (model) {
    this.renderer_.addModel(model);
    this.insertModel_(model);
};

base.makeUnremovable(renderer.Scene.prototype.registerMd3);

/**
 * @public
 * @param {Array.<base.Model>} models
 * @param {base.Map.LightmapData} lightmapData
 */
renderer.Scene.prototype.registerMap = function (models, lightmapData) {
    var i, j;

    this.renderer_.buildLightmap(lightmapData);

    for (i = 0; i < models.length; ++i) {
	this.renderer_.addModel(models[i]);
	this.insertModel_(models[i]);
	// find mesh with sky material
	for (j = 0; j < models[i].meshes.length; ++j) {
	    if (models[i].meshes[j].materials[0].shader.sky) {
		this.sky_.build(models[i].meshes[j].materials[0], this.renderer_);
                models[i].meshes[j].indicesCount = 0; // don't render this mesh
	    }
	}
    }
};

base.makeUnremovable(renderer.Scene.prototype.registerMap);

/**
 * @public
 * @param {number} modelBaseId id of model
 * @param {base.Mat4} matrix
 * @param {number} skinId
 * @param {function(*)} callback called with id of model instance as first argument
 */
renderer.Scene.prototype.registerModelInstance = function (modelBaseId,
                                                           matrix,
                                                           skinId,
                                                           callback) {
    var id,
        baseModel = this.models_[modelBaseId],
        instance = null,
        baseMesh,
        meshInstance;
    
    if (!baseModel) {
	this.logger_.log(goog.debug.Logger.Level.SEVERE,
			"Wrong model index in registerModelInstance: " + modelBaseId);
	return;
    }

    // skinId = baseModel.skins.indexOf(skinName || base.Model.DEFAULT_SKIN);
    // if (skinId === -1) { // default skin
    //     skinId = 0;
    //     this.logger_.log(goog.debug.Logger.Level.WARNING,
    //     		"Wrong skin name in makeModelInstance: "
    //     		+ skinName + ". Replaced with default.");
    // }

    // find free slot in modelInstances_ array
    for (id = 0; id < this.modelInstances_.length && this.modelInstances_[id]; ++id) {}

    instance = new base.ModelInstance(
	id,
	baseModel,
	skinId
    );

    instance.setMatrix(matrix);
    this.renderer_.addModelInstance(instance);
//    this.insertModelInstance_(instance);
    this.modelInstances_[id] = instance;
    callback(id);
};

base.makeUnremovable(renderer.Scene.prototype.registerModelInstance);

/**
 * @public
 * @param {number} id
 */
renderer.Scene.prototype.unregister = function (id) {
    var i, model;

    goog.asserts.assert(id >= 0 && id < this.modelInstances_.length);
    this.renderer_.removeModelInstance(this.modelInstances_[id]);
    this.modelInstances_[id] = null;
};

base.makeUnremovable(renderer.Scene.prototype.unregister);

/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<base.Mat4>} matrices
 * @param {Array.<number>} framesA
 * @param {Array.<number>} framesB
 * @param {Array.<number>} lerps
 */
renderer.Scene.prototype.updateModels = function (modelsInstancesIds, matrices, framesA, framesB, lerps) {
    var i,
        model;

    if (modelsInstancesIds.length !== matrices.length || matrices.length !== framesA.length
       || framesA.length !== framesB.length || framesB.length != lerps.length) {
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
	model.setFrameLerp(framesA[i], framesB[i], lerps[i]);
    }
};

base.makeUnremovable(renderer.Scene.prototype.updateModels);

/**
 * @public
 * @param {number} modelInstanceId
 * @param {base.Mat4} matrix
 * @param {number} frame
 */
renderer.Scene.prototype.updateModel = function (modelInstanceId, matrix, frame) {
     var model = this.modelInstances_[modelInstanceId];
     if (model === undefined) {
	 this.logger_.log(goog.debug.Logger.Level.WARNING,
 			  "Invalid model instance id passed to updateModels: "
			  + modelInstanceId);
     }
     model.setMatrix(matrix);
     model.setFrame(frame);
};

base.makeUnremovable(renderer.Scene.prototype.updateModel);

/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<boolean>} visibilityArray
 */
renderer.Scene.prototype.setModelsVisibility = function (modelsInstancesIds, visibilityArray) {
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

base.makeUnremovable(renderer.Scene.prototype.setModelsVisibility);

/**
 * @public
 * @param {base.Mat4} cameraMatrix inversed view matrix
 */
renderer.Scene.prototype.updateCamera = function (cameraMatrix) {
    this.renderer_.updateCameraMatrix(cameraMatrix);
    this.sky_.updateMatrix(cameraMatrix);
};

base.makeUnremovable(renderer.Scene.prototype.updateCamera);

/**
 * @public
 */
renderer.Scene.prototype.render = function () {
    this.renderer_.render();
};


/**
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 * @param {base.Vec4} fromColor
 * @param {base.Vec4} toColor
 * @param {function(*)} callback called with id of model instance as first argument
 */
renderer.Scene.prototype.registerLine = function (from, to, fromColor, toColor, callback) {
    var id;
    var modelInst;

    for (id = 0; id < this.modelInstances_.length && this.modelInstances_[id]; ++id) {}

    modelInst = renderer.line.create(id, from, to, fromColor, toColor);

    this.modelInstances_[id] = modelInst;
    this.renderer_.addModelInstance(modelInst);

    callback(id);
};
base.makeUnremovable(renderer.Scene.prototype.registerLine);
/**
 * @param {number} id
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 */
renderer.Scene.prototype.updateLine = function (id, from, to) {
    var modelInst = this.modelInstances_[id];
    goog.asserts.assert(modelInst);
    
    renderer.line.update(modelInst, from, to);
};
base.makeUnremovable(renderer.Scene.prototype.updateLine);

/**
 * @param {base.Vec3} center
 * @param {number} sizeX
 * @param {number} sizeY
 * @param {number} rotation 
 * @param {string} textureName
 * @param {number} alpha
 * @param {function(*)} callback called with id of model instance as first argument
 */
renderer.Scene.prototype.registerBillboard = function (center, sizeX, sizeY, rotation,
                                                       textureName, alpha, callback) {
    var id;
    var modelInst;

    for (id = 0; id < this.modelInstances_.length && this.modelInstances_[id]; ++id) {}

    modelInst = renderer.billboard.create(id, center, sizeX, sizeY, rotation,
                                          this.renderer_.getTexture(textureName),
                                          alpha);

    this.modelInstances_[id] = modelInst;
    this.renderer_.addModelInstance(modelInst);

    callback(id);
};
base.makeUnremovable(renderer.Scene.prototype.registerBillboard);

/**
 * @param {number} id
 * @param {base.Vec3} center
 * @param {number} sizeX
 * @param {number} sizeY
 * @param {number} rotation
 * @param {number} alpha 
 */
renderer.Scene.prototype.updateBillboard = function (id, center, sizeX, sizeY, rotation, alpha) {
    var modelInst = this.modelInstances_[id];
    goog.asserts.assert(modelInst);
    
    renderer.billboard.update(modelInst, center, sizeX, sizeY, rotation, alpha);
};
base.makeUnremovable(renderer.Scene.prototype.updateBillboard);

/**
 * @private
 */
renderer.Scene.prototype.logger_ = goog.debug.Logger.getLogger('renderer.Scene');

/**
 * @private
 * @param {base.Model} model
 * Function inserts model to proper position in this.models_ table
 */
renderer.Scene.prototype.insertModel_ = function(model) {
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
