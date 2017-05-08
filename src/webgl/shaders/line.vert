attribute vec3 center;
varying vec3 vCenter;
attribute vec3 aPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {

vCenter = center;
vec4 positionVec4 = vec4(aPosition * vec3(1.0, -1.0, 1.0), 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;

}

    