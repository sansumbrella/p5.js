//Retained Mode. The default mode for rendering 3D primitives
//in WEBGL.
'use strict';

var p5 = require('../core/core');
var hashCount = 0;
/**
 * _initBufferDefaults
 * @description initializes buffer defaults. runs each time a new geometry is
 * registered
 * @param  {String} gId  key of the geometry object
 */
p5.RendererGL.prototype._initBufferDefaults = function(gId) {
  //@TODO remove this limit on hashes in gHash
  hashCount ++;
  if(hashCount > 1000){
    var key = Object.keys(this.gHash)[0];
    delete this.gHash[key];
    hashCount --;
  }

  var gl = this.GL;
  //create a new entry in our gHash
  this.gHash[gId] = {};
  this.gHash[gId].vertexBuffer = gl.createBuffer();
  this.gHash[gId].normalBuffer = gl.createBuffer();
  this.gHash[gId].uvBuffer = gl.createBuffer();
  this.gHash[gId].indexBuffer = gl.createBuffer();
  this.gHash[gId].barycentricBuffer = gl.createBuffer();
};
/**
 * createBuffers description
 * @param  {String} gId    key of the geometry object
 * @param  {p5.Geometry}  obj contains geometry data
 */
p5.RendererGL.prototype.createBuffers = function(gId, obj) {
  var gl = this.GL;
  this._setDefaultCamera();
  //initialize the gl buffers for our geom groups
  this._initBufferDefaults(gId);
  //return the current shaderProgram from our material hash
  var mId = this._getCurShaderId();
  var shaderProgram = this.mHash[mId];
  //@todo rename "numberOfItems" property to something more descriptive
  //we mult the num geom faces by 3
  this.gHash[gId].numberOfItems = obj.faces.length * 3;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array( vToNArray(obj.vertices) ),
    gl.STATIC_DRAW);
  //vertex position
  this._checkBuffers(shaderProgram, shaderProgram.vertexPositionAttribute,
   'aPosition');

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gHash[gId].indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array( flatten(obj.faces) ),
    gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].normalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array( vToNArray(obj.vertexNormals) ),
    gl.STATIC_DRAW);
  //vertex normal
  this._checkBuffers(shaderProgram, shaderProgram.vertexNormalAttribute,
   'aNormal');

  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].uvBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array( flatten(obj.uvs) ),
    gl.STATIC_DRAW);
  //texture coordinate Attribute
  this._checkBuffers(shaderProgram, shaderProgram.textureCoordAttribute,
    'aTexCoord');
  //barycentric cooordinate Attribute
  this._checkBuffers(shaderProgram, shaderProgram.barycentricCoordAttribute,
    'aBarycentric');
  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].barycentricBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array( flatten(obj.barycentric) ),
    gl.STATIC_DRAW);
};

/**
 * Draws buffers given a geometry key ID
 * @param  {String} gId     ID in our geom hash
 * @return {p5.RendererGL} this
 */
p5.RendererGL.prototype.drawBuffers = function(gId) {
  this._setDefaultCamera();
  var gl = this.GL;
  var mId = this._getCurShaderId();
  var shaderProgram = this.mHash[mId];
  //vertex position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].vertexBuffer);
  if(shaderProgram.vertexPositionAttribute) {
    gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    3, gl.FLOAT, false, 0, 0);
  }
  //vertex index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gHash[gId].indexBuffer);
  this._setMatrixUniforms(mId);
  switch (mId) {
    case 'normalVert|basicFrag':
    case 'lightVert|lightTextureFrag':
      //normal buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].normalBuffer);
      if(shaderProgram.vertexNormalAttribute) {
        gl.vertexAttribPointer(
        shaderProgram.vertexNormalAttribute,
        3, gl.FLOAT, false, 0, 0);
      } else {
        this._checkBuffers(shaderProgram, shaderProgram.vertexNormalAttribute,
          'aNormal');
      }

      // uv buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].uvBuffer);
      if(shaderProgram.textureCoordinate) {
        gl.vertexAttribPointer(
        shaderProgram.textureCoordAttribute,
        2, gl.FLOAT, false, 0, 0);
      } else {
        this._checkBuffers(shaderProgram, shaderProgram.textureCoordAttribute,
          'aTexCoord');
      }
      break;
    case 'wireframeVert|wireframeFrag':
      //barycentric buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gHash[gId].barycentricBuffer);
      if(shaderProgram.barycentricCoordAttribute) {
        gl.vertexAttribPointer(
        shaderProgram.barycentricCoordAttribute,
        3, gl.FLOAT, false, 0, 0);
      } else {
        this._checkBuffers(shaderProgram, shaderProgram.barycentricCoordAttribute,
          'aBarycentric');
      }
      break;
    default:
      break;
  }
  gl.drawElements(
    gl.TRIANGLES, this.gHash[gId].numberOfItems,
    gl.UNSIGNED_SHORT, 0);
  return this;
};

p5.RendererGL.prototype._checkBuffers = function(shaderProgram, attribLoc,
  attribName) {
  var gl = this.GL;
  attribLoc = gl.getAttribLocation(shaderProgram, attribName);
  if(attribLoc !== -1) {
    gl.enableVertexAttribArray(attribLoc);
    gl.vertexAttribPointer(
    attribLoc,
    3, gl.FLOAT, false, 0, 0);
  }
  return this;
};
///////////////////////////////
//// UTILITY FUNCTIONS
//////////////////////////////
/**
 * turn a two dimensional array into one dimensional array
 * @param  {Array} arr 2-dimensional array
 * @return {Array}     1-dimensional array
 * [[1, 2, 3],[4, 5, 6]] -> [1, 2, 3, 4, 5, 6]
 */
function flatten(arr){
  if (arr.length>0){
    return arr.reduce(function(a, b){
      return a.concat(b);
    });
  } else {
    return [];
  }
}

/**
 * turn a p5.Vector Array into a one dimensional number array
 * @param  {Array} arr  an array of p5.Vector
 * @return {Array]}     a one dimensional array of numbers
 * [p5.Vector(1, 2, 3), p5.Vector(4, 5, 6)] ->
 * [1, 2, 3, 4, 5, 6]
 */
function vToNArray(arr){
  return flatten(arr.map(function(item){
    return [item.x, item.y, item.z];
  }));
}
module.exports = p5.RendererGL;
