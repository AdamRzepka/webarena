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

'use strict';

goog.require('base');

goog.provide('base.Bsp');

/**
 * @constructor
 * @private
 */
base.Bsp = function () {
    this.planes = [];
    this.nodes = [];
    this.leaves = [];
    this.leafFaces = [];
    this.leafBrushes = [];
    this.brushes = [];
    this.brushSides = [];
};

// Flags taken from surfaceflags.h in quake 3 code
/**
 * @enum
 */
base.Bsp.BrushFlags = {
    SOLID: 1,		// an eye is never valid in a solid
    LAVA: 8,
    SLIME: 16,
    WATER: 32,
    FOG: 64,

    NOTTEAM1: 0x0080,
    NOTTEAM2: 0x0100,
    NOBOTCLIP: 0x0200,

    AREAPORTAL: 0x8000,

    PLAYERCLIP: 0x10000,
    MONSTERCLIP: 0x20000,
//bot specific contents types
    TELEPORTER: 0x40000,
    JUMPPAD: 0x80000,
    CLUSTERPORTAL: 0x100000,
    DONOTENTER: 0x200000,
    BOTCLIP: 0x400000,
    MOVER: 0x800000,

    ORIGIN: 0x1000000, // removed before bsping an entity

    BODY: 0x2000000, // should never be on a brush, only in game
    CORPSE: 0x4000000,
    DETAIL: 0x8000000, // brushes not used for the bsp
    STRUCTURAL: 0x10000000, // brushes used for the bsp
    TRANSLUCENT: 0x20000000, // don't consume surface fragments inside
    TRIGGER: 0x40000000,
    NODROP: 0x80000000 // don't leave bodies or items (death fog, lava)
};
/**
 * @enum
 */
base.Bsp.SurfaceFlags = {
    NODAMAGE: 0x1,		// never give falling damage
    SLICK: 0x2,		// effects game physics
    SKY: 0x4,		// lighting from environment map
    LADDER: 0x8,
    NOIMPACT: 0x10,	// don't make missile explosions
    NOMARKS: 0x20,	// don't leave missile marks
    FLESH: 0x40,	// make flesh sounds and effects
    NODRAW: 0x80,	// don't generate a drawsurface at all
    HINT: 0x100,	// make a primary bsp splitter
    SKIP: 0x200,	// completely ignore, allowing non-closed brushes
    NOLIGHTMAP: 0x400,	// surface doesn't need a lightmap
    POINTLIGHT: 0x800,	// generate lighting info at vertexes
    METALSTEPS: 0x1000,	// clanking footsteps
    NOSTEPS: 0x2000,	// no footstep sounds
    NONSOLID: 0x4000,	// don't collide against curves with this set
    LIGHTFILTER: 0x8000,	// act as a light filter during q3map -light
    ALPHASHADOW: 0x10000,	// do per-pixel light shadow casting in q3map
    NODLIGHT: 0x20000,	// don't dlight even if solid (solid lava, skies)
    DUST: 0x40000 // leave a dust trail when walking on this surface
};
/**
 * @constructor
 */
base.Bsp.Builder = function () {};
base.Bsp.Builder.prototype.addPlanes = function () {};
base.Bsp.Builder.prototype.addNodes = function () {};
base.Bsp.Builder.prototype.addLeaves = function () {};
base.Bsp.Builder.prototype.addLeafFaces = function () {};
base.Bsp.Builder.prototype.addLeafBrushes = function () {};
base.Bsp.Builder.prototype.addBrushes = function () {};
base.Bsp.Builder.prototype.addBrushSides = function () {};
base.Bsp.Builder.prototype.getBsp = function () {};

/**
 * @constructor
 * @param {base.Vec3} normal
 * @param {number} distance
 */ 
base.Bsp.Plane = function (normal, distance) {
    /**
     * @public
     * @const
     * @type {base.Vec3}
     */
    this.normal = normal;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.distance = distance;
};
/**
 * @constructor
 * @param {number} plane
 * @param {number} childA
 * @param {number} childB
 * @param {base.Vec3} aabbMin
 * @param {base.Vec3} aabbMax
 */ 
base.Bsp.Node = function (plane, childA, childB, aabbMin, aabbMax) {
    /**
     * @public
     * @const
     * @type {number}
     */
    this.plane = plane;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.childA = childA;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.childB = childB;
    /**
     * @public
     * @const
     * @type {base.Vec3}
     */
    this.aabbMin = aabbMin;
    /**
     * @public
     * @const
     * @type {base.Vec3}
     */
    this.aabbMax = aabbMax;
};
/**
 * @constructor
 * @param {number} cluster
 * @param {number} area
 * @param {base.Vec3} aabbMin
 * @param {base.Vec3} aabbMax
 * @param {number} firstLeafFace
 * @param {number} leafFacesCount
 * @param {number} firstLeafBrush
 * @param {number} leafBrushesCount 
 */ 
base.Bsp.Leaf = function (cluster, area, aabbMin, aabbMax, firstLeafFace,
                         leafFacesCount, firstLeafBrush, leafBrushesCount) {
    /**
     * @public
     * @const
     * @type {number}
     */
    this.cluster = cluster;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.area = area;
    /**
     * @public
     * @const
     * @type {base.Vec3}
     */
    this.aabbMin = aabbMin;
    /**
     * @public
     * @const
     * @type {base.Vec3}
     */
    this.aabbMax = aabbMax;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.firstLeafFace = firstLeafFace;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.leafFacesCount = leafFacesCount;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.firstLeafBrush = firstLeafBrush;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.leafBrushesCount = leafBrushesCount;
};
/**
 * @constructor
 * @param {number} firstBrushSide
 * @param {number} brushSidesCount
 * @param {number} flags see base.Bsp.BrushFlags
 */
base.Bsp.Brush = function (firstBrushSide, brushSidesCount, flags) {
    /**
     * @public
     * @const
     * @type {number}
     */
    this.firstBrushSide = firstBrushSide;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.brushSidesCount = brushSidesCount;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.flags = flags;
};
/**
 * @constructor
 * @param {number} plane
 * @param {number flags see base.Bsp.SurfaceFlags
 */
base.Bsp.BrushSide = function (plane, flags) {
    /**
     * @public
     * @const
     * @type {number}
     */
    this.plane = plane;
    /**
     * @public
     * @const
     * @type {number}
     */
    this.flags = flags;
};

