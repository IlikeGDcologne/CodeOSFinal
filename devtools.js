/* =========================================================
   🛠️ CODEOS DEVTOOLS PORTAL
========================================================= */

(function () {

    "use strict";

    console.log("🛠️ CodeOS DevTools portal loaded.");

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const paymentPlus =
        window.CodeOSPlus;


    const membershipStatus =
        document.getElementById(
            "membershipStatus"
        );

    const codeInput =
        document.getElementById(
            "devToolsCodeInput"
        );

    const unlockButton =
        document.getElementById(
            "unlockButton"
        );

    const validationMessage =
        document.getElementById(
            "validationMessage"
        );

    const authPage =
        document.getElementById(
            "authPage"
        );

    const unlockedSection =
        document.getElementById(
            "unlockedSection"
        );

    const downloadButton =
        document.getElementById(
            "downloadExtension"
        );

    const backToPlus =
        document.getElementById(
            "backToPlus"
        );


    /* =====================================================
       SAFETY CHECK
    ===================================================== */

    if (!membershipStatus) {

        console.error(
            "❌ DevTools: #membershipStatus not found."
        );

        return;

    }

    if (!codeInput) {

        console.error(
            "❌ DevTools: #devToolsCodeInput not found."
        );

        return;

    }

    if (!unlockButton) {

        console.error(
            "❌ DevTools: #unlockButton not found."
        );

        return;

    }


    /* =====================================================
       DEVTOOLS STORAGE
    ===================================================== */

    const DEVTOOLS_STORAGE =
        "codeosDevToolsAccess";


    /* =====================================================
       GET ACCESS
    ===================================================== */

    function getAccess() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    DEVTOOLS_STORAGE
                ) || "null"
            );

        } catch (error) {

            console.error(
                "❌ Could not read DevTools access:",
                error
            );

            return null;

        }

    }


    /* =====================================================
       MEMBERSHIP STATUS
    ===================================================== */

    function updateMembershipStatus() {

        if (!paymentPlus) {

            membershipStatus.textContent =
                "⚠ PLUS+ SYSTEM UNAVAILABLE";

            return;

        }


        const status =
            paymentPlus.getStatus();


        if (status.isPlus) {

            membershipStatus.textContent =
                "👑 CDX PLUS+ MEMBER";

            membershipStatus.classList.add(
                "active"
            );

        } else {

            membershipStatus.textContent =
                "🔒 PLUS+ REQUIRED";

            membershipStatus.classList.remove(
                "active"
            );

        }

    }


    /* =====================================================
       VALIDATE CODE
    ===================================================== */

    function validateCode(
        enteredCode
    ) {

        if (!paymentPlus) {

            return {

                valid:
                    false,

                message:
                    "❌ CodeOS Plus+ system is unavailable."

            };

        }


        const status =
            paymentPlus.getStatus();


        if (!status.isPlus) {

            return {

                valid:
                    false,

                message:
                    "🔒 CDX Plus+ membership is required."

            };

        }


        const access =
            getAccess();


        if (!access) {

            return {

                valid:
                    false,

                message:
                    "❌ No DevTools code was generated for this account."

            };

        }


        if (
            access.valid !== true
        ) {

            return {

                valid:
                    false,

                message:
                    "❌ This DevTools code has been invalidated."

            };

        }


        if (
            String(
                enteredCode
            ).trim() !==
            String(
                access.code
            ).trim()
        ) {

            return {

                valid:
                    false,

                message:
                    "❌ Invalid DevTools code."

            };

        }


        return {

            valid:
                true,

            message:
                "✓ DevTools identity verified."

        };

    }


    /* =====================================================
       SHOW VALIDATION
    ===================================================== */

    function showValidation(
        message,
        success
    ) {

        if (!validationMessage) {
            return;
        }


        validationMessage.textContent =
            message;


        validationMessage.className =
            "validation " +
            (
                success
                    ? "success"
                    : "error"
            );

    }


    /* =====================================================
       UNLOCK
    ===================================================== */

    function unlock() {

        const enteredCode =
            codeInput.value.trim();


        if (!enteredCode) {

            showValidation(
                "Please enter your DevTools code.",
                false
            );

            return;

        }


        const result =
            validateCode(
                enteredCode
            );


        showValidation(
            result.message,
            result.valid
        );


        if (!result.valid) {

            codeInput.animate(
                [
                    {
                        transform:
                            "translateX(0)"
                    },
                    {
                        transform:
                            "translateX(-7px)"
                    },
                    {
                        transform:
                            "translateX(7px)"
                    },
                    {
                        transform:
                            "translateX(-5px)"
                    },
                    {
                        transform:
                            "translateX(0)"
                    }
                ],
                {
                    duration:
                        300
                }
            );

            return;

        }


        unlockButton.disabled =
            true;


        unlockButton.innerHTML =
            `
                <span>
                    Verifying...
                </span>

                <span>
                    ✦
                </span>
            `;


        setTimeout(
            () => {

                if (authPage) {

                    authPage.classList.add(
                        "hidden"
                    );

                }


                if (unlockedSection) {

                    unlockedSection.classList.remove(
                        "hidden"
                    );

                }


                unlockButton.disabled =
                    false;


                unlockButton.innerHTML =
                    `
                        <span>
                            Unlock DevTools
                        </span>

                        <span>
                            →
                        </span>
                    `;


                showValidation(
                    "✓ Access granted.",
                    true
                );

            },
            850
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    unlockButton.addEventListener(
        "click",
        unlock
    );


    codeInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                unlock();

            }

        }
    );


    codeInput.addEventListener(
        "input",
        () => {

            showValidation(
                "",
                false
            );

        }
    );


     /* =========================================================
    🧩 DOWNLOAD ACTUAL CODEOS DEVTOOLS EXTENSION
 ========================================================= */

