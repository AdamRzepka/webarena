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
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.net.jsloader');

goog.provide('base.IBroker');
goog.provide('base.Broker');
goog.provide('base.FakeBroker');

/**
 * @interface
 */
base.IBroker = function () {
};
/**
 * Instructs subworker to load appropriate scripts needed for further processing
 * @public
 * @param {Array.<string>} debugDeps as in goog.provide
 * @param {Array.<string>} compiledDeps filenames of compiled js modules (they will be loaded with bare importScript)
 */
base.IBroker.prototype.addDependency = function (debugDeps, compiledDeps) {
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
 * @param {base.IBroker.EventScope} [scope] default is LOCAL_AND_REMOTE
 * @param {Array.<*>} [transferables] objects which should be transferred to other worker
 */
base.IBroker.prototype.fireEvent = function (eventType, data, scope, transferables) {  
};
/**
 * Execute function in subworker. Function is sent as a string
 * and it can't depend on any closures. All dependencies needed by function
 * must be loaded with addDependency before you run executeFunction.
 * @public
 * @param {function(*): *} fun function to execute
 * @param {Array.<*>} args arguments to pass to fun
 * @param {?Array.<*>} [transferables]
 * @param {function(*)} [callback] callback fired in current worker with results of execution
 */
base.IBroker.prototype.executeFunction = function (fun, args, transferables, callback) {
};
/**
 * @public
 * @param {Array.<string>} debugDeps
 * @param {Array.<string>} compiledDeps
 * @param {string} name human readable worker name
 * @return {base.IBroker}
 */
base.IBroker.createWorker = function (debugDeps, compiledDeps, name) {
    if (base.IBroker.DISABLE_WORKERS) {
        return base.FakeBroker.createWorker(debugDeps, compiledDeps, name);
    } else {
        return base.Broker.createWorker(debugDeps, compiledDeps, name);
    }
};
/**
 * @public
 * @type {boolean}
 */
base.IBroker.DISABLE_WORKERS = false;
/**
 * @public
 * @type {string}
 */
base.IBroker.COMPILED_SCRIPTS_PREFIX = 'js/';
/**
 * @enum {number}
 */
base.IBroker.EventScope = {
    LOCAL_AND_REMOTE: 0,
    LOCAL: 1,
    REMOTE: 2
};
// /**
//  * @public
//  * @type {base.IBroker}
//  */
// base.IBroker.parentInstance = null;


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
base.Broker.MAX_PENDING_CALLBACKS = 512;

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
 * Instructs subworker to load appropriate scripts needed for further processing
 * @public
 * @param {Array.<string>} debugDeps as in goog.provide
 * @param {Array.<string>} compiledDeps filenames of compiled js modules (they will be loaded with bare importScript)
 */
base.Broker.prototype.addDependency = function (debugDeps, compiledDeps) {
    this.worker_.postMessage({
        type: base.Broker.MessageTypes.ADD_DEPENDENCY,
        debugDeps: debugDeps,
        compiledDeps: compiledDeps
    });
};
/**
 * Execute function in subworker. Function is sent as a string
 * and it can't depend on any closures. All dependencies needed by function
 * must be loaded with addDependency before you run executeFunction.
 * @public
 * @param {function(*): *} fun function to execute
 * @param {Array.<*>} args arguments to pass to fun
 * @param {?Array.<*>} [transferables]
 * @param {function(*)} [callback] callback fired in current worker with results of execution
 */
base.Broker.prototype.executeFunction = function (fun, args, transferables, callback) {
    var funStr = fun.toString();
    var re = /function[^\(]*\(([^\)]*)\)\s*\{([\s\S]*)\}/; // [\s\S], because dots don't match \n
    var res = re.exec(funStr);
    goog.asserts.assert(res.length === 3);
    var params = res[1].split(/\*s,\s*/);
    var body = res[2];

    this.worker_.postMessage({
        type: base.Broker.MessageTypes.EXECUTE_FUNCTION_STRING,
        body: body,
        params: params,
        args: args,
        callbackId: this.addPendingCallback_(callback)
    }, transferables);
};
/**
 * @public
 * @param {Array.<string>} debugDeps
 * @param {Array.<string>} compiledDeps
 * @param {string} name human readable worker name
 * @return {base.Broker}
 */
base.Broker.createWorker = function (debugDeps, compiledDeps, name) {
    var worker = new Worker(base.Broker.INIT_WORKER_PATH);
    var broker = new base.Broker(name, worker);
    broker.addDependency(debugDeps, compiledDeps);
    return broker;
};

base.Broker.INIT_WORKER_PATH = 'js/initworker.js';

/**
 * @private
 * @enum
 */
base.Broker.MessageTypes = {
    EVENT: 0,
    FUNCTION_CALL: 1,
    FUNCTION_CALLBACK: 2,
    ADD_DEPENDENCY: 3,
    EXECUTE_FUNCTION_STRING: 4
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
        this.onProxyCall_(msg.callbackId, msg.proxyName, msg.functionName, msg.args,
                          msg.callbackId !== -1);
        break;
    case base.Broker.MessageTypes.FUNCTION_CALLBACK:
        this.onCallback_(msg.callbackId, msg.args);
        break;
    case base.Broker.MessageTypes.EVENT:
        this.onEvent_(msg.eventType, msg.data);
        break;
    case base.Broker.MessageTypes.ADD_DEPENDENCY:
        this.onAddDependency_(msg.debugDeps, msg.compiledDeps);
        break;
    case base.Broker.MessageTypes.EXECUTE_FUNCTION_STRING:
        this.onExecuteFunction_(msg.body, msg.params, msg.args, msg.callbackId);
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
    this.worker_.postMessage({
        type: base.Broker.MessageTypes.FUNCTION_CALL,
        proxyName: proxyName,
        functionName: funName,
        args: args,
        callbackId: this.addPendingCallback_(callback),
        timestamp: Date.now()
    }, transferables);
};
/**
 * @private
 */
base.Broker.prototype.addPendingCallback_ = function (callback) {
    var id = -1;
    if (goog.isDefAndNotNull(callback)) {
        id = this.nextId_++;
        id = id % base.Broker.MAX_PENDING_CALLBACKS;
        goog.asserts.assert(!this.pendingCallbacks_[id]);
        this.pendingCallbacks_[id] = callback;
    }
    return id;        
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
            that.worker_.postMessage({
                type: base.Broker.MessageTypes.FUNCTION_CALLBACK,
                callbackId: id,
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
base.Broker.prototype.onCallback_ = function (id, args) {
    var cb = this.pendingCallbacks_[id];
    this.pendingCallbacks_[id] = null;
    goog.asserts.assert(cb);
    
    cb.apply(self, args);
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
 * @private
 */
base.Broker.prototype.onAddDependency_ = function (debugDeps, compiledDeps) {
    var i;
    if (goog.DEBUG) {
        for (i = 0; i < debugDeps.length; ++i) {
            base.Broker.debugAddDep(debugDeps[i]);
        }
    } else {
        compiledDeps = compiledDeps.map(function (script) {
            return base.IBroker.COMPILED_SCRIPTS_PREFIX + script;
        });

        for (i = 0; i < compiledDeps.length; ++i) {
            self.importScripts(compiledDeps[i]);
        }
    }
};
// workaround for officious compiler
if (goog.DEBUG) {
    base.Broker.debugAddDep = Function('dep', 'goog.require(dep);');
}
/**
 * @private
 */
base.Broker.prototype.onExecuteFunction_ = function (body, params, args, callbackId) {
    params.push(body);
    var fn = Function.apply(self, params);
    args.push(this); // add this worker
    var ret = fn.apply(self, args);
    if (callbackId !== -1) {
        this.worker_.postMessage({
            type: base.Broker.MessageTypes.FUNCTION_CALLBACK,
            callbackId: callbackId,
            args: [ret]
        });
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
    this.loadingDeferred_ = null;
};
/**
 * @public
 * @param {string} name
 * @param {Object} intface
 * @return {Object}
 */
base.FakeBroker.prototype.createProxy = function (name, intface) {
    // TODO addDependency + createProxy not supported now
//    goog.asserts.assert(this.loadingDeferred_ === null);
//    goog.asserts.assert(this.callReceivers_[name]);

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
                    var cb = null;
                    var transferables = null;

                    var receiver = that.callReceivers_[name];
                    goog.asserts.assert(receiver && receiver[funName]
                                        && goog.isFunction(receiver[funName]));
                    receiver[funName].apply(receiver, arguments);
                };
            })();
        }
    }
    return proxy;

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
    var that = this;
    if (goog.isDefAndNotNull(this.loadingDeferred_)) {
        this.loadingDeferred_.addCallback(function () {
            that.onEvent_(eventType, data);
        });
    } else {
        this.onEvent_(eventType, data);
    }
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

base.FakeBroker.prototype.addDependency = function (debugDeps, compiledDeps) {
    goog.asserts.assert(this.loadingDeferred_ === null);
    if (goog.DEBUG) {
        this.loadingDeferred_ = this.debugLoadScripts_(debugDeps);
    } else {
        this.loadingDeferred_ = this.compiledLoadScripts_(compiledDeps);
    }
};
/**
 * Execute function in subworker. Function is sent as a string
 * and it can't depend on any closures. All dependencies needed by function
 * must be loaded with addDependency before you run executeFunction.
 * @public
 * @param {function(*): *} fun function to execute
 * @param {Array.<*>} args arguments to pass to fun
 * @param {?Array.<*>} [transferables]
 * @param {function(*)} [callback] callback fired in current worker with results of execution
 */
base.FakeBroker.prototype.executeFunction = function (fun, args, transferables, callback) {
    args.push(this); // add this broker as the last argument
    if (goog.isDefAndNotNull(this.loadingDeferred_)) {
        this.loadingDeferred_.addCallback(function () {
            var result = fun.apply(goog.global, args);
            if (callback) {
                callback(result);
            }
        });
    } else {
        var result = fun.apply(goog.global, args);
        callback(result);
    }
};

// Overrides default goog script writer in order to be able
// to trace the moment when all scripts are loaded.
base.FakeBroker.prototype.debugLoadScripts_ = function (scripts) {
    var deferredAll;
    var i = 0;
    var deferreds = [];
    if (typeof window === 'undefined') {
        // in worker, goog will be using importScripts (synchronous)
        for (i = 0; i < scripts.length; ++i) {
            base.Broker.debugAddDep(scripts);
        }
        deferredAll = goog.async.Deferred.succeed(null);
    } else {
        goog.global.CLOSURE_IMPORT_SCRIPT = function (url) {
            // var script = document.createElement('script');
            // var deferred = new goog.async.Deferred();
            // script.type = 'text/javascript';
            // script.onload = function (){
            //     deferred.callback();
            // }; 
            // script.src = url;
            // document.appendChild(script);
            var deferred = goog.net.jsloader.load(url);
            deferreds.push(deferred);
            return true;
        };
        for (i = 0; i < scripts.length; ++i) {
            base.Broker.debugAddDep(scripts[i]);
        }
        goog.global.CLOSURE_IMPORT_SCRIPT = undefined;
        deferredAll = goog.async.DeferredList.gatherResults(deferreds);
    }

    return deferredAll;
};

base.FakeBroker.prototype.compiledLoadScripts_ = function (scripts) {
    var i = 0;
    var deferreds = [];
    var deferredAll;

    scripts = scripts.map(function (script) {
        return base.IBroker.COMPILED_SCRIPTS_PREFIX + script;
    });
    
    if (typeof window === 'undefined') {
        self.importScripts(scripts);
        deferredAll = goog.async.Deferred.succeed(null);
    } else {
        for (i = 0; i < scripts.length; ++i) {
            deferreds.push(goog.net.jsloader.load(scripts[i]));
        }
        deferredAll = goog.async.DeferredList.gatherResults(deferreds);
    }
    
    return deferredAll;
};

/**
 * @public
 * @param {Array.<string>} debugDeps
 * @param {Array.<string>} compiledDeps
 * @param {string} name human readable worker name
 * @return {base.FakeBroker}
 */
base.FakeBroker.createWorker = function (debugDeps, compiledDeps, name) {
    var broker = new base.FakeBroker(name);
    broker.addDependency(debugDeps, compiledDeps);
    return broker;
};

// if (typeof window === 'undefined') {
//     // we are in worker
//     base.IBroker.parentInstance = new base.Broker('parent', self);
// }

goog.exportSymbol('base.Broker', base.Broker);
// goog.exportSymbol('base.IBroker.parentInstance', base.IBroker.parentInstance);

