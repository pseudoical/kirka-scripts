/**
 * How to experiment with this shader:
 *   1. Visit https://thebookofshaders.com/edit.php
 *   2. Copy this shader
 *   3. Paste it into the editor
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

/**
 * How to adjust values:
 *   1. Click on any number below
 *   2. Adjust its value with the color picker or slider
 */

vec3 COLOR_A = vec3(1.0, 0.0, 0.0);
vec3 COLOR_B = vec3(0.0, 1.0, 0.0);
vec3 COLOR_C = vec3(0.0, 0.0, 1.0);

bool  WAVE_ENABLED     = true;
float WAVE_SPEED       = 0.5;
float WAVE_STRENGTH    = 0.5;
float WAVE_FREQUENCY   = 1.0;
float WAVE_DIRECTION_X = 1.0;
float WAVE_DIRECTION_Y = 1.0;

bool  WAVE_1_ENABLED     = true;
float WAVE_1_SPEED       = 2.0;
float WAVE_1_STRENGTH    = 0.3;
float WAVE_1_FREQUENCY   = 8.0;
float WAVE_1_WIDTH       = 1.0;
float WAVE_1_SOFTNESS    = 2.0;
float WAVE_1_BRIGHTNESS  = 3.0;
float WAVE_1_DIRECTION_X = 1.0;
float WAVE_1_DIRECTION_Y = 0.0;

bool  WAVE_2_ENABLED     = true;
float WAVE_2_SPEED       = 3.0;
float WAVE_2_STRENGTH    = 1.0;
float WAVE_2_FREQUENCY   = 5.0;
float WAVE_2_WIDTH       = 2.0;
float WAVE_2_SOFTNESS    = 3.0;
float WAVE_2_BRIGHTNESS  = 4.0;
float WAVE_2_DIRECTION_X = 0.0;
float WAVE_2_DIRECTION_Y = 1.0;

bool  CELL_ENABLED = true;
float CELL_SPEED   = 2.0;
float CELL_JITTER  = 0.2;
float CELL_SIZE    = 3.0;

bool  BLOB_ENABLED    = true;
float BLOB_SIZE       = 0.1;
float BLOB_SOFTNESS   = 1.0;
float BLOB_BRIGHTNESS = 3.0;
float BLOB_SPIKES     = 5.0;

float random(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float wave(vec2 p, vec2 direction, float frequency, float speed) {
    if (direction == vec2(0.0)) {
        return 0.0;
    }
    vec2 n = normalize(direction);
    float d = dot(p, n * frequency);
    float s = u_time * speed;
    return sin(d + s);
}

float waveLine(vec2 p, vec2 direction, float frequency, float speed,
        float strength, float width, float softness) {
    float y = wave(p, direction, frequency, speed) * strength;
    float e = width * (1.0 - softness);
    return 1.0 - smoothstep(e, width,  abs(p.y - y));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    float time = u_time;

    if (WAVE_ENABLED) {
        vec2 direction = vec2(WAVE_DIRECTION_X, WAVE_DIRECTION_Y);
        float distortion = wave(p, direction, WAVE_FREQUENCY, WAVE_SPEED);
        p.y += distortion * WAVE_STRENGTH;
    }

    vec3 color = vec3(COLOR_A);

    if (WAVE_1_ENABLED) {
        vec2 direction = vec2(WAVE_1_DIRECTION_X, WAVE_1_DIRECTION_Y);
        float wave1Line = waveLine(p, direction, WAVE_1_FREQUENCY,
                WAVE_1_SPEED, WAVE_1_STRENGTH, WAVE_1_WIDTH, WAVE_1_SOFTNESS);
        color = mix(color, COLOR_B, wave1Line * WAVE_1_BRIGHTNESS);
    }

    if (WAVE_2_ENABLED) {
        vec2 direction = vec2(WAVE_2_DIRECTION_X, WAVE_2_DIRECTION_Y);
        float wave2Line = waveLine(p, direction, WAVE_2_FREQUENCY,
                WAVE_2_SPEED, WAVE_2_STRENGTH, WAVE_2_WIDTH, WAVE_2_SOFTNESS);
        color = mix(color, COLOR_C, wave2Line * WAVE_2_BRIGHTNESS);
    }

    vec2 grid = fract(p * CELL_SIZE) - 0.5;

    if (CELL_ENABLED) {
        vec2 cell = floor(p * CELL_SIZE);
        float pi = 3.14159;

        vec2 phase = vec2(random(cell), random(cell * pi)) * pi * 2.0;
        float speed = time * CELL_SPEED;

        vec2 offset = vec2(sin(speed + phase.x), cos(speed + phase.y));
        grid -= offset * CELL_JITTER;
    }

    if (BLOB_ENABLED) {
        float angle = atan(grid.y, grid.x);
        float arms = cos(angle * BLOB_SPIKES) * 0.5 + 0.5;

        float radius = mix(BLOB_SIZE / 2.0, BLOB_SIZE, arms);
        float edge = radius * (1.0 - BLOB_SOFTNESS);

        float blob = 1.0 - smoothstep(edge, radius, length(grid));
        color += blob * COLOR_C * BLOB_BRIGHTNESS;
    }

    gl_FragColor = vec4(color, 1.0);
}
