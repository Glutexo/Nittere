// ==UserScript==
// @name         NTV Live PiP Fix
// @namespace    https://news.ntv.co.jp/
// @version      1.1.0
// @description  Keeps Picture-in-Picture active on the NTV live page in Safari-compatible players.
// @match        https://news.ntv.co.jp/live*
// @run-at       document-idle
// ==/UserScript==

(function () {
  if (window.__ntvPiPFixInstalled) return;
  window.__ntvPiPFixInstalled = true;

  const nativePause = HTMLMediaElement.prototype.pause;
  const nativePlay = HTMLMediaElement.prototype.play;
  const nativeSetPresentationMode = HTMLVideoElement.prototype.webkitSetPresentationMode;
  const state = { lockedVideo: null, graceUntil: 0, lastPiPAt: 0 };
  const now = () => Date.now();

  const isPiP = (video) =>
    !!video &&
    (document.pictureInPictureElement === video ||
      video.webkitPresentationMode === "picture-in-picture");

  const isProtected = (video) =>
    !!video && (isPiP(video) || (video === state.lockedVideo && now() < state.graceUntil));

  function tryResume(video) {
    if (!video) return;
    try {
      const playPromise = nativePlay.call(video);
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch (error) {}
  }

  function arm(video) {
    state.lockedVideo = video;
    state.lastPiPAt = now();
    state.graceUntil = state.lastPiPAt + 5000;
    tryResume(video);
  }

  HTMLMediaElement.prototype.pause = function () {
    if (this instanceof HTMLVideoElement && isProtected(this)) {
      return Promise.resolve();
    }
    return nativePause.apply(this, arguments);
  };

  if (nativeSetPresentationMode) {
    HTMLVideoElement.prototype.webkitSetPresentationMode = function (mode) {
      if (mode === "picture-in-picture") {
        arm(this);
        return nativeSetPresentationMode.apply(this, arguments);
      }

      if (mode === "inline" && isProtected(this)) {
        return this.webkitPresentationMode || "picture-in-picture";
      }

      return nativeSetPresentationMode.apply(this, arguments);
    };
  }

  function bind(video) {
    if (!video || video.__ntvPiPFixBound) return;

    video.__ntvPiPFixBound = true;
    video.disablePictureInPicture = false;
    video.playsInline = true;

    video.addEventListener(
      "webkitpresentationmodechanged",
      () => {
        if (video.webkitPresentationMode === "picture-in-picture") {
          arm(video);
        }
      },
      true
    );

    video.addEventListener("enterpictureinpicture", () => arm(video), true);

    video.addEventListener(
      "leavepictureinpicture",
      () => {
        if (isProtected(video)) {
          setTimeout(() => tryResume(video), 0);
        }
      },
      true
    );

    video.addEventListener(
      "pause",
      () => {
        if (isProtected(video)) {
          setTimeout(() => tryResume(video), 0);
        }
      },
      true
    );
  }

  new MutationObserver(() => {
    document.querySelectorAll("video").forEach(bind);
  }).observe(document.documentElement, { childList: true, subtree: true });

  document.querySelectorAll("video").forEach(bind);
})();
