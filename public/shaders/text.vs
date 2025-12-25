uniform float time;
varying vec2 vUv;
varying vec3 vColor;
varying float vRandom;
attribute vec3 startPos;
attribute vec3 targetPos;

void main() {
    vUv = uv;
    vColor = color;
    
    // Pass a random value based on position for unique twinkling
    vRandom = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);

    vec3 pos = position;

    // Gentle floating wave effect
    // float wave = sin(time * 2.0 + position.x * 0.5) * 0.2;
    // pos.y += wave;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (300.0 / -mvPosition.z);
}
