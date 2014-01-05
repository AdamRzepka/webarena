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

'use strict';

goog.provide('base.IRendererScene');

/**
 * @interface
 */
base.IRendererScene = function () {
};

//base.IRendererScene._CROSS_WORKER_ = true;
/**
 * @public
 * @param {Array.<base.ShaderScript>} shaderScripts
 * @param {Object.<string,string>} texturesUrls blob URIs of images
 */
base.IRendererScene.prototype.buildShaders = function (shaderScripts, texturesUrls) {};
base.IRendererScene.prototype.buildShaders._CROSS_WORKER_ = true;

/**
 * @public
 * @param {Array.<base.Model>} models
 * @param {base.Map.LightmapData} lightmapData
 */
base.IRendererScene.prototype.registerMap = function (models, lightmapData) {};
base.IRendererScene.prototype.registerMap._CROSS_WORKER_ = true;

/**
 * @public
 * @param {base.Model} model
 */
base.IRendererScene.prototype.registerMd3 = function (model) {};
base.IRendererScene.prototype.registerMd3._CROSS_WORKER_ = true;

/**
 * @public
 * @param {number} modelBaseId id of model
 * @param {base.Mat4} matrix
 * @param {number} skinId
 * @param {function(*)} callback called with id of model instance as first argument
 */
base.IRendererScene.prototype.registerModelInstance = function (modelBaseId,
                                                                matrix,
                                                                skinId,
                                                                callback) {};
base.IRendererScene.prototype.registerModelInstance._CROSS_WORKER_ = true;
base.IRendererScene.prototype.registerModelInstance._CROSS_WORKER_CALLBACK_ = true;

/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<base.Mat4>} matrices
 * @param {Array.<number>} framesA
 * @param {Array.<number>} framesB
 * @param {Array.<number>} lerps
 */
base.IRendererScene.prototype.updateModels = function (modelsInstancesIds, matrices, framesA,
                                                  framesB, lerps) {};
base.IRendererScene.prototype.updateModels._CROSS_WORKER_ = true;
/**
 * @public
 * @param {number} modelInstanceId
 * @param {base.Mat4} matrix
 * @param {number} frame
 */
base.IRendererScene.prototype.updateModel = function (modelInstanceId, matrix, frame) {};
base.IRendererScene.prototype.updateModel._CROSS_WORKER_ = true;
/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<boolean>} visibilityArray
 */
base.IRendererScene.prototype.setModelsVisibility = function (modelsInstancesIds,
                                                              visibilityArray) {};
base.IRendererScene.prototype.setModelsVisibility._CROSS_WORKER_ = true;

/**
 * @public
 * @param {base.Mat4} cameraMatrix inversed view matrix
 */
base.IRendererScene.prototype.updateCamera = function (cameraMatrix) {};
base.IRendererScene.prototype.updateCamera._CROSS_WORKER_ = true;

/**
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 * @param {base.Vec4} fromColor
 * @param {base.Vec4} toColor
 * @param {function(*)} callback called with id of model instance as first argument
 */
base.IRendererScene.prototype.registerLine = function (from, to, fromColor, toColor, callback) {};
base.IRendererScene.prototype.registerLine._CROSS_WORKER_ = true;
base.IRendererScene.prototype.registerLine._CROSS_WORKER_CALLBACK_ = true;

/**
 * @param {number} id
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 */
base.IRendererScene.prototype.updateLine = function (id, from, to) {};
base.IRendererScene.prototype.updateLine._CROSS_WORKER_ = true;

/**
 * @param {base.Vec3} center
 * @param {number} sizeX
 * @param {number} sizeY
 * @param {number} rotation
 * @param {string} textureName
 * @param {number} alpha
 * @param {function(*)} callback called with id of model instance as first argument
 */
base.IRendererScene.prototype.registerBillboard = function (center,
                                                            sizeX,
                                                            sizeY,
                                                            rotation,
                                                            textureName,
                                                            alpha,
                                                            callback) {};
base.IRendererScene.prototype.registerBillboard._CROSS_WORKER_ = true;
base.IRendererScene.prototype.registerBillboard._CROSS_WORKER_CALLBACK_ = true;

/**
 * @param {number} id
 * @param {base.Vec3} center
 * @param {number} sizeX
 * @param {number} sizeY
 * @param {number} rotation
 * @param {number} alpha
 */
base.IRendererScene.prototype.updateBillboard = function (id,
                                                          center,
                                                          sizeX,
                                                          sizeY,
                                                          rotation,
                                                          alpha) {};
base.IRendererScene.prototype.updateBillboard._CROSS_WORKER_ = true;


/**
 * @public
 * @param {number} id
 * Unregisters ModelInstance, Line or Bilboard with given id.
 */
base.IRendererScene.prototype.unregister = function (id) {};
base.IRendererScene.prototype.unregister._CROSS_WORKER_ = true;
