console.log("👾 CodeOS Runner Started");


const output = document.getElementById("output");


/* =========================================================
   🚀 LOAD PROJECT FOR THIS RUN
========================================================= */

/* =========================================================
   🚀 LOAD PROJECT FOR THIS RUN
========================================================= */

const runParams =
    new URLSearchParams(
        window.location.search
    );

const runProjectID =
    runParams.get("project");

const nativeFilePath =
    runParams.get("nativeFile");

let runProject = null;


/* =========================================================
   📦 LOAD SAVED RUN PROJECT
========================================================= */

if (runProjectID) {

    try {

        runProject =
            JSON.parse(
                localStorage.getItem(
                    "codeosRunProject:" +
                    runProjectID
                ) || "null"
            );

    } catch (error) {

        console.error(
            "❌ Could not load run project:",
            error
        );

    }

}


/* =========================================================
   📁 PROJECT FILES
========================================================= */

let projectFiles =
    runProject?.files
        ? structuredClone(
            runProject.files
        )
        : JSON.parse(
            localStorage.getItem(
                "codeosFiles"
            ) || "[]"
        );


/* =========================================================
   🚀 BUILD COMPLETE CDX PROGRAM
========================================================= */

function buildCompleteCDXProgram(
    files
) {

    const cdxFiles =
        files.filter(
            file => {

                return String(
                    file.name || ""
                )
                    .toLowerCase()
                    .endsWith(".cdx");

            }
        );


    /* -----------------------------------------------------
       MAIN.CDX ALWAYS COMES FIRST
    ----------------------------------------------------- */

    cdxFiles.sort(
        (a, b) => {

            const aIsMain =
                String(a.name)
                    .toLowerCase() ===
                "main.cdx";

            const bIsMain =
                String(b.name)
                    .toLowerCase() ===
                "main.cdx";

            if (
                aIsMain &&
                !bIsMain
            ) {
                return -1;
            }

            if (
                !aIsMain &&
                bIsMain
            ) {
                return 1;
            }

            return 0;

        }
    );


    /* -----------------------------------------------------
       COMBINE EVERY CDX FILE
    ----------------------------------------------------- */

    return cdxFiles
        .map(
            file =>
                `\n\n// ===== ${file.name} =====\n` +
                String(
                    file.content || ""
                )
        )
        .join("\n");

}


/* =========================================================
   🖥️ DESKTOP NATIVE FILE FALLBACK
========================================================= */

async function loadNativeFile() {

    if (
        !nativeFilePath
    ) {
        return null;
    }


    if (
        !window.CodeOSDesktop ||
        !window.CodeOSDesktop.readAbsoluteCDX
    ) {

        console.warn(
            "⚠️ Native file requested, but CodeOSDesktop API is unavailable."
        );

        return null;

    }


    try {

        const result =
            await window.CodeOSDesktop
                .readAbsoluteCDX(
                    nativeFilePath
                );

        if (
            !result ||
            !result.success
        ) {

            console.error(
                "❌ Could not read native CDX:",
                result?.message
            );

            return null;

        }

        return {
            name:
                nativeFilePath
                    .split(/[\\/]/)
                    .pop(),

            icon:
                "📄",

            content:
                result.content,

            folder:
                null

        };

    } catch (error) {

        console.error(
            "❌ Native CDX load failed:",
            error
        );

        return null;

    }

}


/* =========================================================
   🧠 PROGRAM
========================================================= */

let code =
    buildCompleteCDXProgram(
        projectFiles
    );



/* =========================================================
   🎨 RUNNER UI
========================================================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const loadingFill =
    document.getElementById(
        "loadingFill"
    );

let variables = {};

const sprites = {};


/* =========================================================
   🖱️ CLICK + ⌨️ KEY EVENTS
========================================================= */

const clickedSprites = {};

const pressedKeys = {};

const consumedKeys = {};


function normalizeKey(
    key
) {

    key =
        key.toLowerCase();

    const keyMap = {

        " ":
            "space",

        "arrowup":
            "up",

        "arrowdown":
            "down",

        "arrowleft":
            "left",

        "arrowright":
            "right",

        "enter":
            "enter",

        "escape":
            "escape",

        "shift":
            "shift",

        "control":
            "ctrl",

        "alt":
            "alt",

        "backspace":
            "backspace",

        "tab":
            "tab"

    };

    return (
        keyMap[key] ||
        key
    );

}


document.addEventListener(
    "keydown",
    event => {

        const key =
            normalizeKey(
                event.key
            );

        if (
            !pressedKeys[key]
        ) {

            pressedKeys[key] =
                true;

            consumedKeys[key] =
                false;

        }

    }
);


document.addEventListener(
    "keyup",
    event => {

        const key =
            normalizeKey(
                event.key
            );

        pressedKeys[key] =
            false;

        consumedKeys[key] =
            false;

    }
);


if (
    runProject?.name &&
    document.title
) {

    document.title =
        runProject.name +
        " — CodeOS";

}


const functions = {};

/* =========================================================
   🚀 START RUNNER
========================================================= */
async function startRunner() {

    /* =====================================================
       💻 NATIVE DESKTOP FILE
       If Electron explicitly gave us a native CDX file,
       that file becomes the source of truth.
    ===================================================== */
    if (nativeFilePath) {

        if (
            !window.CodeOSDesktop ||
            !window.CodeOSDesktop.readAbsoluteCDX
        ) {
            loadingScreen.style.display =
                "none";

            output.style.display =
                "block";

            output.innerHTML =
                "❌ Native CDX support is unavailable.";

            return;
        }

        const nativeFile =
            await loadNativeFile();

        if (!nativeFile) {

            loadingScreen.style.display =
                "none";

            output.style.display =
                "block";

            output.innerHTML =
                "❌ Could not load the native CDX file.";

            return;
        }

        projectFiles =
            [nativeFile];

        code =
            nativeFile.content || "";
    }

    /* =====================================================
       🚨 NO CODE
    ===================================================== */
    if (
        !code ||
        !String(code).trim()
    ) {
        loadingScreen.style.display =
            "none";

        output.style.display =
            "block";

        output.innerHTML =
            "😭 No CDX program found";

        return;
    }

    /* =====================================================
       🚀 BOOT
    ===================================================== */
    await boot();
}

/* =========================================================
   🧩 CODEOS RUNNER INPUT
========================================================= */

