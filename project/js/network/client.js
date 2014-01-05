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
goog.require('network.ObjectWriter');
goog.require('network.Serializer');

goog.provide('network.Client');

/**
 * @constructor
 * @param {base.IBroker} broker
 * @param {network.ISynchronizable} scene
 */
network.Client = function (broker, scene) {
    /**
     * @const
     * @private
     * @type {Array.<network.Snapshot>}
     */
    this.snapshots_ = [];
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
     * @const
     * @private
     * @type {network.ClassInfoManager}
     */
    this.classInfoManager_ = new network.ClassInfoManager();
    /**
     * @const
     * @private
     * @type {network.ObjectWriter}
     */
    this.objectWriter_ = new network.ObjectWriter(this.classInfoManager_);
    /**
     * @const
     * @private
     * @type {network.Serializer}
     */
    this.serializer_ = new network.Serializer(this.classInfoManager_);
};

/**
 * @private
 * @const
 * @type {goog.debug.Logger}
 */
network.Client.prototype.logger_ = goog.debug.Logger.getLogger('network.Client');

/**
 * @public
 * @param {ArrayBuffer} buffer
 */
network.Client.prototype.update = function (buffer) {
    var i = 0;
    var delta = new network.SnapshotDelta();
    var lastSnapshot = null;
    var newSnapshot = new network.Snapshot();

    this.serializer_.read(delta, new DataView(buffer), 0);
    
    var lastTimestamp = delta.timestampA;
    
    if (lastTimestamp === 0) {
        lastSnapshot = new network.Snapshot();
    } else {
        for (i = 0; i < this.snapshots_.length; ++i) {
            if (this.snapshots_[i].timestamp < lastTimestamp) {
                this.snapshots_[i] = null; // clear old snapshots
            } else if (this.snapshots_[i].timestamp === lastTimestamp) {
                lastSnapshot = this.snapshots_[i];
            }
        }
        if (lastSnapshot === null) {
            this.logger_.log(goog.debug.Logger.Level.WARNING,
                             "Don't have a snapshot with timestamp " + lastTimestamp);
            return;
        }
    }
    
    network.Snapshot.sum(lastSnapshot, delta, newSnapshot);
    this.objectWriter_.writeScene(this.scene_, newSnapshot);

    for (i = 0; i <= this.snapshots_.length; ++i) {
        if (!goog.isDefAndNotNull(this.snapshots_[i])) {
            this.snapshots_[i] = newSnapshot;
        }
    }
    this.broker_.fireEvent(base.EventType.SERVER_TIME_UPDATE, newSnapshot.timestamp);
};

/**
 * @public
 * @return {network.ClassInfoManager}
 */
network.Client.prototype.getClassInfoManager = function () {
    return this.classInfoManager_;
};
