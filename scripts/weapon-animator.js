// ==UserScript==
// @name         Weapon Animator
// @namespace    https://kirka.io/
// @version      2.1.1
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
 * ## Version 2.1.1
 *   - Fix texture mask not loading on URL change.
 *
 * ## Version 2.1.0
 *   - Add support for older browsers.
 *
 * ## Version 2.0.2
 *   - Fix loading texture mask on refresh.
 *
 * ## Version 2.0.1
 *   - Fix texture mask coloration.
 *
 * ## Version 2.0.0
 *   - Separate animations for each weapon.
 *   - Animations only affect default textures.
 *   - Persist menu position when resetting.
 */

/**
 * todo: This codebase needs a rewrite before adding more features.
 *
 * Systems are too tightly coupled, some typings are semantically incorrect,
 * and there are several opportunities for performance improvements. Consider
 * migrating to TypeScript to reduce JSDoc verbosity and improve type safety.
 *
 * TL;DR: The code is bad. Also, consider creating a UI kit for menus.
 */

(async function () {
    const console = { ...window.console };

    const version = "2.0.0";

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

    const globalId = "@pseudoical_Weapon_Animator";

    const settingsKey = globalId;

    /**
     * @type {Record<string,
     *     | { type: "color", default: {r: number, g: number, b: number} }
     *     | { type: "checkbox", default: boolean }
     *     | { type: "range", min: number, max: number, default: number }
     *     | { type: "text", default: string, glslRepr?: Texture | null }
     * >}
     */
    const defaultWeaponSettings = {
        COLOR_A: { type: "color", default: { r: 1, g: 0, b: 0 } },
        COLOR_B: { type: "color", default: { r: 0, g: 1, b: 0 } },
        COLOR_C: { type: "color", default: { r: 0, g: 0, b: 1 } },

        WAVE_ENABLED: { type: "checkbox", default: true },
        WAVE_SPEED: { type: "range", min: 0, max: 2, default: 0.5 },
        WAVE_STRENGTH: { type: "range", min: 0, max: 5, default: 0.5 },
        WAVE_FREQUENCY: { type: "range", min: 0, max: 50, default: 1 },
        WAVE_DIRECTION_X: { type: "range", min: -1, max: 1, default: 1 },
        WAVE_DIRECTION_Y: { type: "range", min: -1, max: 1, default: 1 },

        WAVE_1_ENABLED: { type: "checkbox", default: true },
        WAVE_1_SPEED: { type: "range", min: 0, max: 15, default: 2 },
        WAVE_1_STRENGTH: { type: "range", min: 0, max: 5, default: 0.3 },
        WAVE_1_FREQUENCY: { type: "range", min: 0, max: 30, default: 8 },
        WAVE_1_WIDTH: { type: "range", min: 0, max: 5, default: 1 },
        WAVE_1_SOFTNESS: { type: "range", min: 0, max: 10, default: 2 },
        WAVE_1_BRIGHTNESS: { type: "range", min: 0, max: 10, default: 3 },
        WAVE_1_DIRECTION_X: { type: "range", min: -1, max: 1, default: 1 },
        WAVE_1_DIRECTION_Y: { type: "range", min: -1, max: 1, default: 0 },

        WAVE_2_ENABLED: { type: "checkbox", default: true },
        WAVE_2_SPEED: { type: "range", min: 0, max: 15, default: 3 },
        WAVE_2_STRENGTH: { type: "range", min: 0, max: 5, default: 1 },
        WAVE_2_FREQUENCY: { type: "range", min: 0, max: 30, default: 5 },
        WAVE_2_WIDTH: { type: "range", min: 0, max: 5, default: 2 },
        WAVE_2_SOFTNESS: { type: "range", min: 0, max: 10, default: 3 },
        WAVE_2_BRIGHTNESS: { type: "range", min: 0, max: 10, default: 4 },
        WAVE_2_DIRECTION_X: { type: "range", min: -1, max: 1, default: 0 },
        WAVE_2_DIRECTION_Y: { type: "range", min: -1, max: 1, default: 1 },

        CELL_ENABLED: { type: "checkbox", default: true },
        CELL_SPEED: { type: "range", min: 0, max: 10, default: 2 },
        CELL_JITTER: { type: "range", min: 0, max: 0.5, default: 0.2 },
        CELL_SIZE: { type: "range", min: 0, max: 10, default: 3 },

        BLOB_ENABLED: { type: "checkbox", default: true },
        BLOB_SIZE: { type: "range", min: 0, max: 0.5, default: 0.1 },
        BLOB_SOFTNESS: { type: "range", min: 0, max: 10, default: 1 },
        BLOB_BRIGHTNESS: { type: "range", min: 0, max: 10, default: 3 },
        BLOB_SPIKES: { type: "range", min: 0, max: 10, default: 5 },

        TEXTURE_MASK: { type: "text", default: "", glslRepr: /** @type {Texture | null} */ (null) },
    };

    /** @type {{ type: "vec3" | "bool" | "float" | "sampler2D", name: string }[]} */
    const glslVariables = [{ type: "float", name: "u_time" }];

    /**
     * @typedef {keyof typeof defaultWeaponSettings} WeaponSetting
     */

    /**
     * A simplified `structuredClone` to support older browser versions.
     * @template {object} T
     * @param {T} obj
     * @returns {T}
     */
    function structuredClone(obj) {
        return Object.assign({}, obj);
    }

    /**
     * @param {TextureConstructor} Texture
     * @returns {typeof defaultSettings}
     */
    function createSettings(Texture) {
        const weapons = {};

        for (const weapon of Object.values(defaultTextures)) {
            const weaponSettings = {};

            for (const [key, val] of Object.entries(defaultWeaponSettings)) {
                const value = val.default;
                weaponSettings[key] = { value: typeof value === "object" ? structuredClone(value) : value };

                if ("glslRepr" in val) {
                    weaponSettings[key].glslRepr = val.glslRepr;
                }
            }

            weapons[weapon] = weaponSettings;
        }

        /**
         * @type {{
         *     version: typeof version,
         *     weapon: Weapon,
         *     weapons: {[K in Weapon]: {[S in WeaponSetting]: {
         *         value: typeof defaultWeaponSettings[S]["default"],
         *         glslRepr?: Texture | null,
         *     }}},
         *     menuHidden: boolean,
         *     menuKey: string,
         * }}
         */
        const defaultSettings = {
            version: version,
            weapon: "LAR",
            weapons: /** @type {any} */ (weapons),
            menuHidden: false,
            menuKey: "5",
        };

        try {
            const value = localStorage.getItem(settingsKey);

            if (value !== null) {
                const parsed = JSON.parse(value);

                if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                    const { weapons: _, ...savedSettings } = parsed;

                    if (parsed.version !== defaultSettings.version) {
                        return defaultSettings;
                    }

                    Object.assign(defaultSettings, savedSettings);

                    for (const weapon in weapons) {
                        for (const prop in weapons[weapon]) {
                            const saved = parsed.weapons?.[weapon]?.[prop];

                            if (saved) {
                                const obj = weapons[weapon][prop];
                                obj.value = saved.value;

                                if (prop === "TEXTURE_MASK") {
                                    const texture = new Texture();
                                    const image = new Image();
                                    image.crossOrigin = "anonymous";

                                    image.onload = () => {
                                        texture.image = image;
                                        // .generateMipmaps
                                        texture.WMWwmnwN = false;
                                        // .needsUpdate
                                        texture.wwWMW = true;
                                    };

                                    image.onerror = () => { };

                                    image.src = obj.value;

                                    obj.glslRepr = texture;
                                }
                            }
                        }
                    }
                }
            }
        } catch { }

        return defaultSettings;
    }

    /** @type {ReturnType<typeof createSettings>} */
    let settings;

    /**
     * @returns {void}
     */
    function saveSettings() {
        /**
         * note: `settings` is a global runtime state and also stores GLSL
         * representations. `glslRepr` is runtime-only and should not be
         * persisted, so only extract `value` when saving to localStorage.
         */

        /**
         * issue: Iterating through `settings` adds a small performance cost.
         * Improving this would require a larger rewrite. However, the
         * marginal cost is acceptable for now.
         */

        const savedSettings = { ...settings, weapons: {} };

        for (const weapon in settings.weapons) {
            savedSettings.weapons[weapon] = {};
            const weaponSettings = settings.weapons[weapon];

            for (const prop in weaponSettings) {
                const value = weaponSettings[prop].value;
                savedSettings.weapons[weapon][prop] = { value };
            }
        }

        localStorage.setItem(settingsKey, JSON.stringify(savedSettings));
    }

    /**
     * @template {keyof typeof settings} K
     * @param {K} prop
     * @param {typeof settings[K]} value
     */
    function setSetting(prop, value) {
        settings[prop] = value;
        saveSettings()
    }

    /**
     * @template {WeaponSetting} K
     * @param {K} prop
     * @param {typeof settings.weapons[Weapon][K]["value"]} value
     * @param {typeof settings.weapons[Weapon][K]["glslRepr"]} [glslRepr] undefined
     */
    function setWeaponSetting(prop, value, glslRepr = undefined) {
        const weaponSettings = settings.weapons[settings.weapon];

        weaponSettings[prop].value = value;

        if (glslRepr !== undefined) {
            weaponSettings[prop].glslRepr = glslRepr;
        }

        saveSettings();
    }

    /** @type {null | number} */
    let menuOffsetLeft = null;
    /** @type {null | number} */
    let menuOffsetTop = null;

    /**
     * @param {TextureConstructor} Texture
     */
    function createMenuUI(Texture) {
        if (settings === undefined) {
            settings = createSettings(Texture);
        }

        /**
         * @returns {HTMLFieldSetElement}
         */
        function createMenu() {
            const menu = document.createElement("fieldset");
            menu.id = `${globalId}_menu`;
            menu.style.position = "fixed";
            menu.style.top = menuOffsetTop !== null ? `${menuOffsetTop}px` : "50%";
            menu.style.left = menuOffsetLeft !== null ? `${menuOffsetLeft}px` : "125px";
            menu.style.transform = "translateY(-50%)";
            menu.style.zIndex = "9999";
            menu.style.background = "#222";
            menu.style.border = "1px solid #555";
            menu.style.color = "white";
            menu.style.font = "14px Noto Sans Mono, monospace";
            menu.style.maxHeight = "80vh";
            menu.style.overflowY = "auto";
            menu.style.margin = "0";
            menu.hidden = settings.menuHidden;

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
                setSetting("menuHidden", menu.hidden);
            });

            menu.appendChild(close);

            document.addEventListener("keydown", (event) => {
                if (event.key === settings.menuKey) {
                    event.preventDefault();

                    menu.hidden = !menu.hidden;
                    setSetting("menuHidden", menu.hidden);
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
                menuOffsetLeft = menu.offsetLeft;
                menuOffsetTop = menu.offsetTop;
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
         * @param {WeaponSetting} prop
         * @returns {void}
         */
        function createColorGL(prop) {
            glslVariables.push({ type: "vec3", name: prop });

            const value = settings.weapons[settings.weapon][prop].value;

            if (typeof value !== "object" || !("r" in value)) {
                throw new Error("Wrong type");
            }

            const input = createInput(prop, "color");
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

                setWeaponSetting(prop, { r: color(1, 3), g: color(3, 5), b: color(5, 7) });
            });
        }

        /**
         * @param {WeaponSetting} prop
         * @returns {void}
         */
        function createCheckboxGL(prop) {
            glslVariables.push({ type: "bool", name: prop });

            const value = settings.weapons[settings.weapon][prop].value;

            if (typeof value !== "boolean") {
                throw new Error("Wrong type");
            }

            const input = createInput(prop, "checkbox");
            input.checked = value;

            input.addEventListener("input", () => {
                setWeaponSetting(prop, input.checked);
            });
        }

        /**
         * @param {WeaponSetting} prop
         * @param {number} min
         * @param {number} max
         * @returns {void}
         */
        function createRangeGL(prop, min, max) {
            glslVariables.push({ type: "float", name: prop });

            const value = settings.weapons[settings.weapon][prop].value;

            if (typeof value !== "number") {
                throw new Error("Wrong type");
            }

            const input = createInput(prop, "range");
            input.min = min.toString();
            input.max = max.toString();
            input.step = (max / 100).toString();
            input.value = value.toString();

            input.addEventListener("input", () => {
                setWeaponSetting(prop, Number(input.value));
            });
        }

        /**
         * @param {WeaponSetting} prop
         * @returns {void}
         */
        function createTextGL(prop) {
            glslVariables.push({ type: "sampler2D", name: prop });

            const value = settings.weapons[settings.weapon][prop].value;

            if (typeof value !== "string") {
                throw new Error("Wrong type");
            }

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
                    setWeaponSetting(prop, value, texture);
                };

                image.onerror = () => {
                    setWeaponSetting(prop, value, null);
                };

                image.src = value;
            }

            setTexture(value);

            const input = createInput(prop, "text");
            input.value = value;

            input.addEventListener("input", () => {
                setTexture(input.value);
            });
        }

        {
            const select = document.createElement("select");

            for (const key in defaultTextures) {
                const option = document.createElement("option");
                option.value = option.textContent = defaultTextures[key];
                select.appendChild(option);
            }

            select.value = settings.weapon;

            select.addEventListener("change", () => {
                setSetting("weapon", /** @type {Weapon} */(select.value));

                menu.remove();
                createMenuUI(Texture);
            });

            menu.appendChild(select);
        }

        for (const [name, setting] of Object.entries(defaultWeaponSettings)) {
            switch (setting.type) {
                case "color":
                    createColorGL(name);
                    break;
                case "checkbox":
                    createCheckboxGL(name);
                    break;
                case "range":
                    createRangeGL(name, setting.min, setting.max);
                    break;
                case "text":
                    createTextGL(name);
                    break;
            }
        }

        {
            const input = createInput("MENU_KEY", "text");

            /**
             * @param {string} value
             * @returns {void}
             */
            function setInputValue(value) {
                input.value = `KEY ${value.toUpperCase()}`;
            }

            setInputValue(settings.menuKey);

            input.addEventListener("click", () => {
                input.value = "Press any key...";
                input.style.caretColor = "transparent";
            });

            input.addEventListener("blur", () => {
                setInputValue(settings.menuKey);
            });

            input.addEventListener("keydown", (event) => {
                event.preventDefault();
                event.stopPropagation();
                input.blur();

                setInputValue(event.key);
                setSetting("menuKey", event.key);
            });
        }

        {
            const input = createInput("RESET_SETTINGS", "button");
            input.value = "Reset";

            input.addEventListener("click", () => {
                const weapon = settings.weapon;

                for (const key in defaultWeaponSettings) {
                    const v = defaultWeaponSettings[key].default;
                    settings.weapons[weapon][key].value = typeof v === "object" ? structuredClone(v) : v;
                }

                saveSettings();

                menu.remove();
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

                const uniforms = shader.WwWnmM;
                uniforms.u_time = { get value() { return performance.now() / 1000; } };

                const weaponSettings = settings.weapons[weaponModel];

                for (const prop in weaponSettings) {
                    shader.WwWnmM[prop] = {
                        get value() {
                            const obj = weaponSettings[prop];
                            return obj.glslRepr !== undefined ? obj.glslRepr : obj.value;
                        },
                    };
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

vec4 mask = mapTexelToLinear(texture2D(TEXTURE_MASK, uv));

color = mix(color, mask.rgb, mask.a);

gl_FragColor = vec4(color, WmWNMwnwColor.a);
`);
                }
            };
        } catch (err) {
            console.error(err);
        }

        return callback();
    };

    console.log("%cWeapon Animator by %c@pseudoical", "color: yellow;", "color: lime;");
})();
