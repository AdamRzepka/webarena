/**
 * Copyright (C) 2014 Adam Rzepka
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
goog.require('base.IBroker');
goog.require('base.events');
goog.require('network');
goog.require('network.Snapshot');
goog.require('network.ObjectReader');
goog.require('network.Serializer');

goog.provide('network.Server');

/**
 * @constructor
 * @param {base.IBroker} broker
 * @param {network.ISynchronizable} scene
 */
network.Server = function (broker, scene) {
    /**
     * @const
     * @private
     * @type {Array.<network.Server.ClientData>}
     */
    this.clientsData_ = [];
    /**
     * @const
     * @private
     * @type {network.ISynchronizable}
     */
    this.scene_ = scene;
    /**
     * @const
     * @private
     * @type {base.IBroker}
     */
    this.broker_ = broker;
    /**
     * @private
     * @type {number}
     */
    this.timestamp_ = 0;
    /**
     * @private
     * @type {number}
     */
    this.accTime_ = 0;
    /**
     * @const
     * @private
     * @type {network.ClassInfoManager}
     */
    this.classInfoManager_ = new network.ClassInfoManager();
    /**
     * @const
     * @private
     * @type {network.ObjectReader}
     */
    this.objectReader_ = new network.ObjectReader(this.classInfoManager_);
    /**
     * @const
     * @private
     * @type {network.Serializer}
     */
    this.serializer_ = new network.Serializer(this.classInfoManager_);
};

/**
 * @private
 * @constructor
 */
network.Server.ClientData = function () {
    this.snapshots = [];
    this.lastSnapshot = 0;
};

/**
 * @private
 * @const
 * @type {goog.debug.Logger}
 */
network.Server.prototype.logger_ = goog.debug.Logger.getLogger('network.Server');

/**
 * @public
 * @param {number} clientId
 */
network.Server.prototype.addClient = function (clientId) {
    if (clientId !== this.clientsData_.length) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                        "Invalid client id in addClient: " + clientId +
                        ". Expected " + this.clientsData_.length);
        return;
    }
    this.clientsData_.push(new network.Server.ClientData);
};

/**
 * @public
 * @param {number} clientId
 * @param {number} timestamp
 */
network.Server.prototype.onClientInput = function (clientId, timestamp) {
    var i = 0;
    if (clientId >= this.clientsData_.length || clientId < 0) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                        "Invalid client id: " + clientId);
        return;
    }
    var client = this.clientsData_[clientId];
    var found = false;

    for (i = 0; i < client.snapshots.length; ++i) {
        if (client.snapshots[i]) {
            if (client.snapshots[i].timestamp < timestamp) {
                client.snapshots[i] = null;
            } else if (client.snapshots[i].timestamp === timestamp) {
                client.lastSnapshot = timestamp;
                found = true;
            }
        }
    }
    if (!found) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         "Don't have snapshot with timestamp " + timestamp);
    }
};

/**
 * @public
 * @param {number} dt in seconds
 */
network.Server.prototype.update = function (dt) {
    var time = this.accTime_ + dt;
    if (time > network.Server.UPDATE_INTERVAL) {
        this.internalUpdate_();
        this.accTime_ = 0;
    } else {
        this.accTime_ = time;
    }
};

/**
 * @public
 * @return {network.ClassInfoManager}
 */
network.Server.prototype.getClassInfoManager = function () {
    return this.classInfoManager_;
};

/**
 * @private
 */
network.Server.prototype.internalUpdate_ = function () {
    var i = 0;
    var snapshot = this.objectReader_.readScene(this.scene_);
    snapshot.timestamp = this.timestamp_++;
    for (i = 0; i < this.clientsData_.length; ++i) {
        this.clientUpdate_(i, this.clientsData_[i], snapshot);
    }
};

/**
 * @private
 */
network.Server.prototype.clientUpdate_ = function (id, client, snapshot) {
    var i = 0;
    var lastSnapshot = null;
    var delta = new network.SnapshotDelta();
    var buffer = new DataView(new ArrayBuffer(1024));

    if (client.lastSnapshot === 0) {
        lastSnapshot = new network.Snapshot();
    } else {
        for (i = 0; i < client.snapshots.length; ++i) {
            if (client.snapshots[i] && client.snapshots[i].timestamp === client.lastSnapshot) {
                lastSnapshot = client.snapshots[i];
                break;
            }
        }
        goog.asserts.assert(lastSnapshot);
    }
    network.Snapshot.diff(lastSnapshot, snapshot, delta);

    var size = this.serializer_.write(delta, buffer, 0);
    var buff = buffer.buffer.slice(0, size);
    this.broker_.fireEvent(base.EventType.STATE_UPDATE, {
        playerId: id,
        data: buff
    }, base.IBroker.EventScope.REMOTE, [buffer.buffer]);

    // store this snapshot in the first free slot
    for (i = 0; i <= client.snapshots.length; ++i) {
        if (!goog.isDefAndNotNull(client.snapshots[i])) {
            client.snapshots[i] = snapshot;
            break;
        }
    }
};

/**
 * @const
 * @private
 * @type {number}
 */
network.Server.UPDATE_INTERVAL = 1/20;
