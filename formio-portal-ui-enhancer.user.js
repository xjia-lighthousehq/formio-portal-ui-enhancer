// ==UserScript==
// @name         Form IO Portal UI Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @author       xjia@lighthousehq
// @description  Form IO Designer UI Improvement (Verified for Portal 9.x; older versions untested)
// @match        *://portal.form.io/*
// @match        *://next.form.io/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    ace: {
      selector: '.row.ng-scope textarea[ng-model], textarea[name*="[message]"], textarea[name*="[transform]"], textarea[name*="[custom]"]',
      urlPattern: /\/project\/[a-zA-Z0-9-]+\/form\/[a-zA-Z0-9-]+\/(settings|action\/[a-zA-Z0-9-]+\/edit|action\/add\/[a-zA-Z0-9-]+)/,
      scripts: [
        "https://cdn.jsdelivr.net/npm/ace-builds/src-min-noconflict/ace.min.js",
        "https://cdn.jsdelivr.net/npm/js-beautify/js/lib/beautify.min.js",
        "https://cdn.jsdelivr.net/npm/js-beautify/js/lib/beautify-html.min.js"
      ],
      theme: "ace/theme/monokai",
      mode: "ace/mode/html",
      fontSize: "14px"
    },
    title: {
      h3Selector: 'h3.form-title',
      linkSelector: 'a[href]'
    },
    selectors: {
      formarea: '.formarea',
      foldable: '.formio-component-container, .formio-component-fieldset, .formio-component-fieldSet, .formio-component-well, .formio-component-panel'
    }
  };

  // --- Combined Styles ---
  const STYLES = `
    :root {
      --dev-accent: #38bdf8;
      --dev-bg: rgba(15, 23, 42, 0.9);
      --dev-bg-header: rgba(30, 41, 59, 0.6);
      --dev-border: rgba(255, 255, 255, 0.1);
      --dev-text: #e2e8f0;
      --dev-text-dim: #94a3b8;
    }

    /* Foldable */
    .formarea .formio-component-container.formio-folded > :not(label):not(.component-btn-group),
    .formarea .formio-component-fieldset.formio-folded > fieldset > :not(legend),
    .formarea .formio-component-fieldSet.formio-folded > fieldset > :not(legend),
    .formarea .formio-component-panel.formio-folded > .panel-body,
    .formarea .formio-component-well.formio-folded > :not(.component-btn-group),
    .formarea .formio-component-fieldset.formio-folded > :not(fieldset):not(.component-btn-group),
    .formarea .formio-component-fieldSet.formio-folded > :not(fieldset):not(.component-btn-group) { display: none !important; }

    .formarea .formio-component-container > label[ref="label"],
    .formarea .formio-component-fieldset > fieldset > legend[ref="header"],
    .formarea .formio-component-fieldSet > fieldset > legend[ref="header"],
    .formarea .formio-component-panel .panel-title,
    .formarea .formio-component-well > label[ref="label"] {
      cursor: pointer !important; user-select: none; position: relative; padding-left: 20px !important;
    }

    .formarea .formio-component-container > label[ref="label"]::before,
    .formarea .formio-component-fieldset > fieldset > legend[ref="header"]::before,
    .formarea .formio-component-panel .panel-title::before,
    .formarea .formio-component-well > label[ref="label"]::before {
      content: '▼'; position: absolute; left: 0; top: 0; font-size: 10px; color: var(--dev-accent); transition: transform 0.2s;
    }

    .formarea [class*="formio-component-"].formio-folded label[ref="label"]::before,
    .formarea [class*="formio-component-"].formio-folded legend[ref="header"]::before,
    .formarea [class*="formio-component-"].formio-folded .panel-title::before { content: '▶'; }

    .formarea .formio-folded { border: 1px dashed var(--dev-accent) !important; background: rgba(0, 123, 255, 0.02) !important; padding-bottom: 5px !important; min-height: auto !important; }
    .formio-injected-header { color: #999 !important; font-style: italic !important; font-weight: normal !important; opacity: 0.8; font-size: 0.9em !important; }

    /* Portal & Map */
    #formio-dev-panel {
      position: fixed; top: 100px; right: 20px; width: 350px; max-height: calc(100vh - 120px); z-index: 10001;
      background: var(--dev-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--dev-border); border-radius: 12px; color: var(--dev-text);
      font-family: 'Inter', sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      display: flex; flex-direction: column; transition: all 0.3s ease; overflow: hidden;
    }
    #formio-dev-panel.minimized { height: 50px !important; width: 50px !important; border-radius: 25px; overflow: hidden; }
    #formio-dev-panel.minimized #formio-dev-panel-header { padding: 0; height: 50px; justify-content: center; border-bottom: none; }
    #formio-dev-panel.minimized #formio-dev-panel-header h3 i { font-size: 20px; margin: 0; display: block; }
    #formio-dev-panel.minimized #formio-dev-panel-header h3 span, #formio-dev-panel.minimized #formio-dev-panel-header .toggle-icon { display: none; }
    #formio-dev-panel.minimized #formio-dev-panel-content { display: none; }

    #formio-dev-panel-header { 
      padding: 10px 16px; height: 42px; box-sizing: border-box; background: var(--dev-bg-header); 
      border-bottom: 1px solid var(--dev-border); display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;
    }
    #formio-dev-panel-header h3 {
      margin: 0; font-size: 13px; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;
    }
    #formio-dev-panel-content { padding: 12px; overflow-y: auto; flex-grow: 1; }
    #formio-dev-panel-content::-webkit-scrollbar { width: 6px; }
    #formio-dev-panel-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

    .dev-form-item { margin-bottom: 10px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); overflow: hidden; transition: border-color 0.2s; }
    .dev-form-item:hover { border-color: rgba(56, 189, 248, 0.3); }
    .dev-form-label { padding: 10px 14px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); transition: all 0.2s; }
    .dev-form-label:hover { background: rgba(255,255,255,0.06); color: var(--dev-accent); }
    .dev-form-details { display: none; padding: 12px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); }
    .dev-form-details.expanded { display: block; }
    .dev-detail-row { margin-bottom: 10px; display: flex; flex-direction: column; gap: 4px; }
    .dev-detail-key { color: var(--dev-text-dim); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .dev-detail-val-container { display: flex; align-items: center; gap: 8px; background: rgba(15,23,42,0.5); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); }
    .dev-detail-val { flex-grow: 1; color: #cbd5e1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; }
    
    .map-item { transition: all 0.2s; text-decoration: none; display: flex; align-items: center; padding: 6px 12px; cursor: pointer; font-size: 11px; color: #cbd5e1; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
    .map-item:hover { background-color: rgba(56, 189, 248, 0.1); color: var(--dev-accent); }
    .map-item.folded { opacity: 0.4; font-style: italic; }
    .map-highlight { outline: 2px solid var(--dev-accent) !important; outline-offset: -2px; box-shadow: 0 0 15px rgba(56, 189, 248, 0.4) !important; z-index: 1000 !important; }

    .copy-btn { cursor: pointer; color: #64748b; font-size: 12px; transition: all 0.2s; }
    .copy-btn:hover { color: var(--dev-accent); transform: scale(1.1); }
    .dev-json-view { display: none; max-height: 200px; overflow: auto; background: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.2); font-family: monospace; font-size: 11px; line-height: 1.5; }
    .dev-json-view.expanded { display: block; }
    .dev-json-view pre { margin: 0; color: #9cdcf1; white-space: pre-wrap; word-break: break-all; }
    .arrow-icon { transition: transform 0.3s; font-size: 10px; opacity: 0.5; }
    .dev-form-item.expanded .arrow-icon { transform: rotate(90deg); }
  `;


  // --- Utilities ---
  const Utils = {
    injectStyles(id, css) {
      if (document.getElementById(id)) return;
      const style = document.createElement('style');
      style.id = id;
      style.innerHTML = css;
      document.head.appendChild(style);
    },
    copyToClipboard(text, btn) {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const originalClass = btn.className;
        btn.className = 'fa fa-check text-info';
        setTimeout(() => { btn.className = originalClass; }, 1000);
      });
    },
    escape(str) {
      if (typeof _ !== 'undefined' && _.escape) return _.escape(str);
      return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    },
    debounce: (fn, delay) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    }
  };

  // --- Dependency Management ---
  const oldDefine = window.define;
  window.define = null;

  function loadDependencies(callback) {
    if (window.ace && window.js_beautify && window.html_beautify) return callback();
    const loadScript = (src) => new Promise((resolve) => {
      const s = document.createElement('script'); s.src = src; s.onload = resolve;
      document.head.appendChild(s);
    });

    Promise.all(CONFIG.ace.scripts.map(loadScript)).then(() => {
      if (oldDefine) window.define = oldDefine;
      callback();
    });
  }


  // --- Feature 1: ACE Editor ---
  const AceEditorFeature = {
    init(el) {
      if (!CONFIG.ace.urlPattern.test(window.location.href)) return;

      const name = el.name || "";
      const isActionPage = window.location.href.includes('/action/');
      if ((name.includes('[message]') || name.includes('[transform]') || name.includes('[custom]')) && !isActionPage) return;

      if (el.nextElementSibling?.classList.contains('ace_editor') || el.dataset.aceInitialized === "true" || el.offsetWidth === 0) return;
      el.dataset.aceInitialized = "true";

      const mode = name.includes('message') ? "ace/mode/nunjucks" :
        (name.includes('transform') || name.includes('custom')) ? "ace/mode/javascript" : CONFIG.ace.mode;

      const ui = this.createUI(el, mode);
      const editor = this.setupEditor(ui.editorContainer, el.value, mode);

      this.bindEvents(el, editor, ui.prettifyBtn, mode);
      this.setupObserver(el, editor, ui.editorContainer);
      setTimeout(() => editor.resize(), 200);
    },

    createUI(el, mode) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin: 15px 0; position: relative; width: 100%;';

      const label = mode.includes('nunjucks') || mode.includes('javascript') ? 'Prettify Code' : 'Prettify HTML';
      wrapper.innerHTML = `
        <button type="button" class="btn btn-dark btn-sm mb-2" style="font-weight:bold;">${label}</button>
        <div style="width:100%; height:300px; border:1px solid #444;"></div>
      `;

      if (el.parentNode) {
        el.parentNode.insertBefore(wrapper, el.nextSibling);
        el.style.display = 'none';
      }
      return { editorContainer: wrapper.lastElementChild, prettifyBtn: wrapper.firstElementChild };
    },

    setupEditor(container, initialValue, mode) {
      const editor = ace.edit(container);
      ace.config.set('basePath', 'https://cdn.jsdelivr.net/npm/ace-builds/src-min-noconflict/');
      editor.setTheme(CONFIG.ace.theme);
      editor.session.setMode(mode || CONFIG.ace.mode);
      editor.setOptions({ fontSize: CONFIG.ace.fontSize, showPrintMargin: false, useSoftTabs: true, tabSize: 2, wrap: true, useWorker: false });
      editor.setValue(initialValue || '', -1);
      return editor;
    },

    bindEvents(el, editor, btn, mode) {
      btn.onclick = (e) => {
        e.preventDefault();
        const val = editor.getValue();
        try {
          let pretty = "";
          if (mode.includes('javascript') && window.js_beautify) {
            pretty = window.js_beautify(val, { indent_size: 2, space_after_anon_function: true });
          } else if (window.html_beautify) {
            pretty = window.html_beautify(val, { indent_size: 2, wrap_line_length: 0, preserve_newlines: true, unformatted: ['em', 'strong', 'span'] });
          }
          if (pretty) editor.setValue(pretty, -1);
        } catch (err) { console.error('[Ace] Prettify failed:', err); }
      };

      editor.getSession().on('change', () => {
        el.value = editor.getValue();
        ['input', 'change'].forEach(type => el.dispatchEvent(new Event(type, { bubbles: true })));
      });
    },

    setupObserver(el, editor, container) {
      new MutationObserver(() => {
        if (document.activeElement !== container && el.value !== editor.getValue()) editor.setValue(el.value, -1);
      }).observe(el, { attributes: true, attributeFilter: ['value'] });
    }
  };


  // --- Feature 2: Form Title & DOM Management ---
  const FormTitleFeature = {
    run() {
      const h3 = document.querySelector(CONFIG.title.h3Selector);
      if (!h3 || h3.innerText.includes('... Form')) return;

      // Fix layout
      const parent = h3.parentElement;
      if (parent?.tagName === 'DIV') {
        parent.className = 'col-12';
        if (parent.nextElementSibling?.tagName === 'DIV') parent.nextElementSibling.className = 'col-12';
      }

      this.fetchTitle(h3);
      this.flattenNavigation();
    },

    fetchTitle(h3) {
      const anchor = h3.querySelector(CONFIG.title.linkSelector);
      if (!anchor || h3.dataset.lastHref === anchor.href) return;

      const token = window.Formio?.getToken?.();
      if (!token) return;

      h3.dataset.lastHref = anchor.href;
      fetch(anchor.href, { headers: { 'x-jwt-token': token, 'Accept': 'application/json' } })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.title && h3.childNodes.length > 0) h3.childNodes[0].textContent = ` ${data.title} Form `;
        })
        .catch(err => console.error('[Formio Title] Fetch failed:', err));
    },

    flattenNavigation() {
      const nav = document.querySelector('#form-navigation .nav-pills');
      const menu = nav?.querySelector('.dropdown-menu');
      if (!menu) return;

      const items = menu.querySelectorAll('.dropdown-item:not(.deleted-move)');
      items.forEach(link => {
        const text = link.innerText.toLowerCase();
        if (text.includes('delete')) return;

        // Skip duplicates (Edit, Use, Embed, etc. are already buttons)
        // Duplicates in FormIO have d-block d-xs-none classes
        if (link.classList.contains('d-xs-none') || link.classList.contains('d-sm-none')) {
          link.remove(); // Remove duplicate link from dropdown
          return;
        }

        // Move unique items (Revisions, API, Logs, Settings) to top level
        const li = document.createElement('li');
        li.className = 'nav-item';
        link.classList.remove('dropdown-item');
        link.classList.add('nav-link', 'btn-sm', 'btn-xs', 'deleted-move');
        li.appendChild(link);
        nav.insertBefore(li, menu.closest('.dropdown'));
      });
    }
  };


  // --- Feature 3: Foldable Containers (Designer) ---
  const FoldableFeature = {
    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;
      Utils.injectStyles('formio-helper-styles', STYLES);
      this.bindEvents();
    },


    bindEvents() {
      document.addEventListener('click', (e) => {
        const target = e.target;
        const comp = target.closest(CONFIG.selectors.foldable);
        if (!comp || !comp.closest(CONFIG.selectors.formarea)) return;

        // Ignore simple inputs
        if (comp.classList.contains('formio-component-radio') || comp.classList.contains('formio-component-checkbox')) return;

        const header = comp.querySelector('label[ref="label"], legend[ref="header"], .panel-title');
        if (header && (header === target || header.contains(target))) {
          if (['INPUT', 'A', 'BUTTON'].includes(target.tagName)) return;
          comp.classList.toggle('formio-folded');
        }
      }, true);
    },

    ensureHeaders() {
      const area = document.querySelector(CONFIG.selectors.formarea);
      if (!area) return;

      area.querySelectorAll(CONFIG.selectors.foldable).forEach(comp => {
        if (comp.classList.contains('formio-component-radio') || comp.classList.contains('formio-component-checkbox')) return;

        const fs = comp.querySelector('fieldset');
        if (fs && !fs.querySelector('legend')) {
          const leg = document.createElement('legend');
          leg.setAttribute('ref', 'header');
          leg.className = 'formio-injected-header';
          leg.innerText = '(not set)';
          fs.prepend(leg);
        } else if (!comp.querySelector('label[ref="label"], legend[ref="header"], .panel-title')) {
          const lab = document.createElement('label');
          lab.setAttribute('ref', 'label');
          lab.className = 'formio-injected-header col-form-label';
          lab.innerText = '(not set)';
          comp.prepend(lab);
        }
      });
    }
  };


  // --- Feature 4: Form Structure Mini-Map ---
  const FormMapFeature = {
    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;
    },

    updateMap() {
      const designer = document.querySelector('.formio-builder-form');
      const container = document.querySelector('#dev-structure-item .map-content');
      if (!designer || !container) {
        if (container?.parentElement) container.parentElement.style.display = 'none';
        return;
      }
      container.parentElement.style.display = 'block';

      const components = Array.from(designer.querySelectorAll(CONFIG.selectors.foldable));
      const html = _.map(components, comp => {
        const label = comp.querySelector('label[ref="label"], legend[ref="header"], .panel-title');
        const title = (label?.innerText || 'Unnamed Component').trim().split('\n')[0];

        let type = 'Comp';
        const cls = comp.className.toLowerCase();
        ['fieldset', 'container', 'panel', 'well'].forEach(t => { if (cls.includes(t)) type = _.capitalize(t); });

        let depth = 0, p = comp.parentElement;
        while (p && p !== designer) { if (p.matches(CONFIG.selectors.foldable)) depth++; p = p.parentElement; }

        return `
          <div class="map-item ${comp.classList.contains('formio-folded') ? 'folded' : ''}" 
               data-target-id="${comp.id}" style="padding-left: ${16 + (depth * 15)}px !important">
            <span class="flex-grow-1 text-truncate">${Utils.escape(title)}</span>
            <span class="ms-2 opacity-50" style="font-size: 9px; text-transform: uppercase;">${type}</span>
          </div>
        `;
      }).join('') || '<div class="map-item text-muted p-3">No components found</div>';

      if (container.innerHTML !== html) {
        container.innerHTML = html;
        container.onclick = (e) => {
          const item = e.target.closest('.map-item');
          const target = item ? document.getElementById(item.dataset.targetId) : null;
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('map-highlight');
            setTimeout(() => target.classList.remove('map-highlight'), 1500);
          }
        };
      }
    }
  };


  // --- Feature 5: Form Developer Portal ---
  const FormDevPortalFeature = {
    init() {
      if (this.isInitialized) return;
      this.isInitialized = true;
      this.createUI();
    },

    createUI() {
      if (document.getElementById('formio-dev-panel')) return;
      const p = document.createElement('div');
      p.id = 'formio-dev-panel';
      p.innerHTML = `
        <div id="formio-dev-panel-header">
          <h3><i class="fa fa-terminal"></i> <span>Form Overview for Developer</span></h3>
          <i class="fa fa-chevron-down toggle-icon"></i>
        </div>
        <div id="formio-dev-panel-content">
          <div id="dev-forms-list"></div>
          <div id="dev-structure-item" class="dev-form-item" style="display:none;">
            <div class="dev-form-label">
              <span><i class="fa fa-sitemap me-2"></i> Form Structure</span>
              <i class="fa fa-chevron-right arrow-icon"></i>
            </div>
            <div class="dev-form-details map-content p-0" style="background: rgba(0,0,0,0.4);"></div>
          </div>
        </div>
      `;

      const header = p.querySelector('#formio-dev-panel-header');
      header.onclick = () => {
        const min = p.classList.toggle('minimized');
        localStorage.setItem('formio-dev-minimized', min);
        header.querySelector('.toggle-icon').className = `fa fa-chevron-${min ? 'up' : 'down'} toggle-icon`;
      };

      if (localStorage.getItem('formio-dev-minimized') === 'true') {
        p.classList.add('minimized');
        header.querySelector('.toggle-icon').className = 'fa fa-chevron-up toggle-icon';
      }

      document.body.appendChild(p);

      // Event Delegation for the whole panel
      p.onclick = (e) => {
        const target = e.target;

        // Toggle Expanded
        const label = target.closest('.dev-form-label');
        if (label) {
          const item = label.parentElement;
          const details = label.nextElementSibling;
          const isExp = details.classList.toggle('expanded');
          item.classList.toggle('expanded', isExp);
          return;
        }

        // JSON Toggle
        const jsonExpBtn = target.closest('.dev-json-toggle');
        if (jsonExpBtn && (target.tagName === 'SPAN' || target.closest('span'))) {
          const view = jsonExpBtn.nextElementSibling;
          const isExp = view.classList.toggle('expanded');
          const span = jsonExpBtn.querySelector('span span');
          const icon = jsonExpBtn.querySelector('i.fa');
          if (span) span.innerText = isExp ? 'Hide JSON' : 'View JSON';
          if (icon) icon.className = `fa fa-eye${isExp ? '-slash' : ''}`;
          return;
        }

        // Copy Button
        const copyBtn = target.closest('.copy-btn');
        if (copyBtn) {
          Utils.copyToClipboard(copyBtn.dataset.value, copyBtn);
        }
      };
    },

    update() {
      if (!window.Formio || !document.getElementById('formio-dev-panel')) return;

      const list = document.getElementById('dev-forms-list');
      const forms = window.Formio.forms || {};

      let html = '';
      _.forEach(forms, (inst, key) => {
        if (!inst?._form?.title) return;

        const f = inst._form;
        const sub = inst.submission || {};
        const data = inst.data || {};

        let stage = "Live";
        const mName = f.machineName || "";
        if (mName.includes(':')) {
          const env = mName.split(':')[0];
          if (env.includes('-')) stage = _.capitalize(env.split('-')[0]);
        }

        const dataStr = JSON.stringify(data, null, 2);

        html += `
          <div class="dev-form-item" data-key="${key}">
            <div class="dev-form-label"><span>${Utils.escape(f.title)}</span><i class="fa fa-chevron-right arrow-icon"></i></div>
            <div class="dev-form-details">
              ${this.renderRow('Path', f.path)}
              ${this.renderRow('Name', f.name)}
              ${this.renderRow('Stage', stage)}
              ${this.renderRow('Submission ID', sub._id || 'N/A')}
              <div class="dev-detail-row">
                <span class="dev-detail-key">Data</span>
                <div class="btn-group dev-json-toggle mt-1">
                  <span class="badge bg-info text-dark" style="cursor:pointer;"><i class="fa fa-eye"></i> <span>View JSON</span></span>
                  <i class="fa fa-copy copy-btn ms-2" title="Copy JSON" data-value='${dataStr.replace(/'/g, "&apos;").replace(/"/g, "&quot;")}'></i>
                </div>
                <div class="dev-json-view mt-2"><pre>${Utils.escape(dataStr)}</pre></div>
              </div>
            </div>
          </div>
        `;
      });

      const panel = document.getElementById('formio-dev-panel');
      const hasMap = document.getElementById('dev-structure-item')?.style.display !== 'none';
      panel.style.display = (html || hasMap) ? 'flex' : 'none';

      if (list && list.dataset.lastContent !== html) {
        // Save expansion states
        const expandedItems = _.map(list.querySelectorAll('.dev-form-item.expanded'), el => el.dataset.key);
        const expandedJSONs = _.map(list.querySelectorAll('.dev-form-item .dev-json-view.expanded'), el => el.closest('.dev-form-item').dataset.key);

        list.innerHTML = html;
        list.dataset.lastContent = html;

        // Restore expansion states
        _.forEach(expandedItems, key => {
          const item = list.querySelector(`.dev-form-item[data-key="${key}"]`);
          if (item) {
            item.classList.add('expanded');
            item.querySelector('.dev-form-details').classList.add('expanded');
          }
        });
        _.forEach(expandedJSONs, key => {
          const item = list.querySelector(`.dev-form-item[data-key="${key}"]`);
          const jsonView = item?.querySelector('.dev-json-view');
          if (jsonView) {
            jsonView.classList.add('expanded');
            const toggleText = item.querySelector('.dev-json-toggle span span');
            if (toggleText) toggleText.innerText = 'Hide JSON';
            const toggleIcon = item.querySelector('.dev-json-toggle i.fa-eye');
            if (toggleIcon) toggleIcon.className = 'fa fa-eye-slash';
          }
        });
      }
    },

    renderRow(label, val) {
      return `
        <div class="dev-detail-row">
          <span class="dev-detail-key">${label}</span>
          <div class="dev-detail-val-container">
            <span class="dev-detail-val" title="${val}">${Utils.escape(val)}</span>
            <i class="fa fa-copy copy-btn" title="Copy ${label}" data-value='${Utils.escape(val)}'></i>
          </div>
        </div>
      `;
    }
  };

  // --- Main Execution ---
  loadDependencies(() => {
    FoldableFeature.init();
    FormMapFeature.init();
    FormDevPortalFeature.init();

    // Use a debounced update function for efficiency
    const runUpdates = Utils.debounce(() => {
      // 1. Ace Editor
      document.querySelectorAll(CONFIG.ace.selector).forEach(el => AceEditorFeature.init(el));
      // 2. Form Title
      FormTitleFeature.run();
      // 3. Foldable & Map
      FoldableFeature.ensureHeaders();
      FormMapFeature.updateMap();
      // 4. Dev Portal
      FormDevPortalFeature.update();
    }, 500);

    // Initial run
    runUpdates();

    // Set up MutationObserver to replace setInterval
    const observer = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some(m =>
        m.addedNodes.length > 0 ||
        (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'style'))
      );
      if (shouldUpdate) runUpdates();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Fallback interval for pure data changes (window.Formio.forms) which 
    // might not trigger DOM mutations immediately
    setInterval(FormDevPortalFeature.update.bind(FormDevPortalFeature), 5000);
  });

})();