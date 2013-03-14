goog.require('base.IRendererScene');
goog.require('renderer.Renderer');

goog.provide('renderer.Scene');

/**
 * @constructor
 */
renderer.Scene = function (gl) {
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
     * @private
     * @type {renderer.Sky}
     */
    this.sky_ = new renderer.Sky();
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

    this.materialManager_.buildLightmap(lightmapData);

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
 * @param {number} id of modelInstance
 * @param {number} modelBaseId id of model
 * @param {base.Mat4} matrix
 * @param {string} [skinName]
 */
renderer.Scene.prototype.registerModelInstance = function (id, modelBaseId, matrix, skinName) {
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
    this.renderer_.addModelInstance(instance);
    this.insertModelInstance_(instance);
};

base.makeUnremovable(renderer.Scene.prototype.registerModelInstance);

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
    this.renderer_updateCameraMatrix(cameraMatrix);
    this.sky_.updateMatrix(cameraMatrix);
};

base.makeUnremovable(renderer.Scene.prototype.updateCamera);

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

/**
 * @private
 * @param {base.ModelInstance} model
 * Function inserts model to proper position in this.modelInstances_ table
 */
renderer.Scene.prototype.insertModelInstance_ = function(model) {
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


