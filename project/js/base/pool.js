goog.require('goog.asserts');
goog.provide('base.Pool');

/**
 * @constructor
 * @param {{function(): Object}} maker
 * @param {{function(Object)}} cleaner
 */
base.Pool = function (maker, cleaner) {
    var i;
    /**
     * @const
     * @private
     * @type {{function(): Object}}
     */
    this.maker_ = maker;
    /**
     * @const
     * @private
     * @type {{function(Object)}}
     */
    this.cleaner_ = cleaner;    /**
     * @const
     * @private
     * @type {Array.<Object>}
     */
    this.pool_ = [];
};
/**
 * @public
 * @param {string} className
 * Acquire instance of class
 */
base.Pool.prototype.acquire = function () {
    var obj;
    if (this.pool_.length > 0) {
        obj = this.pool_.pop();
        this.cleaner_(obj);
        return obj;
    } else {
        return this.maker_();
    }
};
/**
 * @public
 * @param {Object} object
 * Returns object back to pool
 */
base.Pool.prototype.release = function (obj) {
    goog.asserts.assert(goog.isDefAndNotNull(obj));
    this.pool_.push(obj);
};
