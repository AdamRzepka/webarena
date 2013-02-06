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

/**
 * @fileoverview High level is communication between workers. Cross-worker function calls
 * with callback and generating local object proxies itp. In future this class will also
 * broadcast some events accross workers.
 */

goog.require('goog.asserts');
goog.require('goog.array');

goog.provide('base.workers.Broker');
goog.provide('base.workers.FakeBroker');

/**
 * @constructor
 * @param {string} name human friendly name of the worker.
 * @param {Worker|DedicatedWorkerGlobalScope|Window} worker if we are in worker, this argument should be self.
 */
base.workers.Broker = function (name, worker) {
    goog.asserts.assert(worker); // if we are inside worker, self shall be defined
    /**
     * @private
     * @const
     * @type {Worker|DedicatedWorkerGlobalScope|Window}
     */
    this.worker_ = worker;
    // /**
    //  * @private
    //  * @const
    //  * @type {function(Object)}
    //  */
    // this.postMessage_ = worker ? goog.bind(worker.postMessage, worker)
    //     : self.postMessage;
    /**0
     * @const
     * @type {string}
     */
    this.name = name;
    /**
     * @private
     * @type {number}
     */
    this.nextId_ = 0;
    /**
     * @private
     * @type {Array.<function(*)|null>}
     */
    this.pendingCallbacks_ = [];
    /**
     * @private
     * @type {Object.<string, Object>}
     */
    this.callReceivers_ = [];

    this.worker_.onmessage = goog.bind(this.onMessage_, this);
};

/**
 * @const
 * @private
 */
base.workers.Broker.MAX_PENDING_CALLBACKS = 256;

/**
 * @public
 * @param {string} name correspons with name in createProxy
 * @param {Object} obj
 * Registers proxy call receiver.
 */
base.workers.Broker.prototype.registerReceiver = function (name, obj) {
    goog.asserts.assert(!this.callReceivers_[name]);
    this.callReceivers_[name] = obj;
};

/**
 * @public
 * @param {string} name correspons with name in registerReceiver
 * @param {function(...)} intface common interface for proxy and receiver
 * @return {Object}
 * Creates local stub for cros-worker function calls.
 * Interface passed here must have property _CROSS_WORKER_ = true.
 * All cross-worker functions must have property _CROSS_WORKER_ = true
 * and if necessary _CROSS_WORKER_CALLBACK_ = true.
 */
base.workers.Broker.prototype.createProxy = function (name, intface) {
    var prop;
    var that = this;
    var proxy = {};
    var proto = intface.prototype;

//    goog.asserts.assert(proto._CROSS_WORKER_);
    
    for( prop in proto ) {
        if (proto.hasOwnProperty(prop) && goog.isFunction(proto[prop])
            && proto[prop]._CROSS_WORKER_) {
            (function() { // local scope for funName needed
                var funName = prop;

                proxy[prop] = function() {
                    var args = goog.array.clone(arguments);
                    var cb = null;
                    
                    if (proto[prop]._CROSS_WORKER_CALLBACK_
                        && goog.isFunction(args[args.length - 1])) {
                        cb = args.pop();
                    }
                    
                    that.sendProxyCall(name, funName, args, cb);
                };
            })();
        }
    }
    return proxy;
};
/**
 * @private
 * @enum
 */
base.workers.Broker.MessageTypes = {
    EVENT: 0,
    FUNCTION_CALL: 1,
    FUNCTION_CALLBACK: 2,
    ARBITRARY: 3
};
/**
 * @private
 */
base.workers.Broker.prototype.onMessage_ = function (event) {
    var msg = event.data;
    switch (msg.type) {
    case base.workers.Broker.MessageTypes.EVENT:
        break;
    case base.workers.Broker.MessageTypes.FUNCTION_CALL:
        this.onProxyCall(msg.id, msg.proxyName, msg.functionName, msg.args, msg.withCallback);
        break;
    case base.workers.Broker.MessageTypes.FUNCTION_CALLBACK:
        this.onProxyCallback(msg.id, msg.args);
        break;
    case base.workers.Broker.MessageTypes.ARBITRARY:
        break;        
    }
};

/**
 * @private
 */
base.workers.Broker.prototype.sendProxyCall = function (proxyName, funName, args, callback) {
    var id = this.nextId_++;
    var withCallback = goog.isDefAndNotNull(callback);
    id = id % base.workers.Broker.MAX_PENDING_CALLBACKS;
    
    if (withCallback) {
        goog.asserts.assert(!this.pendingCallbacks_[id]);
        this.pendingCallbacks_[id] = callback;
    }
//    var post = this.postMessage_;
    this.worker_.postMessage({
        type: base.workers.Broker.MessageTypes.FUNCTION_CALL,
        id: id,
        proxyName: proxyName,
        functionName: funName,
        args: args,
        withCallback: withCallback
    });
};

/**
 * @private
 */
base.workers.Broker.prototype.onProxyCall = function (id, receiverName, funName, args,
                                                      withCallback) {
    var that = this;
    var receiver = this.callReceivers_[receiverName];
    goog.asserts.assert(receiver && receiver[funName] && goog.isFunction(receiver[funName]));

    if (withCallback) {
        args.push (function () {
//            var post = that.postMessage_;
            that.worker_.postMessage({
                type: base.workers.Broker.MessageTypes.FUNCTION_CALLBACK,
                id: id,
                args: goog.array.clone(arguments)
            });
        });
        receiver[funName].apply(receiver, args);
    } else {
        receiver[funName].apply(receiver, args);
    }
};

/**
 * @private
 */
base.workers.Broker.prototype.onProxyCallback = function (id, args) {
    
    var cb = this.pendingCallbacks_[id];
    this.pendingCallbacks_[id] = null;
    goog.asserts.assert(cb);
    
    cb(args);
};

/**
 * @constructor
 * @param {string} name
 */
base.workers.FakeBroker = function (name) {
    this.callReceivers_ = [];
};
/**
 * @public
 * @param {string} name
 * @param {function(...)} intface
 */
base.workers.FakeBroker.prototype.createProxy = function (name, intface) {
    goog.asserts.assert(this.callReceivers_[name]);
    return this.callReceivers_[name];
};
/**
 * @public
 * @param {string} name correspons with name in createProxy
 * @param {Object} obj
 * Registers proxy call receiver.
 */
base.workers.FakeBroker.prototype.registerReceiver = function (name, obj) {
    goog.asserts.assert(!this.callReceivers_[name]);
    this.callReceivers_[name] = obj;
};
