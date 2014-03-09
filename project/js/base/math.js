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