const extensionFiles = [
    "manifest.json",
    "devtools.html",
    "devtools.js",
    "panel.html",
    "panel.css",
    "panel.js"
];

document
    .getElementById("downloadExtension")
    .onclick = async () => {

        const account =
            window.CodeOSPlus?.getStatus?.();


        /* ================================================
           🔒 PLUS+ CHECK
        ================================================ */

        if (
            !account ||
            !account.isPlus
        ) {

            showToast(
                "🔒 CDX Plus+ is required."
            );

            return;

        }


        /* ================================================
           🔐 DEVTOOLS CODE CHECK
        ================================================ */

        const access =
            getAccess();


        if (
            !access ||
            access.valid !== true
        ) {

            showToast(
                "❌ DevTools access is invalid."
            );

            return;

        }


        const button =
            document.getElementById(
                "downloadExtension"
            );


        button.disabled =
            true;


        button.innerHTML = `
            <span>✨</span>
            <span>Building DevTools...</span>
            <span>...</span>
        `;


        try {

            /* ============================================
               LOAD JSZIP
            ============================================ */

            if (
                !window.JSZip
            ) {

                await loadScript(
                    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
                );

            }


            const zip =
                new JSZip();


            /* ============================================
               REAL EXTENSION FOLDER
            ============================================ */

            const extensionFolder =
                "DevTools Extension";


            /* ============================================
               FETCH EVERY REAL FILE
            ============================================ */

            for (
                const fileName of
                extensionFiles
            ) {

                const fileURL =
                    encodeURI(
                        extensionFolder +
                        "/" +
                        fileName
                    );


                console.log(
                    "📦 Fetching extension file:",
                    fileURL
                );


                const response =
                    await fetch(
                        fileURL,
                        {
                            cache:
                                "no-store"
                        }
                    );


                if (
                    !response.ok
                ) {

                    throw new Error(
                        `Could not load "${fileName}" ` +
                        `(HTTP ${response.status})`
                    );

                }


                const content =
                    await response.text();


                /*
                 * Put it inside the ZIP with the exact
                 * filename Chrome expects.
                 */

                zip.file(
                    fileName,
                    content
                );

            }


            /* ============================================
               BUILD ZIP
            ============================================ */

            button.innerHTML = `
                <span>⚡</span>
                <span>Packaging extension...</span>
                <span>...</span>
            `;


            const blob =
                await zip.generateAsync(
                    {
                        type:
                            "blob",

                        compression:
                            "DEFLATE",

                        compressionOptions:
                            {
                                level:
                                    6
                            }
                    },
                    metadata => {

                        console.log(
                            "📦 ZIP progress:",
                            metadata.percent
                        );

                    }
                );


            /* ============================================
               DOWNLOAD
            ============================================ */

            const url =
                URL.createObjectURL(
                    blob
                );


            const anchor =
                document.createElement(
                    "a"
                );


            anchor.href =
                url;


            anchor.download =
                "CodeOS-DevTools.zip";


            document.body.appendChild(
                anchor
            );


            anchor.click();


            anchor.remove();


            URL.revokeObjectURL(
                url
            );


            /* ============================================
               SUCCESS
            ============================================ */

            button.innerHTML = `
                <span>✓</span>
                <span>Extension Downloaded!</span>
                <span>🎉</span>
            `;


            showToast(
                "🧩 Real CodeOS DevTools downloaded!"
            );


            setTimeout(
                () => {

                    button.innerHTML = `
                        <span class="downloadIcon">
                            ↓
                        </span>

                        <span>
                            Download Chrome Extension
                        </span>

                        <span>
                            →
                        </span>
                    `;

                },
                2500
            );


        } catch (error) {

            console.error(
                "❌ Failed to build CodeOS DevTools:",
                error
            );


            showToast(
                "❌ " +
                error.message
            );


            button.innerHTML = `
                <span>↻</span>
                <span>Try Again</span>
                <span>→</span>
            `;


        } finally {

            button.disabled =
                false;

        }

    };


