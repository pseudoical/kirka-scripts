// ==UserScript==
// @name         RGB Bullet Trails
// @namespace    https://kirka.io/
// @version      2.0.0
// @description  Color bullet trails. Press `6` to open the menu.
// @author       https://github.com/pseudoical
// @match        https://kirka.io/*
// @icon         https://kirka.io/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

// @ts-check

/**
 * # CHANGELOG
 *
 * ## v2.0.0
 *
 * - Update UI look.
 * - Add `Reset` button to reset settings.
 */

(function () {
    const console = { ...window.console };

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://cdn.jsdelivr.net/gh/pseudoical/tune@1.0.0/dist/tune.min.js", false);
    xhr.send(null);

    const script = document.head.appendChild(document.createElement("script"));
    script.textContent = xhr.responseText;

    // @ts-expect-error ts(2339)
    const gui = new window.Tune({
        storageVersion: "2",
        title: "RGB Bullet Trails",
        scriptVersion: "2.0.0",
        author: "@pseudoical",
        url: "https://github.com/pseudoical/kirka-scripts",
        css: {
            top: "15%",
            left: "27%",
            transform: "translateY(-50%)",
        },
    });

    const scope = () => "";

    gui.menuKey({ label: "MENU_KEY", value: "6" });
    gui.color({ type: "vec3", label: "COLOR", value: [1, 1, 1], scope });
    gui.range({ type: "float", label: "OPACITY", min: 1, max: 10, value: 1, scope });
    gui.checkbox({ type: "bool", label: "RGB_ENABLED", checked: true, scope });
    gui.range({ type: "float", label: "RGB_SPEED", min: 180, max: 720, value: 360, scope });
    gui.range({ type: "float", label: "RGB_SATURATION", min: 0, max: 1, value: 1, scope });
    gui.range({ type: "float", label: "RGB_BRIGHTNESS", min: 0, max: 1, value: 1, scope });
    gui.resetSettings({ label: "RESET_SETTINGS", value: "Reset" });

    if (document.body) {
        gui.menu();
    } else {
        document.addEventListener("DOMContentLoaded", () => gui.menu(), { once: true });
    }

    /**
     * https://threejs.org/docs/#Scene
     * @typedef {Object} ShaderMaterial
     * @property {{ [key: string]: { value: unknown } }} WwWnmM .uniforms
     *   -- https://threejs.org/docs/#ShaderMaterial.uniforms
     * @property {string} wMnmWN .fragmentShader
     *   -- https://threejs.org/docs/#ShaderMaterial.fragmentShader
     */

    /**
     * @param {object} obj
     * @returns {obj is ShaderMaterial}
     */
    function isShaderMaterial(obj) {
        return "WwWnmM" in obj && "wMnmWN" in obj;
    }

    const window_WeakMap = window.WeakMap;
    // @ts-expect-error ts(2510)
    window.WeakMap = /** @type {WeakMapConstructor} */ (class extends window_WeakMap {
        #once = false;

        /**
         * @param {Parameters<typeof WeakMap.prototype.set>[0]} obj
         */
        set(obj) {
            const callback = () => super.set.apply(this, arguments);

            try {
                if (this.#once || !isShaderMaterial(obj)) {
                    return callback();
                }

                const shader = obj;

                const fragmentTarget = `gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha);`;
                const fragmentShader = shader.wMnmWN;

                if (!fragmentShader.includes(fragmentTarget)) {
                    return callback();
                }

                this.#once = true;

                /**
                 * @param {string} patch
                 * @returns {string}
                 */
                function watermark(patch) {
                    const prefix = `\n// ${gui.author}\n`;
                    const suffix = `\n// ${"=".repeat(gui.author.length)}\n`;
                    return prefix + patch.trim() + suffix;
                }

                /**
                 * @param {string} source
                 * @param {number} index
                 * @param {string} patch
                 * @returns {string}
                 */
                function insert(source, index, patch) {
                    if (0 > index || index > source.length) {
                        throw new Error("Index out of range");
                    }
                    return source.slice(0, index) + watermark(patch) + source.slice(index);
                }

                /**
                 * @param {string} source
                 * @param {string} target
                 * @param {string} patch
                 * @returns {string}
                 */
                function replace(source, target, patch) {
                    return source.replace(target, watermark(patch));
                }

                const uniforms = gui.generateUniforms();
                Object.assign(shader.WwWnmM, uniforms);

                {
                    const fragmentShader = shader.wMnmWN;
                    const target = `void main() {`;
                    const index = fragmentShader.indexOf(target);
                    shader.wMnmWN = insert(fragmentShader, index, `
uniform float uTime; // uTime comes from the vertex shader.
${gui.glslUniforms(uniforms)}

// https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
vec3 HSVtoRGB(float h, float s, float v) {
    float c = s * v;
    float hPrime = h / 60.0;
    float x = c * (1.0 - abs(mod(hPrime, 2.0) - 1.0));

    vec3 rgb;
    if (hPrime < 1.0) {
        rgb = vec3(c, x, 0.0);
    } else if (hPrime < 2.0) {
        rgb = vec3(x, c, 0.0);
    } else if (hPrime < 3.0) {
        rgb = vec3(0.0, c, x);
    } else if (hPrime < 4.0) {
        rgb = vec3(0.0, x, c);
    } else if (hPrime < 5.0) {
        rgb = vec3(x, 0.0, c);
    } else {
        rgb = vec3(c, 0.0, x);
    }

    float m = v - c;
    return rgb + vec3(m);
}
`);
                }

                {
                    const fragmentShader = shader.wMnmWN;
                    shader.wMnmWN = replace(fragmentShader, fragmentTarget, `
vec3 color = COLOR;

if (RGB_ENABLED) {
    float hue = mod(uTime * RGB_SPEED, 360.0);
    color = HSVtoRGB(hue, RGB_SATURATION, RGB_BRIGHTNESS);
}

gl_FragColor = vec4(color, vAlpha * OPACITY);
`);
                }
            } catch { }

            return callback();
        }
    });
})();
