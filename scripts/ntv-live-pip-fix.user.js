// ==UserScript==
// @name         NTV Live PiP Fix
// @namespace    https://news.ntv.co.jp/
// @version      1.0.0
// @description  Keeps Picture-in-Picture alive on the NTV live page in Safari-compatible players.
// @match        https://news.ntv.co.jp/live*
// @run-at       document-idle
// ==/UserScript==

(function () {
  if (window.__ntvPiPFixInstalled) return;
  window.__ntvPiPFixInstalled = true;

  const nativePause = HTMLMediaElement.prototype.pause;
  const nativePlay = HTMLMediaElement.prototype.play;
  const nativeRequestPiP = HTMLVideoElement.prototype.requestPictureInPicture;
  const state = { lockedVideo: null, graceUntil: 0 };
  const now = () => Date.now();
  const isPiP = (video) =>
    !!video &&
    (document.pictureInPictureElement === video ||
      video.webkitPresentationMode === "picture-in-picture");

  HTMLMediaElement.prototype.pause = function () {
    if (
      this instanceof HTMLVideoElement &&
      (isPiP(this) || (this === state.lockedVideo && now() < state.graceUntil))
    ) {
      return Promise.resolve();
    }
    return nativePause.apply(this, arguments);
  };

  function tryResume(video) {
    if (!video) return;
    try {
      const playPromise = nativePlay.call(video);
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch (error) {}
  }

  async function tryReenter(video) {
    if (!video || !document.contains(video)) return;

    tryResume(video);

    try {
      if (
        video.webkitSupportsPresentationMode &&
        video.webkitSupportsPresentationMode("picture-in-picture")
      ) {
        video.webkitSetPresentationMode("picture-in-picture");
        return;
      }
    } catch (error) {}

    try {
      if (nativeRequestPiP) {
        await nativeRequestPiP.call(video);
      }
    } catch (error) {}
  }

  function bind(video) {
    if (!video || video.__ntvPiPFixBound) return;

    video.__ntvPiPFixBound = true;
    video.disablePictureInPicture = false;
    video.playsInline = true;

    const arm = () => {
      state.lockedVideo = video;
      state.graceUntil = now() + 4000;
      tryResume(video);
    };

    video.addEventListener(
      "webkitpresentationmodechanged",
      () => {
        if (video.webkitPresentationMode === "picture-in-picture") {
          arm();
          return;
        }
        if (state.lockedVideo === video && now() < state.graceUntil) {
          setTimeout(() => tryReenter(video), 80);
        }
      },
      true
    );

    video.addEventListener("enterpictureinpicture", arm, true);
    video.addEventListener(
      "leavepictureinpicture",
      () => {
        if (state.lockedVideo === video && now() < state.graceUntil) {
          setTimeout(() => tryReenter(video), 80);
        }
      },
      true
    );

    video.addEventListener(
      "pause",
      () => {
        if (isPiP(video) || now() < state.graceUntil) {
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
