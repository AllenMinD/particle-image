"use strict";

var images = 8;
var count = 1;

var createGeometry = function createGeometry(size) {
  return [{ x: -size, y: size, z: size }, { x: -size, y: -size, z: size }, { x: size, y: size, z: size }, { x: -size, y: -size, z: size }, { x: size, y: -size, z: size }, { x: size, y: size, z: size }];
};

var getRandom = function getRandom(value) {
  return Math.random() * value - value / 2;
};

var loadImage = function loadImage(callback) {
  var image = new Image();
  image.onload = function () {
    count += count === images ? -(images - 1) : 1;
    callback(image);
  };
  image.crossOrigin = "Anonymous";
  image.src = "http://i0.letvimg.com/lc02_isvrs/201504/23/14/28/9aef904a-3583-4600-8ffe-806ecd5f0d61.jpg";
};

var initialize = function initialize(image) {
  var canvas = document.querySelector("canvas");
  var grid = 200;
  var size = 0.004;
  var step = 0.004;
  var duration = 0.4;

  var imageRatio = image.width / image.height;
  var geometry = createGeometry(size);
  var gridRatio = Math.ceil(grid / imageRatio);
  var multiplier = gridRatio * grid;

  var texture = undefined;
  var forward = false;

  var attributes = [{
    name: "aPositionStart",
    data: function data(i) {
      return [(-((grid - 1) / 2) + i % grid) / (0.5 / size), ((gridRatio - 1) / 2 - Math.floor(i / grid)) / (0.5 / size), 0.0];
    }
  }, {
    name: "aControlPointOne",
    data: function data() {
      return [getRandom(2), getRandom(2), 0];
    }
  }, {
    name: "aControlPointTwo",
    data: function data() {
      return [getRandom(2), getRandom(2), 0];
    }
  }, {
    name: "aPositionEnd",
    data: function data() {
      return [0, 0, -10];
    }
  }, {
    name: "aOffset",
    data: function data(i) {
      return [i * ((1 - duration) / (multiplier - 1))];
    }
  }, {
    name: "aTextureCoord",
    data: function data(i) {
      return [i % grid / grid, Math.floor(i / grid) / gridRatio];
    }
  }];

  var uniforms = [{
    name: "uProgress",
    type: "float",
    value: 1.0
  }];

  var vertexShader = "\n    attribute vec3 position;\n    attribute vec3 aPositionStart;\n    attribute vec3 aControlPointOne;\n    attribute vec3 aControlPointTwo;\n    attribute vec3 aPositionEnd;\n    attribute float aOffset;\n    attribute float aAngle;\n\n    attribute vec2 aTextureCoord;\n    varying vec2 vTextureCoord;\n\n    uniform float uProgress;\n    uniform mat4 uMVP;\n\n    vec3 bezier4(vec3 a, vec3 b, vec3 c, vec3 d, float t) {\n      return mix(mix(mix(a, b, t), mix(b, c, t), t), mix(mix(b, c, t), mix(c, d, t), t), t);\n    }\n\n    float easeInOutSin(float t){\n      return (1.0 + sin(3.142 * t - 3.142 / 2.0)) / 2.0;\n    }\n\n    void main () {\n      float tProgress = easeInOutSin(min(1.0, max(0.0, (uProgress - aOffset)) / " + duration + "));\n      vec3 newPosition = bezier4(aPositionStart, aControlPointOne, aControlPointTwo, aPositionEnd, tProgress);\n      gl_Position = uMVP * vec4(newPosition + position, 1.0);\n\n      vTextureCoord = aTextureCoord;\n    }\n  ";

  var fragmentShader = "\n    precision mediump float;\n\n    uniform sampler2D uSampler;\n    varying vec2 vTextureCoord;\n\n    void main() {\n      gl_FragColor = texture2D(uSampler, vTextureCoord);\n    }\n  ";

  var onSetup = function onSetup(gl) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  var onRepeat = function onRepeat(gl, program) {
    var uSampler = gl.getUniformLocation(program, "uSampler");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uSampler, 0);

    if (uniforms[0].value > 1) {
      loadImage(function (newImage) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, newImage);
      });
      forward = false;
    } else if (uniforms[0].value < -0.2) {
      forward = true;
    }
    uniforms[0].value += forward ? step : -step;
  };

  var textureCoordLayout = [false, true, false, false, true, true, false, false, true, false, true, true];

  var modifier = {
    attribute: "aTextureCoord",
    value: function value(attributeBufferDataOffset, attributeData, l, k) {
      var current = textureCoordLayout[k * 2 + l];
      if (l === 1) {
        return !current ? attributeData[1] + imageRatio / grid : attributeData[1];
      }
      return current ? attributeData[0] + 1 / grid : attributeData[0];
    }
  };

  starlings(canvas, geometry, multiplier, attributes, uniforms, vertexShader, fragmentShader, onSetup, onRepeat, modifier);
};

loadImage(initialize);