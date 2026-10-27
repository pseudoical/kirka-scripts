// ==UserScript==
// @name         Craft Animator Demo
// @namespace    https://kirka.io/
// @version      1.0.0
// @description  Crafting animations demo. Press `7` to open the menu.
// @author       https://github.com/pseudoical
// @match        https://kirka.io/*
// @icon         https://kirka.io/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

// @ts-check

(function () {
    const console = { ...window.console };

    {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "https://cdn.jsdelivr.net/gh/pseudoical/tune@1.0.0/dist/tune.min.js", false);
        xhr.send(null);

        const script = document.head.appendChild(document.createElement("script"));
        script.textContent = xhr.responseText;
    }

    /**
     * @typedef {{
     *     name: string;
     *     description: string;
     *     shaderCode: string;
     * }} ShaderPayload
     */

    /**
     * @param {object} obj
     * @returns {obj is ShaderPayload}
     */
    function isShaderPayload(obj) {
        return "name" in obj && "description" in obj && "shaderCode" in obj;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api2.kirka.io/api/wMNn/wnMNW", false);
    xhr.send(null);

    const response = JSON.parse(xhr.responseText);

    if (!Array.isArray(response)) {
        throw new Error(`!Array.isArray(response)`, response);
    }

    const payloads = response.filter(isShaderPayload);

    // @ts-expect-error ts(2339)
    const gui = new window.Tune({
        storageVersion: "1",
        title: "Craft Animator Demo",
        scriptVersion: "1.0.0",
        author: "@pseudoical",
        url: "https://github.com/pseudoical/kirka-scripts",
        css: {
            top: "50%",
            left: "4%",
            transform: "translateY(-50%)",
        },
    });

    gui.menuKey({ label: "MENU_KEY", value: "7" });

    /** @type {string[]} */
    const glslConfigurations = [];

    for (const { name, description, shaderCode } of payloads) {
        /** @type {HTMLInputElement} */
        const input = gui.checkbox({ type: "bool", label: name, checked: false, scope: () => "" });
        input.setAttribute("title", description);

        /** @type {string} */
        let value;

        try {
            const code = shaderCode.replaceAll("\r\n", String.raw`\r\n`);
            value = JSON.parse(code).fragment;
        } catch {
            value = shaderCode;
        }

        const glsl = `if (${name}) {\n${" ".repeat(4)}${value}\n}`
        glslConfigurations.push(glsl);
    }

    const glslConditions = glslConfigurations.join("\n\n");

    /** @type {HTMLElement} */
    const menu = gui.menu();

    for (const div of menu.children) {
        const input = div.firstElementChild;

        if (input instanceof HTMLInputElement) {
            div.setAttribute("title", input.title);
            input.removeAttribute("title");
        }
    }

    /**
     * https://threejs.org/docs/#ShaderMaterial
     * @typedef {Object} ShaderMaterial
     * @property {{ [key: string]: { value: unknown } }} WNwnWM .uniforms
     *   -- https://threejs.org/docs/#ShaderMaterial.uniforms
     * @property {string} wnWNwm .fragmentShader
     *   -- https://threejs.org/docs/#ShaderMaterial.fragmentShader
     * @property {string} wwWnWN .vertexShader
     *   -- https://threejs.org/docs/#ShaderMaterial.vertexShader
     */

    /**
     * https://threejs.org/docs/#Texture
     * @typedef {Object} Texture
     * @property {() => unknown} WNmMwn .onUpdate
     *   -- https://threejs.org/docs/#Texture.onUpdate
     * @property {HTMLImageElement?} image
     *   -- https://threejs.org/docs/#Texture.image
     */

    /**
     * https://threejs.org/docs/#MeshStandardMaterial
     * @typedef {Object} MeshStandardMaterial
     * @property {string} name
     *   -- https://threejs.org/docs/#Material.name
     * @property {Texture?} map
     *   -- https://threejs.org/docs/#MeshStandardMaterial.map
     * @property {(shaderobject: ShaderMaterial) => unknown} wMmWWwNn .onBeforeCompile
     *   -- https://threejs.org/docs/#Material.onBeforeCompile
     * @property {boolean} transparent
     *   -- https://threejs.org/docs/#Material.transparent
     * @property {boolean} WwmMNn .needsUpdate
     *   -- https://threejs.org/docs/#Material.needsUpdate
     */

    /**
     * @param {object} obj
     * @returns {obj is MeshStandardMaterial}
     */
    function isMeshStandardMaterial(obj) {
        return "name" in obj && "wMmWWwNn" in obj;
    }

    const WeakMap_prototype_set = WeakMap.prototype.set;

    /**
     * Must be patched synchronously. Do not await before this process.
     * @param {Parameters<typeof WeakMap.prototype.set>} args
     * @returns {ReturnType<typeof WeakMap.prototype.set>}
     */
    WeakMap.prototype.set = function (...args) {
        const callback = () => WeakMap_prototype_set.apply(this, args);

        try {
            const material = args[0];

            if (!isMeshStandardMaterial(material)) {
                return callback();
            }

            const texture = material.map;

            if (!texture) {
                return callback();
            }

            const onUpdate = () => {
                const image = texture.image;

                // Some textures use HTMLCanvasElements, such as the lobby
                // player's shadow, the in-game skybox, and player health bars.
                // However, weapon textures are loaded as HTMLImageElements.
                const isImageElement = image instanceof HTMLImageElement;

                // Enemy weapon texture images include "texture-mini.", whereas
                // the player's own textures include "texture.". However, after a
                // game ends, winner weapons are not loaded as mini textures.
                const isOwnTexture = texture.image?.src?.includes("texture.");

                // Player material names start with "player".
                const isPlayer = material.name.startsWith("player");

                if (!(isImageElement && isOwnTexture && !isPlayer)) {
                    return callback();
                }

                material.transparent = true;
                material.WwmMNn = true;

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

                // .onBeforeCompile
                material.wMmWWwNn = (shader) => {
                    const uniforms = gui.generateUniforms({
                        definitions: {
                            u_time: {
                                type: "float",
                                get value() { return performance.now() / 1000; },
                            },
                        },
                    });

                    Object.assign(shader.WNwnWM, uniforms);

                    const isInspecting = !shader.wwWnWN.includes(`vViewPosition = - mvPosition.xyz;`);

                    {
                        const fragmentShader = shader.wnWNwm;
                        const target = "void main() {";
                        const index = fragmentShader.indexOf(target);
                        shader.wnWNwm = insert(fragmentShader, index, `
${isInspecting ? `varying vec3 vViewPosition;` : ""}

${gui.glslUniforms(uniforms)}

vec3 getSurfaceNormal() {
    return normalize(vNormal);
}
`);
                    }
                    {
                        const fragmentShader = shader.wnWNwm;
                        const target = "#WWwMwnN <wWWnNMm>"
                        const index = fragmentShader.indexOf(target) + target.length;
                        shader.wnWNwm = insert(fragmentShader, index, `
vec2 vUV = WnwMWmw;
vec3 col = texture2D(map, vUV).rgb;
vec3 baseColor = col;
float time = u_time;
float uTime = u_time;
vec3 vViewPos = vViewPosition;
vec3 vViewNormal = mat3(WwWwmM) * ${isInspecting ? `vec3(1.0)` : `WWnwmwM`};
vec4 originalColor = gl_FragColor;
vec2 grid = fract(vUV * 20.0);
vec3 vBarycentric = vec3(grid, abs(grid.x + grid.y - 1.0));

${glslConditions}
`);
                    }
                    if (isInspecting) {
                        const vertexShader = shader.wwWnWN;
                        const target = `void main() {`;
                        const index = vertexShader.indexOf(target);
                        shader.wwWnWN = insert(vertexShader, index, `
varying vec3 vViewPosition;
varying vec3 vNormal;
`);
                    }
                    if (isInspecting) {
                        const vertexShader = shader.wwWnWN;
                        const target = `#WWwMwnN <WwWNMwn>`;
                        const index = vertexShader.indexOf(target) + target.length;
                        shader.wwWnWN = insert(vertexShader, index, `
vViewPosition = - mvPosition.xyz;
vNormal = vec3(1.0);
`);
                    }
                };
            };

            if (!window.location.href.includes("games")) {
                texture.WNmMwn = onUpdate;
            } else {
                onUpdate();
            }
        } catch (err) {
            console.error(err);
        }

        return callback();
    };
})();
