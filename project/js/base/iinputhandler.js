'use strict';

goog.provide('base.IInputHandler');

/**
 * @interface
 */
base.IInputHandler = function () {};

/**
 * @public
 * @param {number} key
 */
base.IInputHandler.prototype.onKeyUp = function (key) {};
base.IInputHandler.prototype.onKeyUp._CROSS_WORKER_ = true;
/**
 * @public
 * @param {number} key
 */
base.IInputHandler.prototype.onKeyDown = function (key) {};
base.IInputHandler.prototype.onKeyDown._CROSS_WORKER_ = true;
/**
 * @public
 * @param {number} dx
 * @param {number} dy
 */
base.IInputHandler.prototype.onMouseMove = function (dx, dy) {};
base.IInputHandler.prototype.onMouseMove._CROSS_WORKER_ = true;