function codeOSAsk(question, type = "text") {

    return new Promise(resolve => {

        const old =
            document.getElementById(
                "codeOSRunnerAsk"
            );

        if (old) {
            old.remove();
        }

        const overlay =
            document.createElement("div");

        overlay.id =
            "codeOSRunnerAsk";

        overlay.style.cssText = `
            position:fixed;
            inset:0;
            z-index:999999;

            display:flex;
            align-items:center;
            justify-content:center;

            background:
                rgba(0,0,0,.68);

            backdrop-filter:
                blur(14px);

            font-family:
                Inter, Arial, sans-serif;
        `;

        const box =
            document.createElement("div");

        box.style.cssText = `
            width:min(
                520px,
                calc(100vw - 40px)
            );

            padding:26px;

            border-radius:22px;

            background:
                linear-gradient(
                    145deg,
                    #191c2c,
                    #10121c
                );

            border:
                1px solid
                rgba(255,255,255,.1);

            box-shadow:
                0 30px 100px
                rgba(0,0,0,.65);

            color:white;
        `;

        const header =
            document.createElement("div");

        header.style.cssText = `
            display:flex;
            align-items:center;
            gap:12px;
            margin-bottom:12px;
        `;

        const icon =
            document.createElement("div");

        icon.textContent = "⌨️";

        icon.style.cssText = `
            width:44px;
            height:44px;
            display:flex;
            align-items:center;
            justify-content:center;

            border-radius:14px;

            background:
                linear-gradient(
                    135deg,
                    #7c5cff,
                    #36b8ff
                );

            font-size:21px;
        `;

        const title =
            document.createElement("div");

        title.textContent =
            "CodeOS Input";

        title.style.cssText = `
            font-size:20px;
            font-weight:800;
        `;

        header.append(
            icon,
            title
        );

        const message =
            document.createElement("div");

        message.textContent =
            question;

        message.style.cssText = `
            color:#abb0c4;
            line-height:1.5;
            margin-bottom:18px;
            white-space:pre-wrap;
        `;

        const input =
            document.createElement("input");

        input.type =
            type === "number"
                ? "number"
                : "text";

        input.placeholder =
            type === "boolean"
                ? "true / false"
                : "Enter your answer...";

        input.autocomplete =
            "off";

        input.style.cssText = `
            width:100%;
            box-sizing:border-box;

            padding:14px;

            border-radius:14px;

            border:
                1px solid
                rgba(255,255,255,.1);

            outline:none;

            background:
                rgba(255,255,255,.05);

            color:white;

            font-size:15px;

            margin-bottom:18px;
        `;

        const actions =
            document.createElement("div");

        actions.style.cssText = `
            display:flex;
            justify-content:flex-end;
            gap:10px;
        `;

        const cancel =
            document.createElement("button");

        cancel.textContent =
            "Cancel";

        cancel.type =
            "button";

        cancel.style.cssText = `
            border:0;
            border-radius:12px;
            padding:11px 16px;

            background:
                rgba(255,255,255,.07);

            color:#dfe2ef;

            font-weight:700;
            cursor:pointer;
        `;

        const submit =
            document.createElement("button");

        submit.textContent =
            "Continue 🚀";

        submit.type =
            "button";

        submit.style.cssText = `
            border:0;
            border-radius:12px;
            padding:11px 18px;

            background:
                linear-gradient(
                    135deg,
                    #7c5cff,
                    #36b8ff
                );

            color:white;

            font-weight:800;
            cursor:pointer;
        `;

        actions.append(
            cancel,
            submit
        );

        box.append(
            header,
            message,
            input,
            actions
        );

        overlay.appendChild(
            box
        );

        document.body.appendChild(
            overlay
        );

        function finish(value) {

            overlay.remove();

            document.removeEventListener(
                "keydown",
                handleKey
            );

            resolve(value);
        }

        function handleKey(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                finish(
                    input.value
                );

            }

            if (
                event.key === "Escape"
            ) {

                event.preventDefault();

                finish(null);

            }

        }

        submit.onclick =
            () => {
                finish(
                    input.value
                );
            };

        cancel.onclick =
            () => {
                finish(null);
            };

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {
                    finish(null);
                }

            }
        );

        document.addEventListener(
            "keydown",
            handleKey
        );

        setTimeout(
            () => {
                input.focus();
            },
            20
        );

    });

}

/* =========================================================
   🧩 CODEOS EXTENSION RUNTIME
   Extensions can add real CDX commands.
========================================================= */

const codeOSExtensionCommands = new Map();

let activeCodeOSExtension = null;


/* =========================================================
   📦 GET INSTALLED EXTENSIONS
========================================================= */

function getInstalledCodeOSExtensions() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "codeosInstalledExtensions"
            ) || "{}"
        );

    } catch (error) {

        console.error(
            "❌ Could not load CodeOS extensions:",
            error
        );

        return {};

    }

}


/* =========================================================
   🔎 TOKENIZER
   Supports:

   flip 12
   say "hello world"
   play "click.wav"
========================================================= */

function codeOSTokenize(line) {

    const tokens = [];

    const regex =
        /"([^"]*)"|'([^']*)'|(\S+)/g;

    let match;

    while (
        (match = regex.exec(line)) !== null
    ) {

        tokens.push(
            match[1] ??
            match[2] ??
            match[3]
        );

    }

    return tokens;

}


/* =========================================================
   📦 GET PROJECT ASSET
========================================================= */

function codeOSGetProjectFile(
    name
) {

    return projectFiles.find(
        file =>
            file.name === name
    ) || null;

}


/* =========================================================
   🔊 PLAY SOUND
========================================================= */

function codeOSPlaySound(
    name
) {

    if (!activeCodeOSExtension) {

        output.innerHTML +=
            "❌ No active extension.<br>";

        return;

    }

    const sounds =
        activeCodeOSExtension.assets
            ?.sounds || {};

    const sound =
        sounds[name];

    if (!sound) {

        output.innerHTML +=
            "❌ Extension sound not found: " +
            name +
            "<br>";

        return;

    }

    try {

        const audio =
            new Audio(sound);

        audio.currentTime = 0;

        audio.play().catch(
            error => {

                console.error(
                    "Sound playback failed:",
                    error
                );

            }
        );

    } catch (error) {

        console.error(
            "❌ Could not play extension sound:",
            error
        );

    }

}


/* =========================================================
   🎯 EXTENSION CONTEXT
========================================================= */

function createCodeOSExtensionContext(
    extension
) {

    return {

        extension,

        args: [],

        variables,

        files: projectFiles,

        output,

        getValue,

        getFile:
            codeOSGetProjectFile,

        playSound:
            codeOSPlaySound,

        say(value) {

            output.innerHTML +=
                String(value) +
                "<br>";

        },

        print(value) {

            output.innerHTML +=
                String(value);

        },

        setVariable(
            name,
            value
        ) {

            variables[name] =
                value;

        },

        getVariable(
            name
        ) {

            return variables[name];

        },

        resolve(
            value
        ) {

            return getValue(value);

        }

    };

}

/* =========================================================
   🧬 FULL EXTENSION RUNTIME
========================================================= */

const extensionFunctions =
    new Map();

/* ---------------------------------------------------------
   🌐 DOM API
--------------------------------------------------------- */

