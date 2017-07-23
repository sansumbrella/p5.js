/**
 * webgl wireframe example
 *
 */

function setup() {
  createCanvas(150, 150, WEBGL);
}


function draw() {
  stroke(0);
  fill(0);
  rotateX(frameCount * 0.01);
  box(75);
}