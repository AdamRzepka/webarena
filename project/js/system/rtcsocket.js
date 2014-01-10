/**
 * Copyright (C) 2013 Adam Rzepka
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

goog.require('goog.debug.Logger');
goog.require('goog.asserts');
goog.require('system.ISocket');

goog.provide('system.RTCSocket');

/**
 * @constructor
 * @implements {system.ISocket}
 * @param {function(Object)} signallingCallback Function
 *        used to send control messages through signalling channel (e.g. WebSocket),
 *        in order to estabilish RT connection.
 */
system.RTCSocket = function (signallingCallback) {
    var RTC_CONFIGURATION = {
        'iceServers': [{
            'url': 'stun:stun.l.google.com:19302'            
        }]
    };
    var that = this;
    var RTCPeerConnection = window['mozRTCPeerConnection'] || window['RTCPeerConnection']
            || window['webkitRTCPeerConnection'];
    if (!RTCPeerConnection) {
        throw new Error('No RTCPeerConnection defined');
    }
    /**
     * @const
     * @private
     * @type {function(Object)}
     */
    this.signallingCallback = signallingCallback;
    /**
     * @const
     * @private
     * @type {RTCPeerConnection}
     */
    this.peerConnection = new RTCPeerConnection(RTC_CONFIGURATION, {
        'optional': [{'RtpDataChannels': true}]
    });
    /**
     * @private
     * @type {RTCDataChannel}
     */
    this.dataChannel = null;
    /**
     * @private
     * @type {boolean}
     */
    this.supportsBinary = true;

    this.estabilishConnection_();
};

/**
 * @constructor
 * @param {system.RTCSocket.SignallingMessage.Type} type
 * @param {*} data
 */
system.RTCSocket.SignallingMessage = function (type, data) {
    /**
     * @type {system.RTCSocket.SignallingMessage.Type}
     */
    this.type = type;
    /**
     * @type {*}
     */
    this.data = data;
};

/**
 * @enum {number}
 */
system.RTCSocket.SignallingMessage.Type = {
    DESCRIPTION: 0,
    CANDIDATE: 1
};

/**
 * @param {system.RTCSocket.SignallingMessage} msg
 */
system.RTCSocket.prototype.readSignallingMessage = function (msg) {
    var that = this;

    var onError = goog.bind(this.onError_, this);
    var onLocalDescription = goog.bind(this.onLocalDescription_, this);
    
    switch (msg.type) {
    case system.RTCSocket.SignallingMessage.Type.DESCRIPTION:
        
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data), function () {
            that.logger_.log(goog.debug.Logger.Level.INFO,
                             'Got remote description');
            if (msg.data.type === 'offer') {
                that.peerConnection.createAnswer(onLocalDescription, onError);
            }
        }, onError);
        break;
    case system.RTCSocket.SignallingMessage.Type.CANDIDATE:
        this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.data));
        break;
    }
};

/**
 * @type {function()}
 */
system.RTCSocket.prototype.onopen = function () {};
/**
 * @type {function(Event)}
 */
system.RTCSocket.prototype.onmessage = function (event) {};
/**
 * @type {function()}
 */
system.RTCSocket.prototype.onclose = function () {};
/**
 * @type {function()}
 */
system.RTCSocket.prototype.onerror = function () {};
/**
 * @public
 */
system.RTCSocket.prototype.open = function () {
    this.dataChannel = this.peerConnection.createDataChannel('data', {'reliable': false,
                                                                      'ordered': false});
    this.setupChannel_();
};
/**
 * @public
 * @param {ArrayBuffer|string} data
 */
system.RTCSocket.prototype.send = function (data) {
    data = /**@type{ArrayBuffer}*/data;
    if (this.supportsBinary) {
        try {
            this.dataChannel.send(data);
            return;
        } catch (ex) {
            // arraybuffer still not supported :(
            this.supportsBinary = false;
        }
    }
    var u8 = new Uint8Array(data);
    var b64encoded = btoa(String.fromCharCode.apply(null, u8));
    goog.asserts.assert(b64encoded.length < 256);
    this.dataChannel.send(b64encoded);
};
/**
 * @public
 */
system.RTCSocket.prototype.close = function () {
    this.dataChannel.close();
};

/**
 * @private
 */
system.RTCSocket.prototype.logger_ = goog.debug.Logger.getLogger('system.RTCSocket');
/**
 * @private
 */
system.RTCSocket.prototype.estabilishConnection_ = function () {
    var that = this;
    var onError = goog.bind(this.onError_, this);
    var onLocalDescription = goog.bind(this.onLocalDescription_, this);

    this.peerConnection.onnegotiationneeded = function () {
        that.peerConnection.createOffer(onLocalDescription, onError);
    };

    this.peerConnection.onicecandidate = function (evt) {
        var msg;
        if (evt['candidate']) {
            msg = new system.RTCSocket.SignallingMessage(
                system.RTCSocket.SignallingMessage.Type.CANDIDATE,
                evt['candidate']);
            that.signallingCallback(msg);
        }
    };

    this.peerConnection.ondatachannel = function (evt) {
        that.dataChannel = evt['channel'];
        that.setupChannel_();
    };
};
/**
 * @private
 */
system.RTCSocket.prototype.setupChannel_ = function () {
    var that = this;
    this.dataChannel.binaryType = "arraybuffer";
    this.dataChannel.onopen = function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'Data Channel opened');
        that.onopen();
    };
    this.dataChannel.onmessage = function (evt) {
        if (goog.isString(evt.data)) { // sender browser doesn't support ArrayBuffers in WebRTC
            var u8_2 = new Uint8Array(atob(evt.data).split("").map(function(c) {
                return c.charCodeAt(0); }));
            evt = {'data': u8_2.buffer};
        }
        that.onmessage(evt);
    };
    this.dataChannel.onclose = function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'Data Channel closed');        
        that.onclose();
    };
};
/**
 * @private
 */
system.RTCSocket.prototype.onError_ = function (error) {
    this.logger_.log(goog.debug.Logger.Level.SEVERE,
                     error.name + ': ' + error.message);
    this.onerror();
};
/**
 * @private
 */
system.RTCSocket.prototype.onLocalDescription_ = function (desc) {
    var that = this;
    var msg;
    var onError = goog.bind(this.onError_, this);

    this.logger_.log(goog.debug.Logger.Level.INFO,
                     'Got local description');        
    this.peerConnection.setLocalDescription(desc, function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'Local description set');
    }, onError);        
    msg = new system.RTCSocket.SignallingMessage(
        system.RTCSocket.SignallingMessage.Type.DESCRIPTION,
        desc);
    that.signallingCallback(msg);
};

