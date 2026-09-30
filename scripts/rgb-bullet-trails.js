// ==UserScript==
// @name         RGB Bullet Trails
// @namespace    https://kirka.io/
// @version      1.0.0
// @description  Color bullet trails. Press `6` to open the menu.
// @author       https://github.com/pseudoical
// @match        https://kirka.io/*
// @icon         https://kirka.io/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

// @ts-check

(function () {
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
     * @param {object} obj
     * @returns {obj is ShaderMaterial}
     */
    function isShaderMaterial(obj) {
        return "WwWnmM" in obj && "wMnmWN" in obj;
    }

    /** @type {ShaderMaterial["WwWnmM"]} */
    const uniformsState = {};

    /** @type {{ type: "vec3" | "bool" | "float", name: string }[]} */
    const glslVariables = [];

    const globalId = "@pseudoical_RGB_Bullet_Trails";

    /**
     * @returns {void}
     */
    function createMenuUI() {
        const settingsKey = globalId;

        /**
         * @returns {{ [key: string]: unknown } & typeof defaultSettings}
         */
        function createSettings() {
            const defaultSettings = { "MENU_HIDDEN": false, "MENU_KEY": "6" };

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
            menu.style.top = "0px";
            menu.style.left = "394px";
            menu.style.zIndex = "9999";
            menu.style.background = "#222";
            menu.style.border = "1px solid #555";
            menu.style.color = "white";
            menu.style.font = "14px Noto Sans Mono, monospace";
            menu.hidden = settings.MENU_HIDDEN;

            const title = document.createElement("div");
            title.style.textAlign = "center";
            title.style.padding = "6px 24px 6px 0";
            title.style.fontSize = "15px";

            title.appendChild(document.createTextNode("RGB Bullet Trails by "));

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
                if (event.key === settings.MENU_KEY) {
                    event.preventDefault();

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

        createColorGL("COLOR", { r: 1, g: 1, b: 1 });
        createRangeGL("OPACITY", 1, 10, 1);
        createCheckboxGL("RGB_ENABLED", true);
        createRangeGL("RGB_SPEED", 180, 720, 360);
        createRangeGL("RGB_SATURATION", 0, 1, 1);
        createRangeGL("RGB_BRIGHTNESS", 0, 1, 1);

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

                createMenuUI();
            });
        }
    }

    createMenuUI();

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

                const glslUniforms = glslVariables.map((v) => `uniform ${v.type} ${v.name};`).join("\n");

                for (const name in uniformsState) {
                    const uniforms = shader.WwWnmM;
                    uniforms[name] = { get value() { return uniformsState[name].value; } };
                    console.log(uniforms[name]);
                }

                {
                    const fragmentShader = shader.wMnmWN;
                    const target = `void main() {`;
                    const index = fragmentShader.indexOf(target);
                    shader.wMnmWN = insert(fragmentShader, index, `
uniform float uTime; // uTime comes from the vertex shader.
${glslUniforms}

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

    console.log("%cRGB Bullet Trails by %c@pseudoical", "color: yellow;", "color: lime;");
})();
