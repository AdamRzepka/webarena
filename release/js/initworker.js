// bootstrap webworker in compiled code
importScripts('base.js');
importScripts('game.js');
(function () {
    var broker = new base.workers.Broker('main', self);
    game.init(broker);
})();
