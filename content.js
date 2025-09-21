// === flags & CSS injection ===
document.documentElement.classList.add("piazza-legacyizer-active");

function injectCSS(href) {
  const url = chrome.runtime.getURL(href);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.documentElement.appendChild(link);
}
injectCSS("styles/skin.min.css"); // (your saved legacy skin; optional)
injectCSS("styles/content.min.css"); // (editor)
injectCSS("styles/content2.min.css"); // (editor)
injectCSS("styles/legacy-overrides.css"); // <-- OUR big override sheet (last)

// === DOM mapping: add stable classes the CSS can use ===
function stamp() {
  const $ = (sel) => document.querySelector(sel);

  // Top bar / header
  ($('[data-test="top-nav"], header[role="banner"]') || 0)?.classList.add(
    "legacy-header"
  );

  // Left rail (sections)
  (
    $('[data-test="left-rail"], nav[aria-label="Sections"]') || 0
  )?.classList.add("legacy-left-rail");

  // Optional right rail (hide for legacy feel)
  ($('[data-test="right-rail"]') || 0)?.classList.add("legacy-right-rail");

  // Thread list (list + items)
  const tl = $('[data-test="thread-list"]');
  if (tl) {
    tl.classList.add("legacy-thread-list");
    tl.querySelectorAll(
      '[role="listitem"], [data-test^="thread-row"], a[href*="/post/"]'
    ).forEach((el) => el.classList.add("legacy-thread-row"));
  }

  // Main thread/article container
  ($('[data-test="thread-container"], main article') || 0)?.classList.add(
    "legacy-thread"
  );

  // Post header & meta inside thread
  ($('[data-test="post-header"], article header') || 0)?.classList.add(
    "legacy-post-header"
  );
  ($('[data-test="post-meta"], [data-test="tag-list"]') || 0)?.classList.add(
    "legacy-post-meta"
  );

  // Composer / editor
  (
    $('[data-test="composer"], [data-test="editor-container"]') || 0
  )?.classList.add("legacy-composer");

  // Search bar
  ($('[data-test="search"], form[role="search"]') || 0)?.classList.add(
    "legacy-search"
  );

  // Generic buttons
  document
    .querySelectorAll('button, [role="button"], .btn')
    .forEach((b) => b.classList.add("legacy-button"));
}

// Run now and keep re-stamping on SPA changes
stamp();
const mo = new MutationObserver((m) => {
  for (const rec of m) {
    if (rec.type === "childList" || rec.type === "attributes") {
      stamp();
      break;
    }
  }
});
mo.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
});

// SPA route awareness
const { pushState, replaceState } = history;
history.pushState = function () {
  const r = pushState.apply(this, arguments);
  stamp();
  return r;
};
history.replaceState = function () {
  const r = replaceState.apply(this, arguments);
  stamp();
  return r;
};
addEventListener("popstate", stamp);
