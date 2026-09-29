// ==UserScript==
// @name         Weapon Animator
// @namespace    https://kirka.io/
// @version      1.0.1
// @description  Animate weapon skins. Press `5` to open the menu. View a guide [here](guides/weapon-animator.md).
// @author       https://github.com/pseudoical
// @match        https://kirka.io/*
// @icon         https://kirka.io/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

// @ts-check

(async function () {
    const console = { ...window.console };

    /**
     * https://threejs.org/docs/#Scene
     * @typedef {Object} ShaderMaterial
     * @property {{ [key: string]: { value: unknown } }} WwWnmM .uniforms
     *   -- https://threejs.org/docs/#ShaderMaterial.uniforms
     * @property {string} wMnmWN .fragmentShader
     *   -- https://threejs.org/docs/#ShaderMaterial.fragmentShader
     */

    /**
     * https://threejs.org/docs/#Texture
     * @typedef {Object} Texture
     * @property {HTMLImageElement?} image
     * @property {boolean} WMWwmnwN .generateMipmaps
     *   -- https://threejs.org/docs/#Texture.generateMipmaps
     * @property {boolean} wwWMW .needsUpdate
     *   -- https://threejs.org/docs/#Texture.needsUpdate
     */

    /**
     * @typedef {new () => Texture} TextureConstructor
     */

    /**
     * https://threejs.org/docs/#MeshStandardMaterial
     * @typedef {Object} MeshStandardMaterial
     * @property {string} name
     * @property {Texture?} map
     *   -- https://threejs.org/docs/#MeshStandardMaterial.map
     * @property {(shaderobject: ShaderMaterial) => unknown} wmwWNMn .onBeforeRender
     *   -- https://threejs.org/docs/#Material.onBeforeCompile
     */

    /**
     * @param {object} obj
     * @returns {obj is MeshStandardMaterial}
     */
    function isMeshStandardMaterial(obj) {
        return "name" in obj && "wmwWNMn" in obj;
    }

    /** @type {ShaderMaterial["WwWnmM"]} */
    let uniformsState = { u_time: { get value() { return performance.now() / 1000; } } };

    /** @type {{ type: "vec3" | "bool" | "float" | "sampler2D", name: string }[]} */
    const glslVariables = [{ type: "float", name: "u_time" }];

    const globalId = "@pseudoical_Weapon_Animator";

    /**
     * @param {TextureConstructor} Texture
     */
    function createMenuUI(Texture) {
        const settingsKey = globalId;

        /**
         * @returns {{ [key: string]: unknown } & typeof defaultSettings}
         */
        function createSettings() {
            const defaultSettings = { "MENU_HIDDEN": false, "MENU_KEY": "5" };

            try {
                const value = localStorage.getItem(settingsKey);

                if (value !== null) {
                    const parsed = JSON.parse(value);

                    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                        return Object.assign(defaultSettings, parsed);
                    }
                }
            } catch { }

            return defaultSettings;
        }

        const settings = createSettings();

        /**
         * @param {string} name
         * @param {unknown} value
         */
        function setSetting(name, value) {
            settings[name] = value;
            localStorage.setItem(settingsKey, JSON.stringify(settings));
        }

        /**
         * @param {string} name
         * @param {unknown} uniformValue
         * @param {unknown} [settingValue = uniformValue] uniformValue
         */
        function setUniform(name, uniformValue, settingValue = uniformValue) {
            uniformsState[name] = { value: uniformValue };
            setSetting(name, settingValue);
        }

        /**
         * @returns {HTMLFieldSetElement}
         */
        function createMenu() {
            const menu = document.createElement("fieldset");
            menu.id = `${globalId}_menu`;
            menu.style.position = "fixed";
            menu.style.top = "50%";
            menu.style.left = "124px";
            menu.style.transform = "translateY(-50%)";
            menu.style.zIndex = "9999";
            menu.style.background = "#222";
            menu.style.border = "1px solid #555";
            menu.style.color = "white";
            menu.style.font = "14px Noto Sans Mono, monospace";
            menu.hidden = settings.MENU_HIDDEN;

            const title = document.createElement("div");
            title.style.textAlign = "center";
            title.style.padding = "6px 0";
            title.style.fontSize = "15px";

            title.appendChild(document.createTextNode("Weapon Animator by "));

            const name = document.createElement("a");
            name.textContent = "@pseudoical";
            name.href = "https://github.com/pseudoical/kirka-scripts";
            name.target = "_blank";
            name.rel = "noopener noreferrer";
            name.style.color = "aqua";

            title.appendChild(name);
            menu.appendChild(title);

            const close = document.createElement("button");
            close.textContent = "X";
            close.style.position = "absolute";
            close.style.top = "5px";
            close.style.right = "5px";
            close.style.width = "20px";
            close.style.height = "20px";
            close.style.padding = "0";

            close.addEventListener("click", () => {
                menu.hidden = true;
                setSetting("MENU_HIDDEN", menu.hidden);
            });

            menu.appendChild(close);

            document.addEventListener("keydown", (event) => {
                event.preventDefault();

                if (event.key === settings.MENU_KEY) {
                    menu.hidden = !menu.hidden;
                    setSetting("MENU_HIDDEN", menu.hidden);
                }
            });

            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;

            menu.addEventListener("mousedown", (event) => {
                if (!(event.target instanceof HTMLInputElement)) {
                    isDragging = true;
                    offsetX = event.clientX - menu.offsetLeft;
                    offsetY = event.clientY - menu.offsetTop;
                }
            });

            document.addEventListener("mousemove", (event) => {
                if (isDragging) {
                    menu.style.left = `${event.clientX - offsetX}px`;
                    menu.style.top = `${event.clientY - offsetY}px`;
                }
            });

            document.addEventListener("mouseup", () => {
                isDragging = false;
            });

            document.body.appendChild(menu);

            return menu;
        }

        const menu = createMenu();

        /**
         * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#input_types
         * @param {string} name
         * @param {"button" | "checkbox" | "color" | "range" | "text"} type
         */
        function createInput(name, type) {
            const input = document.createElement("input");
            input.type = type;
            input.id = `${globalId}_${name}`;

            const label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = name;

            const div = document.createElement("div");
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.gap = "6px";
            div.style.marginTop = "2px";

            div.appendChild(input);
            div.appendChild(label);

            menu.appendChild(div);

            return input;
        }

        /**
         * @param {string} name
         * @param {{ r: number, g: number, b: number }} defaultValue
         */
        function createColorGL(name, defaultValue) {
            glslVariables.push({ type: "vec3", name });

            const value = /** @type {typeof defaultValue} */ (settings[name]) ?? defaultValue;
            setUniform(name, value);

            const input = createInput(name, "color");
            input.value = "#" + [value.r, value.g, value.b]
                .map((color) => Math.round(color * 255).toString(16).padStart(2, "0"))
                .join("");

            input.addEventListener("input", () => {
                /**
                 * @param {number} start
                 * @param {number} end
                 * @returns {number}
                 */
                function color(start, end) {
                    const string = input.value.slice(start, end);
                    return parseInt(string, 16) / 255;
                }

                setUniform(name, { r: color(1, 3), g: color(3, 5), b: color(5, 7) });
            });
        }

        /**
         * @param {string} name
         * @param {boolean} defaultValue
         */
        function createCheckboxGL(name, defaultValue) {
            glslVariables.push({ type: "bool", name });

            const value = /** @type {typeof defaultValue} */ (settings[name]) ?? defaultValue;
            setUniform(name, value);

            const input = createInput(name, "checkbox");
            input.checked = value;

            input.addEventListener("input", () => {
                setUniform(name, input.checked);
            });
        }

        /**
         * @param {string} name
         * @param {number} min
         * @param {number} max
         * @param {number} defaultValue
         */
        function createRangeGL(name, min, max, defaultValue) {
            glslVariables.push({ type: "float", name });

            const value = /** @type {typeof defaultValue} */ (settings[name]) ?? defaultValue;
            setUniform(name, value);

            const input = createInput(name, "range");
            input.min = min.toString();
            input.max = max.toString();
            input.step = (max / 100).toString();
            input.value = value.toString();

            input.addEventListener("input", () => {
                setUniform(name, Number(input.value));
            });
        }

        /**
         * @param {string} name
         * @param {string} defaultValue
         */
        function createTextGL(name, defaultValue) {
            glslVariables.push({ type: "sampler2D", name });

            const value = /** @type {typeof defaultValue} */ (settings[name]) ?? defaultValue;
            setUniform(name, null, value);

            /**
             * @param {string} value
             * @returns {void}
             */
            function setTexture(value) {
                const texture = new Texture();
                const image = new Image();
                image.crossOrigin = "anonymous";

                image.onload = () => {
                    texture.image = image;
                    // .generateMipmaps
                    texture.WMWwmnwN = false;
                    // .needsUpdate
                    texture.wwWMW = true;
                    setUniform(name, texture, value);
                };

                image.onerror = () => {
                    setUniform(name, null, value);
                };

                image.src = value;
            }

            setTexture(value);

            const input = createInput(name, "text");
            input.value = value;

            input.addEventListener("input", () => {
                setTexture(input.value);
            });
        }

        createColorGL("COLOR_A", { r: 1, g: 0, b: 0 });
        createColorGL("COLOR_B", { r: 0, g: 1, b: 0 });
        createColorGL("COLOR_C", { r: 0, g: 0, b: 1 });

        createCheckboxGL("WAVE_ENABLED", true);
        createRangeGL("WAVE_SPEED", 0, 2, 0.5);
        createRangeGL("WAVE_STRENGTH", 0, 5, 0.5);
        createRangeGL("WAVE_FREQUENCY", 0, 50, 1);
        createRangeGL("WAVE_DIRECTION_X", -1, 1, 1);
        createRangeGL("WAVE_DIRECTION_Y", -1, 1, 1);

        createCheckboxGL("WAVE_1_ENABLED", true);
        createRangeGL("WAVE_1_SPEED", 0, 15, 2);
        createRangeGL("WAVE_1_STRENGTH", 0, 5, 0.3);
        createRangeGL("WAVE_1_FREQUENCY", 0, 30, 8);
        createRangeGL("WAVE_1_WIDTH", 0, 5, 1);
        createRangeGL("WAVE_1_SOFTNESS", 0, 10, 2);
        createRangeGL("WAVE_1_BRIGHTNESS", 0, 10, 3);
        createRangeGL("WAVE_1_DIRECTION_X", -1, 1, 1);
        createRangeGL("WAVE_1_DIRECTION_Y", -1, 1, 0);

        createCheckboxGL("WAVE_2_ENABLED", true);
        createRangeGL("WAVE_2_SPEED", 0, 15, 3);
        createRangeGL("WAVE_2_STRENGTH", 0, 5, 1);
        createRangeGL("WAVE_2_FREQUENCY", 0, 30, 5);
        createRangeGL("WAVE_2_WIDTH", 0, 5, 2);
        createRangeGL("WAVE_2_SOFTNESS", 0, 10, 3);
        createRangeGL("WAVE_2_BRIGHTNESS", 0, 10, 4);
        createRangeGL("WAVE_2_DIRECTION_X", -1, 1, 0);
        createRangeGL("WAVE_2_DIRECTION_Y", -1, 1, 1);

        createCheckboxGL("CELL_ENABLED", true);
        createRangeGL("CELL_SPEED", 0, 10, 2);
        createRangeGL("CELL_JITTER", 0, 0.5, 0.2);
        createRangeGL("CELL_SIZE", 0, 10, 3);

        createCheckboxGL("BLOB_ENABLED", true);
        createRangeGL("BLOB_SIZE", 0, 0.5, 0.1);
        createRangeGL("BLOB_SOFTNESS", 0, 10, 1);
        createRangeGL("BLOB_BRIGHTNESS", 0, 10, 3);
        createRangeGL("BLOB_SPIKES", 0, 10, 5);

        createTextGL("TEXTURE_MASK", "");

        {
            const settingName = "MENU_KEY";
            const input = createInput(settingName, "text");

            /**
             * @param {string} value
             * @returns {void}
             */
            function setInputValue(value) {
                input.value = `KEY ${value.toUpperCase()}`;
            }

            setInputValue(settings.MENU_KEY);

            input.addEventListener("click", () => {
                input.value = "Press any key...";
                input.style.caretColor = "transparent";
            });

            input.addEventListener("blur", () => {
                setInputValue(settings.MENU_KEY);
            });

            input.addEventListener("keydown", (event) => {
                event.preventDefault();
                event.stopPropagation();
                input.blur();

                setInputValue(event.key);
                setSetting(settingName, event.key);
            });
        }

        {
            const input = createInput("RESET_SETTINGS", "button");
            input.value = "Reset";

            input.addEventListener("click", () => {
                menu.remove();

                for (const key in settings) {
                    if (key !== "MENU_KEY") {
                        delete settings[key];
                    }
                }

                localStorage.setItem(settingsKey, JSON.stringify(settings));

                createMenuUI(Texture);
            });
        }
    }

    let isMenuCreated = false;
    /** @type {string | undefined} */
    let glslUniforms = undefined;

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

            // Some textures use HTMLCanvasElements, such as the lobby
            // player's shadow, the in-game skybox, and player health bars.
            // However, weapon textures are loaded as HTMLImageElements.
            const isImageElement = texture.image instanceof HTMLImageElement;

            // Enemy weapon texture images include "texture-mini.", whereas
            // the player's own textures include "texture.". However, after a
            // game ends, winner weapons are not loaded as mini textures.
            const isOwnTexture = texture.image?.src?.includes("texture.");

            // Player material names start with "player".
            const isPlayer = material.name.startsWith("player");

            if (!(isImageElement && isOwnTexture && !isPlayer)) {
                return callback();
            }

            if (!isMenuCreated) {
                createMenuUI(/** @type {TextureConstructor} */(texture.constructor));
                isMenuCreated = true;
            }

            /**
             * @param {string} patch
             * @returns {string}
             */
            function watermark(patch) {
                const prefix = `\n// ${globalId}\n`;
                const suffix = `\n// ${"=".repeat(globalId.length)}\n`;
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
            material.wmwWNMn = (shader) => {
                glslUniforms ??= glslVariables.map((v) => `uniform ${v.type} ${v.name};`).join("\n");

                for (const name in uniformsState) {
                    const uniforms = shader.WwWnmM;
                    uniforms[name] = { get value() { return uniformsState[name].value; } };
                }

                {
                    const fragmentShader = shader.wMnmWN;
                    const target = "void main() {";
                    const index = fragmentShader.indexOf(target);
                    shader.wMnmWN = insert(fragmentShader, index, `
${glslUniforms}

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
                    const fragmentShader = shader.wMnmWN;
                    const target = "gl_FragColor = vec4( outgoingWnwWNwMm, WmWNMwnwColor.a );"
                    shader.wMnmWN = replace(fragmentShader, target, `
vec2 uv = WwnMmW;
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

vec4 mask = texture2D(TEXTURE_MASK, uv);

color = mix(outgoingWnwWNwMm, color, 1.0);
color = mix(color, mask.rgb, mask.a);

gl_FragColor = vec4(color, WmWNMwnwColor.a);
`);
                }
            };
        } catch { }

        return callback();
    };

    console.log("%cWeapon Animator by %c@pseudoical", "color: yellow;", "color: lime;");
})();
