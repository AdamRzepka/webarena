// bootstrap webworker with gamecode in debug mode
if (typeof COMPILED == 'undefined') {
  var CLOSURE_BASE_PATH = '../../../closure/goog/';
  importScripts(
      CLOSURE_BASE_PATH + 'bootstrap/webworkers.js',
      CLOSURE_BASE_PATH + 'base.js',
      CLOSURE_BASE_PATH + 'deps.js',
      'deps.js');
}

goog.require('base.Broker');

(function () {
    var broker = new base.Broker('test', self);
    broker.registerEventListener('testEventPing', function (eventType, data) {
        broker.fireEvent('testEventPong', data);
    });
})();

