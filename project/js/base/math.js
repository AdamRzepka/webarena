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

'use strict';

goog.require('base.Vec3');
goog.provide('base.math');

base.math.clamp = function (x, min, max) {
    if (x >= max) {
        return max;
    } else if (x <= min) {
        return min;
    } else {
        return x;
    }
};

/**
 * @param {base.Vec3} min AABB min
 * @param {base.Vec3} max AABB max
 * @param {base.Vec3} from
 * @param {base.Vec3} to
 * @return {number} fraction (or one, if not hit)
 */
base.math.rayAABB = function (min, max, from, to) {
    var i = 0;
    var fraction = 1;
    var point = base.Vec3.create();
    for (i = 0; i < 3; ++i) {
        if (from[i] <= to[i]) {
            if (from[i] < max[i] && to[i] > min[i]) {
                point[i] = min[i];
                continue;
            }
        }
        if (from[i] > to[i]) {
            if (to[i] < max[i] && from[i] > min[i]) {
                point[i] = max[i];
                continue;
            }
        }
        return fraction;
    }

    fraction = base.Vec3.length(base.Vec3.subtract(point, from, base.Vec3.create())) /
        base.Vec3.length(base.Vec3.subtract(to, from, base.Vec3.create()));
    return fraction;
};

/**
 *
 * http://wiki.cgsociety.org/index.php/Ray_Sphere_Intersection
 */
base.math.raySphere = function (center, radius, from, to) {
    var d = base.Vec3.subtract(to, from, base.Vec3.create());
    var dd = base.Vec3.length(d);
    base.Vec3.scale(d, 1/dd);

    var centerToFrom = base.Vec3.subtract(from, center, base.Vec3.create());

    var a = 1; // d is normalized
    var b = 2 * base.Vec3.dot(centerToFrom, d);
    var c = base.Vec3.length2(centerToFrom) - radius * radius;

    var delta = b*b - 4*a*c;

    if (delta < 0)
        return 1;

    var deltaSqrt = Math.sqrt(delta);
    var t0 = (-b - deltaSqrt) / (2*a);
    var t1 = (-b + deltaSqrt) / (2*a);
    var t = t0;
    if (t < 0)
        t = t1;

    return (t >= 0 ) ? t / dd : 1;
};

/**
 * http://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
 */
base.math.rayTriangle = function(v1, v2, v3, from, to) {
    var o = from;
    var d = base.Vec3.subtract(to, from, base.Vec3.create());
    var e1 = base.Vec3.create(), e2 = base.Vec3.create();  //Edge1, Edge2
    var p = base.Vec3.create(), q = base.Vec3.create(), t = base.Vec3.create();
    var det, inv_det, u, v;
    var epsilon = 0.000001;
    var tparam;
 
    //Find vectors for two edges sharing V1
    base.Vec3.subtract(v2, v1, e1);
    base.Vec3.subtract(v3, v1, e2);
    //Begin calculating determinant - also used to calculate u parameter
    base.Vec3.cross(d, e2, p);
    //if determinant is near zero, ray lies in plane of triangle
    det = base.Vec3.dot(e1, p);
    //NOT CULLING
    if(det > -epsilon && det < epsilon) return 0;
    inv_det = 1 / det;
 
    //calculate distance from V1 to ray origin
    base.Vec3.subtract(o, v1, t);
 
    //Calculate u parameter and test bound
    u = base.Vec3.dot(t, p) * inv_det;
    //The intersection lies outside of the triangle
    if(u < 0 || u > 1) return 1;
 
    //Prepare to test v parameter
    base.Vec3.cross(t, e1, q);
    
    //Calculate V parameter and test bound
    v = base.Vec3.dot(d, q) * inv_det;
    //The intersection lies outside of the triangle
    if(v < 0 || u + v  > 1) return 1;
    
    tparam = base.Vec3.dot(e2, q) * inv_det;
    
    if(tparam > epsilon) { //ray intersection
        return tparam / base.Vec3.length(d);
    }
    
    // No hit, no win
    return 1;
};

base.math.transformAABB = function (min, max, mtx) {
    // TODO    
};

base.math.transformSphere = function (center, radius, mtx) {
    // assume uniform scaling
    var scale = base.Vec3.length(base.Mat4.getRow(mtx, 0, base.Vec3.create()));
    return {
        center: base.Mat4.multiplyVec3(mtx, center, base.Vec3.create()),
        radius: radius * scale
    };
};

base.math.transformRay = function (from, to, mtx) {
    var mtxInv = base.Mat4.inverse(mtx, base.Mat4.identity());
    return {
        from: base.Mat4.multiplyVec3(mtxInv, from, base.Vec3.create()),
        to: base.Mat4.multiplyVec3(mtxInv, to, base.Vec3.create())
    };
};
