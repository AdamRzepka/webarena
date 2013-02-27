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

/**
 * @fileoverview Base type for game models and auxiliary classes.
 * Used by renderer and game.
 * They are extended in renderer module.
 *
 */

goog.require('goog.asserts');
goog.require('base.Vec3');
goog.require('base.Mat4');

goog.provide('base');
goog.provide('base.Model');
goog.provide('base.ModelInstance');
goog.provide('base.Mesh');
goog.provide('base.LightningType');
goog.provide('base.GeometryData');

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
base.Model = function (id, meshes, framesCount, framesData, tags, skins) {
    goog.asserts.assert(meshes.length > 0);
    goog.asserts.assert(framesCount > 0);

    /**
     * @const
     * @type {number}
     */
    this.id = id;
    /**
     * @type {Array.<base.Mesh>}
     */
    this.meshes = meshes;
    /**
     * @const
     * @type {number}
     */
    this.framesCount = framesCount;
    /**
     * @const
     * @type {Array.<base.Model.FrameData>}
     */
    this.framesData = framesData;
    /**
     * @const
     * @type {Array.<string>}
     */
    this.tags = tags || [];
    /**
     * One model can be displayed with different materials, when they have .skin
     * files specified.
     * @const
     * @type {Array.<string>}
     */
    this.skins = (skins && skins[0]) ? skins : [base.Model.DEFAULT_SKIN];  // If skins are not defined explicitly, we create default skin

};
/**
 * @public
 * @const
 * @type {string}
 */
base.Model.DEFAULT_SKIN = '__default__';

/**
 * @public
 * @return {number}
 */
base.Model.getNextId = (function() {
    var id = -1;
    return function() {
	return ++id;
    };
})();

/**
 * @constructor
 * @param {Float32Array} aabbMin
 * @param {Float32Array} aabbMax
 * @param {base.Vec3} origin
 * @param {number} radius
 * @param {Array.<base.Mat4>} [tags]
 */
base.Model.FrameData = function(aabbMin, aabbMax, origin, radius, tags) {
    /*
     * @const
     * @type {base.Vec3}
     */
    this.aabbMin = aabbMin;
    /*
     * @const
     * @type {base.Vec3}
     */
    this.aabbMax = aabbMax;
    /*
     * @const
     * @type {base.Vec3}
     */
    this.origin = origin;
    /*
     * @const
     * @type {number}
     */
    this.radius = radius;
    /*
     * @const
     * @type {Array.<base.Mat4>}
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
    goog.asserts.assert(goog.isDefAndNotNull(baseModel));
    goog.asserts.assert(skinId >= 0 && skinId < baseModel.skins.length);
    
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
     * Model matrix.
     * @private
     * @type {base.Mat4}
     */
    this.matrix_ = base.Mat4.identity();
    /**
     * Current frame.
     * @private
     * @type {number}
     */
    this.frameA_ = 0;
    this.frameB_ = 0;
    this.lerp_ = 0;
    /**
     * @private
     * @type {boolean}
     */
    this.visibility_ = true;
    /**
     * Indicates that sync with renderer is necessary for this instance.
     * @private
     * @type {boolean}
     */
    this.dirty_ = false;

};

/**
 * @public
 * @return {number}
 */
base.ModelInstance.getNextId = (function() {
    var id = -1;
    return function() {
	return ++id;
    };
})();

/**
 * @public
 * @return {base.Mat4}
 */
base.ModelInstance.prototype.getMatrix = function () {
    return this.matrix_;
};

/**
 * @public
 * @param {base.Mat4} matrix
 */
base.ModelInstance.prototype.setMatrix = function (matrix) {
    var det = 0;
    if (goog.DEBUG) {
	// Checks if matrix looks OK.
	det = base.Mat4.determinant(matrix);
	goog.asserts.assert(det !== 0 && det < 10e9 && det > -10e9); 
    }
    this.matrix_ = matrix;
    this.dirty_ = true;
};

/**
 * @public
 * @return {number}
 */
base.ModelInstance.prototype.getFrameA = function () {
    return this.frameA_;
};

