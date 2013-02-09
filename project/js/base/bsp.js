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
goog.require('goog.asserts');

goog.provide('base.Bsp');

/**
 * @constructor
 * @private
 */
base.Bsp = function () {
    /**
     * @private
     * @type {Array.<base.Bsp.Plane>}
     */
    this.planes = [];
    /**
     * @private
     * @type {Array.<base.Bsp.Node>}
     */
    this.nodes = [];
    /**
     * @private
     * @type {Array.<base.Bsp.Leaf>}
     */
    this.leaves = [];
    /**
     * @private
     * @type {Array.<number>}
     */
    this.leafFaces = [];
    /**
     * @private
     * @type {Array.<number>}
     */
    this.leafBrushes = [];/**
     * @private
     * @type {Array.<base.Bsp.Brush>}
     */
    this.brushes = [];
    /**
     * @private
     * @type {Array.<base.Bsp.BrushSide>}
     */
    this.brushSides = [];
};

/**
 * @typedef {{allSolid: boolean, startSolid: boolean, fraction: number, endPos: base.Vec3, plane: base.Bsp.Plane}}
 */
base.Bsp.TraceOutput;

/**
 * @public
 * @param {base.Vec3} start
 * @param {base.Vec3} end
 * @param {number} [radius]
 * @return {base.Bsp.TraceOutput}
 */
base.Bsp.prototype.trace = function(start, end, radius) {
    var i;
    var output = {
        allSolid: false,
        startSolid: false,
        fraction: 1.0,
        endPos: end,
        plane: null
    };
    
    if(!radius) { radius = 0; }
    
    this.traceNode(0, 0, 1, start, end, radius, output);
    
    if(output.fraction != 1.0) { // collided with something
        for (i = 0; i < 3; i++) {
            output.endPos[i] = start[i] + output.fraction * (end[i] - start[i]);
        }
    }
    
    return output;
};

/**
 * @const
 * @type {number}
 */
base.Bsp.TRACE_OFFSET = 0.03125;

/**
 * @private
 * @param {number} nodeIdx
 * @param {number} startFraction
 * @param {number} endFraction
 * @param {base.Vec3} start
 * @param {base.Vec3} end
 * @param {number} radius
 * @param {base.Bsp.TraceOutput} output
 */
base.Bsp.prototype.traceNode = function(nodeIdx, startFraction, endFraction, start, end, radius, output) {
    var i,
        leaf, brush, surface,
        node, plane, startDist, endDist,
        side, fraction1, fraction2, middleFraction, middle,
        iDist;
    if (nodeIdx < 0) { // Leaf node?
        leaf = this.leaves[-(nodeIdx + 1)];
        for (i = 0; i < leaf.leafBrushesCount; i++) {
            brush = this.brushes[this.leafBrushes[leaf.firstLeafBrush + i]];
            if (brush.brushSidesCount > 0 && brush.flags & base.Bsp.BrushFlags.SOLID) {
                this.traceBrush(brush, start, end, radius, output);
            }
        }
        return;
    }
    
    // Tree node
    node = this.nodes[nodeIdx];
    plane = this.planes[node.plane];
    
    startDist = base.Vec3.dot(plane.normal, start) - plane.distance;
    endDist = base.Vec3.dot(plane.normal, end) - plane.distance;
    
    if (startDist >= radius && endDist >= radius) {
        this.traceNode(node.children[0], startFraction, endFraction, start, end, radius, output );
    } else if (startDist < -radius && endDist < -radius) {
        this.traceNode(node.children[1], startFraction, endFraction, start, end, radius, output );
    } else {
        middle = base.Vec3.create([0, 0, 0]);

        if (startDist < endDist) {
            side = 1; // back
            iDist = 1 / (startDist - endDist);
            fraction1 = (startDist - radius + base.Bsp.TRACE_OFFSET) * iDist;
            fraction2 = (startDist + radius + base.Bsp.TRACE_OFFSET) * iDist;
        } else if (startDist > endDist) {
            side = 0; // front
            iDist = 1 / (startDist - endDist);
            fraction1 = (startDist + radius + base.Bsp.TRACE_OFFSET) * iDist;
            fraction2 = (startDist - radius - base.Bsp.TRACE_OFFSET) * iDist;
        } else {
            side = 0; // front
            fraction1 = 1;
            fraction2 = 0;
        }
        
        if (fraction1 < 0) fraction1 = 0;
        else if (fraction1 > 1) fraction1 = 1;
        if (fraction2 < 0) fraction2 = 0;
        else if (fraction2 > 1) fraction2 = 1;
        
        middleFraction = startFraction + (endFraction - startFraction) * fraction1;
        
        for (i = 0; i < 3; i++) {
            middle[i] = start[i] + fraction1 * (end[i] - start[i]);
        }
        
        this.traceNode(node.children[side], startFraction, middleFraction, start, middle, radius, output );
        
        middleFraction = startFraction + (endFraction - startFraction) * fraction2;
        
        for (i = 0; i < 3; i++) {
            middle[i] = start[i] + fraction2 * (end[i] - start[i]);
        }
        
        this.traceNode(node.children[side===0?1:0], middleFraction, endFraction, middle, end, radius, output );
    }
};

