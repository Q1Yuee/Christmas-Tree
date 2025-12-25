uniform float time;
uniform sampler2D pointTexture;
uniform float brightness;
uniform float saturation;
uniform float twinkleSpeed;
uniform float glowIntensity;
varying vec3 vColor;
varying float vRandom;

// RGB to HSL conversion
vec3 rgb2hsl(vec3 c) {
    float maxC = max(max(c.r, c.g), c.b);
    float minC = min(min(c.r, c.g), c.b);
    float l = (maxC + minC) / 2.0;
    
    if (maxC == minC) {
        return vec3(0.0, 0.0, l);
    }
    
    float d = maxC - minC;
    float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    
    float h;
    if (maxC == c.r) {
        h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    } else if (maxC == c.g) {
        h = (c.b - c.r) / d + 2.0;
    } else {
        h = (c.r - c.g) / d + 4.0;
    }
    h /= 6.0;
    
    return vec3(h, s, l);
}

// HSL to RGB conversion
float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    
    if (s == 0.0) {
        return vec3(l);
    }
    
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    
    return vec3(
        hue2rgb(p, q, h + 1.0/3.0),
        hue2rgb(p, q, h),
        hue2rgb(p, q, h - 1.0/3.0)
    );
}

void main() {
    // Basic circular soft particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Base glow from center
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.2);

    // Twinkle Effect
    float flashSpeed = 3.0 + vRandom * twinkleSpeed; 
    float twinkle = 0.7 + 0.3 * sin(time * flashSpeed + vRandom * 100.0);
    
    // Occasional bright burst
    if (sin(time * 5.0 + vRandom * 50.0) > 0.95) {
        twinkle *= 1.3; 
    }

    // Convert to HSL for precise control
    vec3 hsl = rgb2hsl(vColor);
    
    // Apply saturation boost (keep hue, boost saturation)
    hsl.y = clamp(hsl.y * saturation, 0.0, 1.0);
    
    // Apply brightness (boost lightness)
    hsl.z = clamp(hsl.z * brightness, 0.0, 0.95);
    
    // Convert back to RGB
    vec3 adjustedColor = hsl2rgb(hsl);
    
    // Apply twinkle
    vec3 finalColor = adjustedColor * twinkle;
    
    // Add colored glow
    finalColor += adjustedColor * glowIntensity;

    gl_FragColor = vec4(finalColor, glow);
}
