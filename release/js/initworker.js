// bootstrap webworker in compiled code
importScripts('base.js');
importScripts('game.js');
(function () {
    var broker = new base.Broker('main', self);
    game.init(broker);
})();
