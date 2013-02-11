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

// This file is based on q3movement.js from webgl-quake3 by Brandon Jones
// Copyright note from original file:

/*
 * q3movement.js - Handles player movement through a bsp structure
 */
 
/*
 * Copyright (c) 2009 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

// Much of this file is a simplified/dumbed-down version of the Q3 player movement code
// found in bg_pmove.c and bg_slidemove.c

'use strict';

goog.require('base.Vec3');
goog.require('base.Bsp');
goog.require('game.globals');
goog.require('game.InputBuffer');
goog.provide('game.CharacterController');

/**
 * @constructor
 * @param {base.Bsp} bsp
 * @param {game.InputBuffer} input
 */
game.CharacterController = function(bsp, input) {
    /**
     * @const
     * @private
     * @type {base.Bsp}
     */
    this.bsp = bsp;
    /**
     * @const
     * @private
     * @type {game.InputBuffer}
     */
    this.input = input;
    /**
     * @private
     * @type {base.Vec3}
     */
    this.velocity = base.Vec3.create([0, 0, 0]);
    /**
     * @private
     * @type {base.Vec3}
     */
    this.position = base.Vec3.create([0, 0, 0]);
    /**
     * @private
     * @type {base.Vec3}
     */
    this.direction = base.Vec3.create([0, 0, 0]);
    /**
     * @private
     * @type {number}
     */
    this.xAngle = Math.PI / 2;
    /**
     * @private
     * @type {number}
     */
    this.zAngle = 0;
    /**
     * @private
     * @type {base.Mat4}
     */
    this.camMtx = base.Mat4.identity();
    /**
     * @private
     * @type {boolean}
     */
    this.onGround = false;
    /**
     * @type {?base.Bsp.TraceOutput}
     */
    this.groundTrace = null;
    
    this.buildCameraMatrix_();
};

// Some movement constants ripped from the Q3 Source code
/**
 * @const
 * @type{number}
 */
game.CharacterController.STOP_SPEED = 100.0;
/**
 * @const
 * @type{number}
 */
game.CharacterController.DUCK_SCALE = 0.25;
/**
 * @const
 * @type{number}
 */
game.CharacterController.JUMP_VELOCITY = 120;

/**
 * @const
 * @type{number}
 */
game.CharacterController.ACCELERATE = 10.0;
/**
 * @const
 * @type{number}
 */
game.CharacterController.AIR_ACCELERATE = 0.1;
/**
 * @const
 * @type{number}
 */
game.CharacterController.FLY_ACCELERATE = 8.0;

/**
 * @const
 * @type{number}
 */
game.CharacterController.FRICTION = 6.0;
/**
 * @const
 * @type{number}
 */
game.CharacterController.FLIGHT_FRICTION = 3.0;

/**
 * @const
 * @type{number}
 */
game.CharacterController.OVERCLIP = 0.501;
/**
 * @const
 * @type{number}
 */
game.CharacterController.STEP_SIZE = 18;

/**
 * @const
 * @type{number}
 */
game.CharacterController.GRAVITY = 200.0;

/**
 * @const
 * @type{number}
 */
game.CharacterController.PLAYER_RADIUS = 10.0;
/**
 * @const
 * @type{number}
 */
game.CharacterController.SCALE = 150;

/**
 * @public
 * @param {base.Vec3} position
 * @param {number} zAngle
 */
game.CharacterController.prototype.respawn = function (position, zAngle) {
    this.position = position;
    this.zAngle = zAngle;
    this.xAngle = Math.PI / 2;
    this.buildCameraMatrix_();
};
/**
 * @public
 */
game.CharacterController.prototype.update = function () {
    var dir = this.direction;
    base.Vec3.setZero(dir);
    
    if (this.input.getAction(game.InputBuffer.Action.UP)) {
	dir[1] += 1;
    }
    if (this.input.getAction(game.InputBuffer.Action.DOWN)) {
	dir[1] -= 1;
    }
    if (this.input.getAction(game.InputBuffer.Action.LEFT)) {
	dir[0] -= 1;
    }
    if (this.input.getAction(game.InputBuffer.Action.RIGHT)) {
	dir[0] += 1;
    }
    if (this.input.getAction(game.InputBuffer.Action.FIRE)) {
        this.zAngle -= this.input.getCursor().dx / 75.0;
        if (this.zAngle > 2 * Math.PI) {
            this.zAngle -= 2 * Math.PI;
        }
        if (this.zAngle < 0) {
            this.zAngle += 2 * Math.PI;
        }

        this.xAngle -= this.input.getCursor().dy / 75.0;
        if (this.xAngle > Math.PI) {
            this.xAngle = Math.PI;
        }
        if (this.xAngle < 0) {
            this.xAngle = 0;
        }
    }

    base.Mat4.identity(this.camMtx);
    base.Mat4.rotateZ(this.camMtx, this.zAngle);
        
    base.Mat4.multiplyVec3(this.camMtx, dir);
        
    this.move(dir);

    if (this.input.hasActionStarted(game.InputBuffer.Action.JUMP)) {
        this.jump();
    }

    this.buildCameraMatrix_();
};

