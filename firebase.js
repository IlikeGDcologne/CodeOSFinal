import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    deleteUser,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    push,
    set,
    get,
    update,
    remove,
    onValue,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

/* =========================================================
   🔥 YOUR FIREBASE CONFIG
   =========================================================

   KEEP YOUR REAL VALUES HERE.
   Do NOT use the placeholder values below.
*/

const firebaseConfig = {

    apiKey: "AIzaSyAvpus9SlTgpmPtpMj2h8Ywtjx5zpf0H_s",
    authDomain: "codeos-79eca.firebaseapp.com",
    databaseURL: "https://codeos-79eca-default-rtdb.firebaseio.com",
    projectId: "codeos-79eca",
    storageBucket: "codeos-79eca.firebasestorage.app",
    messagingSenderId: "998922296534",
    appId: "1:998922296534:web:f02b823fbb96b157e37d77"

};

/* =========================================================
   🚀 INITIALIZE FIREBASE
========================================================= */

const app =
    initializeApp(
        firebaseConfig
    );

const auth =
    getAuth(app);

const db =
    getDatabase(app);

const googleProvider =
    new GoogleAuthProvider();

/* =========================================================
   🌐 CODEOS GLOBAL FIREBASE BRIDGE
   Used by workspace.js for Community projects.
========================================================= */

window.codeosFirebase = {
    app,
    auth,
    db,
    googleProvider,

    ref,
    push,
    set,
    get,
    update,
    remove,
    onValue,
    serverTimestamp
};

/* =========================================================
   📦 EXPORTS
========================================================= */

export {
    app,
    auth,
    db,
    googleProvider,

    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    deleteUser,
    updateProfile,

    ref,
    push,
    set,
    get,
    update,
    remove,
    onValue,
    serverTimestamp
};