const domAPI = {

    document,

    window,

    create(
        tag,
        options = {},
        children = []
    ) {

        const element =
            document.createElement(
                tag
            );

        if (
            options.id
        ) {
            element.id =
                options.id;
        }

        if (
            options.className
        ) {
            element.className =
                options.className;
        }

        if (
            options.text !== undefined
        ) {
            element.textContent =
                options.text;
        }

        if (
            options.html !== undefined
        ) {
            element.innerHTML =
                options.html;
        }

        if (
            options.title !== undefined
        ) {
            element.title =
                options.title;
        }

        if (
            options.value !== undefined
        ) {
            element.value =
                options.value;
        }

        if (
            options.placeholder !== undefined
        ) {
            element.placeholder =
                options.placeholder;
        }

        if (
            options.style
        ) {

            Object.assign(
                element.style,
                options.style
            );

        }

        if (
            options.dataset
        ) {

            Object.assign(
                element.dataset,
                options.dataset
            );

        }

        if (
            options.attributes
        ) {

            Object.entries(
                options.attributes
            ).forEach(
                ([name, value]) => {

                    element.setAttribute(
                        name,
                        value
                    );

                }
            );

        }

        if (
            options.events
        ) {

            Object.entries(
                options.events
            ).forEach(
                ([event, handler]) => {

                    element.addEventListener(
                        event,
                        handler
                    );

                }
            );

        }

        const childList =
            Array.isArray(
                children
            )
                ? children
                : [children];

        childList.forEach(
            child => {

                if (
                    child instanceof Node
                ) {

                    element.appendChild(
                        child
                    );

                } else if (
                    child !==
                    null &&
                    child !==
                    undefined
                ) {

                    element.appendChild(
                        document.createTextNode(
                            String(child)
                        )
                    );

                }

            }
        );

        return element;

    },

    query(
        selector
    ) {

        return document.querySelector(
            selector
        );

    },

    queryAll(
        selector
    ) {

        return [
            ...document.querySelectorAll(
                selector
            )
        ];

    },

    append(
        parent,
        child
    ) {

        const target =
            typeof parent ===
            "string"
                ? document.querySelector(
                    parent
                )
                : parent;

        if (
            !target ||
            !child
        ) {
            return null;
        }

        target.appendChild(
            child
        );

        return child;

    },

    prepend(
        parent,
        child
    ) {

        const target =
            typeof parent ===
            "string"
                ? document.querySelector(
                    parent
                )
                : parent;

        if (
            !target ||
            !child
        ) {
            return null;
        }

        target.prepend(
            child
        );

        return child;

    },

    remove(
        target
    ) {

        const element =
            typeof target ===
            "string"
                ? document.querySelector(
                    target
                )
                : target;

        if (
            element
        ) {

            element.remove();

        }

    },

    on(
        target,
        event,
        handler,
        options
    ) {

        const element =
            typeof target ===
            "string"
                ? document.querySelector(
                    target
                )
                : target;

        if (
            !element
        ) {
            return () => {};
        }

        element.addEventListener(
            event,
            handler,
            options
        );

        return () => {

            element.removeEventListener(
                event,
                handler,
                options
            );

        };

    },

    setText(
        target,
        value
    ) {

        const element =
            typeof target ===
            "string"
                ? document.querySelector(
                    target
                )
                : target;

        if (
            element
        ) {

            element.textContent =
                String(value);

        }

    },

    setHTML(
        target,
        html
    ) {

        const element =
            typeof target ===
            "string"
                ? document.querySelector(
                    target
                )
                : target;

        if (
            element
        ) {

            element.innerHTML =
                String(html);

        }

    },

    setAttribute(
        target,
        name,
        value
    ) {

        const element =
            typeof target ===
            "string"
                ? document.querySelector(
                    target
                )
                : target;

        if (
            element
        ) {

            element.setAttribute(
                name,
                value
            );

        }

    }

};

/* ---------------------------------------------------------
   🧠 FUNCTION REGISTRY
--------------------------------------------------------- */

const functionsAPI = {

    register(
        name,
        fn
    ) {

        if (
            !name ||
            typeof fn !==
            "function"
        ) {

            throw new Error(
                "Function name and function are required."
            );

        }

        extensionFunctions.set(
            String(name),
            fn
        );

        return fn;

    },

    unregister(
        name
    ) {

        extensionFunctions.delete(
            String(name)
        );

    },

    has(
        name
    ) {

        return extensionFunctions.has(
            String(name)
        );

    },

    get(
        name
    ) {

        return extensionFunctions.get(
            String(name)
        );

    },

    async call(
        name,
        ...args
    ) {

        const fn =
            extensionFunctions.get(
                String(name)
            );

        if (
            !fn
        ) {

            throw new Error(
                `Function "${name}" is not registered.`
            );

        }

        return await fn(
            ...args
        );

    }

};

/* ---------------------------------------------------------
   🧩 COMPLETE PROJECT API
--------------------------------------------------------- */

const projectAPI = {

    get() {

        return structuredClone({

            files,

            folders,

            openTabs,

            selectedFile

        });

    },

    getFile(
        name
    ) {

        return (
            files.find(
                file =>
                    file.name ===
                    name
            ) ||
            null
        );

    },

    getFiles() {

        return structuredClone(
            files
        );

    },

    updateFile(
        name,
        content
    ) {

        return filesAPI.update(
            name,
            content
        );

    },

    createFile(
        name,
        content = "",
        options = {}
    ) {

        return filesAPI.create(
            name,
            content,
            options
        );

    },

    deleteFile(
        name
    ) {

        const index =
            files.findIndex(
                file =>
                    file.name ===
                    name
            );

        if (
            index === -1
        ) {
            return false;
        }

        files.splice(
            index,
            1
        );

        openTabs =
            openTabs
                .filter(
                    tab =>
                        tab !== index
                )
                .map(
                    tab =>
                        tab > index
                            ? tab - 1
                            : tab
                );

        if (
            files.length === 0
        ) {

            files.push({

                name:
                    "main.cdx",

                icon:
                    "📄",

                content:
                    "",

                folder:
                    null

            });

        }

        selectedFile =
            Math.min(
                selectedFile,
                files.length - 1
            );

        openTabs =
            openTabs.length
                ? openTabs
                : [selectedFile];

        renderFiles();
        renderTabs();

        editorAPI.setValue(
            files[selectedFile]
                ?.content ||
            ""
        );

        saveWorkspaceState();

        emit(
            "fileDeleted",
            name
        );

        return true;

    },

    renameFile(
        oldName,
        newName
    ) {

        const file =
            files.find(
                item =>
                    item.name ===
                    oldName
            );

        if (
            !file ||
            !newName
        ) {
            return false;
        }

        file.name =
            String(
                newName
            );

        renderFiles();
        renderTabs();

        saveWorkspaceState();

        emit(
            "fileRenamed",
            {
                oldName,
                newName
            }
        );

        return true;

    },

    moveFile(
        name,
        folder
    ) {

        const file =
            files.find(
                item =>
                    item.name ===
                    name
            );

        if (
            !file
        ) {
            return false;
        }

        file.folder =
            folder ||
            null;

        renderFiles();

        saveWorkspaceState();

        emit(
            "fileMoved",
            {
                name,
                folder
            }
        );

        return true;

    },

    openFile(
        name
    ) {

        const index =
            files.findIndex(
                file =>
                    file.name ===
                    name
            );

        if (
            index === -1
        ) {
            return false;
        }

        selectedFile =
            index;

        if (
            !openTabs.includes(
                index
            )
        ) {

            openTabs.push(
                index
            );

        }

        editor.style.display =
            "block";

        imagePreview.style.display =
            "none";

        editor.value =
            files[index]
                .content || "";

        renderFiles();
        renderTabs();

        saveWorkspaceState();

        emit(
            "fileOpened",
            files[index]
        );

        return true;

    },

    save() {

        saveWorkspaceState();

        emit(
            "workspaceSaved"
        );

    }

};

/* ---------------------------------------------------------
   🌍 GLOBAL RUNTIME
--------------------------------------------------------- */

const runtimeAPI = {

    window,

    document,

    navigator,

    location,

    localStorage,

    sessionStorage,

    setTimeout,

    clearTimeout,

    setInterval,

    clearInterval,

    requestAnimationFrame,

    cancelAnimationFrame,

    expose(
        name,
        value
    ) {

        window[
            String(name)
        ] = value;

        return value;

    },

    remove(
        name
    ) {

        delete window[
            String(name)
        ];

    }

};


/* =========================================================
   🧩 REGISTER COMMAND
========================================================= */

