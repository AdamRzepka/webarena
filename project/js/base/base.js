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
 */

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
 */
base.Model = function() {
    /**
     * @type {number}
     */
    this.id = -1;
    /**
     * @type {Array.<base.Mesh>}
     */
    this.meshes = [];
    /**
     * @type {number}
     */
    this.framesCount = 1;
    /**
     * One model can be displayed with different materials, when they have .skin
     * files specified.
     * @type {Object.<string,number>}
     */
    this.skinsIndices = {}; // { NAME: materialIndexInMesh }
    /**
     * @type {number}
     */
    this.skinsCount = 1;
};

/**
 * Model instances share geometric data to display many identical enitities.
 * @constructor
 */
base.ModelInstance = function(id, baseModel, skinId) {
    /**
     * @type {number}
     */
    this.id = id;
    /**
     * @type {base.Model}
     */
    this.baseModel = baseModel;
    /**
     * Skin for this particular instance.
     * @type {number}
     */
    this.skinId = skinId;
    /**
     * Model matrix
     * @type {glmatrix.mat4}
     */
    this.matrix = null;
    /**
     * Current frame
     * @type {number}
     */
    this.frame = 0;
    /**
     * @type {boolean}
     */
    this.visible = false;
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
