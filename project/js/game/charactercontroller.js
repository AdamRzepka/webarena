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

goog.require('game.Player');
goog.require('base.Vec3');
goog.require('base.Bsp');
goog.require('game.globals');
goog.require('game.InputBuffer');
goog.require('network');
goog.require('game.Weapon');
goog.require('game.MachineGun');
goog.require('game.ModelManager');
goog.require('base.IHud');

goog.provide('game.CharacterController');

/**
 * @constructor
 * @implements {network.ISynchronizable}
 * @param {base.Bsp} bsp
 * @param {game.Player} player
 * @param {boolean} owned
 * @param {game.ModelManager} mm
 * @param {base.IHud} hud
 */
game.CharacterController = function(bsp, player, owned, mm, hud) {
    /**
     * @const
     * @private
     * @type {base.Bsp}
     */
    this.bsp = bsp;
    /**
     * @const
     * @private
     * @type {boolean}
     */
    this.owned = owned;
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
     * @type {base.Vec3}
     */
    this.directionTrans = base.Vec3.create([0, 0, 0]);
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
     * @type {number}
     */
    this.xAngleDiff = Math.PI / 2;
    /**
     * @private
     * @type {number}
     */
    this.zAngleDiff = 0;
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
    /**
     * @private
     * @type {game.Player}
     */
    this.player_ = player;
    /**
     * @private
     * @type {game.Weapon}
     */
    this.weapon_ = new game.MachineGun(mm);
    /**
     * @private
     * @type {game.Player.TorsoStates}
     */
    this.torsoState = game.Player.TorsoStates.IDLE;
    /**
     * @private
     * @type {game.Player.LegsStates}
     */
    this.legsState = game.Player.LegsStates.IDLE;
    /**
     * @private
     * @type {number}
     */
    this.xAngVelocity = 0;
    /**
     * @private
     * @type {number}
     */
    this.zAngVelocity = 0;
    /**
     * @type {base.IHud}
     */
    this.hud = hud;
    /**
     * @type {number}
     */
    this.hp = 100;
    /**
     * @type {number}
     */
    this.dyingProgress = 0;

    this.dummyInput = new game.InputBuffer();

    this.stateArchive_ = [];
    
    this.buildCameraMatrix_();
};

/**
 * @public
 * @param {network.ISynchronizer} sync
 * @suppress {checkTypes}
 */