const CodeOS = {

    version:
        "2.0",

    extension:
        currentExtension,

    /* =====================================================
       COMMANDS
    ===================================================== */

    commands: {

        register:
            registerCommand,

        unregister:
            unregisterCommand

    },

    /* =====================================================
       UI
    ===================================================== */

    ui: {

        toast,

        addButton,

        addPanel,

        addCSS,

        setThemeVariable,

        dom:
            domAPI

    },

    /* =====================================================
       RAW DOM
    ===================================================== */

    dom:
        domAPI,

    /* =====================================================
       RUNTIME
    ===================================================== */

    runtime:
        runtimeAPI,

    /* =====================================================
       EDITOR
    ===================================================== */

    editor:
        editorAPI,

    /* =====================================================
       FILES
    ===================================================== */

    files:
        filesAPI,

    /* =====================================================
       COMPLETE PROJECT CONTROL
    ===================================================== */

    project:
        projectAPI,

    /* =====================================================
       FUNCTIONS
    ===================================================== */

    functions:
        functionsAPI,

    /* =====================================================
       WORKSPACE
    ===================================================== */

    workspace:
        workspaceAPI,

    /* =====================================================
       SNIPPETS
    ===================================================== */

    snippets: {

        add(
            name,
            code,
            options = {}
        ) {

            window
                .codeosExtensionSnippets ||= {};

            window
                .codeosExtensionSnippets[
                    name
                ] = {

                    code,

                    icon:
                        options.icon ||
                        "🧩"

                };

        },

        insert(
            name
        ) {

            const snippet =
                window
                    .codeosExtensionSnippets
                    ?.[name];

            if (
                !snippet
            ) {
                return;
            }

            editorAPI.insert(
                snippet.code
            );

        }

    },

    /* =====================================================
       EVENTS
    ===================================================== */

    events: {

        on,

        emit

    }

};

window.CodeOS =
    CodeOS;

window.CodeOS =
    CodeOS;


/* =========================================================
   🚀 LOAD INSTALLED EXTENSIONS
========================================================= */

function loadCodeOSExtensions() {

    const installed =
        getInstalledCodeOSExtensions();


    Object.values(
        installed
    ).forEach(
        extension => {

            if (
                !extension ||
                extension.enabled === false
            ) {

                return;

            }


            if (
                !extension.code
            ) {

                return;

            }


            activeCodeOSExtension =
                extension;


            try {

                const runner =
                    new Function(
                        "CodeOS",
                        "extension",
                        `
                            "use strict";

                            ${extension.code}
                        `
                    );


                runner(
                    CodeOS,
                    extension
                );


                console.log(
                    "🧩 Loaded extension:",
                    extension.name
                );

            } catch (error) {

                console.error(
                    `❌ Extension "${extension.name}" failed:`,
                    error
                );

            }

        }
    );


    activeCodeOSExtension =
        null;

}


/* =========================================================
   ▶ EXECUTE EXTENSION COMMAND
========================================================= */

async function executeCodeOSExtensionCommand(
    line
) {

    const tokens =
        codeOSTokenize(line);

    if (!tokens.length) {

        return {
            handled: false,
            value: undefined
        };

    }


    const commandName =
        tokens[0]
            .toLowerCase();


    const command =
        codeOSExtensionCommands.get(
            commandName
        );


    if (!command) {

        return {
            handled: false,
            value: undefined
        };

    }


    const context =
        createCodeOSExtensionContext(
            command.extension
        );


    context.args =
        tokens.slice(1);


    activeCodeOSExtension =
        command.extension;


    try {

        const value =
            await command.handler(
                context
            );


        return {
            handled: true,
            value
        };

    } catch (error) {

        output.innerHTML +=
            "❌ Extension command error: " +
            error.message +
            "<br>";

        console.error(
            "Extension command error:",
            error
        );

        return {
            handled: true,
            value: undefined
        };

    } finally {

        activeCodeOSExtension =
            null;

    }

}

/* =========================================================
   🛠️ CODEOS DEVTOOLS BRIDGE
   Allows the CodeOS DevTools Chrome extension to inspect
   and edit the running CodeOS project.
========================================================= */

window.CodeOSDevToolsAPI = {

    version: "1.0",

    isCodeOS: true,

    /* =====================================================
       GET PROJECT
    ===================================================== */

    getProject() {

        return {

            name:
                runProject?.name ||
                document.title ||
                "CodeOS Project",

            files:
                projectFiles.map(
                    file => ({

                        name:
                            file.name,

                        icon:
                            file.icon ||
                            "📄",

                        folder:
                            file.folder ??
                            null,

                        content:
                            file.content ||
                            "",

                        size:
                            String(
                                file.content ||
                                ""
                            ).length

                    })
                ),

            selectedFile:
                runProject?.selectedFile ??
                0,

            runId:
                runProjectID || null

        };

    },


    /* =====================================================
       GET FILE
    ===================================================== */

    getFile(name) {

        const file =
            projectFiles.find(
                item =>
                    item.name === name
            );

        if (!file) {

            return null;

        }

        return {

            name:
                file.name,

            icon:
                file.icon ||
                "📄",

            folder:
                file.folder ??
                null,

            content:
                file.content ||
                "",

            size:
                String(
                    file.content ||
                    ""
                ).length

        };

    },


    /* =====================================================
       UPDATE FILE
    ===================================================== */

    updateFile(
        name,
        content
    ) {

        if (
            typeof name !==
            "string"
        ) {

            return {

                success: false,

                message:
                    "Invalid file name."

            };

        }

        if (
            typeof content !==
            "string"
        ) {

            return {

                success: false,

                message:
                    "File content must be text."

            };

        }


        const file =
            projectFiles.find(
                item =>
                    item.name ===
                    name
            );


        if (!file) {

            return {

                success: false,

                message:
                    `File "${name}" not found.`

            };

        }


        /* =============================================
           UPDATE LIVE PROJECT FILE
        ============================================= */

        file.content =
            content;


        /* =============================================
           UPDATE RUN SNAPSHOT
        ============================================= */

        if (
            runProjectID
        ) {

            try {

                const snapshot =
                    JSON.parse(
                        localStorage.getItem(
                            "codeosRunProject:" +
                            runProjectID
                        ) || "null"
                    );


                if (
                    snapshot &&
                    Array.isArray(
                        snapshot.files
                    )
                ) {

                    const snapshotFile =
                        snapshot.files.find(
                            item =>
                                item.name ===
                                name
                        );


                    if (
                        snapshotFile
                    ) {

                        snapshotFile.content =
                            content;

                    }


                    localStorage.setItem(
                        "codeosRunProject:" +
                        runProjectID,
                        JSON.stringify(
                            snapshot
                        )
                    );

                }

            } catch (error) {

                console.error(
                    "❌ Failed updating run snapshot:",
                    error
                );

            }

        }


        /* =============================================
           UPDATE FALLBACK PROJECT STORAGE
        ============================================= */

        try {

            const storedFiles =
                JSON.parse(
                    localStorage.getItem(
                        "codeosFiles"
                    ) || "[]"
                );


            const storedFile =
                storedFiles.find(
                    item =>
                        item.name ===
                        name
                );


            if (
                storedFile
            ) {

                storedFile.content =
                    content;

                localStorage.setItem(
                    "codeosFiles",
                    JSON.stringify(
                        storedFiles
                    )
                );

            }

        } catch (error) {

            console.warn(
                "⚠️ Could not update fallback file storage:",
                error
            );

        }


        return {

            success: true,

            message:
                `Updated "${name}".`,

            file:
                this.getFile(name)

        };

    },


    /* =====================================================
       SELECT / SET CODE
    ===================================================== */

    setCurrentCode(
        code
    ) {

        code =
            String(
                code ??
                ""
            );

        const current =
            projectFiles.find(
                file =>
                    file.name
                        .toLowerCase()
                        .endsWith(".cdx")
            );

        if (!current) {

            return {

                success: false,

                message:
                    "No CDX file exists."

            };

        }

        return this.updateFile(
            current.name,
            code
        );

    }

};


/* =========================================================
   GLOBAL DEVTOOLS DETECTION
========================================================= */

console.log(
    "🛠️ CodeOS DevTools Bridge ready."
);

console.log(
    "📁 Project:",
    window.CodeOSDevToolsAPI.getProject()
);


