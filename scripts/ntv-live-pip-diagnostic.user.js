// ==UserScript==
// @name         NTV Live PiP Diagnostic
// @namespace    https://news.ntv.co.jp/
// @version      1.0.0
// @description  Logs Picture-in-Picture teardown signals on the NTV live page.
// @match        https://news.ntv.co.jp/live*
// @run-at       document-idle
// ==/UserScript==

(function () {
  const MAX_LOG = 400;
  const now = () => new Date().toISOString();
  const short = (value) => {
    try {
      if (value === window) return "[window]";
      if (value === document) return "[document]";
      if (value instanceof HTMLVideoElement) {
        return `[video ${value.currentSrc || value.src || "no-src"}]`;
      }
      if (value && value.nodeType === 1) {
        return `<${value.tagName.toLowerCase()}${value.id ? `#${value.id}` : ""}>`;
      }
      if (typeof value === "string") return value.slice(0, 180);
      return String(value).slice(0, 180);
    } catch (error) {
      return "[unprintable]";
    }
  };

  const logStore = (window.__ntvPiPDiag = window.__ntvPiPDiag || []);
  const push = (type, data = {}) => {
    const row = { ts: now(), type, ...data };
    logStore.push(row);
    if (logStore.length > MAX_LOG) logStore.shift();
    try {
      console.log("[ntv-pip-diag]", row);
    } catch (error) {}
  };

  if (window.__ntvPiPDiagInstalled) {
    push("reinstall");
    return;
  }

  window.__ntvPiPDiagInstalled = true;
  window.__ntvPiPDiagExport = () => JSON.stringify(logStore, null, 2);

  const nativePause = HTMLMediaElement.prototype.pause;
  const nativePlay = HTMLMediaElement.prototype.play;
  const nativeSetPiP = HTMLVideoElement.prototype.webkitSetPresentationMode;
  const nativeReqPiP = HTMLVideoElement.prototype.requestPictureInPicture;
  const nativeExitPiP = Document.prototype.exitPictureInPicture;

  HTMLMediaElement.prototype.pause = function () {
    push("call.pause", {
      target: short(this),
      mode: this.webkitPresentationMode || "",
      paused: this.paused,
      readyState: this.readyState,
      stack: new Error().stack?.split("\n").slice(1, 5).join(" | "),
    });
    return nativePause.apply(this, arguments);
  };

  HTMLMediaElement.prototype.play = function () {
    push("call.play", {
      target: short(this),
      mode: this.webkitPresentationMode || "",
      paused: this.paused,
      readyState: this.readyState,
      stack: new Error().stack?.split("\n").slice(1, 5).join(" | "),
    });
    return nativePlay.apply(this, arguments);
  };

  if (nativeSetPiP) {
    HTMLVideoElement.prototype.webkitSetPresentationMode = function (mode) {
      push("call.webkitSetPresentationMode", {
        target: short(this),
        modeArg: mode,
        currentMode: this.webkitPresentationMode || "",
        paused: this.paused,
        stack: new Error().stack?.split("\n").slice(1, 5).join(" | "),
      });
      return nativeSetPiP.apply(this, arguments);
    };
  }

  if (nativeReqPiP) {
    HTMLVideoElement.prototype.requestPictureInPicture = function () {
      push("call.requestPictureInPicture", {
        target: short(this),
        currentMode: this.webkitPresentationMode || "",
        paused: this.paused,
        stack: new Error().stack?.split("\n").slice(1, 5).join(" | "),
      });
      return nativeReqPiP.apply(this, arguments);
    };
  }

  if (nativeExitPiP) {
    Document.prototype.exitPictureInPicture = function () {
      push("call.exitPictureInPicture", {
        stack: new Error().stack?.split("\n").slice(1, 5).join(" | "),
      });
      return nativeExitPiP.apply(this, arguments);
    };
  }

  const watchVideo = (video) => {
    if (!video || video.__ntvPiPDiagBound) return;
    video.__ntvPiPDiagBound = true;
    push("bind.video", { target: short(video) });

    [
      "webkitpresentationmodechanged",
      "enterpictureinpicture",
      "leavepictureinpicture",
      "pause",
      "play",
      "playing",
      "loadeddata",
      "emptied",
      "abort",
      "stalled",
      "suspend",
      "ended",
      "error",
    ].forEach((type) => {
      video.addEventListener(
        type,
        () => {
          push(`event.${type}`, {
            target: short(video),
            mode: video.webkitPresentationMode || "",
            paused: video.paused,
            readyState: video.readyState,
            currentSrc: video.currentSrc || video.src || "",
          });
        },
        true
      );
    });
  };

  const watchTarget = (target, label, events) => {
    events.forEach((type) => {
      target.addEventListener(
        type,
        () => {
          push(`event.${type}`, {
            target: label,
            hidden: document.hidden,
            visibilityState: document.visibilityState,
          });
        },
        true
      );
    });
  };

  watchTarget(document, "document", ["visibilitychange", "webkitvisibilitychange", "fullscreenchange"]);
  watchTarget(window, "window", ["pagehide", "pageshow", "blur", "focus", "freeze", "resume"]);

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLVideoElement) {
          push("mutation.videoAdded", { target: short(node) });
          watchVideo(node);
        } else if (node && node.querySelectorAll) {
          node.querySelectorAll("video").forEach((video) => {
            push("mutation.videoNested", { target: short(video) });
            watchVideo(video);
          });
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node instanceof HTMLVideoElement) {
          push("mutation.videoRemoved", { target: short(node) });
        }
      });
    });

    document.querySelectorAll("video").forEach(watchVideo);
  }).observe(document.documentElement, { childList: true, subtree: true });

  document.querySelectorAll("video").forEach(watchVideo);
  push("installed", { href: location.href, userAgent: navigator.userAgent });
})();