game.CharacterController.prototype.synchronize = function (sync) {
    var i = 0;

    sync.synchronize(this.weapon_, network.Type.OBJECT, 0);
    if (sync.getMode() == network.ISynchronizer.Mode.WRITE && this.owned) {
        var pos = new Float32Array(5);

        var serverPosition = sync.synchronize(this.position, network.Type.VEC3, 0);
        var xServerAngle = sync.synchronize(this.xAngle, network.Type.FLOAT32, 0);
        var zServerAngle = sync.synchronize(this.zAngle, network.Type.FLOAT32, 0);
        
        var state = null;
        while (this.stateArchive_.length &&
               this.stateArchive_[0].input.timestamp <= sync.getInputTimestamp()) {
            if (this.stateArchive_[0].input.timestamp === sync.getInputTimestamp()) {
                state = this.stateArchive_[0];
                break;
            }
            this.stateArchive_.shift();
        }

        if (state !== null) {
            var diff = (Math.abs(xServerAngle - state.xAngle) > 0.5) || 
                    (Math.abs(zServerAngle - state.zAngle) > 0.5) ||
                    (Math.abs(serverPosition[0] - state.position[0]) > 20) ||
                    (Math.abs(serverPosition[1] - state.position[1]) > 20) ||
                    (Math.abs(serverPosition[2] - state.position[2]) > 20);
            if (diff) {
                this.position = serverPosition;
                this.xAngle = xServerAngle;
                this.zAngle = zServerAngle;
                
                this.velocity = sync.synchronize(this.velocity, network.Type.VEC3, 0);
                this.direction = sync.synchronize(this.direction, network.Type.VEC3,
                                                  network.Flags.NORMAL_VECTOR);
                
                this.onGround = sync.synchronize(this.onGround, network.Type.BOOL, 0);
                this.torsoState = sync.synchronize(this.torsoState, network.Type.INT8, 0);
                this.legsState = sync.synchronize(this.legsState, network.Type.INT8, 0);
                this.xAngVelocity = sync.synchronize(this.xAngVelocity, network.Type.FLOAT32, 0);
                this.zAngVelocity = sync.synchronize(this.zAngVelocity, network.Type.FLOAT32, 0);


                var buffer = new game.InputBuffer();
                buffer.step(state.input);
                for (i = 1; i < this.stateArchive_.length; ++i) {
                    buffer.step(this.stateArchive_[i].input);
                    this.updateServer(game.globals.TIME_STEP_MS, buffer);
                    this.stateArchive_.pop();
                }
            } else {
                sync.synchronize(this.velocity, network.Type.VEC3, 0);
                sync.synchronize(this.direction, network.Type.VEC3,
                                                  network.Flags.NORMAL_VECTOR);
                
                sync.synchronize(this.onGround, network.Type.BOOL, 0);
                sync.synchronize(this.torsoState, network.Type.INT8, 0);
                sync.synchronize(this.legsState, network.Type.INT8, 0);
                sync.synchronize(this.xAngVelocity, network.Type.FLOAT32, 0);
                sync.synchronize(this.zAngVelocity, network.Type.FLOAT32, 0);

            }
        } else {
            this.position = serverPosition;
            this.xAngle = xServerAngle;
            this.zAngle = zServerAngle;
            
            this.velocity = sync.synchronize(this.velocity, network.Type.VEC3, 0);
            this.direction = sync.synchronize(this.direction, network.Type.VEC3,
                                              network.Flags.NORMAL_VECTOR);
            
            this.onGround = sync.synchronize(this.onGround, network.Type.BOOL, 0);
            this.torsoState = sync.synchronize(this.torsoState, network.Type.INT8, 0);
            this.legsState = sync.synchronize(this.legsState, network.Type.INT8, 0);
            this.xAngVelocity = sync.synchronize(this.xAngVelocity, network.Type.FLOAT32, 0);
            this.zAngVelocity = sync.synchronize(this.zAngVelocity, network.Type.FLOAT32, 0);

        }
    } else {
        this.position = sync.synchronize(this.position, network.Type.VEC3, 0);
        this.xAngle = sync.synchronize(this.xAngle, network.Type.FLOAT32, 0);
        this.zAngle = sync.synchronize(this.zAngle, network.Type.FLOAT32, 0);
        this.velocity = sync.synchronize(this.velocity, network.Type.VEC3, 0);
        this.direction = sync.synchronize(this.direction, network.Type.VEC3,
                                          network.Flags.NORMAL_VECTOR);
        
        this.onGround = sync.synchronize(this.onGround, network.Type.BOOL, 0);
        this.torsoState = sync.synchronize(this.torsoState, network.Type.INT8, 0);
        this.legsState = sync.synchronize(this.legsState, network.Type.INT8, 0);
        this.xAngVelocity = sync.synchronize(this.xAngVelocity, network.Type.FLOAT32, 0);
        this.zAngVelocity = sync.synchronize(this.zAngVelocity, network.Type.FLOAT32, 0);

        if (sync.getMode() == network.ISynchronizer.Mode.READ) {
//            console.log(this.xAngVelocity);
        }
    }
    if (sync.getMode() == network.ISynchronizer.Mode.WRITE) {
        var hp = sync.synchronize(this.hp, network.Type.INT8, 0);
        if (this.hp !== hp) {
            if (this.owned) {
                this.hud.setHp(hp);
            }
            if (this.hp > 0 && hp <= 0) {
                this.kill();            
            } else if (this.hp <= 0 && hp > 0) {
                this.respawn();
            }
        }
        this.hp = hp;
    } else {
        this.hp = sync.synchronize(this.hp, network.Type.INT8, 0);
    }
    
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
game.CharacterController.GRAVITY = 400.0;

/**
 * @const
 * @type{number}
 */
game.CharacterController.PLAYER_RADIUS = 14.0;
/**
 * @const
 * @type{number}
 */
game.CharacterController.SCALE = 250;

/**
 * @public
 * @param {number} hp
 */
game.CharacterController.prototype.addHp = function (hp) {
    if (this.hp <= 0) {
        return;
    }
    this.hp += hp;
    if (this.hp > 100) {
        this.hp = 100;
    }
    if (this.hp <= 0) {
        this.kill();
    }
};
/**
 * @public
 */
game.CharacterController.prototype.respawn = function (spawnPoint) {
    if (spawnPoint) {
        base.Vec3.set((/**@type{base.Vec3}*/spawnPoint['origin']), this.position);
        this.zAngle = spawnPoint['angle'] * Math.PI / 180 - Math.PI * 0.5;
        this.xAngle = Math.PI / 2;
        base.Vec3.setZero(this.velocity);
        this.buildCameraMatrix_();
    }
    this.player_.respawn();
    this.hp = 100;
    this.weapon_.show(true);
    this.hud.setHp(this.hp);
};

game.CharacterController.prototype.kill = function () {
    this.dyingProgress = 0;
    this.player_.kill();
    this.hp = 0;
    this.weapon_.show(false);
};
/**
 * @return {game.Player}
 */
game.CharacterController.prototype.getPlayer = function () {
    return this.player_;
};
/**
 * @public
 */
game.CharacterController.prototype.updateClient = function (dt) {

    this.xAngle += this.xAngVelocity * dt;
    this.zAngle += this.zAngVelocity * dt;
    
    base.Mat4.identity(this.camMtx);
    base.Mat4.rotateZ(this.camMtx, this.zAngle);
        
    base.Mat4.multiplyVec3(this.camMtx, this.direction, this.directionTrans);

    if (dt > 0) {
        if (!this.player_.isDead() || !this.onGround) {
            this.move(this.directionTrans, this.dummyInput);
        }
    }

    this.buildCameraMatrix_();
    this.player_.update(this.torsoState,
                        this.legsState,
                        this.position,
                        this.direction,
                        this.zAngle,
                        this.xAngle,
                        this.camMtx);
    this.weapon_.update(dt, this.player_.getWeaponMtx());
};

/**
 * @public
 * @param {number} dt
 * @param {game.InputBuffer} input
 */
game.CharacterController.prototype.updateServer = function (dt, input, scene) {
    var dir = this.direction;
    this.torsoState = game.Player.TorsoStates.IDLE;
    this.legsState = game.Player.LegsStates.IDLE;

    base.Vec3.setZero(dir);

    if (input.getAction(base.InputState.Action.UP)) {
	dir[1] += 1;
    }
    if (input.getAction(base.InputState.Action.DOWN)) {
	dir[1] -= 1;
    }
    if (input.getAction(base.InputState.Action.LEFT)) {
	dir[0] -= 1;
    }
    if (input.getAction(base.InputState.Action.RIGHT)) {
	dir[0] += 1;
    }
    var lastZAngle = this.zAngle;
    var lastXAngle = this.xAngle;

    if (!this.player_.isDead()) {
        this.zAngle -= input.getDeltaX() / 200.0;
//        this.zAngle = -input.getX() / 200.0 % (2 * Math.PI);
        if (this.zAngle > 2 * Math.PI) {
            this.zAngle -= 2 * Math.PI;
        }
        if (this.zAngle < 0) {
            this.zAngle += 2 * Math.PI;
        }

        // this.xAngle = -input.getY() / 200.0 + Math.PI * 0.5;
        this.xAngle -= input.getDeltaY() / 200.0;
        if (this.xAngle > Math.PI) {
            this.xAngle = Math.PI;
        }
        if (this.xAngle < 0) {
            this.xAngle = 0;
        }
    }
    this.xAngVelocity = (this.xAngle - lastXAngle) / dt;
    this.zAngVelocity = (this.zAngle - lastZAngle) / dt;

    base.Mat4.identity(this.camMtx);
    base.Mat4.rotateZ(this.camMtx, this.zAngle);
        
    base.Mat4.multiplyVec3(this.camMtx, dir, this.directionTrans);

    if (!this.player_.isDead() || !this.onGround)
        this.move(this.directionTrans, input);

    if (base.Vec3.length2(this.velocity) > 0.01) {
        this.legsState = game.Player.LegsStates.RUN;
        if (input.getAction(base.InputState.Action.WALK)) {
            this.legsState = game.Player.LegsStates.WALK;
        }
        
        if (input.getAction(base.InputState.Action.CROUCH)) {
            this.legsState = game.Player.LegsStates.CROUCH;
        }        
    } else if (input.getAction(base.InputState.Action.CROUCH)) {
        this.legsState = game.Player.LegsStates.IDLE_CROUCH;
    }
    
    if (!this.onGround) {
        this.legsState = game.Player.LegsStates.IN_AIR;
    }

    if (!this.player_.isDead() && this.onGround
        && input.hasActionStarted(base.InputState.Action.JUMP)) {
        this.jump();
        this.legsState = game.Player.LegsStates.JUMP;
    }

    if (input.hasActionStarted(base.InputState.Action.FIRE)) {
        if (this.hp <= 0) {
            this.respawn(scene.getSpawnPoint());
        } else {
            this.torsoState = game.Player.TorsoStates.ATTACKING;
        }
    }

    if (input.hasActionStarted(base.InputState.Action.CHANGING)) {
        this.torsoState = game.Player.TorsoStates.CHANGING;
    }

    if (input.hasActionStarted(base.InputState.Action.KILL)) {
        this.kill();
    }
    
    this.buildCameraMatrix_();

    if (input.getAction(base.InputState.Action.FIRE)) {
        this.weapon_.shoot(scene, this.camMtx, this);
    }
    
    this.player_.update(this.torsoState,
                        this.legsState,
                        this.position,
                        this.direction,
                        this.zAngle,
                        this.xAngle,
                        this.camMtx);
    this.weapon_.update(dt, this.player_.getWeaponMtx());
    
    this.stateArchive_.push({
        position: this.position,
        xAngle: this.xAngle,
        zAngle: this.zAngle,
        input: input.getState()
    });
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

game.CharacterController.TPP_CAMERA_OFFSET = base.Vec3.createVal(0, 0, 60);

/**
 * @private
 */
game.CharacterController.prototype.buildCameraMatrix_ = function () {
    base.Mat4.identity(this.camMtx);

    base.Mat4.rotateZ(this.camMtx, this.zAngle);
    if (!game.globals.tppMode && this.hp <= 0) {
        this.dyingProgress += 0.05;
        if (this.dyingProgress > 1) {
            this.dyingProgress = 1;
        }
        base.Mat4.rotateY(this.camMtx, -Math.PI * 0.4 * this.dyingProgress);
    }

    base.Mat4.rotateX(this.camMtx, this.xAngle);


    this.camMtx[13] = this.position[1];
    this.camMtx[12] = this.position[0];
    this.camMtx[14] = this.position[2] + 20;
    if (game.globals.tppMode) {
        base.Mat4.translate(this.camMtx, game.CharacterController.TPP_CAMERA_OFFSET);
    } else if (this.legsState == game.Player.LegsStates.IDLE_CROUCH
              || this.legsState == game.Player.LegsStates.CROUCH) {
        this.camMtx[14] -= 10;
    } else if (this.hp <= 0) {
        this.camMtx[14] -= 15 * this.dyingProgress;
    }
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
    var checkPoint = base.Vec3.pool.acquire();
    base.Vec3.setValues(checkPoint, this.position[0], this.position[1],
                        this.position[2] - game.CharacterController.PLAYER_RADIUS - 0.25);
    
    this.groundTrace = base.Bsp.trace(this.bsp, this.position, checkPoint,
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
    base.Vec3.pool.release(checkPoint);
};
/**
 * @private
 */
game.CharacterController.prototype.clipVelocity = function(velIn, normal, result) {
    var backoff = base.Vec3.dot(velIn, normal);
    
    if ( backoff < 0 ) {
        backoff *= game.CharacterController.OVERCLIP;
    } else {
        backoff /= game.CharacterController.OVERCLIP;
    }
    var tmp = base.Vec3.pool.acquire();    
    base.Vec3.scale(normal, backoff, tmp);
    base.Vec3.subtract(velIn, tmp, result);
    base.Vec3.pool.release(tmp);
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
    
    var accelDir = base.Vec3.pool.acquire();
    base.Vec3.scale(dir, accelSpeed, accelDir);
    base.Vec3.add(this.velocity, accelDir);
    base.Vec3.pool.release(accelDir);
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
    var groundDir = base.Vec3.pool.acquire();
    base.Vec3.add(this.position, base.Vec3.scale(this.groundTrace.plane.normal,
                                                 groundDist + 5,
                                                 groundDir));
    base.Vec3.pool.release(groundDir);
    
    return true;
};
/**
 * @private
 * @param {base.Vec3} dir
 * @return {base.Vec3}
 */
game.CharacterController.prototype.move = function(dir, input) {
//    game.globals.TIME_STEP = frameTime*0.0075;
    
    this.groundCheck();
    
    base.Vec3.normalize(dir);
    
    if(this.onGround) {
        this.walkMove(dir, input);
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
game.CharacterController.prototype.walkMove = function(dir, input) {
    this.applyFriction();
    
    var speed = base.Vec3.length(dir) * game.CharacterController.SCALE;

    if (input.getAction(base.InputState.Action.CROUCH) ||
        input.getAction(base.InputState.Action.WALK)) {
        speed *= 0.3;
    }
    
    this.accelerate(dir, speed, game.CharacterController.ACCELERATE);
    
    this.clipVelocity(this.velocity, this.groundTrace.plane.normal, this.velocity);
    
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
    var tmpVec = base.Vec3.pool.acquire();
    var endVelocity = base.Vec3.pool.acquire();
    
    if ( gravity ) {
        base.Vec3.set(this.velocity, endVelocity );
        endVelocity[2] -= game.CharacterController.GRAVITY
            * game.globals.TIME_STEP;
        this.velocity[2] = ( this.velocity[2] + endVelocity[2] ) * 0.5;
        
        if ( this.groundTrace && this.groundTrace.plane ) {
            // slide along the ground plane
            this.clipVelocity(this.velocity,
                              this.groundTrace.plane.normal, this.velocity);
        }
    }

    // never turn against the ground plane
    if ( this.groundTrace && this.groundTrace.plane ) {
        planes.push(base.Vec3.set(this.groundTrace.plane.normal,
                                  base.Vec3.pool.acquire()));
    }

    // never turn against original velocity
    planes.push(base.Vec3.normalize(this.velocity, base.Vec3.pool.acquire()));
    
    var time_left = game.globals.TIME_STEP;
    var end = base.Vec3.create([0,0,0]);
    for(bumpcount=0; bumpcount < numbumps; ++bumpcount) {
        
        // calculate position we are trying to move to
        base.Vec3.add(this.position,
                      base.Vec3.scale(this.velocity, time_left,
                                      tmpVec), end);
        
        // see if we can make it there
        var trace = base.Bsp.trace(this.bsp, this.position, end, game.CharacterController.PLAYER_RADIUS);

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
        
        planes.push(base.Vec3.set(trace.plane.normal, base.Vec3.pool.acquire()));

        var dir = base.Vec3.pool.acquire();
        //
        // modify velocity so it parallels all of the clip planes
        //

        // find a plane that it enters
        for(var i = 0; i < planes.length; ++i) {
            var into = base.Vec3.dot(this.velocity, planes[i]);
            if ( into >= 0.1 ) { continue; } // move doesn't interact with the plane
            
            // slide along the plane
            var clipVelocity = base.Vec3.pool.acquire();
            this.clipVelocity(this.velocity, planes[i], clipVelocity);
            var endClipVelocity = base.Vec3.pool.acquire();
            this.clipVelocity(endVelocity, planes[i], endClipVelocity);

            // see if there is a second plane that the new move enters
            for (var j = 0; j < planes.length; j++) {
                if ( j == i ) { continue; }
                if ( base.Vec3.dot( clipVelocity, planes[j] ) >= 0.1 ) {
                    // move doesn't interact with the plane
                    continue;
                }
                
                // try clipping the move to the plane
                this.clipVelocity( clipVelocity, planes[j], clipVelocity );
                this.clipVelocity( endClipVelocity, planes[j], endClipVelocity);

                // see if it goes back into the first clip plane
                if ( base.Vec3.dot( clipVelocity, planes[i] ) >= 0 ) { continue; }

                // slide the original velocity along the crease
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
                    base.Vec3.setZero(this.velocity);
                    return true;
                }
            }

            // if we have fixed all interactions, try another move
            base.Vec3.set( clipVelocity, this.velocity );
            base.Vec3.set( endClipVelocity, endVelocity );

            base.Vec3.pool.release(clipVelocity);
            base.Vec3.pool.release(endClipVelocity);
            break;
        }
        base.Vec3.pool.release(dir);
    }

    if ( gravity ) {
        base.Vec3.set( endVelocity, this.velocity );
    }

    base.Vec3.pool.release(endVelocity);
    base.Vec3.pool.release(tmpVec);
    for (i = 0; i < planes.length; ++i) {
        base.Vec3.pool.release(planes[i]);
    }

    return ( bumpcount !== 0 );
};

/**
 * @private
 * @param {boolean} gravity
 */
game.CharacterController.prototype.stepSlideMove = function(gravity) {
    var start_o = base.Vec3.set(this.position, base.Vec3.pool.acquire());
    var start_v = base.Vec3.set(this.velocity, base.Vec3.pool.acquire());
    
    if ( this.slideMove( gravity ) === false ) {
        // we got exactly where we wanted to go first try
        return;
    }

    var down = base.Vec3.set(start_o, base.Vec3.pool.acquire());
    down[2] -= game.CharacterController.STEP_SIZE;
    var trace = base.Bsp.trace(this.bsp, start_o, down, game.CharacterController.PLAYER_RADIUS);
    
    var up = base.Vec3.pool.acquire();
    up[2] = 1;
    
    // never step up when you still have up velocity
    if ( this.velocity[2] > 0 &&
         (trace.fraction == 1.0 || base.Vec3.dot(trace.plane.normal, up) < 0.7)) {
        return;
    }
    
    var down_o = base.Vec3.set(this.position, base.Vec3.pool.acquire());
    var down_v = base.Vec3.set(this.velocity, base.Vec3.pool.acquire());
    
    base.Vec3.set(start_o, up);
    up[2] += game.CharacterController.STEP_SIZE;
    
    // test the player position if they were a stepheight higher
    trace = base.Bsp.trace(this.bsp, start_o, up, game.CharacterController.PLAYER_RADIUS);
    if ( trace.allSolid ) { return; } // can't step up
    
    var stepSize = trace.endPos[2] - start_o[2];
    // try slidemove from this position
    base.Vec3.set(trace.endPos, this.position);
    base.Vec3.set(start_v, this.velocity);
    
    this.slideMove( gravity );
    
    // push down the final amount
    base.Vec3.set(this.position, down);
    down[2] -= stepSize;
    trace = base.Bsp.trace(this.bsp, this.position, down, game.CharacterController.PLAYER_RADIUS);
    if ( !trace.allSolid ) {
        base.Vec3.set(trace.endPos, this.position);
    }
    if ( trace.fraction < 1.0 ) {
        this.clipVelocity( this.velocity, trace.plane.normal, this.velocity );
    }

    base.Vec3.pool.release(start_o);
    base.Vec3.pool.release(start_v);
    base.Vec3.pool.release(down);
    base.Vec3.pool.release(up);
    base.Vec3.pool.release(down_o);
    base.Vec3.pool.release(down_v);
};