if (!code && !nativeFilePath) {

    output.style.display = "block";

    loadingScreen.style.display = "none";

    output.innerHTML =
        "😭 No program found";

} else {

    boot();

}

async function boot(){

    loadingFill.style.width = "100%";

    await new Promise(resolve => {
        setTimeout(resolve, 2000);
    });

    /* =====================================================
       💻 LOAD REAL NATIVE CDX FILE
    ===================================================== */

    if (
        nativeFilePath &&
        window.CodeOSDesktop?.isDesktopApp
    ) {

        try {

            console.log(
                "📁 Loading native CDX:",
                nativeFilePath
            );

            const nativeFile =
                await window.CodeOSDesktop.readAbsoluteCDX(
                    nativeFilePath
                );

            if (
                nativeFile &&
                nativeFile.success
            ) {

                code =
                    nativeFile.content || "";

                console.log(
                    "✅ Native CDX loaded successfully."
                );

            } else {

                console.error(
                    "❌ Could not read native CDX file:",
                    nativeFile
                );

                loadingScreen.style.display =
                    "none";

                output.style.display =
                    "block";

                output.innerHTML =
                    "❌ Could not read the CDX file.";

                return;
            }

        } catch (error) {

            console.error(
                "❌ Could not load native CDX file:",
                error
            );

            loadingScreen.style.display =
                "none";

            output.style.display =
                "block";

            output.innerHTML =
                "❌ Could not load the CDX file.";

            return;
        }
    }

    /* =====================================================
       🚨 MAKE SURE WE ACTUALLY HAVE CODE
    ===================================================== */

    if (!code) {

        loadingScreen.style.display =
            "none";

        output.style.display =
            "block";

        output.innerHTML =
            "😭 No program found";

        return;
    }

    /* =====================================================
       ✅ FINISH BOOT
    ===================================================== */

    loadingScreen.style.display =
        "none";

    output.style.display =
        "block";

    /* =========================================
       🧩 LOAD CDX EXTENSIONS
    ========================================= */

    loadCodeOSExtensions();

    console.log(
        "🧩 Extension commands:",
        [...codeOSExtensionCommands.keys()]
    );

    run(code);
}


/* =========================================================
   🧱 CDX BLOCK HELPERS
========================================================= */

function isCDXBlockStart(line) {
    return (
        line.startsWith("if ") ||
        line.startsWith("repeat ") ||
        line.startsWith("repeat until ") ||
        line.startsWith("while ") ||
        line === "forever" ||
        line.startsWith("function ")
    );
}

/* =========================================================
   🔎 FIND MATCHING END
========================================================= */
function findMatchingEnd(lines, startIndex) {

    let depth = 1;

    for (
        let i = startIndex;
        i < lines.length;
        i++
    ) {
        const current =
            lines[i].trim();

        if (
            isCDXBlockStart(
                current
            )
        ) {
            depth++;
        }

        if (
            current === "end"
        ) {
            depth--;

            if (
                depth === 0
            ) {
                return i;
            }
        }
    }

    return -1;
}

/* =========================================================
   🧠 PARSE IF / ELSE IF / ELSE
========================================================= */
function parseIfBlock(
    lines,
    ifIndex
) {

    const firstLine =
        lines[ifIndex].trim();

    const branches = [
        {
            type: "if",
            condition:
                firstLine
                    .substring(3)
                    .trim(),
            body: []
        }
    ];

    let currentBranch =
        branches[0];

    let depth = 1;

    for (
        let i = ifIndex + 1;
        i < lines.length;
        i++
    ) {

        const current =
            lines[i].trim();

        /* ---------------------------------------------
           Nested CDX block
        --------------------------------------------- */
        if (
            isCDXBlockStart(
                current
            )
        ) {
            depth++;

            currentBranch.body.push(
                current
            );

            continue;
        }

        /* ---------------------------------------------
           Closing block
        --------------------------------------------- */
        if (
            current === "end"
        ) {
            depth--;

            if (
                depth === 0
            ) {
                return {
                    endIndex: i,
                    branches
                };
            }

            currentBranch.body.push(
                current
            );

            continue;
        }

        /* ---------------------------------------------
           ELSE IF
           Only special at this IF's own level
        --------------------------------------------- */
        if (
            depth === 1 &&
            current.startsWith(
                "else if "
            )
        ) {

            currentBranch = {
                type: "else if",
                condition:
                    current
                        .substring(8)
                        .trim(),
                body: []
            };

            branches.push(
                currentBranch
            );

            continue;
        }

        /* ---------------------------------------------
           ELSE
        --------------------------------------------- */
        if (
            depth === 1 &&
            current === "else"
        ) {

            currentBranch = {
                type: "else",
                condition: null,
                body: []
            };

            branches.push(
                currentBranch
            );

            continue;
        }

        currentBranch.body.push(
            current
        );
    }

    return {
        endIndex: -1,
        branches
    };
}

/* =========================================================
   ▶ EXECUTE IF BLOCK
========================================================= */
async function executeIfBlock(
    lines,
    ifIndex
) {

    const parsed =
        parseIfBlock(
            lines,
            ifIndex
        );

    if (
        parsed.endIndex === -1
    ) {

        output.innerHTML +=
            "❌ IF block is missing an end<br>";

        return {
            endIndex: ifIndex,
            returned: null
        };
    }

    for (
        const branch of
        parsed.branches
    ) {

        let shouldRun = false;

        if (
            branch.type === "else"
        ) {
            shouldRun = true;
        }
        else {
            shouldRun =
                checkCondition(
                    branch.condition
                );
        }

        if (!shouldRun) {
            continue;
        }

        const result =
            await run(
                branch.body.join("\n")
            );

        if (
            result &&
            result.__codeOSReturn === true
        ) {
            return {
                endIndex:
                    parsed.endIndex,
                returned:
                    result
            };
        }

        break;
    }

    return {
        endIndex:
            parsed.endIndex,
        returned:
            null
    };
}



