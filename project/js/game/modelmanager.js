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
goog.require('goog.debug.Logger');

goog.require('base.ModelInstance');
goog.require('base.IRendererScene');
goog.require('files.ResourceManager');
goog.require('files.md3');

goog.provide('game.ModelManager');

/**
 * @constructor
 * @param {base.IRendererScene} renderer
 * @param {files.ResourceManager} rm
 * Class creates models and model instances for given path and
 * synchronizes instances with renderer.
 */
game.ModelManager = function (renderer, rm) {
    /**
     * @private
     * @const
     * @type {base.IRendererScene}
     */
    this.renderer = renderer;
    /**
     * @private
     * @const
     * @type {files.ResourceManager}
     */
    this.rm = rm;

    /**
     * @private
     * @type {Object.<string,base.Model>}
     */
    this.models = {};
    /**
     * @private
     * @type {Array.<base.ModelInstance>}
     */
    this.instances = [];

    // these arrays could be local, but I hold it here to spare GC
    /**
     * @private
     * @type {Array.<number>}
     */
    this.updateIds = [];
    /**
     * @private
     * @type {Array.<base.Mat4>}
     */
    this.updateMatrices = [];
    /**
     * @private
     * @type {Array.<number>}
     */
    this.updateFramesA = [];
    /**
     * @private
     * @type {Array.<number>}
     */
    this.updateFramesB = [];
    /**
     * @private
     * @type {Array.<number>}
     */
    this.updateLerps = [];
    /**
     * @private
     * @type {Array.<boolean>}
     */
    this.updateVisibility = [];

    /**
     * @private
     * @type {number}
     */
    this.lineId = -1;
};

/**
 * @private
 * @const
 * @type {goog.debug.Logger}
 */
game.ModelManager.prototype.logger = goog.debug.Logger.getLogger('game.ModelManager');

/**
 * @public
 * @param {string} modelPath
 * @param {base.Mat4} [matrix]
 * @param {string} [skinName]
 * @return {base.ModelInstance}
 */
game.ModelManager.prototype.makeInstance = function (modelPath, matrix, skinName) {
    var modelFile, instance, skinId;
    var model = this.models[modelPath];
    if (model === undefined) {
        modelFile = this.rm.getModel(modelPath);
        if (!modelFile) {
            return null;
        }
        this.models[modelPath] = model = files.md3.load(modelFile,
                                                        this.findSkinsForMd3_(modelPath));
        this.renderer.registerMd3(model);
    }
    matrix = matrix || base.Mat4.identity();
    skinName = skinName || base.Model.DEFAULT_SKIN;
    skinId = model.skins.indexOf(skinName);
    if (skinId === -1) {
        this.logger.log(goog.debug.Logger.Level.WARNING,
			'Skin ' + skinName + ' for model ' +
                        modelPath + ' does not exist' );
        skinId = 0;
    }
    instance = new base.ModelInstance(-1, model, skinId);
    this.renderer.registerModelInstance(model.id,
                                        matrix,
                                        skinId,
                                        function (id) {
                                            instance.id = /**@type{number}*/id;
                                        });
    this.instances.push(instance);
    var that = this;
    // this.renderer.registerBillboard(base.Vec3.create(), 20, 20, 1,
    //                                 'textures/base_light/ceil1_22a',
    //                                 0.5,
    //                                 function (id) {
    //                                     that.lineId = /**@type{number}*/id;
    //                                 });

    // var from = matrix.subarray(12,15);
    // var to = base.Vec3.create();
    // to[2] += 4;
    // var color = new Float32Array([1, 0, 0, 1]);
    // var color2 = new Float32Array([0, 1, 0, 1]);
    // var that = this;
    
    // this.renderer.registerLine(from, to, color, color2, function(id) {
    //     that.lineId = /**@type{number}*/id;
    // });

    return instance;
};

/**
 * @public
 */
game.ModelManager.prototype.syncWithRenderer = function () {
    var i, instance;
    for (i = 0; i < this.instances.length; ++i) {
        instance = this.instances[i];
        if (instance.isDirty() && instance.id > 0) { // make sure instance already has valid id
            this.updateIds.push(instance.id);
            this.updateMatrices.push(instance.getMatrix());
            this.updateFramesA.push(instance.getFrameA());
            this.updateFramesB.push(instance.getFrameB());
            this.updateLerps.push(instance.getLerp());
            this.updateVisibility.push(instance.getVisibility());
            instance.clear();
        }
    }
    this.renderer.updateModels(this.updateIds, this.updateMatrices, this.updateFramesA,
                               this.updateFramesB, this.updateLerps);
    this.renderer.setModelsVisibility(this.updateIds, this.updateVisibility);

    // if (this.updateMatrices.length > 0) {
    //     this.renderer.updateBillboard(this.lineId, this.updateMatrices[0].subarray(12,15),
    //                                   30, 50, 1, 0.5
    //                                 );
    //}
    // if (this.updateMatrices.length > 0) {
    //     var matrix = this.updateMatrices[0];
    //     var from = matrix.subarray(12,15);
    //     var to = base.Vec3.create(from);
    //     to[2] += 50;

    //     this.renderer.updateLine(this.lineId, from, to);
    // }
    
    this.updateIds.length = this.updateMatrices.length = this.updateFramesA.length
        = this.updateFramesB.length = this.updateLerps.length = this.updateVisibility.length = 0;
};

/**
 * @private
 * @param {string} modelPath
 * @return {Object.<string, string>}
 */
game.ModelManager.prototype.findSkinsForMd3_ = function (modelPath) {
    var path, regexp, skins = {}, skinFiles, key, skinName;
    path = modelPath.replace('.md3', '');
    regexp = new RegExp(path + '_(.*)\\.skin');
    skinFiles = this.rm.findConfigFiles(regexp);
    // replace full paths with skin names
    for( key in skinFiles ) {
        if (skinFiles.hasOwnProperty(key)) {
            skinName = regexp.exec(key)[1]; // get only skin name (eg. 'default', 'red')
            skins[skinName] = skinFiles[key];
        }
    }
    return skins;
};
