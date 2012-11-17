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
goog.require('glmatrix');

goog.provide('base.Model');
goog.provide('base.ModelInstance');
goog.provide('base.Mesh');
goog.provide('base.GeometryData');
goog.provide('base.Material');
goog.provide('base.Model.Frame');

/**
 * Base class for game models. It represents both md3 models (one model per file)
 * and bsp models (many models in one bsp).
 * @constructor
 * @param {Array.<base.Mesh>} meshes
 * @param {number} framesCount
 * @param {Array.<base.Model.FrameData>} framesData
 * @param {Array.<string>} [tags]
 * @param {Array.<string>} [skins]
 */
base.Model = function (meshes, framesCount, framesData, tags, skins) {
    goog.asserts.assert(meshes.length > 0);
    goog.asserts.assert(framesCount > 0);

    /**
     * @const
     * @type {Array<base.Mesh>}
     */
    this.meshes = meshes;
    /**
     * @const
     * @type {number}
     */
    this.framesCount = framesCount;
    /**
     * @const
     * @type {Array<base.Model.Frame>}
     */
    this.framesData_ = {};
    /**
     * @const
     * @type {Array.<string>}
     */
    this.tags = tags || [];
    /**
     * One model can be displayed with different materials, when they have .skin
     * files specified.
     * @const
     * @type {Array<string>}
     */
    this.skins = (skins && skins[0]) ? skins : ['__default__'];  // If skins are not defined explicitly, we create default skin

};

/**
 * @constructor
 * @param {Float32Array} aabb
 * @param {glmatrix.vec3} origin
 * @param {number} radius
 * @param {Array.<glmatrix.mat4>} [tags]
 */
base.Model.FrameData = function(aabb, origin, radius, tags) {
    /*
     * @const
     * @type {Float32Array}
     */
    this.aabb = aabb;
    /*
     * @const
     * @type {glmatrix.vec3}
     */
    this.origin = origin;
    /*
     * @const
     * @type {number}
     */
    this.radius = radius;
    /*
     * @const
     * @type {Array.<glmatrix.mat4>}
     */
    this.tags = tags || [];
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
     * @const
     * @type {number}
     */
    this.id = id;
    /**
     * @const
     * @type {base.Model}
     */
    this.baseModel = baseModel;
    /**
     * Skin for this particular instance.
     * @const
     * @type {number}
     */
    this.skinId = skinId;
    /**
     * Model matrix. This shouldn't be modified directly by game worker.
     * @private
     * @type {glmatrix.mat4}
     */
    this.matrix_ = glmatrix.mat4.identity();
    /**
     * Current frame. This shouldn't be modified directly by game worker.
     * @private
     * @type {number}
     */
    this.frame_ = 0;
    /**
     * This shouldn't be modified directly by game worker.
     * @private
     * @type {boolean}
     */
    this.visibility_ = false;
};


// These functions could be non-static methods, but it would create problem after sending
// to different worker, since structural copy algorythm breaks prototype chain.
/**
 * @public
 * @param {base.ModelInstance} self
 * @return {glmatrix.mat4}
 */
base.ModelInstance.getMatrix = function (self) {
    return self.matrix_;
};

/**
 * @public
 * @param {base.ModelInstance} self
 * @param {glmatrix.mat4} matrix
 * This function shouldn't be called directly by game worker.
 */
base.ModelInstance.setMatrix = function (self, matrix) {
    var det = 0;
    if (goog.DEBUG) {
	// Checks if matrix looks OK.
	det = mat4.determinant(mat);
	goog.asserts.assert(det !== 0 && det < 10e9); 
    }
    self.matrix_ = matrix;
};

/**
 * @public
 * @param {base.ModelInstance} self
 * @return {number}
 */
base.ModelInstance.getFrame = function (self) {
    return self.frame_;
};

/**
 * @public
 * @param {base.ModelInstance} self
 * @param {number} frame
 * This function shouldn't be called directly by game worker.
 */
base.ModelInstance.setFrame = function (self, frame) {
    goog.asserts.assert(frame >= 0 && frame < self.baseModel_.getFramesCount());
    self.frame_ = frame;
};

/**
 * @public
 * @param {base.ModelInstance} self
 * @return {boolean}
 */
base.ModelInstance.getVisibility = function (self) {
    return self.visibility_;
};

/**
 * @public
 * @param {base.ModelInstance} self
 * @param {boolean} visibility
 * This function shouldn't be called directly by game worker.
 */
base.ModelInstance.setVisibility = function (self, visibility) {
    self.visibility_ = visibility;
};


/**
 * This class corresponds to model surface. Note that we don't declare here
 * the MeshInstance class, since the game code doesn't need it. The renderer
 * however will create it, when making new ModelInstance.
 * @constructor
 * @param {base.GeometryData} geometry
 * @param {number} indicesOffset
 * @param {number} indicesCount
 * @param {Array.<base.Materials>} materials
 */
base.Mesh = function(geometry, indicesOffset, indicesCount, materials) {
    /**
     * @const
     * @type {base.GeometryData}
     */
    this.geometry = geometry;
    /**
     * @const
     * Offset in geometry buffer
     * @type {number}
     */
    this.indicesOffset = indicesOffset;
    /**
     * @const
     * @type {number}
     */
    this.indicesCount = indicesCount;
    /**
     * List of all materials, the instances of the mesh can have.
     * @const
     * @type {Array.<base.Material>}
     */
    this.materials = materials;
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
    /**
     * @const
     * @type {string}
     */
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
    /**
     * @type {Uint16Array}
     */
    this.indices = indices;
    /**
     * @type {Array<Float32Array>}
     */
    this.vertices = vertices;
};