async function run(code) {

    output.style.display =
        "block";

    let returnValue =
        null;

    let lines =
        code.split("\n");

    /* Ignore generated comments / file separators */
    lines =
        lines.map(
            line => line.trim()
        );

    // 📚 Find all functions

/* =====================================================
   📚 SCAN FUNCTIONS
===================================================== */

for (
    let i = 0;
    i < lines.length;
    i++
) {

    const line =
        lines[i].trim();

    if (
        line.startsWith(
            "function "
        )
    ) {

        const name =
            line
                .substring(9)
                .trim();

        const end =
            findMatchingEnd(
                lines,
                i + 1
            );

        if (
            end === -1
        ) {
            output.innerHTML +=
                `❌ Function "${name}" is missing an end<br>`;
            continue;
        }

        functions[name] = {
            body:
                lines.slice(
                    i + 1,
                    end
                )
        };
    }
}

let loopRunning = true;



    for(let i = 0; i < lines.length; i++){

    let line = lines[i];


        line=line.trim();


        if(line==="") continue;

        /* =====================================================
   🧩 EXTENSION COMMAND
   ===================================================== */

        // 📦 FUNCTION DEFINITION

if(line.startsWith("function ")){

    let depth = 1;

    while(
        i + 1 < lines.length &&
        depth > 0
    ){

        i++;

        const current =
            lines[i].trim();

        if(
            current.startsWith("function ") ||
            current.startsWith("if ") ||
            current.startsWith("repeat ") ||
            current.startsWith("repeat until ") ||
            current.startsWith("while ") ||
            current === "forever"
        ){

            depth++;

        }

        if(current === "end"){

            depth--;

        }

    }

    continue;
}

 // ♾️ FOREVER LOOP

if(line==="forever"){
    const start = i + 1;
    const end = findMatchingEnd(lines, start);

    if(end === -1){
        output.innerHTML +=
            "❌ FOREVER loop is missing an end<br>";
        return;
    }

    while(true){
        const result = await run(
            lines
                .slice(start, end)
                .join("\n")
        );

        /* ↩️ Propagate return through nested loops */
        if(
            result &&
            result.__codeOSReturn === true
        ){
            return result;
        }

        /* 💤 Give the browser time to breathe */
        await new Promise(resolve => {
            setTimeout(resolve, 16);
        });
    }
}

// 🧠 WHILE LOOP
if(line.startsWith("while ")){
    const start = i + 1;
    const end = findMatchingEnd(lines, start);

    if(end === -1){
        output.innerHTML +=
            "❌ WHILE loop is missing an end<br>";
        return;
    }

    const condition =
        line.substring(6).trim();

    while(checkCondition(condition)){
        const result = await run(
            lines
                .slice(start, end)
                .join("\n")
        );

        /* ↩️ Propagate return */
        if(
            result &&
            result.__codeOSReturn === true
        ){
            return result;
        }
    }

    i = end;
    continue;
}

// 🔁 REPEAT UNTIL

if(line.startsWith("repeat until ")){
    const condition =
        line
            .substring("repeat until ".length)
            .trim();

    const start = i + 1;
    const end = findMatchingEnd(lines, start);

    if(end === -1){
        output.innerHTML +=
            "❌ REPEAT UNTIL loop is missing an end<br>";
        return;
    }

    while(!checkCondition(condition)){
        const result = await run(
            lines
                .slice(start, end)
                .join("\n")
        );

        /* ↩️ Propagate return */
        if(
            result &&
            result.__codeOSReturn === true
        ){
            return result;
        }
    }

    i = end;
    continue;
}

// 🔁 REPEAT LOOP

if(line.startsWith("repeat ")){
    const amount = Number(
        line
            .substring("repeat ".length)
            .trim()
    );

    const start = i + 1;
    const end = findMatchingEnd(lines, start);

    if(end === -1){
        output.innerHTML +=
            "❌ REPEAT loop is missing an end<br>";
        return;
    }

    for(let x = 0; x < amount; x++){
        const result = await run(
            lines
                .slice(start, end)
                .join("\n")
        );

        /* ↩️ Propagate return */
        if(
            result &&
            result.__codeOSReturn === true
        ){
            return result;
        }
    }

    i = end;
    continue;
}


/* =====================================================
   🧠 IF / ELSE IF / ELSE
===================================================== */

if (
    line.startsWith("if ")
) {

    const result =
        await executeIfBlock(
            lines,
            i
        );

    if (
        result.returned &&
        result.returned.__codeOSReturn
    ) {
        return result.returned;
    }

    i =
        result.endIndex;

    continue;
}


/* =====================================================
   ↩️ RETURN
===================================================== */

if (
    line.startsWith("return ")
) {

    const value =
        line
            .substring(7)
            .trim();

    return {
        __codeOSReturn: true,
        value:
            getValue(value)
    };
}

/* =====================================================
   🧩 EXTENSION COMMAND
   Only execute extensions when this line is active.
===================================================== */

const extensionResult =
    await executeCodeOSExtensionCommand(
        line
    );

if (
    extensionResult.handled
) {

    if (
        extensionResult.value !==
            undefined &&
        extensionResult.value !==
            null
    ) {

        output.innerHTML +=
            String(
                extensionResult.value
            ) +
            "<br>";

    }

    continue;

}

if(line.startsWith("say ")){

    let text = line.substring(4);


    let parts = text.match(/"[^"]*"|\S+/g);


    let result = "";


    parts.forEach(part=>{


        if(part.startsWith('"')){

            result += part.slice(1,-1) + " ";

        }

        else if(variables[part] !== undefined){

            result += variables[part] + " ";

        }

        else{

            result += part + " ";

        }


    });


    output.innerHTML += result.trim()+"<br>";

}

// 🖼 IMAGE

else if(line.startsWith("image is ")){

    let name =
    line.substring(9)
    .replaceAll('"',"")
    .trim();


    variables.image=name;


}

// SHOW IMAGE

else if(line==="show image"){

    let img=document.createElement("img");


    img.src=variables.image;


    img.style.width="200px";


    output.appendChild(img);

}

// 💬 ASK
else if(line.startsWith("ask ")){

    let input = line.substring(4).trim();

    // Find the closing quote of the prompt
    let firstQuote = input.indexOf('"');
    let secondQuote = input.indexOf('"', firstQuote + 1);

    if(firstQuote === -1 || secondQuote === -1){

        output.innerHTML +=
            '❌ Ask syntax: ask "prompt" type [variable]<br>';

        continue;
    }

    let question =
        input.substring(
            firstQuote + 1,
            secondQuote
        );

    let options =
        input.substring(secondQuote + 1).trim();

    let parts = options.split(/\s+/);

    let type = parts[0]?.toLowerCase();
    let variableName = parts[1] || "answer";

    // Check type
    if(
        type !== "number" &&
        type !== "text" &&
        type !== "boolean"
    ){

        output.innerHTML +=
            "❌ Unknown ask type: " +
            type +
            "<br>";

        continue;
    }

    // Ask the user
    let answer =
    await codeOSAsk(
        question,
        type
    );

if(answer === null){
    answer = "";
}

    // 🔢 NUMBER
    if(type === "number"){

        let number = Number(answer);

        if(isNaN(number)){

            output.innerHTML +=
                "❌ " +
                variableName +
                " must be a number<br>";

            continue;
        }

        variables[variableName] = number;
    }

    // 📝 TEXT
    else if(type === "text"){

        variables[variableName] = answer;
    }

    // 🔘 BOOLEAN
    else if(type === "boolean"){

        let value = answer.toLowerCase();

        if(value === "true" || value === "yes"){

            variables[variableName] = true;

        }
        else if(value === "false" || value === "no"){

            variables[variableName] = false;

        }
        else{

            output.innerHTML +=
                "❌ " +
                variableName +
                " must be true/false or yes/no<br>";

            continue;
        }
    }

    console.log(
        "👾 ASK:",
        variableName,
        "=",
        variables[variableName],
        "(" + type + ")"
    );
}

// 🎲 RANDOM NUMBER

else if(line.includes(" is random ")){

    let parts = line.split(" is random ");

    let name = parts[0].trim();


    let range = parts[1].split(" to ");


    let min = Number(range[0]);

    let max = Number(range[1]);


    variables[name] =
    Math.floor(
        Math.random() * (max-min+1)
    ) + min;


}

// 🚀 DO FUNCTION
// 🚀 DO FUNCTION
else if(line.startsWith("do ")){

    let name = line.substring(3).trim();

    console.log("👾 DO:", name);

    if(!functions[name]){

        output.innerHTML +=
            "❌ Function not found: " +
            name +
            "<br>";

        continue;
    }

    let func = functions[name];

    // Run the stored function body
    await run(
        func.body.join("\n")
    );
}

// 👾 CREATE SPRITE

else if(line.startsWith("create sprite ")){

    let name = line.substring(14).trim();

    let div = document.createElement("img");

    div.style.position = "absolute";

    div.style.left = "0px";

    div.style.top = "0px";

    div.style.width = "64px";

    document.body.appendChild(div);

    sprites[name] = {

    element: div,

    x: 0,

    y: 0,

    image: ""

};

clickedSprites[name] = false;

div.addEventListener("click", () => {
    clickedSprites[name] = true;
});

}

// 🖼 PLAYER IMAGE

else if(line.includes(" image is ")){

    let parts =
        line.split(" image is ");

    let sprite =
        parts[0].trim();

    let image =
        parts[1]
            .replaceAll('"', "")
            .trim();

    if(!sprites[sprite]){
        continue;
    }

    /* =====================================================
       💻 REAL NATIVE IMAGE
    ===================================================== */

    if(
        nativeFilePath &&
        window.CodeOSDesktop?.isDesktopApp
    ){

        try{

            const nativeImage =
                await window.CodeOSDesktop.readNativeImage(
                    nativeFilePath,
                    image
                );

            if(
                nativeImage &&
                nativeImage.success
            ){

                sprites[sprite].image =
                    nativeImage.data;

                sprites[sprite].element.src =
                    nativeImage.data;

                continue;

            }

        }
        catch(error){

            console.error(
                "❌ Native image loading failed:",
                error
            );

        }

    }

    /* =====================================================
       📦 NORMAL CODEOS PROJECT IMAGE
    ===================================================== */

    const file =
        projectFiles.find(
            f => f.name === image
        );

    if(file){

        sprites[sprite].image =
            file.content;

        sprites[sprite].element.src =
            file.content;

    }
    else{

        output.innerHTML +=
            "❌ Image not found: " +
            image +
            "<br>";

    }

}

// 📍 POSITION

else if(line.includes(" x is ")){

    let parts=line.split(" x is ");

    let sprite=parts[0].trim();

    let x=Number(parts[1]);

    if(sprites[sprite]){

        sprites[sprite].x=x;

        sprites[sprite].element.style.left=x+"px";

    }

}

// 📏 SIZE

else if(line.includes(" size is ")){

    let parts = line.split(" size is ");

    let sprite = parts[0].trim();

    let size = Number(parts[1]);

    if(sprites[sprite]){

        sprites[sprite].element.style.width = size + "px";
        sprites[sprite].element.style.height = size + "px";

    }

}

// 📍 Y

else if(line.includes(" y is ")){

    let parts=line.split(" y is ");

    let sprite=parts[0].trim();

    let y=Number(parts[1]);

    if(sprites[sprite]){

        sprites[sprite].y=y;

        sprites[sprite].element.style.top=y+"px";

    }

}

// 🧮 ADVANCED MATH

else if(
    line.includes(" is ") &&
    line.includes(" multiply ")
){

    let parts = line.split(" is ");

    let name = parts[0].trim();
    let equation = parts[1].trim();

    let values = equation.split(" multiply ");

    let first = values[0].trim();
    let second = values[1].trim();

    let firstValue =
        variables[first] !== undefined
        ? variables[first]
        : Number(first);

    let secondValue =
        variables[second] !== undefined
        ? variables[second]
        : Number(second);

    variables[name] =
        Number(firstValue) * Number(secondValue);

}


else if(
    line.includes(" is ") &&
    line.includes(" divide ")
){

    let parts = line.split(" is ");

    let name = parts[0].trim();
    let equation = parts[1].trim();

    let values = equation.split(" divide ");

    let first = values[0].trim();
    let second = values[1].trim();

    let firstValue =
        variables[first] !== undefined
        ? variables[first]
        : Number(first);

    let secondValue =
        variables[second] !== undefined
        ? variables[second]
        : Number(second);

    if(Number(secondValue) === 0){

        output.innerHTML +=
            "❌ Cannot divide by zero<br>";

    }
    else{

        variables[name] =
            Number(firstValue) / Number(secondValue);

    }

}


else if(
    line.includes(" is ") &&
    line.includes(" floor ")
){

    let parts = line.split(" is ");

    let name = parts[0].trim();
    let value = parts[1]
        .replace("floor ", "")
        .trim();

    let number =
        variables[value] !== undefined
        ? variables[value]
        : Number(value);

    variables[name] =
        Math.floor(Number(number));

}


else if(
    line.includes(" is ") &&
    line.includes(" ceiling ")
){

    let parts = line.split(" is ");

    let name = parts[0].trim();
    let value = parts[1]
        .replace("ceiling ", "")
        .trim();

    let number =
        variables[value] !== undefined
        ? variables[value]
        : Number(value);

    variables[name] =
        Math.ceil(Number(number));

}


else if(
    line.includes(" is ") &&
    line.includes(" sqrt ")
){

    let parts = line.split(" is ");

    let name = parts[0].trim();
    let value = parts[1]
        .replace("sqrt ", "")
        .trim();

    let number =
        variables[value] !== undefined
        ? variables[value]
        : Number(value);

    variables[name] =
        Math.sqrt(Number(number));

}


else if(
    line.includes(" is ") &&
    line.includes(" square ")
){

    let parts = line.split(" is ");

    let name = parts[0].trim();
    let value = parts[1]
        .replace("square ", "")
        .trim();

    let number =
        variables[value] !== undefined
        ? variables[value]
        : Number(value);

    variables[name] =
        Number(number) * Number(number);

}





        // VARIABLE CREATION

        // COLOUR
else if(line.startsWith("colour is ")){

    let colour = line.substring(10).trim();

    output.style.color = colour;

}
        else if(
    line.includes(" is ")
    &&
    !line.includes(" plus ")
    &&
    !line.includes(" minus ") &&
    !line.startsWith("wait until ") &&
    !line.startsWith("repeat until ")
){


            let parts=line.split(" is ");


            let name=parts[0].trim();


            let value=parts[1].trim();

// ↩️ FUNCTION RETURN VALUE
/* =========================================
   ↩️ FUNCTION RETURN VALUE
========================================= */
if(value.startsWith("do ")){
    const functionName =
        value.substring(3).trim();

    if(!functions[functionName]){
        output.innerHTML +=
            "❌ Function not found: " +
            functionName +
            "<br>";
        continue;
    }

    const func =
        functions[functionName];

    const result =
        await run(
            func.body.join("\n")
        );

    variables[name] =
        result &&
        result.__codeOSReturn === true
            ? result.value
            : result;

    console.log(
        "👾 Function:",
        functionName,
        "returned:",
        variables[name],
        "Type:",
        typeof variables[name]
    );

    continue;
}

            if(value.startsWith('"')){

                variables[name]=value.replaceAll('"',"");

            }

            else if(!isNaN(value)){

                variables[name]=Number(value);

            }

            else{

                variables[name]=value;

            }


        }





        // MATH
        // MATH
// 🧮 MATH COMMANDS

 if(
    line.includes(" is ")
    &&
    (
        line.includes(" plus ")
        ||
        line.includes(" minus ")
    )
){

    let parts=line.split(" is ");


    let name=parts[0].trim();


    let equation=parts[1].trim();


    let operation;


    if(equation.includes(" plus ")){
        operation="plus";
    }
    else{
        operation="minus";
    }



    let values=equation.split(
        " " + operation + " "
    );


    let first=values[0].trim();

    let second=values[1].trim();



    let firstValue =
    variables[first] !== undefined
    ? variables[first]
    : Number(first);



    let secondValue =
    variables[second] !== undefined
    ? variables[second]
    : Number(second);



    if(operation==="plus"){

        variables[name] =
        Number(firstValue)+Number(secondValue);

    }


    if(operation==="minus"){

        variables[name] =
        Number(firstValue)-Number(secondValue);

    }


}

// ⏳ WAIT UNTIL

else if(line.startsWith("wait until ")){

    let condition =
        line.substring("wait until ".length).trim();

    while(!checkCondition(condition)){

        await new Promise(resolve => {
            setTimeout(resolve, 50);
        });

    }

}





        // WAIT
        else if(line.startsWith("wait for ")){

            let seconds =
            Number(
                line
                .replace("wait for ","")
                .replace(" seconds","")
            );


            await new Promise(resolve=>{

                setTimeout(resolve,seconds*1000);

            });


        }





        else{

            const extensionResult = await executeCodeOSExtensionCommand(line);

if (extensionResult.handled) {
    if (
        extensionResult.value !== undefined &&
        extensionResult.value !== null
    ) {
        output.innerHTML += String(extensionResult.value) + "<br>";
    }

    continue;
}

            output.innerHTML +=
            "❌ I don't understand: "+line+"<br>";

        }


    }


return returnValue;
}