/**
 * @public
 * @return {base.Mat4}
 */
game.CharacterController.prototype.getCameraMatrix = function () {
    return this.camMtx;
};
/**
 * @public
 * @return {base.Vec3}
 */
game.CharacterController.prototype.getPosition = function () {
    return this.position;
};
/**
 * @public
 * @return {base.Vec3}
 */
game.CharacterController.prototype.getDirection = function () {
    return this.direction;
};
/**
 * @public
 * @return {base.Vec3}
 */
game.CharacterController.prototype.getVelocity = function () {
    return this.velocity;
};
/**
 * @public
 * @return {number}
 */
game.CharacterController.prototype.getXAngle = function () {
    return this.xAngle;
};
/**
 * @public
 * @return {number}
 */
game.CharacterController.prototype.getZAngle = function () {
    return this.zAngle;
};

/**
 * @private
 */
game.CharacterController.prototype.buildCameraMatrix_ = function () {
    base.Mat4.identity(this.camMtx);
    base.Mat4.rotateZ(this.camMtx, this.zAngle);
    base.Mat4.rotateX(this.camMtx, this.xAngle);
    this.camMtx[12] = this.position[0];
    this.camMtx[13] = this.position[1];
    this.camMtx[14] = this.position[2] + 30;
};

/**
 * @private
 */
game.CharacterController.prototype.applyFriction = function() {
    if(!this.onGround) { return; }
    
    var speed = base.Vec3.length(this.velocity);
    
    var drop = 0;
    
    var control = speed < game.CharacterController.STOP_SPEED ? game.CharacterController.STOP_SPEED : speed;
    drop += control*game.CharacterController.FRICTION * game.globals.TIME_STEP;
    
    var newSpeed = speed - drop;
    if (newSpeed < 0) {
        newSpeed = 0;
    }
    if(speed !== 0) {
        newSpeed /= speed;
        base.Vec3.scale(this.velocity, newSpeed);
    } else {
        base.Vec3.setZero(this.velocity);
    }
};

/**
 * @private
 */
game.CharacterController.prototype.groundCheck = function() {
    var checkPoint = base.Vec3.create([this.position[0], this.position[1],
                      this.position[2] - game.CharacterController.PLAYER_RADIUS - 0.25]);
    
    this.groundTrace = this.bsp.trace(this.position, checkPoint,
                                      game.CharacterController.PLAYER_RADIUS);
    
    if(this.groundTrace.fraction == 1.0) { // falling
        this.onGround = false;
        return;
    }
    
    if ( this.velocity[2] > 0 &&
         base.Vec3.dot( this.velocity, this.groundTrace.plane.normal ) > 10 ) { // jumping
        this.onGround = false;
        return;
    }
    
    if(this.groundTrace.plane.normal[2] < 0.7) { // steep slope
        this.onGround = false;
        return;
    }
    
    this.onGround = true;
};
/**
 * @private
 */
game.CharacterController.prototype.clipVelocity = function(velIn, normal) {
    var backoff = base.Vec3.dot(velIn, normal);
    
    if ( backoff < 0 ) {
        backoff *= game.CharacterController.OVERCLIP;
    } else {
        backoff /= game.CharacterController.OVERCLIP;
    }
    
    var change = base.Vec3.scale(normal, backoff, base.Vec3.create([0,0,0]));
    return base.Vec3.subtract(velIn, change, change);
};
/**
 * @private
 */
game.CharacterController.prototype.accelerate = function(dir, speed, accel) {
    var currentSpeed = base.Vec3.dot(this.velocity, dir);
    var addSpeed = speed - currentSpeed;
    if (addSpeed <= 0) {
        return;
    }
    
    var accelSpeed = accel*game.globals.TIME_STEP*speed;
    if (accelSpeed > addSpeed) {
        accelSpeed = addSpeed;
    }
    
    var accelDir = base.Vec3.scale(dir, accelSpeed, base.Vec3.create([0,0,0]));
    base.Vec3.add(this.velocity, accelDir);
};
/**
 * @private
 * @return {boolean}
 */