/**
 * @public
 * @return {number}
 */
base.ModelInstance.prototype.getFrameB = function () {
    return this.frameB_;
};

/**
 * @public
 * @return {number}
 */
base.ModelInstance.prototype.getLerp = function () {
    return this.lerp_;
};

/**
 * @public
 * @param {number} frame
 */
base.ModelInstance.prototype.setFrame = function (frame) {
    goog.asserts.assert(frame >= 0 && frame <= this.baseModel.framesCount - 1);
    this.frameA_ = Math.floor(frame);
    this.frameB_ = Math.ceil(frame);
    this.lerp_ = frame - this.frameA_;
    this.dirty_ = true;
};

/**
 * @public
 * @param {number} frameA integer frame
 * @param {number} frameB integer frame
 * @param {number} lerp weight of frameB (0-1)
 * Interpolation between two arbitrary frames.
 */
base.ModelInstance.prototype.setFrameLerp = function (frameA, frameB, lerp) {
    goog.asserts.assert(frameA >= 0 && frameA <= this.baseModel.framesCount - 1);
    goog.asserts.assert(frameB >= 0 && frameB <= this.baseModel.framesCount - 1);
    this.frameA_ = Math.round(frameA);
    this.frameB_ = Math.round(frameB);
    this.lerp_ = lerp;
    this.dirty_ = true;
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
    this.dirty_ = true;
};

/**
 * @public
 * @return {boolean}
 */
base.ModelInstance.prototype.isDirty = function () {
    return this.dirty_;
};
/**
 * @public
 */
base.ModelInstance.prototype.clear = function () {
    this.dirty_ = false;
};

/**
 * This class corresponds to model surface. Note that we don't declare here
 * the MeshInstance class, since the game code doesn't need it. The renderer
 * however will create it, when making new ModelInstance.
 * @constructor
 * @param {base.GeometryData} geometry
 * @param {number} indicesOffset
 * @param {number} indicesCount
 * @param {Array.<string>} materialNames
 */
base.Mesh = function(geometry, indicesOffset, indicesCount, materialNames, lightningType) {
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
     * @type {Array.<string>}
     */
    this.materialNames = materialNames;
    /**
     * @const
     * @type {base.LightningType}
     */
    this.lightningType = lightningType;
     
    /**
     * @type {Array.<base.Material>}
     */
    this.materials = [];
};

/**
 * @enum
 */
base.LightningType = {
    LIGHT_2D: -4,
    LIGHT_VERTEX: -3,
    LIGHT_WHITE: -2,
    LIGHT_DYNAMIC: -1,
    LIGHT_MAP: 0,
    LIGHT_CUSTOM: 1
};


/**
 * Buffer for raw geometry data.
 * @constructor
 * @param {Uint16Array} indices Index array
 * @param {Array.<Float32Array>} vertices Array vertex array. One vertex array
 * @param {base.GeometryData.Layout} layout
 * corresponds to one frame.
 */
base.GeometryData = function(indices, vertices, layout) {
    goog.asserts.assert(layout >= 0 && layout < base.GeometryData.Layout.SIZE);
    /**
     * @const
     * @type {Uint16Array}
     */
    this.indices = indices;
    /**
     * @const
     * @type {Array.<Float32Array>}
     */
    this.vertices = vertices;
    /**
     * @const
     * @type {base.GeometryData.Layout}
     */
    this.layout = layout;
    /**
     * @type {number}
     */
    this.indexBufferId = -1;
    /**
     * @type {Array.<number>}
     */
    this.vertexBufferIds = [];
};

/**
 * @enum
 */
base.GeometryData.Layout = {
    BSP: 0,
    MD3: 1,
    SKY: 2,
    SIZE: 3
};

/**
 * @public
 * @param {function(...)} fun
 * Forces compiler not to remove specific function during dead code removing;
 */
base.makeUnremovable = function (fun) {
    var dummy = 1;
    ++dummy;
    if (dummy == 0) {
        fun.apply(goog.global); // it'll never be called
    }
};
