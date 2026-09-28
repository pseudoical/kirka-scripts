// ==UserScript==
// @name         Health Bar Mod
// @namespace    https://kirka.io/
// @version      1.0.0
// @description  Color players from green to red based on HP.
// @author       https://github.com/pseudoical
// @match        https://kirka.io/*
// @icon         https://kirka.io/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

// @ts-check

/**
 * issue: The player sometimes remains green after taking damage and does not
 * transition to the expected damage color. The direct cause is unknown.
 *
 * Patching `WebGL2RenderingContext.prototype.shaderSource` is a possible
 * workaround, since Three.js uses it during its `onBeforeCompile` pipeline.
 * This has not been verified to resolve the issue.
 *
 * This problem occurs infrequently, so fixing it is not urgent.
 */

(function () {
    const console = { ...window.console };

    /**
     * https://threejs.org/docs/#Object3D
     * @typedef {object} Object3D
     * @property {number} id
     *   -- https://threejs.org/docs/#Object3D.id
     * @property {string} name
     *   -- https://threejs.org/docs/#Object3D.name
     */

    /**
     * @param {object} obj
     * @returns {obj is Object3D}
     */
    function isObject3D(obj) {
        return "id" in obj && "name" in obj;
    }

    /**
     * https://threejs.org/docs/#Scene
     * @typedef {object} _Scene
     * @property {(object: Object3D) => unknown} WwnMNmWw .add
     *   -- https://threejs.org/docs/#Object3D.add
     * @property {(callback: (object: Object3D) => unknown) => unknown} WwWmnN .traverse
     *   -- https://threejs.org/docs/#Object3D.traverse
     * @typedef {Object3D & _Scene} Scene
     */

    /**
     * @param {Object3D} obj
     * @param {string} name
     * @returns {obj is Scene}
     */
    function isScene(obj, name) {
        return obj.name === name && "WwnMNmWw" in obj && "WwWmnN" in obj;
    }

    /**
     * https://threejs.org/docs/#Texture
     * @typedef {object} Texture
     * @property {unknown} image
     *   -- https://threejs.org/docs/#Texture.image
     */

    /**
     * https://threejs.org/docs/#ShaderMaterial
     * @typedef {object} ShaderMaterial
     * @property {{ [key: string]: { value: unknown } }} WwWnmM .uniforms
     *   -- https://threejs.org/docs/#ShaderMaterial.uniforms
     * @property {string} wMnmWN .fragmentShader
     *   -- https://threejs.org/docs/#ShaderMaterial.fragmentShader
     */

    /**
     * https://threejs.org/docs/#MeshStandardMaterial
     * @typedef {object} _MeshStandardMaterial
     * @property {Texture | null} map
     *   -- https://threejs.org/docs/#MeshStandardMaterial.map
     * @property {boolean} wwWMW .needsUpdate
     *   -- https://threejs.org/docs/#Material.needsUpdate
     * @property {(shaderobject: ShaderMaterial) => unknown} wmwWNMn .onBeforeCompile
     *   -- https://threejs.org/docs/#Material.onBeforeCompile
     * @property {() => string} WwnWwN .customProgramCacheKey
     *   -- https://threejs.org/docs/#Material.customProgramCacheKey
     * @typedef {Object3D & _MeshStandardMaterial} MeshStandardMaterial
     */

    /**
     * https://threejs.org/docs/#Mesh
     * @typedef {Object} _Mesh
     * @property {MeshStandardMaterial} WwwNWMm .material
     *   -- https://threejs.org/docs/#Mesh.material
     * @typedef {Object3D & _Mesh} Mesh
     */

    /**
     * @param {Object3D} obj
     * @returns {obj is Mesh}
     */
    function isMesh(obj) {
        return "WwwNWMm" in obj;
    }

    /**
     * @typedef {Mesh & { name: "Head" }} PlayerMesh
     */

    /**
     * @param {Mesh} mesh
     * @returns {mesh is PlayerMesh}
     */
    function isPlayerMesh(mesh) {
        return mesh.name === "Head";
    }

    /**
     * @typedef {MeshStandardMaterial & { map: { image: HTMLCanvasElement } }} HealthMaterial
     */

    /**
     * @param {MeshStandardMaterial} material
     * @returns {material is HealthMaterial}
     */
    function isHealthMaterial(material) {
        const canvas = material.map?.image;
        const skyboxHeight = 1024;
        return canvas instanceof HTMLCanvasElement && canvas.height !== skyboxHeight;
    }

    const window_WeakMap = window.WeakMap;
    // @ts-expect-error ts(2510)
    window.WeakMap = /** @type {WeakMapConstructor} */ (class extends window_WeakMap {
        #once = false;
        /** @type {Set<Object3D["id"]>} */
        #cache = new Set();

        /**
         * @param {Parameters<typeof WeakMap.prototype.set>[0]} obj
         * @returns {this}
         */
        set(obj) {
            const callback = () => super.set.apply(this, arguments);;

            try {
                if (this.#once || !(isObject3D(obj) && isScene(obj, ""))) {
                    return callback();
                }
                this.#once = true;

                const scene = obj;
                console.log("scene", scene);

                /** @type {PlayerMesh | undefined} */
                let playerMesh = undefined;

                /**
                 * @param {Object3D} obj
                 * @returns {void}
                 */
                const traverse = (obj) => {
                    /// Skip previously seen objects to improve performance.
                    if (this.#cache.has(obj.id)) {
                        return;
                    }
                    this.#cache.add(obj.id);

                    /**
                     * note: The following process assumes that the health
                     * mesh appears after the player mesh.
                     *
                     * The player mesh is cached so it can be used as the
                     * player reference when a health mesh is detected in a
                     * subsequent iteration.
                     */

                    if (!isMesh(obj)) {
                        return;
                    }

                    if (isPlayerMesh(obj)) {
                        playerMesh = obj;
                        return;
                    }
                    const healthMat = obj.WwwNWMm;
                    if (playerMesh === undefined || !isHealthMaterial(healthMat)) {
                        return;
                    }

                    const context = healthMat.map.image.getContext("2d");
                    if (context === null) {
                        console.error("context === null");
                        return;
                    }

                    /** @type {ShaderMaterial["WwWnmM"] | undefined} */
                    let uniforms = undefined;
                    const radiance = { r: 0, g: 1, b: 0 };

                    const context_fillRect = context.fillRect;
                    context.fillRect = function (_x, _y, width, _height) {
                        const maxHealth = context.canvas.width;
                        const health = Math.max(0, Math.min(1, width / maxHealth));

                        radiance.r = 1 - health;
                        radiance.g = health;

                        if (uniforms !== undefined) {
                            // Update and reassign the uniform in case it gets
                            // removed by the game.
                            uniforms.radiance = { value: radiance };
                        }

                        return context_fillRect.apply(this, arguments);
                    };

                    /**
                     * @param {string} source
                     * @param {string} target
                     * @param {string} patch
                     * @returns {string}
                     */
                    function replace(source, target, patch) {
                        const prefix = "\n// @pseudoical\n";
                        const suffix = "\n// ===========\n";
                        const watermark = prefix + patch.trim() + suffix;
                        return source.replace(target, watermark);
                    }

                    const playerMat = playerMesh.WwwNWMm;
                    playerMat.wmwWNMn = function (shader) {
                        uniforms = shader.WwWnmM;
                        uniforms.radiance = { value: radiance };

                        const fragmentShader = shader.wMnmWN;
                        const target = "void main() {";
                        shader.wMnmWN = replace(fragmentShader, target, `
uniform vec3 radiance;
void main() {
    gl_FragColor = vec4(radiance, 1.0);
    return;
`);
                    };

                    // The game sometimes reuses shaders, so onBeforeCompile
                    // will retain the previously captured canvas context.
                    // Force a recompile so it captures the current context.
                    // .customProgramCacheKey
                    playerMat.WwnWwN = () => playerMat.id.toString();
                    // .needsUpdate
                    playerMat.wwWMW = true;
                }

                // An initial traverse does 2 things:
                //  1. It patches the first player's shader before the game
                //     can reuse its shader program for subsequent players.
                //  2. It patches the shader for players already in-game.
                scene.WwWmnN(traverse);

                // During a game, when a player joins, the game adds a scene
                // and multiple health meshes. Traverse the scene when a
                // health mesh is detected.
                const scene_add = scene.WwnMNmWw;
                scene.WwnMNmWw = function (obj) {
                    // Add the object to the scene before traversing.
                    const result = scene_add.apply(this, arguments);
                    const callback = () => result;

                    try {
                        if (!isMesh(obj)) {
                            return callback();
                        }

                        const material = obj.WwwNWMm;
                        if (isHealthMaterial(material)) {
                            scene.WwWmnN(traverse);
                        }
                    } catch { }

                    return callback();
                };
            } catch { }

            return callback();
        }
    });

    console.log("%cHealth Bar Mod by %c@pseudoical", "color: yellow;", "color: lime;");
})();
