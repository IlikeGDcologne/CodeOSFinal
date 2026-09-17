/* =========================================================
   👑 CDX PLUS+ PAGE
========================================================= */

(function () {

    "use strict";

    console.log("👑 CDX Plus+ page loaded.");

    const paymentOverlay =
        document.getElementById("paymentOverlay");

    const codeOverlay =
        document.getElementById("codeOverlay");

    const planStep =
        document.getElementById("planStep");

    const payStep =
        document.getElementById("payStep");

    const successStep =
        document.getElementById("successStep");

    const continuePayment =
        document.getElementById("continuePayment");

    const paymentProgressFill =
        document.getElementById("paymentProgressFill");

    const paymentStatus =
        document.getElementById("paymentStatus");

    const paymentSubtext =
        document.getElementById("paymentSubtext");

    const secretCode =
        document.getElementById("secretCode");

    const nameOverlay =
    document.getElementById("nameOverlay");

const plusDisplayName =
    document.getElementById("plusDisplayName");

const nameError =
    document.getElementById("nameError");

const confirmNameButton =
    document.getElementById("confirmNameButton");

const cancelNameButton =
    document.getElementById("cancelNameButton");

    let selectedPlan = null;

    const DEVTOOLS_STORAGE =
        "codeosDevToolsAccess";


    /* =====================================================
       PARTICLES
    ===================================================== */

    function createParticles() {

        const container =
            document.getElementById("particles");

        if (!container) return;

        for (let i = 0; i < 70; i++) {

            const particle =
                document.createElement("div");

            particle.className =
                "particle";

            particle.style.left =
                Math.random() * 100 + "%";

            particle.style.animationDuration =
                (8 + Math.random() * 16) + "s";

            particle.style.animationDelay =
                (-Math.random() * 18) + "s";

            const size =
                1 + Math.random() * 2;

            particle.style.width =
                size + "px";

            particle.style.height =
                size + "px";

            container.appendChild(
                particle
            );

        }

    }


    /* =====================================================
       DEVTOOLS CODE
    ===================================================== */

    function generateDevToolsCode() {

        const chars =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

        let code = "";

        for (let i = 0; i < 6; i++) {

            code += chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];

        }

        return code;

    }


    function getDevToolsAccess() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    DEVTOOLS_STORAGE
                ) || "null"
            );

        } catch {

            return null;

        }

    }


    function createDevToolsAccess() {

        const account =
            window.CodeOSPlus.getAccount();

        let access =
            getDevToolsAccess();

        if (
            access &&
            access.code &&
            access.valid === true
        ) {

            return access;

        }

        access = {

            code:
                generateDevToolsCode(),

            valid:
                true,

            created:
                Date.now(),

            owner:
                account.displayName ||
                "CodeOS Creator"

        };

        localStorage.setItem(
            DEVTOOLS_STORAGE,
            JSON.stringify(access)
        );

        return access;

    }


    function invalidateDevToolsAccess() {

        const access =
            getDevToolsAccess();

        if (!access) return;

        access.valid = false;

        localStorage.setItem(
            DEVTOOLS_STORAGE,
            JSON.stringify(access)
        );

    }


    /* =====================================================
       ACCOUNT UI
    ===================================================== */

    function refreshAccountUI() {

        const account =
            window.CodeOSPlus.getStatus();

        const title =
            document.getElementById(
                "accountStatusTitle"
            );

        const text =
            document.getElementById(
                "accountStatusText"
            );

        const unsubscribeButton =
            document.getElementById(
                "unsubscribeButton"
            );

        if (account.isPlus) {

            title.textContent =
                "👑 You're officially a CDX Plus+ member.";

            text.textContent =
                `Welcome, ${
                    account.displayName ||
                    "CodeOS Creator"
                }. Your Plus+ features are active.`;

            unsubscribeButton.style.display =
                "block";

        } else {

            title.textContent =
                "You're currently using CodeOS Free.";

            text.textContent =
                "Upgrade to unlock the complete CodeOS ecosystem.";

            unsubscribeButton.style.display =
                "none";

        }

    }


    /* =====================================================
       OPEN PAYMENT
    ===================================================== */

    function openPayment() {

        selectedPlan = null;

        document
            .querySelectorAll(".modalPlan")
            .forEach(button => {
                button.classList.remove(
                    "selected"
                );
            });

        continuePayment.disabled =
            true;

        planStep.classList.add("active");
        payStep.classList.remove("active");
        successStep.classList.remove("active");

        paymentOverlay.classList.remove(
            "hidden"
        );

    }


    function closePayment() {

        paymentOverlay.classList.add(
            "hidden"
        );

    }


    /* =====================================================
       SELECT PLAN
    ===================================================== */

    document
        .querySelectorAll(".modalPlan")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".modalPlan"
                        )
                        .forEach(
                            item => {
                                item.classList.remove(
                                    "selected"
                                );
                            }
                        );

                    button.classList.add(
                        "selected"
                    );

                    selectedPlan =
                        button.dataset.plan;

                    continuePayment.disabled =
                        false;

                }
            );

        });


    /* =====================================================
       FAKE PAYMENT
    ===================================================== */

    async function processPayment() {

    if (!selectedPlan) {
        console.warn("⚠️ No Plus+ plan selected.");
        return;
    }

    console.log("👑 Starting fake Plus+ payment:", selectedPlan);

    /* =============================================
       SWITCH TO PAYMENT STEP
    ============================================= */

    planStep.classList.remove("active");
    payStep.classList.add("active");
    successStep.classList.remove("active");

    paymentProgressFill.style.width = "0%";

    paymentStatus.textContent =
        "Processing...";

    paymentSubtext.textContent =
        selectedPlan === "monthly"
            ? "Preparing your imaginary monthly subscription."
            : "Preparing your imaginary lifetime upgrade.";

    /* =============================================
       FAKE PAYMENT STAGES
    ============================================= */

    const stages = [
        {
            progress: 22,
            text: "Connecting to CDX Pay...",
            sub: "Opening a completely fake payment gateway."
        },
        {
            progress: 47,
            text: "Authorizing transaction...",
            sub: "Your imaginary bank has approved the imaginary charge."
        },
        {
            progress: 72,
            text: "Activating membership...",
            sub: "Installing premium privileges."
        },
        {
            progress: 94,
            text: "Finalizing...",
            sub: "Polishing your imaginary golden badge."
        },
        {
            progress: 100,
            text: "Complete.",
            sub: "Everything is ready."
        }
    ];

    for (const stage of stages) {

        await new Promise(resolve =>
            setTimeout(resolve, 700)
        );

        paymentProgressFill.style.width =
            stage.progress + "%";

        paymentStatus.textContent =
            stage.text;

        paymentSubtext.textContent =
            stage.sub;

        console.log(
            `👑 Payment stage: ${stage.progress}%`
        );
    }

    /* =============================================
       ACTIVATE PLUS+
    ============================================= */

    try {

        console.log("👑 Beginning Plus+ activation...");

        let name =
    window.CodeOSPlus.getDisplayName();

if (!name) {
    name =
        await askForPlusDisplayName();
}

        console.log("👑 Using display name:", name);

        /* -----------------------------------------
           ACTUALLY SUBSCRIBE
        ----------------------------------------- */

        const account =
            window.CodeOSPlus.subscribe({
                displayName: name,
                plan: selectedPlan
            });

        console.log(
            "👑 Plus+ subscription created:",
            account
        );

        /* -----------------------------------------
           CREATE DEVTOOLS ACCESS
        ----------------------------------------- */

        const devToolsAccess =
            createDevToolsAccess();

        console.log(
            "🛠️ DevTools access created:",
            devToolsAccess
        );

        /* -----------------------------------------
           VERIFY PERSISTENCE
        ----------------------------------------- */

        const verified =
            window.CodeOSPlus.getStatus();

        console.log(
            "✅ Verified Plus+ status:",
            verified
        );

        if (!verified.isPlus) {
            throw new Error(
                "Plus+ subscription was saved but could not be verified."
            );
        }

        /* =========================================
           SMALL SUCCESS DELAY
        ========================================= */

        await new Promise(resolve =>
            setTimeout(resolve, 450)
        );

        /* =========================================
           SHOW SUCCESS SCREEN
        ========================================= */

        payStep.classList.remove("active");

        successStep.classList.add("active");

        paymentProgressFill.style.width = "100%";

        paymentStatus.textContent =
            "Complete! 👑";

        paymentSubtext.textContent =
            "Your CodeOS Plus+ membership is now active.";

        refreshAccountUI();

        console.log(
            "🎉 CODEOS PLUS+ ACTIVATION COMPLETE!"
        );

    } catch (error) {

        /* =========================================
           ACTIVATION ERROR
        ========================================= */

        console.error(
            "❌ Plus+ activation failed:",
            error
        );

        paymentStatus.textContent =
            "Activation failed.";

        paymentSubtext.textContent =
            error?.message ||
            "Something went wrong while activating Plus+.";

    }
}


    /* =====================================================
       DEVTOOLS CODE
    ===================================================== */

    function showDevToolsCode() {

        const account =
            window.CodeOSPlus.getStatus();

        if (!account.isPlus) {

            openPayment();

            return;

        }

        const access =
            createDevToolsAccess();

        secretCode.textContent =
            access.code;

        codeOverlay.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       COPY
    ===================================================== */

    document
        .getElementById("copyCode")
        .addEventListener(
            "click",
            async () => {

                const code =
                    secretCode.textContent;

                try {

                    await navigator.clipboard.writeText(
                        code
                    );

                } catch {

                    const textarea =
                        document.createElement(
                            "textarea"
                        );

                    textarea.value =
                        code;

                    document.body.appendChild(
                        textarea
                    );

                    textarea.select();

                    document.execCommand(
                        "copy"
                    );

                    textarea.remove();

                }

                const button =
                    document.getElementById(
                        "copyCode"
                    );

                button.textContent =
                    "✓ Copied!";

                setTimeout(
                    () => {
                        button.textContent =
                            "Copy Code";
                    },
                    1800
                );

            }
        );


    /* =====================================================
       UNSUBSCRIBE
    ===================================================== */

    document
        .getElementById(
            "unsubscribeButton"
        )
        .addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Unsubscribe from CDX Plus+?\n\n" +
                        "Your Plus+ features and DevTools access " +
                        "will be disabled."
                    );

                if (!confirmed) return;

                window.CodeOSPlus
                    .cancelSubscription();

                invalidateDevToolsAccess();

                refreshAccountUI();

                alert(
                    "CDX Plus+ has been cancelled."
                );

            }
        );


    /* =====================================================
       BUTTONS
    ===================================================== */

    document
        .getElementById("heroSubscribe")
        .onclick = openPayment;

    document
        .getElementById("subscribeMonthly")
        .onclick = () => {

            openPayment();

            document
                .querySelector(
                    '[data-plan="monthly"]'
                )
                .click();

        };

    document
        .getElementById("subscribeLifetime")
        .onclick = () => {

            openPayment();

            document
                .querySelector(
                    '[data-plan="lifetime"]'
                )
                .click();

        };


    document
        .getElementById("heroDevTools")
        .onclick = () => {
            location.href =
                "devtools.html";
        };


    document
        .getElementById("openDevTools")
        .onclick = () => {
            location.href =
                "devtools.html";
        };


    document
        .getElementById(
            "devToolsCodeButton"
        )
        .onclick =
            showDevToolsCode;


    document
        .getElementById("closePayment")
        .onclick =
            closePayment;


    document
        .getElementById("closeCode")
        .onclick =
            () => {
                codeOverlay.classList.add(
                    "hidden"
                );
            };


    document
        .getElementById("continuePayment")
        .onclick =
            processPayment;


    document
        .getElementById("finishPayment")
        .onclick =
            () => {

                closePayment();

                document
                    .getElementById(
                        "devtools"
                    )
                    .scrollIntoView({
                        behavior:
                            "smooth"
                    });

            };


    /* =====================================================
       CLICK OUTSIDE MODALS
    ===================================================== */

    paymentOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                paymentOverlay
            ) {
                closePayment();
            }

        }
    );

    codeOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                codeOverlay
            ) {
                codeOverlay.classList.add(
                    "hidden"
                );
            }

        }
    );


    /* =====================================================
       ACCOUNT BUTTON
    ===================================================== */

    document
        .getElementById("accountButton")
        .onclick = () => {

            const status =
                window.CodeOSPlus.getStatus();

            alert(
                status.isPlus
                    ? `👑 CDX Plus+\n\n` +
                      `Member: ${status.displayName}\n` +
                      `Badge: ${status.badge}\n` +
                      `DevTools: ${status.devTools ? "Unlocked" : "Locked"}`
                    : "You're using the CodeOS Free tier."
            );

        };


    /* =====================================================
       INIT
    ===================================================== */

    createParticles();
    refreshAccountUI();

})();

function askForPlusDisplayName() {

    return new Promise(resolve => {

        const existingName =
            window.CodeOSPlus.getDisplayName();

        plusDisplayName.value =
            existingName || "";

        nameError.textContent = "";

        nameOverlay.classList.remove("hidden");

        setTimeout(() => {
            plusDisplayName.focus();
        }, 50);

        function finish(name) {

            nameOverlay.classList.add("hidden");

            confirmNameButton.onclick = null;
            cancelNameButton.onclick = null;

            plusDisplayName.onkeydown = null;

            resolve(name);

        }

        confirmNameButton.onclick = () => {

            const name =
                plusDisplayName.value.trim();

            if (!name) {

                nameError.textContent =
                    "Please enter a display name.";

                plusDisplayName.focus();

                return;
            }

            finish(name);

        };

        cancelNameButton.onclick = () => {

            finish(
                existingName ||
                "CodeOS Creator"
            );

        };

        plusDisplayName.onkeydown = event => {

            if (event.key === "Enter") {

                event.preventDefault();

                confirmNameButton.click();

            }

            if (event.key === "Escape") {

                event.preventDefault();

                cancelNameButton.click();

            }

        };

    });

}