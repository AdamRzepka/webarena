goog.provide('common');

/**
 * @enum
 */
var LightningType = {
    LIGHT_2D: -4,
    LIGHT_VERTEX: -3,
    LIGHT_WHITE: -2,
    LIGHT_DYNAMIC: -1,
    LIGHT_MAP: 0
};

/**
 * @constructor
 */
var Mesh = function() {
    /**
     * @type {renderer.LightningType}
     */
    this.lightningType = LIGHT_2D;
    /**
     * @type {number}
     */
    this.elementsArrayId = -1;
    /**
     * @type {number}
     */
    this.elementsOffset = 0;
    /**
     * @type {number}
     */
    this.elementsCount = 0;
    /**
     * @type {Array.<{arrayBuffer: number}>}
     */
    this.frames = [{arrayBufferId: -1}];
    /**
     * @type {Array.<{shader: ?, defaultTexture: ?}>}
     */
    this.materials = [{shader: null, defaultTexture: null}]; // defaultTexture is used with default shader
};

/**
 * @constructor
 */
var MeshInstance = function() {
    /**
     * @type {number}
     */
    this.id = -1;
    /**
     * @type {Mesh}
     */
    this.baseMesh = null;
    /**
     * @type {boolean}
     */
    this.culled = false;
    /**
     * @type {ModelInstance}
     */
    this.modelInstance = null;
    /**
     * @type {?}
     */
    this.material = null;
};

/**
 * @constructor
 */
var Model = function() {
    /**
     * @type {number}
     */
    this.id = -1;
    /**
     * @type {Array.<Mesh>}
     */
    this.meshes = [];
    /**
     * @type {number}
     */
    this.framesCount = 1;
    /**
     * @type {Object.<string,number>}
     */
    this.skinsIndices = {}; // { NAME: materialIndexInMesh }
    /**
     * @type {number}
     */
    this.skinsCount = 1;
};

/**
 * @constructor
 */
var ModelInstance = function() {
    /**
     * @type {number}
     */
    this.id = -1;
    /**
     * @type {Model}
     */
    this.baseModel = null;

    /**
     * @type {number}
     */
    this.skinId = 0;
    /**
     * @type {mat4}
     */
    this.matrix = null;
    /**
     * @type {number}
     */
    this.frame = 0;
    /**
     * @type {boolean}
     */
    this.visible = false;
};