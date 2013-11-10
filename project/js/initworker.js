// bootstrap a webworker
if (typeof COMPILED == 'undefined') {
    // debug mode
    var CLOSURE_BASE_PATH = '../closure/closure/goog/';
    importScripts(
        CLOSURE_BASE_PATH + 'bootstrap/webworkers.js',
        CLOSURE_BASE_PATH + 'base.js',
        CLOSURE_BASE_PATH + 'deps.js',
        '../deps.js');
    
    goog.require('base.Broker');
} else {
    // release mode
    importScripts('base.js');
}
