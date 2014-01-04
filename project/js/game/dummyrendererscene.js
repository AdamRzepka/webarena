/**
 * Copyright (C) 2014 Adam Rzepka
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

/**
 * @fileoverview
 * Dummy implementation of base.IRendererScene needed by game server.
 */

'use strict';

goog.provide('base.IRendererScene');
goog.provide('game.DummyRendererScene');

/**
 * @implements {base.IRendererScene}
 */
game.DummyRendererScene = function () {
    /**
     * @private
     * @type {number}
     * This id is used for all renderables (model instances, lines, bilboards). For now
     * the id doesn't need to be "more correct" :).
     */
    this.nextId_ = 0;
};

/**
 * @public
 * @param {Array.<base.ShaderScript>} shaderScripts
 * @param {Object.<string,string>} texturesUrls blob URIs of images
 */
game.DummyRendererScene.prototype.buildShaders = function (shaderScripts, texturesUrls) {};
/**
 * @public
 * @param {Array.<base.Model>} models
 * @param {base.Map.LightmapData} lightmapData
 */
game.DummyRendererScene.prototype.registerMap = function (models, lightmapData) {};
/**
 * @public
 * @param {base.Model} model
 */
game.DummyRendererScene.prototype.registerMd3 = function (model) {};
/**
 * @public
 * @param {number} modelBaseId id of model
 * @param {base.Mat4} matrix
 * @param {number} skinId
 * @param {function(*)} callback called with id of model instance as first argument
 */
game.DummyRendererScene.prototype.registerModelInstance = function (modelBaseId,
                                                                matrix,
                                                                skinId,
                                                                callback) {
    callback(this.nextId_++);
};
/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<base.Mat4>} matrices
 * @param {Array.<number>} framesA
 * @param {Array.<number>} framesB
 * @param {Array.<number>} lerps
 */
game.DummyRendererScene.prototype.updateModels = function (modelsInstancesIds, matrices, framesA,
                                                  framesB, lerps) {};
/**
 * @public
 * @param {number} modelInstanceId
 * @param {base.Mat4} matrix
 * @param {number} frame
 */
game.DummyRendererScene.prototype.updateModel = function (modelInstanceId, matrix, frame) {};

/**
 * @public
 * @param {Array.<number>} modelsInstancesIds
 * @param {Array.<boolean>} visibilityArray
 */
game.DummyRendererScene.prototype.setModelsVisibility = function (modelsInstancesIds,
                                                              visibilityArray) {};
/**
 * @public
 * @param {base.Mat4} cameraMatrix inversed view matrix
 */
game.DummyRendererScene.prototype.updateCamera = function (cameraMatrix) {};

/**
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 * @param {base.Vec4} fromColor
 * @param {base.Vec4} toColor
 * @param {function(*)} callback called with id of model instance as first argument
 */
game.DummyRendererScene.prototype.registerLine = function (from, to, fromColor,
                                                           toColor, callback) {
    callback(this.nextId_++);
};

/**
 * @param {number} id
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 */
game.DummyRendererScene.prototype.updateLine = function (id, from, to) {};

/**
 * @param {base.Vec3} center
 * @param {number} sizeX
 * @param {number} sizeY
 * @param {number} rotation
 * @param {string} textureName
 * @param {number} alpha
 * @param {function(*)} callback called with id of model instance as first argument
 */
game.DummyRendererScene.prototype.registerBillboard = function (center,
                                                            sizeX,
                                                            sizeY,
                                                            rotation,
                                                            textureName,
                                                            alpha,
                                                            callback) {
    callback(this.nextId_++);
};

/**
 * @param {number} id
 * @param {base.Vec3} center
 * @param {number} sizeX
 * @param {number} sizeY
 * @param {number} rotation
 * @param {number} alpha
 */
game.DummyRendererScene.prototype.updateBillboard = function (id,
                                                          center,
                                                          sizeX,
                                                          sizeY,
                                                          rotation,
                                                          alpha) {};


/**
 * @public
 * @param {number} id
 * Unregisters ModelInstance, Line or Bilboard with given id.
 */
game.DummyRendererScene.prototype.unregister = function (id) {};