base.Bsp.prototype.traceBrush = function(brush, start, end, radius, output) {
    var startFraction = -1;
    var endFraction = 1;
    var startsOut = false;
    var endsOut = false;
    var collisionPlane = null;
    var i, brushSide, plane, startDist, endDist, fraction;
    
    for (i = 0; i < brush.brushSidesCount; i++) {
        brushSide = this.brushSides[brush.firstBrushSide + i];
        plane = this.planes[brushSide.plane];
        
        startDist = base.Vec3.dot( start, plane.normal ) - (plane.distance + radius);
        endDist = base.Vec3.dot( end, plane.normal ) - (plane.distance + radius);

        if (startDist > 0) startsOut = true;
        if (endDist > 0) endsOut = true;

        // make sure the trace isn't completely on one side of the brush
        if (startDist > 0 && endDist > 0) { return; }
        if (startDist <= 0 && endDist <= 0) { continue; }

        if (startDist > endDist) { // line is entering into the brush
            fraction = (startDist - base.Bsp.TRACE_OFFSET) / (startDist - endDist);
            if (fraction > startFraction) {
                startFraction = fraction;
                collisionPlane = plane;
            }
        } else { // line is leaving the brush
            fraction = (startDist + base.Bsp.TRACE_OFFSET) / (startDist - endDist);
            if (fraction < endFraction)
                endFraction = fraction;
        }
    }
    
    if (startsOut === false) {
        output.startSolid = true;
        if (endsOut === false)
            output.allSolid = true;
        return;
    }

    if (startFraction < endFraction) {
        if (startFraction > -1 && startFraction < output.fraction) {
            output.plane = collisionPlane;
            if (startFraction < 0)
                startFraction = 0;
            output.fraction = startFraction;
        }
    }
    
    return;
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
base.Bsp.Builder = function () {
    /**
     * @private
     * @type {base.Bsp}
     */
    this.bsp = new base.Bsp();
};
/**
 * @public
 * @param {Array.<base.Bsp.Plane>} planes
 */
base.Bsp.Builder.prototype.addPlanes = function (planes) {
    this.bsp.planes = planes;
};
/**
 * @public
 * @param {Array.<base.Bsp.Node>} nodes
 */
base.Bsp.Builder.prototype.addNodes = function (nodes) {
    this.bsp.nodes = nodes;    
};
/**
 * @public
 * @param {Array.<base.Bsp.Leaf>} leaves
 */
base.Bsp.Builder.prototype.addLeaves = function (leaves) {
    this.bsp.leaves = leaves;
};
/**
 * @public
 * @param {Array.<number>} leafFaces
 */
base.Bsp.Builder.prototype.addLeafFaces = function (leafFaces) {
    this.bsp.leafFaces = leafFaces;
};
/**
 * @public
 * @param {Array.<number>} leafBrushes
 */
base.Bsp.Builder.prototype.addLeafBrushes = function (leafBrushes) {
    this.bsp.leafBrushes = leafBrushes;
};
/**
 * @public
 * @param {Array.<base.Bsp.Brush>} brushes
 */
base.Bsp.Builder.prototype.addBrushes = function (brushes) {
    this.bsp.brushes = brushes;
};
/**
 * @public
 * @param {Array.<base.Bsp.BrushSide>} brushSides
 */
base.Bsp.Builder.prototype.addBrushSides = function (brushSides) {
    this.bsp.brushSides = brushSides;
};
/**
 * @public
 * @return {base.Bsp}
 */
base.Bsp.Builder.prototype.getBsp = function () {
    goog.asserts.assert(this.bsp.planes.length);
    goog.asserts.assert(this.bsp.nodes.length);
    goog.asserts.assert(this.bsp.leaves.length);
    goog.asserts.assert(this.bsp.leafFaces.length);
    goog.asserts.assert(this.bsp.leafBrushes.length);
    goog.asserts.assert(this.bsp.brushes.length);
    goog.asserts.assert(this.bsp.brushSides.length);
    return this.bsp;
};

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
 * @param {Array.<number>} children
 * @param {base.Vec3} aabbMin
 * @param {base.Vec3} aabbMax
 */ 
base.Bsp.Node = function (plane, children, aabbMin, aabbMax) {
    /**
     * @public
     * @const
     * @type {number}
     */
    this.plane = plane;
    /**
     * @public
     * @const
     * @type {Array.<number>}
     */
    this.children = children;
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
 * @param {number} flags see base.Bsp.SurfaceFlags
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