game.CharacterController.prototype.jump = function() {
    if(!this.onGround) { return false; }
    
    this.onGround = false;
    this.velocity[2] = game.CharacterController.JUMP_VELOCITY;
    
    //Make sure that the player isn't stuck in the ground
    var groundDist = base.Vec3.dot( this.position, this.groundTrace.plane.normal )
            - this.groundTrace.plane.distance - game.CharacterController.PLAYER_RADIUS;
    base.Vec3.add(this.position, base.Vec3.scale(this.groundTrace.plane.normal,
                                                 groundDist + 5,
                                                 base.Vec3.create([0, 0, 0])));
    
    return true;
};
/**
 * @private
 * @param {base.Vec3} dir
 * @return {base.Vec3}
 */
game.CharacterController.prototype.move = function(dir) {
//    game.globals.TIME_STEP = frameTime*0.0075;
    
    this.groundCheck();
    
    base.Vec3.normalize(dir);
    
    if(this.onGround) {
        this.walkMove(dir);
    } else {
        this.airMove(dir);
    }
    
    return this.position;
};
/**
 * @private
 * @param {base.Vec3} dir
 */
game.CharacterController.prototype.airMove = function(dir) {
    var speed = base.Vec3.length(dir) * game.CharacterController.SCALE;
    
    this.accelerate(dir, speed, game.CharacterController.AIR_ACCELERATE);
    
    this.stepSlideMove( true );
};

/**
 * @private
 * @param {base.Vec3} dir
 */
game.CharacterController.prototype.walkMove = function(dir) {
    this.applyFriction();
    
    var speed = base.Vec3.length(dir) * game.CharacterController.SCALE;
    
    this.accelerate(dir, speed, game.CharacterController.ACCELERATE);
    
    this.velocity = this.clipVelocity(this.velocity, this.groundTrace.plane.normal);
    
    if(!this.velocity[0] && !this.velocity[1]) { return; }
    
    this.stepSlideMove( false );
};

/**
 * @private
 * @param {boolean} gravity
 * @return {boolean}
 */
