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

/**
 * @fileoverview Base type for game models and auxiliary classes.
 * Used by renderer and game.
 * They are extended in renderer module.
 *
 * The encapsulation is ensured only by jsdoc annotation (+ google closure).
 * I know it's not the best way, but it's significantly more efficient than
 * private-as-constructor-local-variable approach.
 */

goog.require('goog.asserts');

goog.provide('base.Model');
goog.provide('base.ModelInstance');
goog.provide('base.Mesh');
goog.provide('base.MeshInstance');
goog.provide('base.GeometryData');
goog.provide('base.Material');

/**
 * Base class for game models. It represents both md3 models (one model per file)
 * and bsp models (many models in one bsp).
 * @constructor
 * @param {Array<base.Mesh>} meshes
 * @param {number} framesCount
 * @param {Array<string>} skins
 */
base.Model = function (meshes, framesCount, skins) {
    goog.asserts.assert(meshes.length > 0);
    goog.asserts.assert(framesCount > 0);

    // If skins are not defined explicitly, we create default skin
    if (skins === null) {
	skins = ['__default__'];
    }
    else if (!skins[0]) { // if is undefined/null/empty string
	skins[0] = '__default__';
    }
    
    /**
     * @private
     * @type {Array<base.Mesh>}
     */
    this.meshes_ = meshes;
    /**
     * @private
     * @type {number}
     */
    this.framesCount_ = framesCount;
    /**
     * One model can be displayed with different materials, when they have .skin
     * files specified.
     * @private
     * @type {Array<string>}
     */
    this.skins_ = skins;
};

/**
 * @public
 * @return {Array<base.Mesh>}
 */
base.Model.prototype.getMeshes = function () {
    return this.meshes_;
};

/**
 * @public
 * @return {number}
 */
base.Model.prototype.getFramesCount = function () {
    return this.framesCount_;
};

/**
 * @public
 * @return {Array<string>}
 */
base.Model.prototype.getSkins = function () {
    return this.skins_;
};

/**
 * Model instances share geometric data to display many identical enitities.
 * @constructor
 * @param {number} id
 * @param {base.Model} baseModel
 * @param {number} skinId
 */
base.ModelInstance = function(id, baseModel, skinId) {
    goog.asserts.assert(id >= 0);
    goog.asserts.assert(goog.isDefAndNotNull(baseModel));
    goog.asserts.assert(skinId >= 0 && skinId < baseModel.getSkins().length);
    
    /**
     * @private
     * @type {number}
     */
    this.id_ = id;
    /**
     * @private
     * @type {base.Model}
     */
    this.baseModel_ = baseModel;
    /**
     * Skin for this particular instance.
     * @private
     * @type {number}
     */
    this.skinId_ = skinId;
    /**
     * Model matrix
     * @private
     * @type {glmatrix.mat4}
     */
    this.matrix_ = null;
    /**
     * Current frame
     * @private
     * @type {number}
     */
    this.frame_ = 0;
    /**
     * @private
     * @type {boolean}
     */
    this.visibility_ = false;
};

/**
 * @public
 * @return {number}
 */
base.ModelInstance.prototype.getId = function () {
    return this.id_;
};

/**
 * @public
 * @return {base.Model}
 */
base.ModelInstance.prototype.getBaseModel = function () {
    return this.baseModel_;
};

/**
 * @public
 * @return {number}
 */
base.ModelInstance.prototype.getSkinId = function () {
    return this.skinId_;
};

/**
 * @public
 * @return {glmatrix.mat4}
 */
base.ModelInstance.prototype.getMatrix = function () {
    return this.matrix_;
};

/**
 * @public
 * @param {glmatrix.mat4} matrix
 */
base.ModelInstance.prototype.setMatrix = function (matrix) {
    var det = 0;
    if (goog.DEBUG) {
	// Checks if matrix looks OK.
	det = mat4.determinant(mat);
	goog.asserts.assert(det !== 0 && det < 10e9); 
    }
    this.matrix_ = matrix;
};

/**
 * @public
 * @return {number}
 */
base.ModelInstance.prototype.getFrame = function () {
    return this.frame_;
};

/**
 * @public
 * @param {number} frame
 */
base.ModelInstance.prototype.setFrame = function (frame) {
    goog.asserts.assert(frame >= 0 && frame < this.baseModel_.getFramesCount());
    this.frame_ = frame;
};

/**
 * @public
 * @return {boolean}
 */
base.ModelInstance.prototype.getVisibility = function () {
    return this.visibility_;
};

/**
 * @public
 * @param {boolean} visibility
 */
base.ModelInstance.prototype.setVisibility = function (visibility) {
    this.visibility_ = visibility;
};


/**
 * This class corresponds to model surface. Note that we don't declare here
 * the MeshInstance class, since the game code doesn't need it. The renderer
 * however will create it, when making new ModelInstance.
 * @constructor
 */
base.Mesh = function() {
    /**
     * @type {base.GeometryData}
     */
    this.geometry = null;
    /**
     * Offset in geometry buffer
     * @type {number}
     */
    this.indicesOffset = 0;
    /**
     * @type {number}
     */
    this.indicesCount = 0;
    /**
     * List of all materials, the instances of the mesh can have.
     * @type {Array.<base.Material>}
     */
    this.materials = [];
};

/**
 * Base class for material, containing only material name. Material class corresponds
 * to shader strings found in bsp and md3, which in fact can reffer either to
 * explicit shader declaration or to ordinary texture (with default shader). Material
 * unifies this concept.
 * @constructor
 * @param {string} name Material name as found in md3/bsp/skin file, without
 * trailing zeros
 */
base.Material = function (name) {
    this.name = name;
};

/**
 * Buffer for raw geometry data.
 * @constructor
 * @param {Uint16Array} indices Index array
 * @param {Array<Float32Array>} vertices Array vertex array. One vertex array
 * corresponds to one frame.
 */
base.GeometryData = function(indices, vertices) {
    this.indices = indices;
    this.vertices = vertices;
};