function getValue(value){

    value = value.trim();

    // 📝 String
    if(
        value.startsWith('"') &&
        value.endsWith('"')
    ){

        return value.slice(1, -1);

    }

    // 📦 Variable
    if(
        variables[value] !== undefined
    ){

        return variables[value];

    }

    // 🔢 Number
    if(!isNaN(value)){

        return Number(value);

    }

    return value;

}


function checkCondition(condition){

    condition = condition.trim();


    // 🖱️ SPRITE CLICKED

if(condition.endsWith(" clicked")){

    let spriteName =
        condition.substring(
            0,
            condition.length - " clicked".length
        ).trim();

    if(clickedSprites[spriteName] === true){

        // Consume the click so it only triggers once
        clickedSprites[spriteName] = false;

        return true;
    }

    return false;
}


    // ⌨️ KEY PRESSED
if(condition.endsWith(" pressed")){

    let key =
        condition.substring(
            0,
            condition.length - " pressed".length
        ).trim();

    key = normalizeKey(
        key.replaceAll('"', "")
    );

    if(
        pressedKeys[key] === true &&
        consumedKeys[key] === false
    ){
        consumedKeys[key] = true;
        return true;
    }

    return false;
}


    // 🚫 NOT

    if(condition.startsWith("not ")){

        return !checkCondition(
            condition.substring(4).trim()
        );

    }


    // 🧩 AND
    if(condition.includes(" and ")){

        let parts = condition.split(" and ");

        return parts.every(part =>
            checkCondition(part)
        );

    }


    // 🔀 OR
    if(condition.includes(" or ")){

        let parts = condition.split(" or ");

        return parts.some(part =>
            checkCondition(part)
        );

    }


    // 🔎 CONTAINS
    if(condition.includes(" contains ")){

        let parts =
            condition.split(" contains ");

        let first =
            getValue(parts[0]);

        let second =
            getValue(parts[1]);

        return String(first).includes(
            String(second)
        );

    }


    // 🚫 IS NOT
    if(condition.includes(" is not ")){

        let parts =
            condition.split(" is not ");

        return getValue(parts[0]) !=
               getValue(parts[1]);

    }


    // ⬆️ GREATER THAN OR EQUAL
    if(condition.includes(" is greater than or equal to ")){

        let parts =
            condition.split(
                " is greater than or equal to "
            );

        return Number(getValue(parts[0])) >=
               Number(getValue(parts[1]));

    }


    // ⬇️ LESS THAN OR EQUAL
    if(condition.includes(" is less than or equal to ")){

        let parts =
            condition.split(
                " is less than or equal to "
            );

        return Number(getValue(parts[0])) <=
               Number(getValue(parts[1]));

    }


    // ⬆️ GREATER THAN
    if(condition.includes(" is greater than ")){

        let parts =
            condition.split(
                " is greater than "
            );

        return Number(getValue(parts[0])) >
               Number(getValue(parts[1]));

    }


    // ⬇️ LESS THAN
    if(condition.includes(" is less than ")){

        let parts =
            condition.split(
                " is less than "
            );

        return Number(getValue(parts[0])) <
               Number(getValue(parts[1]));

    }


    // 🟰 IS
    if(condition.includes(" is ")){

        let parts =
            condition.split(" is ");

        return getValue(parts[0]) ==
               getValue(parts[1]);

    }


    return false;

}

