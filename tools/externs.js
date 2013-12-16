function postMessage(msg) {}
/**
 * @constructor
 */
function FileReaderSync() {}
FileReaderSync.prototype.readAsDataURL = function (blob) {};

HTMLElement.prototype.requestPointerLock = function () {};
HTMLElement.prototype.mozRequestPointerLock = function () {};
HTMLElement.prototype.webkitRequestPointerLock = function () {};
/**
 * @type {HTMLElement}
 */
HTMLDocument.prototype.pointerLockElement = null;
/**
 * @type {HTMLElement}
 */
HTMLDocument.prototype.mozPointerLockElement = null;
/**
 * @type {HTMLElement}
 */
HTMLDocument.prototype.webkitPointerLockElement = null;
/**
 * @type {number}
 */
MouseEvent.prototype.movementX = 0;
/**
 * @type {number}
 */
MouseEvent.prototype.mozMovementX = 0;
/**
 * @type {number}
 */
MouseEvent.prototype.webkitMovementX = 0;
/**
 * @type {number}
 */
MouseEvent.prototype.movementY = 0;
/**
 * @type {number}
 */
MouseEvent.prototype.mozMovementY = 0;
/**
 * @type {number}
 */
MouseEvent.prototype.webkitMovementY = 0;

function btoa(str) {}
function atob(str) {}

var JSON = {
    stringify: function (obj) {},
    parse: function(string) {}
};

/**
 * @constructor
 */
var RTCSessionDescription = function (desc) {};
/**
 * @constructor
 */
var RTCIceCandidate = function (candidate) {};
/**
 * @constructor
 */
function RTCPeerConnection() {};
/**
 * @return {RTCDataChannel}
 */
RTCPeerConnection.prototype.createDataChannel = function (a,b) {};
RTCPeerConnection.prototype.setRemoteDescription = function (a,b,c) {};
RTCPeerConnection.prototype.createAnswer = function (a,b) {};
RTCPeerConnection.prototype.createOffer = function (a,b) {};
RTCPeerConnection.prototype.addIceCandidate = function (a) {};
RTCPeerConnection.prototype.setLocalDescription = function (a,b,c) {};
/** @type {?function (Event)} */RTCPeerConnection.prototype.onnegotiationneeded = null;
/** @type {?function (Event)} */RTCPeerConnection.prototype.onicecandidate = null;
/** @type {?function (Event)} */RTCPeerConnection.prototype.ondatachannel = null;
/**
 * @constructor
 */
var RTCDataChannel = function () {};
RTCDataChannel.prototype.send = function (a) {};
RTCDataChannel.prototype.close = function () {};
/** @type {?function (Event)} */RTCDataChannel.prototype.onopen = null;
/** @type {?function (Event)} */RTCDataChannel.prototype.onmessage = null;
/** @type {?function (Event)} */RTCDataChannel.prototype.onclose = null;
/**
 * @constructor
 * @extends {RTCPeerConnection}
 */
function mozRTCPeerConnection() {};
/**
 * @constructor
 * @extends {RTCPeerConnection}
 */
function webkitRTCPeerConnection() {};

var exports = {};
