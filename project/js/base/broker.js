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
 * @fileoverview High level communication between workers. Cross-worker function calls
 * with callbacks through local proxies.
 */

goog.require('goog.asserts');
goog.require('goog.array');

goog.provide('base.IBroker');
goog.provide('base.Broker');
goog.provide('base.FakeBroker');

/**
 * @interface
 */
base.IBroker = function () {
};
/**
 * @public
 * @param {string} name
 * @param {Object} intface
 * @return {Object}
 */
base.IBroker.prototype.createProxy = function (name, intface) {
};
/**
 * @public
 * @param {string} name correspons with name in createProxy
 * @param {Object} obj
 * Registers proxy call receiver.
 */
base.IBroker.prototype.registerReceiver = function (name, obj) {
};
/**
 * @public
 * @param {string} eventType
 * @param {function(string,*)} callback
 * @return {number} listener id
 */
base.IBroker.prototype.registerEventListener = function (eventType, callback) {    
};
/**
 * @public
 * @param {string} eventType
 * @param {*} data
 * @param {base.IBroker.EventScope} [scope] default id LOCAL_AND_REMOTE
 * @param {Array.<*>} [transferables] objects which should be transferred to other worker
 */
base.IBroker.prototype.fireEvent = function (eventType, data, scope, transferables) {  
};
/**
 * @enum {number}
 */
base.IBroker.EventScope = {
    LOCAL_AND_REMOTE: 0,
    LOCAL: 1,
    REMOTE: 2
};

/**
 * @constructor
 * @implements {base.IBroker}
 * @param {string} name human friendly name of the worker.
 * @param {Worker|DedicatedWorkerGlobalScope|Window} worker if we are in worker, this argument should be self.
 */
base.Broker = function (name, worker) {
    goog.asserts.assert(worker); // if we are inside worker, self shall be defined
    /**
     * @private
     * @const
     * @type {Worker|DedicatedWorkerGlobalScope|Window}
     */
    this.worker_ = worker;
    /**
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
    this.callReceivers_ = {};
    /**
     * @private
     * @type {Object.<string, Array.<function(string,*)>>}
     */
    this.eventListeners_ = [];
    
    this.worker_.onmessage = goog.bind(this.onMessage_, this);
};

/**
 * @const
 * @private
 */
base.Broker.MAX_PENDING_CALLBACKS = 256;

/**
 * @public
 * @param {string} name correspons with name in createProxy
 * @param {Object} obj
 * Registers proxy call receiver.
 */
base.Broker.prototype.registerReceiver = function (name, obj) {
    goog.asserts.assert(!this.callReceivers_[name]);
    this.callReceivers_[name] = obj;
};

/**
 * @public
 * @param {string} name correspons with name in registerReceiver
 * @param {Object} intface common interface for proxy and receiver
 * @return {Object}
 * Creates local stub for cros-worker function calls.
 * Interface passed here must have property _CROSS_WORKER_ = true.
 * All cross-worker functions must have property _CROSS_WORKER_ = true
 * and if necessary _CROSS_WORKER_CALLBACK_ = true.
 * If _CROSS_WORKER_TRANSFERABLE_ = true is set for function, the last argument
 * for that function should be array of transferables.
 */
base.Broker.prototype.createProxy = function (name, intface) {
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
                    var transferables = null;

                    if (proto[funName]._CROSS_WORKER_TRANSFERABLE_ && goog.isArray(args[args.length - 1])) {
                        transferables = args.pop();
                    }

                    if (goog.isFunction(args[args.length - 1])) {
                        goog.asserts.assert(proto[funName]._CROSS_WORKER_CALLBACK_);
                        cb = args.pop();
                    }

                    that.sendProxyCall_(name, funName, args, cb, transferables);
                };
            })();
        }
    }
    return proxy;
};
/**
 * @public
 * @param {string} eventType
 * @param {function(string,*)} callback
 * @return {number} listener id
 */
base.Broker.prototype.registerEventListener = function (eventType, callback) {
    var listeners = this.eventListeners_[eventType];
    if (!goog.isDefAndNotNull(listeners)) {
        this.eventListeners_[eventType] = listeners = [];
    }
    listeners.push(callback);
    return listeners.length - 1;
};
/**
 * @public
 * @param {string} eventType
 * @param {*} data
 * @param {base.IBroker.EventScope} [scope] default id LOCAL_AND_REMOTE
 * @param {Array.<*>} [transferables] objects which should be transferred to other worker
 */
base.Broker.prototype.fireEvent = function (eventType, data, scope, transferables) {
    scope = scope || base.IBroker.EventScope.LOCAL_AND_REMOTE;
    if (scope != base.IBroker.EventScope.LOCAL) {
        this.worker_.postMessage({
            type: base.Broker.MessageTypes.EVENT,
            eventType: eventType,
            data: data
        });
    }
    if (scope != base.IBroker.EventScope.REMOTE) {
        this.onEvent_(eventType, data);
    }
};

/**
 * @private
 * @enum
 */
base.Broker.MessageTypes = {
    EVENT: 0,
    FUNCTION_CALL: 1,
    FUNCTION_CALLBACK: 2,
    ARBITRARY: 3
};

