uniform float time;
varying vec3 vPosition;

// Random function for star generation
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Generate stars based on position
float stars(vec3 pos, float threshold) {
    vec3 p = normalize(pos);
    vec2 uv = vec2(
        atan(p.z, p.x) / 6.28318530718,
        asin(p.y) / 3.14159265359 + 0.5
    );
    
    // Create different layers of stars
    float star = 0.0;
    
    // Layer 1: Small stars (fewer stars)
    vec2 grid1 = floor(uv * 150.0);
    float r1 = random(grid1);
    if (r1 > threshold - 0.07) {  // Fewer stars
        vec2 local1 = fract(uv * 150.0);
        float dist1 = length(local1 - vec2(0.5));
        float s1 = smoothstep(0.05, 0.0, dist1) * 1.5;
        
        // Add fast twinkling to small stars too
        float twinkle1 = sin(time * 8.0 + r1 * 100.0) * 0.5 + 0.5;
        s1 *= (0.3 + twinkle1 * 1.0); 
        
        star += s1;
    }
    
    // Layer 2: Medium stars (moderate amount)
    vec2 grid2 = floor(uv * 80.0);
    float r2 = random(grid2);
    if (r2 > threshold + 0.075) {  // Moderate amount
        vec2 local2 = fract(uv * 80.0);
        float dist2 = length(local2 - vec2(0.5));
        star += smoothstep(0.08, 0.0, dist2) * 2.5;  // Moderate brightness

        // Add twinkling effect
        float twinkle = sin(time * 2.0 + r2 * 100.0) * 0.5 + 0.5;
        star *= (0.2 + twinkle * 0.8);
    }
    
    return star;
}

void main() {
    // Pure black background
    vec3 skyColor = vec3(0.0, 0.0, 0.0);
    
    // Generate stars (higher threshold = fewer stars)
    float starBrightness = stars(vPosition, 0.92);
    
    // Base star color: Purple/Violet tint (Removed white)
    vec3 starColor = vec3(0.7, 0.4, 1.0) * starBrightness;
    
    // Add variations of purple
    float colorVar = random(floor(normalize(vPosition).xy * 100.0));
    if (colorVar > 0.95) {
        starColor = mix(starColor, vec3(0.9, 0.2, 1.0), 0.8) * starBrightness; // Intense Deep Purple
    } else if (colorVar > 0.85) {
        starColor = mix(starColor, vec3(0.6, 0.1, 0.9), 0.6) * starBrightness; // Darker Violet
    }
    
    // Combine sky and stars
    vec3 finalColor = skyColor + starColor;
    
    gl_FragColor = vec4(finalColor, 1.0);
}