/* =========================================================
   📜 LOAD SCRIPT
========================================================= */

function loadScript(
    src
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );


            if (
                existing
            ) {

                if (
                    window.JSZip
                ) {

                    resolve();

                } else {

                    existing.addEventListener(
                        "load",
                        resolve
                    );

                    existing.addEventListener(
                        "error",
                        reject
                    );

                }

                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;


            script.onload =
                () => resolve();


            script.onerror =
                () =>
                    reject(
                        new Error(
                            "Could not load ZIP library."
                        )
                    );


            document.head.appendChild(
                script
            );

        }
    );

}


    /* =====================================================
       BACK TO PLUS+
    ===================================================== */

    if (backToPlus) {

        backToPlus.addEventListener(
            "click",
            () => {

                window.location.href =
                    "plus.html";

            }
        );

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message
    ) {

        let toast =
            document.getElementById(
                "devtoolsToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "devtoolsToast";


            toast.style.cssText = `
                position:fixed;
                right:22px;
                bottom:22px;
                z-index:99999;
                padding:13px 17px;
                border-radius:13px;
                background:#171a29;
                color:white;
                border:1px solid rgba(140,115,255,.25);
                box-shadow:0 20px 60px rgba(0,0,0,.4);
                font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",Arial,sans-serif;
                font-size:11px;
            `;


            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            message;


        toast.style.opacity =
            "1";


        clearTimeout(
            toast._timeout
        );


        toast._timeout =
            setTimeout(
                () => {

                    toast.style.opacity =
                        "0";

                },
                2200
            );

    }


    /* =====================================================
       SCRIPT LOADER
    ===================================================== */

    function loadScript(
        src
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    src;


                script.onload =
                    resolve;


                script.onerror =
                    reject;


                document.head.appendChild(
                    script
                );

            }
        );

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    updateMembershipStatus();


    window.addEventListener(
        "codeospluschange",
        updateMembershipStatus
    );


    console.log(
        "✅ CodeOS DevTools portal ready."
    );

})();