base.Broker.sumTime = 0;
base.Broker.countTime = 0;
/**
 * @private
 */
base.Broker.prototype.onMessage_ = function (event) {
    var time = Date.now();
    var msg = event.data;
    switch (msg.type) {
    case base.Broker.MessageTypes.FUNCTION_CALL:
        this.onProxyCall_(msg.id, msg.proxyName, msg.functionName, msg.args,
                          msg.withCallback);
        break;
    case base.Broker.MessageTypes.FUNCTION_CALLBACK:
        this.onProxyCallback_(msg.id, msg.args);
        break;
    case base.Broker.MessageTypes.EVENT:
        this.onEvent_(msg.eventType, msg.data);
        break;
    case base.Broker.MessageTypes.ARBITRARY:
        break;
    }
    var delta = Date.now() - msg.timestamp;
    base.Broker.sumTime += delta;
    ++base.Broker.countTime;
};
/**
 * @private
 */
base.Broker.prototype.sendProxyCall_ = function (proxyName, funName, args,
                                                 callback, transferables) {
    var id = this.nextId_++;
    var withCallback = goog.isDefAndNotNull(callback);
    id = id % base.Broker.MAX_PENDING_CALLBACKS;
    
    if (withCallback) {
        goog.asserts.assert(!this.pendingCallbacks_[id]);
        this.pendingCallbacks_[id] = callback;
    }
//    var post = this.postMessage_;
    this.worker_.postMessage({
        type: base.Broker.MessageTypes.FUNCTION_CALL,
        id: id,
        proxyName: proxyName,
        functionName: funName,
        args: args,
        withCallback: withCallback,
        timestamp: Date.now()
    }, transferables);
};
/**
 * @private
 */
base.Broker.prototype.onProxyCall_ = function (id, receiverName, funName, args,
                                               withCallback) {
    var that = this;
    var receiver = this.callReceivers_[receiverName];
    goog.asserts.assert(receiver && receiver[funName] && goog.isFunction(receiver[funName]));

    if (withCallback) {
        args.push (function () {
//            var post = that.postMessage_;
            that.worker_.postMessage({
                type: base.Broker.MessageTypes.FUNCTION_CALLBACK,
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
base.Broker.prototype.onProxyCallback_ = function (id, args) {
    var cb = this.pendingCallbacks_[id];
    this.pendingCallbacks_[id] = null;
    goog.asserts.assert(cb);
    
    cb(args);
};
/**
 * @private
 */
base.Broker.prototype.onEvent_ = function (evenType, data) {
    var i = 0;
    var listeners = this.eventListeners_[evenType];
    if (goog.isDefAndNotNull(listeners)) {
        for (i = 0; i < listeners.length; ++i) {
            listeners[i](evenType, data);
        }
    }
};

/**
 * @constructor
 * @implements {base.IBroker}
 * @param {string} name
 * Fake broker provides unified interface for single threaded version. Currently it has
 * a bit different semantic than Broker. Receiver must be registered before createProxy
 * call (not before any proxy function calls as in Broker). The reason is performance.
 */
base.FakeBroker = function (name) {
    this.callReceivers_ = [];
    /**
     * @private
     * @type {Object.<string, Array.<function(string,*)>>}
     */
    this.eventListeners_ = [];

};
/**
 * @public
 * @param {string} name
 * @param {Object} intface
 * @return {Object}
 */
base.FakeBroker.prototype.createProxy = function (name, intface) {
    goog.asserts.assert(this.callReceivers_[name]);
    return this.callReceivers_[name];
};
/**
 * @public
 * @param {string} name correspons with name in createProxy
 * @param {Object} obj
 * Registers proxy call receiver.
 */
base.FakeBroker.prototype.registerReceiver = function (name, obj) {
    goog.asserts.assert(!this.callReceivers_[name]);
    this.callReceivers_[name] = obj;
};
/**
 * @public
 * @param {string} eventType
 * @param {function(string,*)} callback
 * @return {number} listener id
 */
base.FakeBroker.prototype.registerEventListener = function (eventType, callback) {
    var listeners = this.eventListeners_[eventType];
    if (!goog.isDefAndNotNull(listeners)) {
        this.eventListeners_[eventType] = listeners = [];
    }
    listeners.push(callback);
    return listeners.length - 1;
};
/**
 * @public
 * @param {string} eventType
 * @param {*} [data]
 * @param {base.IBroker.EventScope} [scope] default id LOCAL_AND_REMOTE
 * @param {Array.<*>} [transferables] objects which should be transferred to other worker
 */
base.FakeBroker.prototype.fireEvent = function (eventType, data, scope, transferables) {
    this.onEvent_(eventType, data);
};
/**
 * @private
 */
base.FakeBroker.prototype.onEvent_ = function (evenType, data) {
    var i = 0;
    var listeners = this.eventListeners_[evenType];
    if (goog.isDefAndNotNull(listeners)) {
        for (i = 0; i < listeners.length; ++i) {
            listeners[i](evenType, data);
        }
    }
};



goog.exportSymbol('base.Broker', base.Broker);
