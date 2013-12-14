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

'use strict';

goog.require('goog.array');
goog.require('base.InputState');

goog.provide('system.InputHandler');

/**
 * @constructor
 * @param {HTMLElement} element
 */
system.InputHandler = function (inputElement) {
    /**
     * @private
     * @type {base.InputState}
     */
    this.state_ = new base.InputState();

    this.capturing_ = false;
    this.locked_ = false;
    this.tryLock_ = true;

    this.initPointerLock_(inputElement);
    this.initInputListeners_(inputElement);
};

system.InputHandler.prototype.initPointerLock_ = function (canvas) {
    var that = this;
    var elem = canvas;
    
    elem.requestMouseLock = elem.requestMouseLock ||
        elem.mozRequestPointerLock ||
        elem.webkitRequestPointerLock;

    function pointerLockChange() {
        if (document.mozPointerLockElement === elem ||
            document.webkitPointerLockElement === elem) {
            that.locked_ = true;
        } else {
            that.locked_ = false;
            that.tryLock_ = true;
        }
    }
    document.addEventListener('pointerlockchange', pointerLockChange, false);
    document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
    document.addEventListener('mozpointerlockchange', pointerLockChange, false);

    function pointerLockError() {
        // Failed to lock pointer. Run in capture mode
        that.locked_ = false;
        that.tryLock_ = false;
    }
    document.addEventListener('pointerlockerror', pointerLockError, false);
    document.addEventListener('webkitpointerlockerror', pointerLockError, false);
    document.addEventListener('mozpointerlockerror', pointerLockError, false);
};

system.InputHandler.prototype.initInputListeners_ = function (canvas) {
    var that = this;
    var elem = canvas;
    var lastX = 0, lastY = 0;

    document.addEventListener('keydown', function (ev) {
        that.onKeyDown_(ev.keyCode);
    }, false);

    document.addEventListener('keyup', function (ev) {
        that.onKeyUp_(ev.keyCode);
    }, false);

    elem.addEventListener('mousedown', function (ev) {
        if (!that.locked_) {
            if (that.tryLock_) {
                elem.requestMouseLock();
                that.tryLock_ = false;
            } else {
                that.capturing_ = true;
            }
        }
        that.onKeyDown_(ev.button);
    }, false);

    document.addEventListener('mouseup', function (ev) {
        this.capturing_ = false;
        that.onKeyUp_(ev.button);
    }, false);

    document.addEventListener('mousemove', function (ev) {
        var dx = ev.movementX || ev.webkitMovementX || ev.mozMovementX ||
                ev.clientX - lastX;
        var dy = ev.movementY || ev.webkitMovementY || ev.mozMovementY ||
                ev.clientY - lastY;

        lastX = ev.clientX;
        lastY = ev.clientY;

        if (that.capturing_ || that.locked_) {
            that.onMouseMove_(dx, dy);
        }
    }, false);
};


/**
 * @public
 * @param {number} key
 * Called by DOM event handler
 */
system.InputHandler.prototype.onKeyUp_ = function (key) {
    var action = system.InputHandler.MAP[key];
    this.state_.actions[action] = false;
};

/**
 * @public
 * @param {number} key
 * Called by DOM event handler
 */
system.InputHandler.prototype.onKeyDown_ = function (key) {
    var action = system.InputHandler.MAP[key];
    this.state_.actions[action] = true;
};

/**
 * @public
 * @param {number} dx
 * @param {number} dy
 * Called by DOM event handler
 */
system.InputHandler.prototype.onMouseMove_ = function (dx, dy) {
    this.state_.cursorX += dx;
    this.state_.cursorY += dy;
};

// /**
//  * @public
//  * Call it at the beginning of game update
//  */
// system.InputHandler.prototype.step = function () {
//     var i = 0, count = this.currentState_.actions.length;
    
//     this.currentState_ = this.state_;
//     this.state_ = new base.InputState();
//     this.state_.cursorX = this.currentState_.cursorX;
//     this.state_.cursorY = this.currentState_.cursorY;

//     for (i = 0; i < count; ++i) {
//         this.state_.actions[i] = this.currentState_.actions[i];
//     }
// };

/**
 * @public
 * @return {base.InputState}
 */
system.InputHandler.prototype.getState = function () {
    return this.state_;
};

system.InputHandler.MAX_KEY = 256;

system.InputHandler.MAP = goog.array.repeat(base.InputState.Action.SIZE,
                                         system.InputHandler.MAX_KEY);
system.InputHandler.MAP[0] = base.InputState.Action.FIRE; //LMB
system.InputHandler.MAP[16] = base.InputState.Action.WALK; //SHIFT
system.InputHandler.MAP[32] = base.InputState.Action.JUMP; //SPACE
system.InputHandler.MAP[67] = base.InputState.Action.CROUCH; //C
system.InputHandler.MAP[87] = base.InputState.Action.UP; //W
system.InputHandler.MAP[83] = base.InputState.Action.DOWN; //S
system.InputHandler.MAP[65] = base.InputState.Action.LEFT; //A
system.InputHandler.MAP[68] = base.InputState.Action.RIGHT; //D
system.InputHandler.MAP[49] = base.InputState.Action.CHANGING; //1
system.InputHandler.MAP[50] = base.InputState.Action.KILL; //2
system.InputHandler.MAP[51] = base.InputState.Action.RESPAWN; //3

