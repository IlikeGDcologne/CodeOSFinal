console.log("👾 CodeOS Runner Started");

const output =
    document.getElementById("output");

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

function buildCompleteCDXProgram(files) {

    const cdxFiles =
        Array.isArray(files)
            ? files.filter(
                file =>
                    String(
                        file?.name || ""
                    )
                        .toLowerCase()
                        .endsWith(".cdx")
            )
            : [];

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
   🖥️ DESKTOP NATIVE FILE
========================================================= */

async function loadNativeFile() {

    if (!nativeFilePath) {
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
                result.content || "",

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

const clickedSprites = {};

const pressedKeys = {};

const consumedKeys = {};

const functions = {};

/* =========================================================
   🧠 RETURN SIGNAL
========================================================= */

function createReturnSignal(
    value
) {
    return {
        __codeOSReturn: true,
        value
    };
}

function isReturnSignal(
    value
) {
    return (
        value &&
        value.__codeOSReturn === true
    );
}

/* =========================================================
   🖱️ KEY NORMALIZER
========================================================= */

function normalizeKey(key) {

    key =
        String(
            key || ""
        ).toLowerCase();

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

/* =========================================================
   🖱️ CLICK + ⌨️ KEY EVENTS
========================================================= */

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

/* =========================================================
   🚀 START RUNNER
========================================================= */

async function startRunner() {

    /* =====================================================
       💻 NATIVE DESKTOP FILE
       Native file wins when explicitly supplied.
    ===================================================== */

    if (
        nativeFilePath
    ) {

        if (
            !window.CodeOSDesktop ||
            !window.CodeOSDesktop.readAbsoluteCDX
        ) {

            if (loadingScreen) {
                loadingScreen.style.display =
                    "none";
            }

            output.style.display =
                "block";

            output.innerHTML =
                "❌ Native CDX support is unavailable.";

            return;
        }

        const nativeFile =
            await loadNativeFile();

        if (!nativeFile) {

            if (loadingScreen) {
                loadingScreen.style.display =
                    "none";
            }

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

        if (loadingScreen) {
            loadingScreen.style.display =
                "none";
        }

        output.style.display =
            "block";

        output.innerHTML =
            "😭 No CDX program found";

        return;
    }

    await boot();
}

/* =========================================================
   🧩 CODEOS RUNNER INPUT
========================================================= */

function codeOSAsk(
    question,
    type = "text"
) {

    return new Promise(
        resolve => {

            const old =
                document.getElementById(
                    "codeOSRunnerAsk"
                );

            if (old) {
                old.remove();
            }

            const overlay =
                document.createElement(
                    "div"
                );

            overlay.id =
                "codeOSRunnerAsk";

            overlay.style.cssText = `
                position:fixed;
                inset:0;
                z-index:999999;
                display:flex;
                align-items:center;
                justify-content:center;
                background:rgba(0,0,0,.68);
                backdrop-filter:blur(14px);
                font-family:Inter,Arial,sans-serif;
            `;

            const box =
                document.createElement(
                    "div"
                );

            box.style.cssText = `
                width:min(520px,calc(100vw - 40px));
                padding:26px;
                border-radius:22px;
                background:linear-gradient(145deg,#191c2c,#10121c);
                border:1px solid rgba(255,255,255,.1);
                box-shadow:0 30px 100px rgba(0,0,0,.65);
                color:white;
            `;

            const header =
                document.createElement(
                    "div"
                );

            header.style.cssText = `
                display:flex;
                align-items:center;
                gap:12px;
                margin-bottom:12px;
            `;

            const icon =
                document.createElement(
                    "div"
                );

            icon.textContent =
                "⌨️";

            icon.style.cssText = `
                width:44px;
                height:44px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:14px;
                background:linear-gradient(135deg,#7c5cff,#36b8ff);
                font-size:21px;
            `;

            const title =
                document.createElement(
                    "div"
                );

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
                document.createElement(
                    "div"
                );

            message.textContent =
                question;

            message.style.cssText = `
                color:#abb0c4;
                line-height:1.5;
                margin-bottom:18px;
                white-space:pre-wrap;
            `;

            const input =
                document.createElement(
                    "input"
                );

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
                border:1px solid rgba(255,255,255,.1);
                outline:none;
                background:rgba(255,255,255,.05);
                color:white;
                font-size:15px;
                margin-bottom:18px;
            `;

            const actions =
                document.createElement(
                    "div"
                );

            actions.style.cssText = `
                display:flex;
                justify-content:flex-end;
                gap:10px;
            `;

            const cancel =
                document.createElement(
                    "button"
                );

            cancel.textContent =
                "Cancel";

            cancel.type =
                "button";

            cancel.style.cssText = `
                border:0;
                border-radius:12px;
                padding:11px 16px;
                background:rgba(255,255,255,.07);
                color:#dfe2ef;
                font-weight:700;
                cursor:pointer;
            `;

            const submit =
                document.createElement(
                    "button"
                );

            submit.textContent =
                "Continue 🚀";

            submit.type =
                "button";

            submit.style.cssText = `
                border:0;
                border-radius:12px;
                padding:11px 18px;
                background:linear-gradient(135deg,#7c5cff,#36b8ff);
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
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    finish(
                        input.value
                    );
                }

                if (
                    event.key ===
                    "Escape"
                ) {

                    event.preventDefault();

                    finish(
                        null
                    );
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
                    finish(
                        null
                    );
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
        }
    );
}

/* =========================================================
   🧩 CODEOS EXTENSION RUNTIME
========================================================= */

const codeOSExtensionCommands =
    new Map();

const extensionFunctions =
    new Map();

const extensionEvents =
    new Map();

let activeCodeOSExtension =
    null;

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
========================================================= */

function codeOSTokenize(
    line
) {

    const tokens = [];

    const regex =
        /"([^"]*)"|'([^']*)'|(\S+)/g;

    let match;

    while (
        (match =
            regex.exec(line)) !==
        null
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
   📦 PROJECT FILE
========================================================= */

function codeOSGetProjectFile(
    name
) {

    return (
        projectFiles.find(
            file =>
                file.name ===
                name
        ) ||
        null
    );
}

/* =========================================================
   🔊 PLAY SOUND
========================================================= */

function codeOSPlaySound(
    name
) {

    if (
        !activeCodeOSExtension
    ) {

        output.innerHTML +=
            "❌ No active extension.<br>";

        return;
    }

    const sounds =
        activeCodeOSExtension
            .assets
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

        audio.currentTime =
            0;

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
   🧩 EXTENSION COMMAND REGISTRATION
========================================================= */

function registerCommand(
    name,
    handler,
    options = {}
) {

    if (
        !name ||
        typeof handler !==
            "function"
    ) {

        throw new Error(
            "Command name and handler are required."
        );
    }

    const commandName =
        String(
            name
        ).trim().toLowerCase();

    codeOSExtensionCommands.set(
        commandName,
        {
            name:
                commandName,

            handler,

            extension:
                activeCodeOSExtension,

            options
        }
    );

    return commandName;
}

function unregisterCommand(
    name
) {

    return codeOSExtensionCommands.delete(
        String(
            name
        )
            .trim()
            .toLowerCase()
    );
}

/* =========================================================
   🔔 EVENTS
========================================================= */

function on(
    eventName,
    handler
) {

    if (
        typeof handler !==
        "function"
    ) {

        return () => {};
    }

    const name =
        String(eventName);

    if (
        !extensionEvents.has(
            name
        )
    ) {

        extensionEvents.set(
            name,
            new Set()
        );
    }

    const listeners =
        extensionEvents.get(
            name
        );

    listeners.add(
        handler
    );

    return () => {

        listeners.delete(
            handler
        );
    };
}

function emit(
    eventName,
    ...args
) {

    const listeners =
        extensionEvents.get(
            String(eventName)
        );

    if (!listeners) {
        return;
    }

    listeners.forEach(
        listener => {

            try {

                listener(
                    ...args
                );

            } catch (error) {

                console.error(
                    "❌ Extension event error:",
                    error
                );
            }
        }
    );
}

/* =========================================================
   🎨 RUNNER UI API
========================================================= */

function toast(
    message,
    options = {}
) {

    const toastElement =
        document.createElement(
            "div"
        );

    toastElement.textContent =
        String(message);

    toastElement.style.cssText = `
        position:fixed;
        right:20px;
        bottom:20px;
        z-index:999999;
        padding:12px 16px;
        border-radius:14px;
        background:rgba(20,24,40,.96);
        color:white;
        border:1px solid rgba(255,255,255,.12);
        box-shadow:0 15px 50px rgba(0,0,0,.4);
        backdrop-filter:blur(15px);
        font-family:Inter,Arial,sans-serif;
        font-weight:700;
    `;

    if (
        options.duration !== 0
    ) {

        setTimeout(
            () => {
                toastElement.remove();
            },
            Number(
                options.duration ||
                2500
            )
        );
    }

    document.body.appendChild(
        toastElement
    );

    return toastElement;
}

function addButton(
    label,
    handler,
    options = {}
) {

    const button =
        document.createElement(
            "button"
        );

    button.textContent =
        String(label);

    button.type =
        "button";

    button.style.cssText = `
        position:relative;
        margin:6px;
        padding:9px 13px;
        border:1px solid rgba(255,255,255,.1);
        border-radius:12px;
        background:rgba(255,255,255,.06);
        color:white;
        cursor:pointer;
        font-weight:700;
    `;

    if (
        options.id
    ) {
        button.id =
            options.id;
    }

    if (
        typeof handler ===
        "function"
    ) {

        button.addEventListener(
            "click",
            handler
        );
    }

    const parent =
        options.parent
            ? typeof options.parent ===
              "string"
                ? document.querySelector(
                    options.parent
                )
                : options.parent
            : document.body;

    if (parent) {
        parent.appendChild(
            button
        );
    }

    return button;
}

function addPanel(
    titleOrOptions,
    content = ""
) {

    let title =
        titleOrOptions;

    let options = {};

    if (
        typeof titleOrOptions ===
        "object"
    ) {

        options =
            titleOrOptions || {};

        title =
            options.title ||
            "CodeOS Panel";

        content =
            options.content ||
            "";
    }

    const panel =
        document.createElement(
            "section"
        );

    panel.style.cssText = `
        position:relative;
        margin:12px 0;
        padding:16px;
        border-radius:18px;
        background:rgba(255,255,255,.04);
        border:1px solid rgba(255,255,255,.08);
        color:white;
        font-family:Inter,Arial,sans-serif;
    `;

    const heading =
        document.createElement(
            "h3"
        );

    heading.textContent =
        String(title);

    heading.style.margin =
        "0 0 10px";

    const body =
        document.createElement(
            "div"
        );

    body.innerHTML =
        String(content);

    panel.append(
        heading,
        body
    );

    const parent =
        options.parent
            ? typeof options.parent ===
              "string"
                ? document.querySelector(
                    options.parent
                )
                : options.parent
            : document.body;

    if (parent) {
        parent.appendChild(
            panel
        );
    }

    return panel;
}

function addCSS(
    css,
    id
) {

    const style =
        document.createElement(
            "style"
        );

    if (id) {
        style.id =
            String(id);
    }

    style.textContent =
        String(css);

    document.head.appendChild(
        style
    );

    return style;
}

function setThemeVariable(
    name,
    value
) {

    document.documentElement
        .style
        .setProperty(
            String(name),
            String(value)
        );
}

/* =========================================================
   🌐 DOM API
========================================================= */

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
            options.text !==
            undefined
        ) {
            element.textContent =
                options.text;
        }

        if (
            options.html !==
            undefined
        ) {
            element.innerHTML =
                options.html;
        }

        if (
            options.title !==
            undefined
        ) {
            element.title =
                options.title;
        }

        if (
            options.value !==
            undefined
        ) {
            element.value =
                options.value;
        }

        if (
            options.placeholder !==
            undefined
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

                    if (
                        typeof handler ===
                        "function"
                    ) {

                        element.addEventListener(
                            event,
                            handler
                        );
                    }
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
                    child !== null &&
                    child !== undefined
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

        if (element) {
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

        if (element) {
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

        if (element) {
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

        if (element) {

            element.setAttribute(
                name,
                value
            );
        }
    }
};

/* =========================================================
   🧠 FUNCTION REGISTRY
========================================================= */

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

        return extensionFunctions.delete(
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

        if (!fn) {

            throw new Error(
                `Function "${name}" is not registered.`
            );
        }

        return await fn(
            ...args
        );
    }
};

/* =========================================================
   📝 RUNNER EDITOR API
========================================================= */

const editorAPI = {

    getValue() {
        return String(
            code || ""
        );
    },

    setValue(value) {

        code =
            String(
                value ?? ""
            );

        return code;
    },

    insert(text) {

        code +=
            String(
                text ?? ""
            );

        return code;
    },

    replaceSelection(text) {

        code =
            String(
                text ?? ""
            );

        return code;
    }
};

/* =========================================================
   📁 RUNNER FILE API
========================================================= */

function saveRunnerFiles() {

    try {

        localStorage.setItem(
            "codeosFiles",
            JSON.stringify(
                projectFiles
            )
        );

    } catch (error) {

        console.warn(
            "⚠️ Could not save runner files:",
            error
        );
    }

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
                snapshot
            ) {

                snapshot.files =
                    structuredClone(
                        projectFiles
                    );

                localStorage.setItem(
                    "codeosRunProject:" +
                    runProjectID,
                    JSON.stringify(
                        snapshot
                    )
                );
            }

        } catch (error) {

            console.warn(
                "⚠️ Could not update run snapshot:",
                error
            );
        }
    }
}

const filesAPI = {

    getFiles() {

        return structuredClone(
            projectFiles
        );
    },

    getCurrentFile() {

        return (
            projectFiles[0] ||
            null
        );
    },

    read(
        name
    ) {

        const file =
            projectFiles.find(
                item =>
                    item.name ===
                    name
            );

        return file
            ? String(
                file.content ||
                ""
            )
            : null;
    },

    create(
        name,
        content = "",
        options = {}
    ) {

        if (!name) {
            return {
                success: false,
                message:
                    "File name is required."
            };
        }

        if (
            projectFiles.some(
                file =>
                    file.name ===
                    name
            )
        ) {

            return {
                success: false,
                message:
                    `File "${name}" already exists.`
            };
        }

        const file = {

            name:
                String(name),

            icon:
                options.icon ||
                "📄",

            folder:
                options.folder ??
                null,

            content:
                String(
                    content ??
                    ""
                )
        };

        projectFiles.push(
            file
        );

        saveRunnerFiles();

        emit(
            "fileCreated",
            file
        );

        return {
            success: true,
            file:
                structuredClone(
                    file
                )
        };
    },

    update(
        name,
        content
    ) {

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

        file.content =
            String(
                content ??
                ""
            );

        saveRunnerFiles();

        emit(
            "fileUpdated",
            file
        );

        return {
            success: true,
            message:
                `Updated "${name}".`
        };
    },

    delete(
        name
    ) {

        const index =
            projectFiles.findIndex(
                item =>
                    item.name ===
                    name
            );

        if (
            index === -1
        ) {
            return false;
        }

        projectFiles.splice(
            index,
            1
        );

        saveRunnerFiles();

        emit(
            "fileDeleted",
            name
        );

        return true;
    }
};

/* =========================================================
   🧩 COMPLETE PROJECT API
========================================================= */

const projectAPI = {

    get() {

        return structuredClone({

            name:
                runProject?.name ||
                document.title ||
                "CodeOS Project",

            files:
                projectFiles,

            runId:
                runProjectID ||
                null
        });
    },

    getFile(
        name
    ) {

        return (
            projectFiles.find(
                file =>
                    file.name ===
                    name
            ) ||
            null
        );
    },

    getFiles() {

        return structuredClone(
            projectFiles
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

        return filesAPI.delete(
            name
        );
    },

    renameFile(
        oldName,
        newName
    ) {

        const file =
            projectFiles.find(
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

        if (
            projectFiles.some(
                item =>
                    item !== file &&
                    item.name ===
                    newName
            )
        ) {
            return false;
        }

        file.name =
            String(
                newName
            );

        saveRunnerFiles();

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
            projectFiles.find(
                item =>
                    item.name ===
                    name
            );

        if (!file) {
            return false;
        }

        file.folder =
            folder ||
            null;

        saveRunnerFiles();

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

        const file =
            projectFiles.find(
                item =>
                    item.name ===
                    name
            );

        return !!file;
    },

    save() {

        saveRunnerFiles();

        emit(
            "workspaceSaved"
        );

        return true;
    },

    setCurrentCode(
        newCode
    ) {

        const current =
            projectFiles.find(
                file =>
                    String(
                        file.name ||
                        ""
                    )
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

        return filesAPI.update(
            current.name,
            String(
                newCode ??
                ""
            )
        );
    }
};

/* =========================================================
   🌍 GLOBAL RUNTIME
========================================================= */

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
        ] =
            value;

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
   🧩 CODEOS API
========================================================= */

const CodeOS = {

    version:
        "2.0",

    /*
       IMPORTANT:
       There is NO currentExtension variable here.
       The active extension is supplied separately.
    */
    extension:
        null,

    commands: {

        register:
            registerCommand,

        unregister:
            unregisterCommand
    },

    ui: {

        toast,

        addButton,

        addPanel,

        addCSS,

        setThemeVariable,

        dom:
            domAPI
    },

    dom:
        domAPI,

    runtime:
        runtimeAPI,

    editor:
        editorAPI,

    files:
        filesAPI,

    project:
        projectAPI,

    functions:
        functionsAPI,

    workspace: {

        getFiles() {
            return structuredClone(
                projectFiles
            );
        },

        getFolders() {
            return [];
        },

        getCurrentFile() {
            return (
                projectFiles[0] ||
                null
            );
        },

        getWorkspaceState() {

            return {
                files:
                    structuredClone(
                        projectFiles
                    ),

                folders: [],

                selectedFile:
                    0
            };
        },

        save() {

            return projectAPI.save();
        }
    },

    snippets: {

        add(
            name,
            snippetCode,
            options = {}
        ) {

            window
                .codeosExtensionSnippets
                ||=
                {};

            window
                .codeosExtensionSnippets[
                    name
                ] = {

                    code:
                        snippetCode,

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

            if (!snippet) {
                return;
            }

            editorAPI.insert(
                snippet.code
            );
        }
    },

    events: {

        on,

        emit
    }
};

window.CodeOS =
    CodeOS;

/* =========================================================
   🧩 LOAD INSTALLED EXTENSIONS
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
                extension.enabled ===
                    false
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
        codeOSTokenize(
            line
        );

    if (
        !tokens.length
    ) {

        return {
            handled: false,
            value:
                undefined
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
            value:
                undefined
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
            value:
                undefined
        };

    } finally {

        activeCodeOSExtension =
            null;
    }
}

/* =========================================================
   🛠️ CODEOS DEVTOOLS BRIDGE
========================================================= */

window.CodeOSDevToolsAPI = {

    version:
        "1.0",

    isCodeOS:
        true,

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
                runProjectID ||
                null
        };
    },

    getFile(
        name
    ) {

        const file =
            projectFiles.find(
                item =>
                    item.name ===
                    name
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

    updateFile(
        name,
        content
    ) {

        return filesAPI.update(
            name,
            content
        );
    },

    setCurrentCode(
        newCode
    ) {

        return projectAPI.setCurrentCode(
            newCode
        );
    }
};

/* =========================================================
   🧱 CDX BLOCK HELPERS
========================================================= */

function isCDXBlockStart(
    line
) {

    return (

        line.startsWith(
            "if "
        ) ||

        line.startsWith(
            "repeat "
        ) ||

        line.startsWith(
            "while "
        ) ||

        line.startsWith(
            "repeat until "
        ) ||

        line ===
            "forever" ||

        line.startsWith(
            "function "
        )
    );
}

/* =========================================================
   🔎 FIND MATCHING END
========================================================= */

function findMatchingEnd(
    lines,
    startIndex
) {

    let depth =
        1;

    for (
        let i =
            startIndex;
        i <
        lines.length;
        i++
    ) {

        const current =
            lines[i]
                .trim();

        if (
            isCDXBlockStart(
                current
            )
        ) {

            depth++;
        }

        if (
            current ===
            "end"
        ) {

            depth--;

            if (
                depth ===
                0
            ) {

                return i;
            }
        }
    }

    return -1;
}

/* =========================================================
   🧠 PARSE IF BLOCK
========================================================= */

function parseIfBlock(
    lines,
    ifIndex
) {

    const firstLine =
        lines[ifIndex]
            .trim();

    const branches = [

        {
            type:
                "if",

            condition:
                firstLine
                    .substring(3)
                    .trim(),

            body: []
        }
    ];

    let currentBranch =
        branches[0];

    let depth =
        1;

    for (
        let i =
            ifIndex + 1;
        i <
        lines.length;
        i++
    ) {

        const current =
            lines[i]
                .trim();

        /* Nested block */
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

        /* End */
        if (
            current ===
            "end"
        ) {

            depth--;

            if (
                depth ===
                0
            ) {

                return {

                    endIndex:
                        i,

                    branches
                };
            }

            currentBranch.body.push(
                current
            );

            continue;
        }

        /* ELSE IF */
        if (
            depth ===
                1 &&
            current.startsWith(
                "else if "
            )
        ) {

            currentBranch = {

                type:
                    "else if",

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

        /* ELSE */
        if (
            depth ===
                1 &&
            current ===
                "else"
        ) {

            currentBranch = {

                type:
                    "else",

                condition:
                    null,

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

        endIndex:
            -1,

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
        parsed.endIndex ===
        -1
    ) {

        output.innerHTML +=
            "❌ IF block is missing an end<br>";

        return {

            endIndex:
                ifIndex,

            returned:
                null
        };
    }

    for (
        const branch of
        parsed.branches
    ) {

        let shouldRun =
            false;

        if (
            branch.type ===
            "else"
        ) {

            shouldRun =
                true;

        } else {

            shouldRun =
                checkCondition(
                    branch.condition
                );
        }

        if (
            !shouldRun
        ) {

            continue;
        }

        const result =
            await run(
                branch.body
                    .join("\n")
            );

        if (
            isReturnSignal(
                result
            )
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

/* =========================================================
   🧮 VALUE RESOLVER
========================================================= */

function getValue(
    value
) {

    value =
        String(
            value ??
            ""
        ).trim();

    /* String */
    if (
        value.startsWith('"') &&
        value.endsWith('"')
    ) {

        return value.slice(
            1,
            -1
        );
    }

    if (
        value.startsWith("'") &&
        value.endsWith("'")
    ) {

        return value.slice(
            1,
            -1
        );
    }

    /* Boolean */
    if (
        value ===
        "true"
    ) {

        return true;
    }

    if (
        value ===
        "false"
    ) {

        return false;
    }

    /* Variable */
    if (
        variables[value] !==
        undefined
    ) {

        return variables[value];
    }

    /* Number */
    if (
        value !== "" &&
        !isNaN(value)
    ) {

        return Number(
            value
        );
    }

    /* Literal text */
    return value;
}

/* =========================================================
   🧠 CONDITION ENGINE
========================================================= */

function checkCondition(
    condition
) {

    condition =
        String(
            condition ??
            ""
        ).trim();

    /* CLICKED */
    if (
        condition.endsWith(
            " clicked"
        )
    ) {

        const spriteName =
            condition
                .substring(
                    0,
                    condition.length -
                    " clicked".length
                )
                .trim();

        if (
            clickedSprites[
                spriteName
            ] === true
        ) {

            clickedSprites[
                spriteName
            ] = false;

            return true;
        }

        return false;
    }

    /* KEY PRESSED */
    if (
        condition.endsWith(
            " pressed"
        )
    ) {

        let key =
            condition
                .substring(
                    0,
                    condition.length -
                    " pressed".length
                )
                .trim();

        key =
            normalizeKey(
                key.replaceAll(
                    '"',
                    ""
                )
            );

        if (
            pressedKeys[key] ===
                true &&
            consumedKeys[key] ===
                false
        ) {

            consumedKeys[key] =
                true;

            return true;
        }

        return false;
    }

    /* NOT */
    if (
        condition.startsWith(
            "not "
        )
    ) {

        return !checkCondition(
            condition.substring(
                4
            )
        );
    }

    /* AND */
    if (
        condition.includes(
            " and "
        )
    ) {

        return condition
            .split(" and ")
            .every(
                part =>
                    checkCondition(
                        part
                    )
            );
    }

    /* OR */
    if (
        condition.includes(
            " or "
        )
    ) {

        return condition
            .split(" or ")
            .some(
                part =>
                    checkCondition(
                        part
                    )
            );
    }

    /* CONTAINS */
    if (
        condition.includes(
            " contains "
        )
    ) {

        const parts =
            condition.split(
                " contains "
            );

        return String(
            getValue(
                parts[0]
            )
        ).includes(
            String(
                getValue(
                    parts[1]
                )
            )
        );
    }

    /* IS NOT */
    if (
        condition.includes(
            " is not "
        )
    ) {

        const parts =
            condition.split(
                " is not "
            );

        return (
            getValue(
                parts[0]
            ) !=
            getValue(
                parts[1]
            )
        );
    }

    /* GREATER THAN OR EQUAL */
    if (
        condition.includes(
            " is greater than or equal to "
        )
    ) {

        const parts =
            condition.split(
                " is greater than or equal to "
            );

        return (
            Number(
                getValue(
                    parts[0]
                )
            ) >=
            Number(
                getValue(
                    parts[1]
                )
            )
        );
    }

    /* LESS THAN OR EQUAL */
    if (
        condition.includes(
            " is less than or equal to "
        )
    ) {

        const parts =
            condition.split(
                " is less than or equal to "
            );

        return (
            Number(
                getValue(
                    parts[0]
                )
            ) <=
            Number(
                getValue(
                    parts[1]
                )
            )
        );
    }

    /* GREATER THAN */
    if (
        condition.includes(
            " is greater than "
        )
    ) {

        const parts =
            condition.split(
                " is greater than "
            );

        return (
            Number(
                getValue(
                    parts[0]
                )
            ) >
            Number(
                getValue(
                    parts[1]
                )
            )
        );
    }

    /* LESS THAN */
    if (
        condition.includes(
            " is less than "
        )
    ) {

        const parts =
            condition.split(
                " is less than "
            );

        return (
            Number(
                getValue(
                    parts[0]
                )
            ) <
            Number(
                getValue(
                    parts[1]
                )
            )
        );
    }

    /* IS */
    if (
        condition.includes(
            " is "
        )
    ) {

        const parts =
            condition.split(
                " is "
            );

        return (
            getValue(
                parts[0]
            ) ==
            getValue(
                parts[1]
            )
        );
    }

    return false;
}

/* =========================================================
   ▶ MAIN CDX INTERPRETER
========================================================= */

async function run(
    codeToRun
) {

    output.style.display =
        "block";

    let lines =
        String(
            codeToRun ??
            ""
        )
        .split("\n");

    /*
       Trim every line HERE.
       This is why you don't need some random
       "line = line.trim()" instruction elsewhere.
    */
    lines =
        lines.map(
            line =>
                line.trim()
        );

    /* =====================================================
       📚 SCAN ALL FUNCTIONS FIRST
    ===================================================== */

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];

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
                end ===
                -1
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

    /* =====================================================
       ▶ EXECUTE PROGRAM
    ===================================================== */

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];

        /* Empty lines + generated file comments */
        if (
            line === "" ||
            line.startsWith(
                "//"
            )
        ) {

            continue;
        }

        /* =================================================
           📦 FUNCTION DEFINITION
        ================================================= */

        if (
            line.startsWith(
                "function "
            )
        ) {

            const end =
                findMatchingEnd(
                    lines,
                    i + 1
                );

            if (
                end ===
                -1
            ) {

                output.innerHTML +=
                    "❌ Function is missing an end<br>";

                return null;
            }

            i =
                end;

            continue;
        }

        /* =================================================
           ♾️ FOREVER
        ================================================= */

        if (
            line ===
            "forever"
        ) {

            const start =
                i + 1;

            const end =
                findMatchingEnd(
                    lines,
                    start
                );

            if (
                end ===
                -1
            ) {

                output.innerHTML +=
                    "❌ FOREVER loop is missing an end<br>";

                return null;
            }

            while (true) {

                const result =
                    await run(
                        lines
                            .slice(
                                start,
                                end
                            )
                            .join("\n")
                    );

                if (
                    isReturnSignal(
                        result
                    )
                ) {

                    return result;
                }

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            16
                        )
                );
            }
        }

        /* =================================================
           🔁 WHILE
        ================================================= */

        if (
            line.startsWith(
                "while "
            )
        ) {

            const start =
                i + 1;

            const end =
                findMatchingEnd(
                    lines,
                    start
                );

            if (
                end ===
                -1
            ) {

                output.innerHTML +=
                    "❌ WHILE loop is missing an end<br>";

                return null;
            }

            const condition =
                line
                    .substring(6)
                    .trim();

            while (
                checkCondition(
                    condition
                )
            ) {

                const result =
                    await run(
                        lines
                            .slice(
                                start,
                                end
                            )
                            .join("\n")
                    );

                if (
                    isReturnSignal(
                        result
                    )
                ) {

                    return result;
                }
            }

            i =
                end;

            continue;
        }

        /* =================================================
           🔁 REPEAT UNTIL
        ================================================= */

        if (
            line.startsWith(
                "repeat until "
            )
        ) {

            const condition =
                line
                    .substring(
                        "repeat until "
                            .length
                    )
                    .trim();

            const start =
                i + 1;

            const end =
                findMatchingEnd(
                    lines,
                    start
                );

            if (
                end ===
                -1
            ) {

                output.innerHTML +=
                    "❌ REPEAT UNTIL loop is missing an end<br>";

                return null;
            }

            while (
                !checkCondition(
                    condition
                )
            ) {

                const result =
                    await run(
                        lines
                            .slice(
                                start,
                                end
                            )
                            .join("\n")
                    );

                if (
                    isReturnSignal(
                        result
                    )
                ) {

                    return result;
                }
            }

            i =
                end;

            continue;
        }

        /* =================================================
           🔁 REPEAT
        ================================================= */

        if (
            line.startsWith(
                "repeat "
            )
        ) {

            const amount =
                Number(
                    getValue(
                        line
                            .substring(7)
                            .trim()
                    )
                );

            const start =
                i + 1;

            const end =
                findMatchingEnd(
                    lines,
                    start
                );

            if (
                end ===
                -1
            ) {

                output.innerHTML +=
                    "❌ REPEAT loop is missing an end<br>";

                return null;
            }

            for (
                let x = 0;
                x < amount;
                x++
            ) {

                const result =
                    await run(
                        lines
                            .slice(
                                start,
                                end
                            )
                            .join("\n")
                    );

                if (
                    isReturnSignal(
                        result
                    )
                ) {

                    return result;
                }
            }

            i =
                end;

            continue;
        }

        /* =================================================
           🧠 IF / ELSE IF / ELSE
        ================================================= */

        if (
            line.startsWith(
                "if "
            )
        ) {

            const result =
                await executeIfBlock(
                    lines,
                    i
                );

            if (
                result.returned
            ) {

                return result.returned;
            }

            i =
                result.endIndex;

            continue;
        }

        /* =================================================
           ↩️ RETURN
        ================================================= */

        if (
            line ===
            "return"
        ) {

            return createReturnSignal(
                null
            );
        }

        if (
            line.startsWith(
                "return "
            )
        ) {

            const value =
                line
                    .substring(7)
                    .trim();

            return createReturnSignal(
                getValue(
                    value
                )
            );
        }

        /* =================================================
           🧩 EXTENSION COMMAND
        ================================================= */

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

        /* =================================================
           📣 SAY
        ================================================= */

        if (
            line.startsWith(
                "say "
            ) ||
            (
                line.startsWith(
                    "say("
                ) &&
                line.endsWith(
                    ")"
                )
            )
        ) {

            let text;

            if (
                line.startsWith(
                    "say("
                )
            ) {

                text =
                    line.substring(
                        4,
                        line.length - 1
                    );

            } else {

                text =
                    line.substring(4);
            }

            const parts =
                text.match(
                    /"[^"]*"|'[^']*'|\S+/g
                ) || [];

            let result =
                "";

            parts.forEach(
                part => {

                    result +=
                        String(
                            getValue(
                                part
                            )
                        ) +
                        " ";
                }
            );

            output.innerHTML +=
                result.trim() +
                "<br>";

            continue;
        }

        /* =================================================
           💬 ASK
        ================================================= */

        if (
            line.startsWith(
                "ask "
            )
        ) {

            const input =
                line
                    .substring(4)
                    .trim();

            const firstQuote =
                input.indexOf(
                    '"'
                );

            const secondQuote =
                input.indexOf(
                    '"',
                    firstQuote + 1
                );

            if (
                firstQuote ===
                    -1 ||
                secondQuote ===
                    -1
            ) {

                output.innerHTML +=
                    '❌ Ask syntax: ask "prompt" type [variable]<br>';

                continue;
            }

            const question =
                input.substring(
                    firstQuote + 1,
                    secondQuote
                );

            const options =
                input
                    .substring(
                        secondQuote + 1
                    )
                    .trim();

            const parts =
                options.split(
                    /\s+/
                );

            const type =
                (
                    parts[0] ||
                    ""
                ).toLowerCase();

            const variableName =
                parts[1] ||
                "answer";

            if (
                type !==
                    "number" &&
                type !==
                    "text" &&
                type !==
                    "boolean"
            ) {

                output.innerHTML +=
                    "❌ Unknown ask type: " +
                    type +
                    "<br>";

                continue;
            }

            let answer =
                await codeOSAsk(
                    question,
                    type
                );

            if (
                answer ===
                null
            ) {

                answer =
                    "";
            }

            if (
                type ===
                "number"
            ) {

                const number =
                    Number(
                        answer
                    );

                if (
                    isNaN(
                        number
                    )
                ) {

                    output.innerHTML +=
                        "❌ " +
                        variableName +
                        " must be a number<br>";

                    continue;
                }

                variables[
                    variableName
                ] =
                    number;

            } else if (
                type ===
                "text"
            ) {

                variables[
                    variableName
                ] =
                    answer;

            } else {

                const value =
                    String(
                        answer
                    ).toLowerCase();

                if (
                    value ===
                        "true" ||
                    value ===
                        "yes"
                ) {

                    variables[
                        variableName
                    ] =
                        true;

                } else if (
                    value ===
                        "false" ||
                    value ===
                        "no"
                ) {

                    variables[
                        variableName
                    ] =
                        false;

                } else {

                    output.innerHTML +=
                        "❌ " +
                        variableName +
                        " must be true/false or yes/no<br>";

                    continue;
                }
            }

            continue;
        }

        /* =================================================
           🎲 RANDOM
        ================================================= */

        if (
            line.includes(
                " is random "
            )
        ) {

            const parts =
                line.split(
                    " is random "
                );

            const name =
                parts[0].trim();

            const range =
                (
                    parts[1] ||
                    ""
                ).split(
                    " to "
                );

            const min =
                Number(
                    getValue(
                        range[0]
                    )
                );

            const max =
                Number(
                    getValue(
                        range[1]
                    )
                );

            variables[name] =
                Math.floor(
                    Math.random() *
                    (
                        max -
                        min +
                        1
                    )
                ) +
                min;

            continue;
        }

        /* =================================================
           🚀 DO FUNCTION
        ================================================= */

        if (
            line.startsWith(
                "do "
            )
        ) {

            const functionName =
                line
                    .substring(3)
                    .trim();

            if (
                !functions[
                    functionName
                ]
            ) {

                output.innerHTML +=
                    "❌ Function not found: " +
                    functionName +
                    "<br>";

                continue;
            }

            const result =
                await run(
                    functions[
                        functionName
                    ]
                    .body
                    .join("\n")
                );

            /*
               A normal `do function`
               ignores the returned value,
               but still stops that function.
            */

            if (
                isReturnSignal(
                    result
                )
            ) {
                continue;
            }

            continue;
        }

        /* =================================================
           👾 SPRITE CREATE
        ================================================= */

        if (
            line.startsWith(
                "create sprite "
            )
        ) {

            const name =
                line
                    .substring(14)
                    .trim();

            const div =
                document.createElement(
                    "img"
                );

            div.style.position =
                "absolute";

            div.style.left =
                "0px";

            div.style.top =
                "0px";

            div.style.width =
                "64px";

            div.style.height =
                "64px";

            div.alt =
                name;

            document.body.appendChild(
                div
            );

            sprites[name] = {

                element:
                    div,

                x:
                    0,

                y:
                    0,

                size:
                    64,

                image:
                    ""
            };

            clickedSprites[
                name
            ] =
                false;

            div.addEventListener(
                "click",
                () => {

                    clickedSprites[
                        name
                    ] =
                        true;
                }
            );

            continue;
        }

        /* =================================================
           🖼 IMAGE VARIABLE
        ================================================= */

        if (
            line.startsWith(
                "image is "
            )
        ) {

            const name =
                line
                    .substring(9)
                    .replaceAll(
                        '"',
                        ""
                    )
                    .replaceAll(
                        "'",
                        ""
                    )
                    .trim();

            variables.image =
                name;

            continue;
        }

        /* =================================================
           🖼 SHOW IMAGE
        ================================================= */

        if (
            line ===
            "show image"
        ) {

            const img =
                document.createElement(
                    "img"
                );

            img.src =
                variables.image ||
                "";

            img.style.width =
                "200px";

            img.style.maxWidth =
                "100%";

            output.appendChild(
                img
            );

            continue;
        }

        /* =================================================
           🖼 SPRITE IMAGE
        ================================================= */

        if (
            line.includes(
                " image is "
            )
        ) {

            const parts =
                line.split(
                    " image is "
                );

            const sprite =
                parts[0].trim();

            const image =
                (
                    parts[1] ||
                    ""
                )
                .replaceAll(
                    '"',
                    ""
                )
                .replaceAll(
                    "'",
                    ""
                )
                .trim();

            if (
                !sprites[sprite]
            ) {

                continue;
            }

            /* Native image */
            if (
                nativeFilePath &&
                window.CodeOSDesktop
                    ?.isDesktopApp
            ) {

                try {

                    const nativeImage =
                        await window.CodeOSDesktop
                            .readNativeImage(
                                nativeFilePath,
                                image
                            );

                    if (
                        nativeImage &&
                        nativeImage.success
                    ) {

                        sprites[
                            sprite
                        ].image =
                            nativeImage.data;

                        sprites[
                            sprite
                        ].element.src =
                            nativeImage.data;

                        continue;
                    }

                } catch (error) {

                    console.error(
                        "❌ Native image loading failed:",
                        error
                    );
                }
            }

            /* Normal project image */
            const file =
                projectFiles.find(
                    f =>
                        f.name ===
                        image
                );

            if (file) {

                sprites[
                    sprite
                ].image =
                    file.content;

                sprites[
                    sprite
                ].element.src =
                    file.content;

            } else {

                output.innerHTML +=
                    "❌ Image not found: " +
                    image +
                    "<br>";
            }

            continue;
        }

        /* =================================================
           📍 SPRITE X
        ================================================= */

        if (
            line.includes(
                " x is "
            )
        ) {

            const parts =
                line.split(
                    " x is "
                );

            const sprite =
                parts[0].trim();

            const x =
                Number(
                    getValue(
                        parts[1]
                    )
                );

            if (
                sprites[sprite]
            ) {

                sprites[
                    sprite
                ].x =
                    x;

                sprites[
                    sprite
                ].element.style.left =
                    x + "px";
            }

            continue;
        }

        /* =================================================
           📍 SPRITE Y
        ================================================= */

        if (
            line.includes(
                " y is "
            )
        ) {

            const parts =
                line.split(
                    " y is "
                );

            const sprite =
                parts[0].trim();

            const y =
                Number(
                    getValue(
                        parts[1]
                    )
                );

            if (
                sprites[sprite]
            ) {

                sprites[
                    sprite
                ].y =
                    y;

                sprites[
                    sprite
                ].element.style.top =
                    y + "px";
            }

            continue;
        }

        /* =================================================
           📏 SPRITE SIZE
        ================================================= */

        if (
            line.includes(
                " size is "
            )
        ) {

            const parts =
                line.split(
                    " size is "
                );

            const sprite =
                parts[0].trim();

            const size =
                Number(
                    getValue(
                        parts[1]
                    )
                );

            if (
                sprites[sprite]
            ) {

                sprites[
                    sprite
                ].size =
                    size;

                sprites[
                    sprite
                ].element.style.width =
                    size + "px";

                sprites[
                    sprite
                ].element.style.height =
                    size + "px";
            }

            continue;
        }

        /* =================================================
           🎨 COLOUR
        ================================================= */

        if (
            line.startsWith(
                "colour is "
            )
        ) {

            const colour =
                line
                    .substring(10)
                    .trim();

            output.style.color =
                colour;

            continue;
        }

        /* =================================================
           🧮 MULTIPLY
        ================================================= */

        if (
            line.includes(
                " is "
            ) &&
            line.includes(
                " multiply "
            )
        ) {

            const parts =
                line.split(
                    " is "
                );

            const name =
                parts[0].trim();

            const values =
                parts[1]
                    .split(
                        " multiply "
                    );

            const first =
                Number(
                    getValue(
                        values[0]
                    )
                );

            const second =
                Number(
                    getValue(
                        values[1]
                    )
                );

            variables[name] =
                first *
                second;

            continue;
        }

        /* =================================================
           🧮 DIVIDE
        ================================================= */

        if (
            line.includes(
                " is "
            ) &&
            line.includes(
                " divide "
            )
        ) {

            const parts =
                line.split(
                    " is "
                );

            const name =
                parts[0].trim();

            const values =
                parts[1]
                    .split(
                        " divide "
                    );

            const first =
                Number(
                    getValue(
                        values[0]
                    )
                );

            const second =
                Number(
                    getValue(
                        values[1]
                    )
                );

            if (
                second ===
                0
            ) {

                output.innerHTML +=
                    "❌ Cannot divide by zero<br>";

            } else {

                variables[name] =
                    first /
                    second;
            }

            continue;
        }

        /* =================================================
           🧮 FLOOR
        ================================================= */

        if (
            line.includes(
                " is "
            ) &&
            line.includes(
                " floor "
            )
        ) {

            const parts =
                line.split(
                    " is "
                );

            const name =
                parts[0].trim();

            const value =
                parts[1]
                    .replace(
                        "floor ",
                        ""
                    )
                    .trim();

            variables[name] =
                Math.floor(
                    Number(
                        getValue(
                            value
                        )
                    )
                );

            continue;
        }

        /* =================================================
           🧮 CEILING
        ================================================= */

        if (
            line.includes(
                " is "
            ) &&
            line.includes(
                " ceiling "
            )
        ) {

            const parts =
                line.split(
                    " is "
                );

            const name =
                parts[0].trim();

            const value =
                parts[1]
                    .replace(
                        "ceiling ",
                        ""
                    )
                    .trim();

            variables[name] =
                Math.ceil(
                    Number(
                        getValue(
                            value
                        )
                    )
                );

            continue;
        }

        /* =================================================
           🧮 SQRT
        ================================================= */

        if (
            line.includes(
                " is "
            ) &&
            line.includes(
                " sqrt "
            )
        ) {

            const parts =
                line.split(
                    " is "
                );

            const name =
                parts[0].trim();

            const value =
                parts[1]
                    .replace(
                        "sqrt ",
                        ""
                    )
                    .trim();

            variables[name] =
                Math.sqrt(
                    Number(
                        getValue(
                            value
                        )
                    )
                );

            continue;
        }

        /* =================================================
           🧮 SQUARE
        ================================================= */

        if (
            line.includes(
                " is "
            ) &&
            line.includes(
                " square "
            )
        ) {

            const parts =
                line.split(
                    " is "
                );

            const name =
                parts[0].trim();

            const value =
                parts[1]
                    .replace(
                        "square ",
                        ""
                    )
                    .trim();

            const number =
                Number(
                    getValue(
                        value
                    )
                );

            variables[name] =
                number *
                number;

            continue;
        }

        /* =================================================
           ➕ PLUS / ➖ MINUS
        ================================================= */

        if (
            line.includes(
                " is "
            ) &&
            (
                line.includes(
                    " plus "
                ) ||
                line.includes(
                    " minus "
                )
            )
        ) {

            const parts =
                line.split(
                    " is "
                );

            const name =
                parts[0].trim();

            const equation =
                parts[1].trim();

            if (
                equation.includes(
                    " plus "
                )
            ) {

                const values =
                    equation.split(
                        " plus "
                    );

                variables[name] =
                    Number(
                        getValue(
                            values[0]
                        )
                    ) +
                    Number(
                        getValue(
                            values[1]
                        )
                    );

            } else {

                const values =
                    equation.split(
                        " minus "
                    );

                variables[name] =
                    Number(
                        getValue(
                            values[0]
                        )
                    ) -
                    Number(
                        getValue(
                            values[1]
                        )
                    );
            }

            continue;
        }

        /* =================================================
           ⏳ WAIT UNTIL
        ================================================= */

        if (
            line.startsWith(
                "wait until "
            )
        ) {

            const condition =
                line
                    .substring(
                        "wait until "
                            .length
                    )
                    .trim();

            while (
                !checkCondition(
                    condition
                )
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            50
                        )
                );
            }

            continue;
        }

        /* =================================================
           ⏳ WAIT
        ================================================= */

        if (
            line.startsWith(
                "wait for "
            )
        ) {

            const seconds =
                Number(
                    getValue(
                        line
                            .replace(
                                "wait for ",
                                ""
                            )
                            .replace(
                                " seconds",
                                ""
                            )
                    )
                );

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        Math.max(
                            0,
                            seconds *
                            1000
                        )
                    )
            );

            continue;
        }

        /* =================================================
           📦 NORMAL VARIABLE
        ================================================= */

        if (
            line.includes(
                " is "
            )
        ) {

            const parts =
                line.split(
                    " is "
                );

            const name =
                parts[0].trim();

            const value =
                parts
                    .slice(1)
                    .join(
                        " is "
                    )
                    .trim();

            /*
               FUNCTION RETURN:
               answer is do add
            */

            if (
                value.startsWith(
                    "do "
                )
            ) {

                const functionName =
                    value
                        .substring(3)
                        .trim();

                if (
                    !functions[
                        functionName
                    ]
                ) {

                    output.innerHTML +=
                        "❌ Function not found: " +
                        functionName +
                        "<br>";

                    continue;
                }

                const result =
                    await run(
                        functions[
                            functionName
                        ]
                        .body
                        .join("\n")
                    );

                variables[name] =
                    isReturnSignal(
                        result
                    )
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

            variables[name] =
                getValue(
                    value
                );

            continue;
        }

        /* =================================================
           ❌ UNKNOWN COMMAND
        ================================================= */

        output.innerHTML +=
            "❌ I don't understand: " +
            line +
            "<br>";
    }

    return null;
}

/* =========================================================
   🧠 CODEOS SUGGESTIONS
========================================================= */

function codeosSuggestCommand(
    input
) {

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

    const extensionCommands =
        [
            ...codeOSExtensionCommands.keys()
        ];

    const commands = [

        ...builtInCommands,

        ...extensionCommands
    ];

    const firstWord =
        String(
            input || ""
        )
            .trim()
            .toLowerCase()
            .split(
                /\s+/
            )[0];

    const typoMap = {

        repat:
            "repeat",

        repeet:
            "repeat",

        forevr:
            "forever",

        funtion:
            "function",

        functon:
            "function",

        whlie:
            "while",

        retrun:
            "return",

        sya:
            "say",

        waut:
            "wait",

        askk:
            "ask",

        creat:
            "create"
    };

    if (
        typoMap[firstWord]
    ) {

        return typoMap[
            firstWord
        ];
    }

    let best =
        null;

    let bestScore =
        Infinity;

    commands.forEach(
        command => {

            const distance =
                codeosLevenshtein(
                    firstWord,
                    command
                        .split(" ")[0]
                );

            if (
                distance <
                bestScore
            ) {

                bestScore =
                    distance;

                best =
                    command;
            }
        }
    );

    if (
        bestScore <=
        3
    ) {

        return best;
    }

    return null;
}

function codeosLevenshtein(
    a,
    b
) {

    const matrix =
        [];

    for (
        let i = 0;
        i <= b.length;
        i++
    ) {

        matrix[i] =
            [i];
    }

    for (
        let j = 0;
        j <= a.length;
        j++
    ) {

        matrix[0][j] =
            j;
    }

    for (
        let i = 1;
        i <= b.length;
        i++
    ) {

        for (
            let j = 1;
            j <= a.length;
            j++
        ) {

            if (
                b.charAt(
                    i - 1
                ) ===
                a.charAt(
                    j - 1
                )
            ) {

                matrix[i][j] =
                    matrix[i - 1][
                        j - 1
                    ];

            } else {

                matrix[i][j] =
                    Math.min(

                        matrix[
                            i - 1
                        ][
                            j - 1
                        ] + 1,

                        matrix[i][
                            j - 1
                        ] + 1,

                        matrix[
                            i - 1
                        ][j] + 1
                    );
            }
        }
    }

    return matrix[
        b.length
    ][
        a.length
    ];
}

/* =========================================================
   🏃 CODEOS SPRITE EXTENSION API
========================================================= */

window.codeOSGetSprite =
    function(name) {

        if (!name) {
            return null;
        }

        return (
            sprites[name] ||
            null
        );
    };

window.codeOSUpdateSprite =
    function(
        name,
        updates
    ) {

        if (!name) {
            return false;
        }

        const sprite =
            sprites[name];

        if (!sprite) {
            return false;
        }

        if (
            updates &&
            typeof updates ===
                "object"
        ) {

            Object.assign(
                sprite,
                updates
            );
        }

        const element =
            sprite.element ||
            sprite.el ||
            sprite.node ||
            null;

        if (element) {

            if (
                Number.isFinite(
                    Number(
                        sprite.x
                    )
                )
            ) {

                element.style.left =
                    `${sprite.x}px`;
            }

            if (
                Number.isFinite(
                    Number(
                        sprite.y
                    )
                )
            ) {

                element.style.top =
                    `${sprite.y}px`;
            }

            if (
                Number.isFinite(
                    Number(
                        sprite.size
                    )
                )
            ) {

                element.style.width =
                    `${sprite.size}px`;

                element.style.height =
                    `${sprite.size}px`;
            }
        }

        if (
            typeof broadcastDevToolsState ===
            "function"
        ) {

            broadcastDevToolsState();
        }

        return true;
    };

/* =========================================================
   🌐 OPTIONAL DEVTOOLS BROADCAST
========================================================= */

function broadcastDevToolsState() {

    try {

        window.dispatchEvent(
            new CustomEvent(
                "codeos:devtools-state",
                {
                    detail:
                        window.CodeOSDevToolsAPI
                            ?.getProject()
                }
            )
        );

    } catch (error) {

        console.warn(
            "⚠️ DevTools state broadcast failed:",
            error
        );
    }
}

/* =========================================================
   🚀 BOOT
========================================================= */

async function boot() {

    /* =====================================================
       📊 LOADING
    ===================================================== */

    if (loadingFill) {
        loadingFill.style.width = "100%";
    }

    await new Promise(resolve =>
        setTimeout(resolve, 1200)
    );

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    output.style.display = "block";

    /* =====================================================
       🧩 LOAD EXTENSIONS
    ===================================================== */

    loadCodeOSExtensions();

    console.log(
        "🧩 Extension commands:",
        [...codeOSExtensionCommands.keys()]
    );

    try {

        /* =================================================
           📁 GET ALL CDX FILES
        ================================================= */

        const cdxFiles =
            Array.isArray(projectFiles)
                ? projectFiles.filter(file =>
                    String(
                        file?.name || ""
                    )
                        .toLowerCase()
                        .endsWith(".cdx")
                )
                : [];

        /* =================================================
           🚀 MAIN.CDX FIRST
        ================================================= */

        cdxFiles.sort((a, b) => {

            const aMain =
                String(a.name)
                    .toLowerCase() === "main.cdx";

            const bMain =
                String(b.name)
                    .toLowerCase() === "main.cdx";

            if (aMain && !bMain) return -1;
            if (!aMain && bMain) return 1;

            return 0;
        });

        console.log(
            "🚀 CODEOS PROJECT FILES:",
            cdxFiles.map(file => file.name)
        );

        /* =================================================
           🚨 NO CDX FILES
        ================================================= */

        if (!cdxFiles.length) {

            output.innerHTML =
                "😭 No .cdx files found.";

            return;
        }

        /* =================================================
           ⚙️ REGISTER EVERY FUNCTION FIRST
           
           This happens BEFORE ANY FILE STARTS.
           
           So:
           
           main.cdx
              ↓
           do playerSetup
           
           can call a function inside:
           
           Player.cdx
        ================================================= */

        for (const file of cdxFiles) {

            const lines =
                String(
                    file.content || ""
                )
                    .split("\n")
                    .map(line => line.trim());

            for (
                let i = 0;
                i < lines.length;
                i++
            ) {

                const line = lines[i];

                if (
                    !line.startsWith(
                        "function "
                    )
                ) {
                    continue;
                }

                const functionName =
                    line
                        .substring(9)
                        .trim();

                const end =
                    findMatchingEnd(
                        lines,
                        i + 1
                    );

                if (end === -1) {

                    output.innerHTML +=
                        `❌ Function "${functionName}" in ${file.name} is missing "end".<br>`;

                    continue;
                }

                functions[functionName] = {
                    body: lines.slice(
                        i + 1,
                        end
                    )
                };

                console.log(
                    "⚙️ Registered function:",
                    functionName,
                    "from",
                    file.name
                );
            }
        }

        /* =================================================
           📄 SHOW EVERY FILE
           
           Add all labels BEFORE execution begins.
        ================================================= */

        cdxFiles.forEach(file => {

            output.innerHTML += `
                <div style="
                    margin:14px 0 7px;
                    opacity:.5;
                    font-size:12px;
                    font-family:monospace;
                ">
                    📄 ${file.name}
                </div>
            `;
        });

        /* =================================================
           🚀 START EVERY FILE AT THE SAME TIME
           
           THIS IS THE IMPORTANT PART.
           
           DO NOT await each file individually.
           
           Promise.all starts them all immediately.
           
           So if main.cdx has:
           
               forever
               ...
               end
           
           Player.cdx STILL STARTS.
           
           Game.cdx STILL STARTS.
           
           UI.cdx STILL STARTS.
        ================================================= */

        const runningFiles =
            cdxFiles.map(async file => {

                console.log(
                    "▶ Starting CDX file:",
                    file.name
                );

                try {

                    const result =
                        await run(
                            String(
                                file.content || ""
                            )
                        );

                    console.log(
                        "✅ CDX file finished:",
                        file.name
                    );

                    if (
                        isReturnSignal(
                            result
                        )
                    ) {

                        console.log(
                            "↩️ File returned:",
                            file.name,
                            result.value
                        );
                    }

                    return {
                        file:
                            file.name,
                        success:
                            true,
                        result
                    };

                } catch (error) {

                    console.error(
                        `❌ ${file.name} crashed:`,
                        error
                    );

                    output.innerHTML += `
                        <div style="
                            color:#ff8f8f;
                            margin:6px 0 12px;
                            font-family:monospace;
                        ">
                            ❌ ${file.name}: ${error.message}
                        </div>
                    `;

                    return {
                        file:
                            file.name,
                        success:
                            false,
                        error
                    };
                }
            });

        /* =================================================
           🧠 WAIT FOR THE PROJECT
           
           This waits for ALL files to finish.
           
           A forever loop means this never resolves —
           WHICH IS CORRECT.
           
           The other files are ALREADY RUNNING.
        ================================================= */

        const results =
            await Promise.allSettled(
                runningFiles
            );

        console.log(
            "✅ CodeOS project execution results:",
            results
        );

        broadcastDevToolsState();

    } catch (error) {

        console.error(
            "💥 CodeOS Runner crashed:",
            error
        );

        output.innerHTML +=
            "<br>💥 CodeOS Runner Error:<br>" +
            String(
                error.message ||
                error
            );
    }
}

/* =========================================================
   🛠️ DEVTOOLS READY
========================================================= */

console.log(
    "🛠️ CodeOS DevTools Bridge ready."
);

console.log(
    "📁 Project:",
    window.CodeOSDevToolsAPI
        .getProject()
);

/* =========================================================
   🚀 START CODEOS
========================================================= */

startRunner();

function getValue(
    value
) {

    value =
        String(
            value ??
            ""
        ).trim();

    /* =====================================================
       📝 STRING
    ===================================================== */

    if (
        (
            value.startsWith('"') &&
            value.endsWith('"')
        ) ||
        (
            value.startsWith("'") &&
            value.endsWith("'")
        )
    ) {

        return value.slice(
            1,
            -1
        );
    }

    /* =====================================================
       🔘 BOOLEAN
    ===================================================== */

    if (
        value === "true"
    ) {
        return true;
    }

    if (
        value === "false"
    ) {
        return false;
    }

    /* =====================================================
       📦 VARIABLE
       
       Do this BEFORE math so:
       a
       score
       lives
       etc.
       resolve correctly.
    ===================================================== */

    if (
        Object.prototype.hasOwnProperty.call(
            variables,
            value
        )
    ) {

        return variables[
            value
        ];
    }

    /* =====================================================
       🔢 NUMBER
    ===================================================== */

    if (
        value !== "" &&
        !isNaN(value)
    ) {

        return Number(
            value
        );
    }

    /* =====================================================
       🧮 NATURAL LANGUAGE MATH
    ===================================================== */

    const mathMatch =
        value.match(
            /^(.+?)\s+(plus|minus|multiply|divide)\s+(.+)$/
        );

    if (
        mathMatch
    ) {

        const left =
            Number(
                getValue(
                    mathMatch[1]
                )
            );

        const operator =
            mathMatch[2];

        const right =
            Number(
                getValue(
                    mathMatch[3]
                )
            );

        if (
            Number.isNaN(left) ||
            Number.isNaN(right)
        ) {

            return value;
        }

        if (
            operator ===
            "plus"
        ) {

            return (
                left +
                right
            );
        }

        if (
            operator ===
            "minus"
        ) {

            return (
                left -
                right
            );
        }

        if (
            operator ===
            "multiply"
        ) {

            return (
                left *
                right
            );
        }

        if (
            operator ===
            "divide"
        ) {

            if (
                right ===
                0
            ) {

                output.innerHTML +=
                    "❌ Cannot divide by zero<br>";

                return 0;
            }

            return (
                left /
                right
            );
        }
    }

    /* =====================================================
       📝 LITERAL TEXT
    ===================================================== */

    return value;
}