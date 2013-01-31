goog.require('goog');

goog.provide('base.workers.Broker');

// /**
//  * @constructor
//  * @private
//  */
// base.workers.Message = function (type, 

/**
 * @constructor
 * @param {string} name human friendly name of the worker.
 * @param {Worker} [worker] if we are in worker, this argument should be empty.
 */
base.workers.Broker = function (name, worker) {
    goog.asserts.assert(worker || self); // if we are inside worker, self shall be defined
    /**
     * @private
     * @const
     * @type {function(Object)}
     */
    this.postMessage_ = worker ? goog.bind(worker.postMessage, worker)
        : self.postMessage;
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
     * @type {Array.<function(*)>}
     */
    this.pendingCallbacks_ = [];
    /**
     * @private
     * @type {Object.<string, Object>}
     */
    this.callReceivers_ = [];

    if (worker) {
        worker.onmessage = goog.bind(this.onMessage_, this);
    } else {
        self.onmessage = goog.bind(this.onMessage_, this);
    }
};

/**
 * @const
 * @private
 */
base.workers.Broker.MAX_PENDING_CALLBACKS = 256;

/**
 * @public
 * @type {string} name
 * @type {*} obj
 */
base.workers.Broker.prototype.registerReceiver = function (name, obj) {
    goog.asserts.assert(!this.callReceivers_[name]);
    this.callReceivers_[name] = obj;
};

/**
 * @public
 * @type {*} intface
 * @return {*}
 */
base.workers.Broker.prototype.createProxy = function (intface, name) {
    var prop;
    var that = this;
    var proxy = {};
    var proto = intface.prototype;

    goog.asserts.assert(intface._CROSS_WORKER_);
    
    for( prop in proto ) {
        if (proto.hasOwnProperty(prop) && goog.isFunction(proto[prop])
            && proto[prop]._CROSS_WORKER_) {
            
            proxy[prop] = function() {
                var args = goog.array.clone(arguments);
                var cb = null;
                var funName = prop;
                
                if (proto[prop]._CROSS_WORKER_CALLBACK_
                    && goog.isFunction(args[args.length - 1])) {
                    cb = args.pop();
                }
                
                that.sendProxyCall(name, funName, args, cb);
            };
        }
    }
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
    var msg = event.message;
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
    id = id % base.workers.Broker.MAX_PENDING_CALLBACKS;
    
    if (callback) {
        goog.asserts.assert(!this.pendingCallbacks_[id]);
        this.pendingCallbacks_[id] = callback;
    }
    this.postMessage_({
        type: base.workers.Broker.MessageTypes.FUNCTION_CALL,
        id: id,
        proxyName: proxyName,
        functionName: funName,
        args: args,
        withCallback: goog.isDefAndNotNull(callback)
    });
};

/**
 * @private
 */
base.workers.Broker.prototype.onProxyCall = function (id, receiverName, funName, args,
                                                      withCallback) {
    var that = this;
    var receiver = this.callReceivers_[receiverName];
    goog.asserts.assert(receiver && receiver.hasOwnProperty(funName) && goog.isFunction(receiver[funName]));

    if (withCallback) {
        receiver[funName].apply(receiver, args, function () {
            that.postMessage_({
                type: base.workers.Broker.MessageTypes.FUNCTION_CALLBACK,
                id: id,
                args: goog.array.clone(arguments)
            });
        });
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