game.CharacterController.prototype.slideMove = function(gravity) {
    var bumpcount;
    var numbumps = 4;
    var planes = [];
    var endVelocity = base.Vec3.create([0,0,0]);
    
    if ( gravity ) {
        base.Vec3.set(this.velocity, endVelocity );
        endVelocity[2] -= game.CharacterController.GRAVITY
            * game.globals.TIME_STEP;
        this.velocity[2] = ( this.velocity[2] + endVelocity[2] ) * 0.5;
        
        if ( this.groundTrace && this.groundTrace.plane ) {
            // slide along the ground plane
            this.velocity = this.clipVelocity(this.velocity,
                                              this.groundTrace.plane.normal);
        }
    }

    // never turn against the ground plane
    if ( this.groundTrace && this.groundTrace.plane ) {
        planes.push(base.Vec3.set(this.groundTrace.plane.normal,
                                  base.Vec3.create([0,0,0])));
    }

    // never turn against original velocity
    planes.push(base.Vec3.normalize(this.velocity, base.Vec3.create([0,0,0])));
    
    var time_left = game.globals.TIME_STEP;
    var end = base.Vec3.create([0,0,0]);
    for(bumpcount=0; bumpcount < numbumps; ++bumpcount) {
        
        // calculate position we are trying to move to
        base.Vec3.add(this.position,
                      base.Vec3.scale(this.velocity, time_left,
                                      base.Vec3.createVal(0,0,0)), end);
        
        // see if we can make it there
        var trace = this.bsp.trace(this.position, end, game.CharacterController.PLAYER_RADIUS);

        if (trace.allSolid) {
            // entity is completely trapped in another solid
            this.velocity[2] = 0;   // don't build up falling damage, but allow sideways acceleration
            return true;
        }

        if (trace.fraction > 0) {
            // actually covered some distance
            base.Vec3.set(trace.endPos, this.position);
        }

        if (trace.fraction == 1) {
             break;     // moved the entire distance
        }
        
        time_left -= time_left * trace.fraction;
        
        planes.push(base.Vec3.set(trace.plane.normal, base.Vec3.create([0,0,0])));

        //
        // modify velocity so it parallels all of the clip planes
        //

        // find a plane that it enters
        for(var i = 0; i < planes.length; ++i) {
            var into = base.Vec3.dot(this.velocity, planes[i]);
            if ( into >= 0.1 ) { continue; } // move doesn't interact with the plane
            
            // slide along the plane
            var clipVelocity = this.clipVelocity(this.velocity, planes[i]);
            var endClipVelocity = this.clipVelocity(endVelocity, planes[i]);

            // see if there is a second plane that the new move enters
            for (var j = 0; j < planes.length; j++) {
                if ( j == i ) { continue; }
                if ( base.Vec3.dot( clipVelocity, planes[j] ) >= 0.1 ) {
                    // move doesn't interact with the plane
                    continue;
                }
                
                // try clipping the move to the plane
                clipVelocity = this.clipVelocity( clipVelocity, planes[j] );
                endClipVelocity = this.clipVelocity( endClipVelocity, planes[j] );

                // see if it goes back into the first clip plane
                if ( base.Vec3.dot( clipVelocity, planes[i] ) >= 0 ) { continue; }

                // slide the original velocity along the crease
                var dir = base.Vec3.create([0,0,0]);
                base.Vec3.cross(planes[i], planes[j], dir);
                base.Vec3.normalize(dir);
                var d = base.Vec3.dot(dir, this.velocity);
                base.Vec3.scale(dir, d, clipVelocity);

                base.Vec3.cross(planes[i], planes[j], dir);
                base.Vec3.normalize(dir);
                d = base.Vec3.dot(dir, endVelocity);
                base.Vec3.scale(dir, d, endClipVelocity);

                // see if there is a third plane the the new move enters
                for(var k = 0; k < planes.length; ++k) {
                    if ( k == i || k == j ) { continue; }
                    if ( base.Vec3.dot( clipVelocity, planes[k] ) >= 0.1 ) {
                        // move doesn't interact with the plane
                        continue;
                    }
                    
                    // stop dead at a tripple plane interaction
                    this.velocity = base.Vec3.createVal(0,0,0);
                    return true;
                }
            }

            // if we have fixed all interactions, try another move
            base.Vec3.set( clipVelocity, this.velocity );
            base.Vec3.set( endClipVelocity, endVelocity );
            break;
        }
    }

    if ( gravity ) {
        base.Vec3.set( endVelocity, this.velocity );
    }

    return ( bumpcount !== 0 );
};

/**
 * @private
 * @param {boolean} gravity
 */
game.CharacterController.prototype.stepSlideMove = function(gravity) {
    var start_o = base.Vec3.set(this.position, base.Vec3.create([0,0,0]));
    var start_v = base.Vec3.set(this.velocity, base.Vec3.create([0,0,0]));
    
    if ( this.slideMove( gravity ) === false ) {
        // we got exactly where we wanted to go first try
        return;
    }

    var down = base.Vec3.set(start_o, base.Vec3.createVal(0,0,0));
    down[2] -= game.CharacterController.STEP_SIZE;
    var trace = this.bsp.trace(start_o, down, game.CharacterController.PLAYER_RADIUS);
    
    var up = base.Vec3.create([0,0,1]);
    
    // never step up when you still have up velocity
    if ( this.velocity[2] > 0 &&
         (trace.fraction == 1.0 || base.Vec3.dot(trace.plane.normal, up) < 0.7)) {
        return;
    }
    
    var down_o = base.Vec3.set(this.position, base.Vec3.create([0,0,0]));
    var down_v = base.Vec3.set(this.velocity, base.Vec3.create([0,0,0]));
    
    base.Vec3.set(start_o, up);
    up[2] += game.CharacterController.STEP_SIZE;
    
    // test the player position if they were a stepheight higher
    trace = this.bsp.trace(start_o, up, game.CharacterController.PLAYER_RADIUS);
    if ( trace.allSolid ) { return; } // can't step up
    
    var stepSize = trace.endPos[2] - start_o[2];
    // try slidemove from this position
    base.Vec3.set(trace.endPos, this.position);
    base.Vec3.set(start_v, this.velocity);
    
    this.slideMove( gravity );
    
    // push down the final amount
    base.Vec3.set(this.position, down);
    down[2] -= stepSize;
    trace = this.bsp.trace(this.position, down, game.CharacterController.PLAYER_RADIUS);
    if ( !trace.allSolid ) {
        base.Vec3.set(trace.endPos, this.position);
    }
    if ( trace.fraction < 1.0 ) {
        this.velocity = this.clipVelocity( this.velocity, trace.plane.normal );
    }
};
