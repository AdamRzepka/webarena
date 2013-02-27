goog.provide('base.IRenderer');

/**
 * @interface
 */
base.IRenderer = function () {
};

//base.IRenderer._CROSS_WORKER_ = true;
/**
 * @public
 * @param {Array.<base.ShaderScript>} shaderScripts
 * @param {Object.<string,string>} texturesUrls blob URIs of images
 */
base.IRenderer.prototype.buildShaders = function (shaderScripts, texturesUrls) {};
base.IRenderer.prototype.buildShaders._CROSS_WORKER_ = true;

/**
 * @public
 * @param {Array.<base.Model>} models
 * @param {base.Map.LightmapData} lightmapData
 */
base.IRenderer.prototype.registerMap = function (models, lightmapData) {};
base.IRenderer.prototype.registerMap._CROSS_WORKER_ = true;

/**
 * @public
 * @param {base.Model} model
 */
base.IRenderer.prototype.registerMd3 = function (model) {};
base.IRenderer.prototype.registerMd3._CROSS_WORKER_ = true;

/**
 * @public
 * @param {number} id of modelInstance
 * @param {number} modelBaseId id of model
 * @param {base.Mat4} matrix
 * @param {string} [skinName]
 */
base.IRenderer.prototype.registerModelInstance = function (id, modelBaseId, matrix, skinName) {};
base.IRenderer.prototype.registerModelInstance._CROSS_WORKER_ = true;
/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<base.Mat4>} matrices
 * @param {Array.<number>} framesA
 * @param {Array.<number>} framesB
 * @param {Array.<number>} lerps
 */
base.IRenderer.prototype.updateModels = function (modelsInstancesIds, matrices, framesA,
                                                  framesB, lerps) {};
base.IRenderer.prototype.updateModels._CROSS_WORKER_ = true;
/**
 * @public
 * @param {number} modelInstanceId
 * @param {base.Mat4} matrix
 * @param {number} frame
 */
base.IRenderer.prototype.updateModel = function (modelInstanceId, matrix, frame) {};
base.IRenderer.prototype.updateModel._CROSS_WORKER_ = true;
/**
 * @public
 * @param {base.Mat4} cameraMatrix inversed view matrix
 */
base.IRenderer.prototype.updateCamera = function (cameraMatrix) {};
base.IRenderer.prototype.updateCamera._CROSS_WORKER_ = true;