function codeosSuggestCommand(input) {

    const builtInCommands = [
        "say",
        "ask",
        "repeat",
        "repeat until",
        "forever",
        "while",
        "if",
        "else",
        "else if",
        "end",
        "wait",
        "wait until",
        "random",
        "plus",
        "minus",
        "multiply",
        "divide",
        "sqrt",
        "square",
        "floor",
        "ceiling",
        "create sprite",
        "show image",
        "image is",
        "do",
        "return"
    ];

    const extensionCommands = [...codeOSExtensionCommands.keys()];

    const commands = [
        ...builtInCommands,
        ...extensionCommands
    ];

    const firstWord = input.trim().toLowerCase().split(/\s+/)[0];

    const typoMap = {
        "repat": "repeat",
        "repeet": "repeat",
        "forevr": "forever",
        "funtion": "function",
        "functon": "function",
        "whlie": "while",
        "retrun": "return",
        "sya": "say",
        "waut": "wait",
        "askk": "ask",
        "creat": "create"
    };

    if (typoMap[firstWord]) {
        return typoMap[firstWord];
    }

    let best = null;
    let bestScore = Infinity;

    commands.forEach(command => {
        const distance = codeosLevenshtein(
            firstWord,
            command.split(" ")[0]
        );

        if (distance < bestScore) {
            bestScore = distance;
            best = command;
        }
    });

    if (bestScore <= 3) {
        return best;
    }

    return null;
}


function codeosLevenshtein(a,b){

    const matrix=[];

    for(let i=0;i<=b.length;i++){
        matrix[i]=[i];
    }

    for(let j=0;j<=a.length;j++){
        matrix[0][j]=j;
    }

    for(let i=1;i<=b.length;i++){

        for(let j=1;j<=a.length;j++){

            if(
                b.charAt(i-1) ===
                a.charAt(j-1)
            ){

                matrix[i][j] =
                    matrix[i-1][j-1];

            }
            else{

                matrix[i][j] =
                    Math.min(
                        matrix[i-1][j-1]+1,
                        matrix[i][j-1]+1,
                        matrix[i-1][j]+1
                    );

            }

        }

    }

    return matrix[b.length][a.length];

}

/* =========================================================
   🏃 CODEOS SPRITE EXTENSION API
========================================================= */

window.codeOSGetSprite = function(name) {

    if (!name) {
        return null;
    }

    return sprites[name] || null;

};


window.codeOSUpdateSprite = function(name, updates) {

    if (!name) {
        return false;
    }

    const sprite =
        sprites[name];

    if (!sprite) {
        return false;
    }


    /* ================================================
       Update the actual sprite data
    ================================================ */

    if (
        updates &&
        typeof updates === "object"
    ) {

        Object.assign(
            sprite,
            updates
        );

    }


    /* ================================================
       Update the visible DOM sprite
    ================================================ */

    const element =
        sprite.element ||
        sprite.el ||
        sprite.node ||
        null;


    if (element) {

        if (
            Number.isFinite(
                Number(sprite.x)
            )
        ) {

            element.style.left =
                `${sprite.x}px`;

        }

        if (
            Number.isFinite(
                Number(sprite.y)
            )
        ) {

            element.style.top =
                `${sprite.y}px`;

        }

        if (
            Number.isFinite(
                Number(sprite.size)
            )
        ) {

            element.style.width =
                `${sprite.size}px`;

            element.style.height =
                `${sprite.size}px`;

        }

    }


    /* ================================================
       Tell DevTools about the new state
    ================================================ */

    if (
        typeof broadcastDevToolsState ===
        "function"
    ) {

        broadcastDevToolsState();

    }


    return true;

};

/* =========================================================
   🚀 START CODEOS RUNNER
========================================================= */
startRunner();