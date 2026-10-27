// ==UserScript==
// @name         Weapon Animator
// @namespace    https://kirka.io/
// @version      3.0.1
// @description  Animate weapon skins. Press `5` to open the menu. Set all skins to their default textures. View a guide [here](guides/weapon-animator.md).
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
 * ## v3.0.1
 *
 * - Update internal obfuscated names.
 *
 * ## v3.0.0
 *
 * - Update UI look.
 * - Add `Export` button to export settings.
 * - Add `Import` button to import settings.
 */

(function () {
    const console = { ...window.console };

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://cdn.jsdelivr.net/gh/pseudoical/tune@1.0.0/dist/tune.min.js", false);
    xhr.send(null);

    const script = document.head.appendChild(document.createElement("script"));
    script.textContent = xhr.responseText;

    const defaultTextures = /** @type {const} */ ({
        "0bed9187.webp": "Revolver",
        "6c8a6582.webp": "Shark",
        "36d894bd.webp": "MAC-10",
        "b658c822.webp": "M60",
        "76c24e59.webp": "Bayonet",
        "d97db214.webp": "LAR",
        "b2a49027.webp": "VITA",
        "1794de31.webp": "AR-9",
        "212a85fe.webp": "Weatie",
        "b3fc7981.webp": "SCAR",
        "397a3f05.webp": "Tomahawk",
    });

    // @ts-expect-error ts(2339)
    const gui = new window.Tune({
        storageVersion: "3",
        title: "Weapon Animator",
        scriptVersion: "3.0.1",
        author: "@pseudoical",
        url: "https://github.com/pseudoical/kirka-scripts",
        css: {
            top: "50%",
            left: "7%",
            transform: "translateY(-50%)",
        },
    });

    /**
     * @param {TextureConstructor} Texture
     * @returns {HTMLFieldSetElement}
     */
    function createMenu(Texture) {
        gui.menuKey({
            label: "MENU_KEY",
            value: "5",
        });

        const weapon = gui.select({
            type: "none",
            label: "WEAPON",
            options: Object.values(defaultTextures),
            value: 0,
            scope: () => "Weapon",
        });

        const scope = () => weapon.value;

        gui.color({ type: "vec3", label: "COLOR_A", value: [1, 0, 0], scope });
        gui.color({ type: "vec3", label: "COLOR_B", value: [0, 1, 0], scope });
        gui.color({ type: "vec3", label: "COLOR_C", value: [0, 0, 1], scope });

        gui.checkbox({ type: "bool", label: "WAVE_ENABLED", checked: true, scope });
        gui.range({ type: "float", label: "WAVE_SPEED", min: 0, max: 2, value: 0.5, scope });
        gui.range({ type: "float", label: "WAVE_STRENGTH", min: 0, max: 5, value: 0.5, scope });
        gui.range({ type: "float", label: "WAVE_FREQUENCY", min: 0, max: 50, value: 1, scope });
        gui.range({ type: "float", label: "WAVE_DIRECTION_X", min: -1, max: 1, value: 1, scope });
        gui.range({ type: "float", label: "WAVE_DIRECTION_Y", min: -1, max: 1, value: 1, scope });

        gui.checkbox({ type: "bool", label: "WAVE_1_ENABLED", checked: true, scope });
        gui.range({ type: "float", label: "WAVE_1_SPEED", min: 0, max: 15, value: 2, scope });
        gui.range({ type: "float", label: "WAVE_1_STRENGTH", min: 0, max: 5, value: 0.3, scope });
        gui.range({ type: "float", label: "WAVE_1_FREQUENCY", min: 0, max: 30, value: 8, scope });
        gui.range({ type: "float", label: "WAVE_1_WIDTH", min: 0, max: 5, value: 1, scope });
        gui.range({ type: "float", label: "WAVE_1_SOFTNESS", min: 0, max: 10, value: 2, scope });
        gui.range({ type: "float", label: "WAVE_1_BRIGHTNESS", min: 0, max: 10, value: 3, scope });
        gui.range({ type: "float", label: "WAVE_1_DIRECTION_X", min: -1, max: 1, value: 1, scope });
        gui.range({ type: "float", label: "WAVE_1_DIRECTION_Y", min: -1, max: 1, value: 0, scope });

        gui.checkbox({ type: "bool", label: "WAVE_2_ENABLED", checked: true, scope });
        gui.range({ type: "float", label: "WAVE_2_SPEED", min: 0, max: 15, value: 3, scope });
        gui.range({ type: "float", label: "WAVE_2_STRENGTH", min: 0, max: 5, value: 1, scope });
        gui.range({ type: "float", label: "WAVE_2_FREQUENCY", min: 0, max: 30, value: 5, scope });
        gui.range({ type: "float", label: "WAVE_2_WIDTH", min: 0, max: 5, value: 2, scope });
        gui.range({ type: "float", label: "WAVE_2_SOFTNESS", min: 0, max: 10, value: 3, scope });
        gui.range({ type: "float", label: "WAVE_2_BRIGHTNESS", min: 0, max: 10, value: 4, scope });
        gui.range({ type: "float", label: "WAVE_2_DIRECTION_X", min: -1, max: 1, value: 0, scope });
        gui.range({ type: "float", label: "WAVE_2_DIRECTION_Y", min: -1, max: 1, value: 1, scope });

        gui.checkbox({ type: "bool", label: "CELL_ENABLED", checked: true, scope });
        gui.range({ type: "float", label: "CELL_SPEED", min: 0, max: 10, value: 2, scope });
        gui.range({ type: "float", label: "CELL_JITTER", min: 0, max: 0.5, value: 0.2, scope });
        gui.range({ type: "float", label: "CELL_SIZE", min: 0, max: 10, value: 3, scope });

        gui.checkbox({ type: "bool", label: "BLOB_ENABLED", checked: true, scope });
        gui.range({ type: "float", label: "BLOB_SIZE", min: 0, max: 0.5, value: 0.1, scope });
        gui.range({ type: "float", label: "BLOB_SOFTNESS", min: 0, max: 10, value: 1, scope });
        gui.range({ type: "float", label: "BLOB_BRIGHTNESS", min: 0, max: 10, value: 3, scope });
        gui.range({ type: "float", label: "BLOB_SPIKES", min: 0, max: 10, value: 5, scope });

        gui.text({
            type: "sampler2D", label: "TEXTURE_MASK", value: "", scope, uniform: (value, callback) => {
                const texture = new Texture();
                const image = new Image();
                image.crossOrigin = "anonymous";

                image.onload = () => {
                    texture.image = image;
                    // .generateMipmaps
                    texture.mwMWWwnN = false;
                    // .needsUpdate
                    texture.WwmMNn = true;

                    callback(texture);
                };

                image.onerror = () => {
                    callback(null);
                };

                image.src = value;
            },
        });

        gui.exportSettings({
            label: "EXPORT_SETTINGS",
            value: "Export",
            filter: ([scope]) => scope === weapon.value || scope === "Weapon",
        });

        gui.importSettings({
            label: "IMPORT_SETTINGS",
            value: "Import",
        });

        gui.resetSettings({
            label: "RESET_SETTINGS",
            value: "Reset",
            filter: ([scope]) => scope === weapon.value,
        });

        // Initialize storage before populating the cache.
        const menu = gui.menu();
        const storedModel = weapon.value;

        weapon.addEventListener("change", () => {
            gui.resetState();
        });

        // Populate Tune's uniform-state cache for every weapon.
        for (const key in defaultTextures) {
            weapon.value = defaultTextures[key];
            weapon.dispatchEvent(new Event("change"));
        }

        // Restore the original weapon and synchronize the state.
        weapon.value = storedModel;
        weapon.dispatchEvent(new Event("change"));

        return menu;
    }

    /**
     * https://threejs.org/docs/#ShaderMaterial
     * @typedef {Object} ShaderMaterial
     * @property {{ [key: string]: { value: unknown } }} WNwnWM .uniforms
     *   -- https://threejs.org/docs/#ShaderMaterial.uniforms
     * @property {string} wnWNwm .fragmentShader
     *   -- https://threejs.org/docs/#ShaderMaterial.fragmentShader
     */

    /**
     * https://threejs.org/docs/#Texture
     * @typedef {Object} Texture
     * @property {HTMLImageElement?} image
     * @property {boolean} mwMWWwnN .generateMipmaps
     *   -- https://threejs.org/docs/#Texture.generateMipmaps
     * @property {boolean} WwmMNn .needsUpdate
     *   -- https://threejs.org/docs/#Texture.needsUpdate
     */

    /**
     * @typedef {new () => Texture} TextureConstructor
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
     */

    /**
     * @param {object} obj
     * @returns {obj is MeshStandardMaterial}
     */
    function isMeshStandardMaterial(obj) {
        return "name" in obj && "wMmWWwNn" in obj;
    }

    /**
     * @typedef {typeof defaultTextures[keyof typeof defaultTextures]} Weapon
     */

    /**
     * @param {string} url
     * @returns {Weapon | null}
     */
    function defaultTextureToWeapon(url) {
        for (const fileName in defaultTextures) {
            if (url.endsWith(fileName)) {
                return defaultTextures[fileName];
            }
        }
        return null;
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

            const weaponModel = defaultTextureToWeapon(image.src);

            if (weaponModel === null) {
                return callback();
            }

            if (!gui.isMenuCreated) {
                const Texture = /** @type {TextureConstructor} */ (texture.constructor);
                createMenu(Texture);
            }

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

            // .onBeforeCompile
            material.wMmWWwNn = (shader) => {
                const uniforms = gui.generateUniforms({
                    scopes: [weaponModel],
                    definitions: {
                        u_time: {
                            type: "float",
                            get value() { return performance.now() / 1000; },
                        },
                    },
                });

                Object.assign(shader.WNwnWM, uniforms);

                {
                    const fragmentShader = shader.wnWNwm;
                    const target = "void main() {";
                    const index = fragmentShader.indexOf(target);
                    shader.wnWNwm = insert(fragmentShader, index, `
${gui.glslUniforms(uniforms)}

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
`);
                }
                {
                    const fragmentShader = shader.wnWNwm;
                    const target = "gl_FragColor = vec4( outgoingmwwWnM, WWmnNMColor.a );"
                    shader.wnWNwm = replace(fragmentShader, target, `
vec2 uv = WnwMWmw;
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

vec4 mask = mapTexelToLinear(texture2D(TEXTURE_MASK, uv));

color = mix(color, mask.rgb, mask.a);

gl_FragColor = vec4(color, WWmnNMColor.a);
`);
                }
            };
        } catch (err) {
            console.error(err);
        }

        return callback();
    };
})();
