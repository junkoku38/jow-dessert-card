/**
 * dessert-card — Le dessert du jour, avec suggestion IA.
 *
 * Affiche le dessert planifié pour aujourd'hui (photo, ingrédients,
 * calories, lien vers la recette). Barre de saisie libre pour demander
 * un dessert à l'IA. Sélecteur de nombre de parts.
 *
 * Fonctionne avec l'intégration jow-dessert (domaine jow_dessert).
 */

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

const DEFAUTS = {
  entity: "sensor.dessert_du_jour",
  suggest_service: "jow_dessert.suggest",
  clear_service: "jow_dessert.clear",
  set_covers_service: "jow_dessert.set_covers",
  show_calories: true,
};

const ETATS_VIDES = ["unknown", "unavailable", "none", "", "Rien de prévu"];

const STYLES = `
  :host {
    --encre:     #1A1816;
    --encre-2:   #2E2A25;
    --filet:     #34302A;
    --filet-fin: #2A2620;
    --papier:    #F2EFE9;
    --gris:      #A39D93;
    --gris-2:    #6E6961;
    --accent:    #C9846B;
  }

  .carte {
    background: var(--encre);
    color: var(--papier);
    border-radius: 14px;
    overflow: hidden;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  .carte p, .carte h1, .carte h2 { margin: 0; }
  .mono { font-family: ui-monospace, "SF Mono", "Roboto Mono", Menlo, monospace; }

  .photo {
    display: block; width: 100%; height: 200px;
    object-fit: cover; background: var(--encre-2);
  }
  .detail { padding: 20px 22px 22px; }
  .detail.sans-photo { padding-top: 26px; }

  .surtitre {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.63rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--gris);
  }
  .titre { margin: 9px 0 0; font-size: 1.62rem; font-weight: 500; line-height: 1.15; letter-spacing: -0.02em; }
  .titre:focus { outline: none; }
  .sans-photo .titre { font-size: 2rem; line-height: 1.1; letter-spacing: -0.025em; margin-top: 12px; }

  .meta {
    display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;
  }
  .meta .chip {
    display: flex; flex-direction: column; gap: 2px;
    padding: 8px 12px; border: 1px solid var(--filet); border-radius: 8px;
    background: var(--encre-2);
  }
  .meta .chip .v { font-size: 0.95rem; font-weight: 500; color: var(--papier); line-height: 1; }
  .meta .chip .l { font-size: 0.6rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gris); }

  .compo { margin-top: 16px; }
  .compo-titre { font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gris); margin-bottom: 8px; }
  .compo ul { list-style: none; padding: 0; margin: 0; font-size: 0.85rem; line-height: 1.5; }
  .compo li {
    display: flex; align-items: baseline; gap: 10px;
    padding: 5px 0; border-bottom: 1px solid var(--filet-fin); color: var(--papier);
  }
  .compo li:last-child { border-bottom: 0; }
  .compo li .q { flex: none; min-width: 70px; font-family: ui-monospace, monospace; font-size: 0.75rem; color: var(--gris); }
  .compo li .n { flex: 1; }

  .actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: 18px; }
  .bouton {
    display: inline-flex; align-items: center; gap: 7px;
    min-height: 44px; padding: 0 16px;
    border: 1px solid #4A443C; border-radius: 8px;
    background: none; color: var(--papier);
    font: inherit; font-size: 0.81rem; text-decoration: none; cursor: pointer;
  }
  .bouton:hover { border-color: var(--gris); }
  .bouton:focus-visible { outline: 2px solid var(--papier); outline-offset: 2px; }
  .bouton[disabled] { opacity: 0.5; cursor: progress; }

  .suggest-bar { display: flex; gap: 0; margin-top: 12px; }
  .suggest-bar input {
    flex: 1; border: 1px solid var(--filet); border-radius: 8px 0 0 8px;
    background: var(--encre-2); color: var(--papier);
    font: inherit; font-size: 0.81rem; padding: 8px 12px; outline: none;
  }
  .suggest-bar input::placeholder { color: var(--gris); }
  .suggest-bar input:focus { border-color: var(--gris); }
  .suggest-bar button {
    border: 1px solid var(--filet); border-left: none; border-radius: 0 8px 8px 0;
    background: none; color: var(--papier); padding: 8px 14px;
    font: inherit; font-size: 0.81rem; cursor: pointer;
  }
  .suggest-bar button:hover { border-color: var(--gris); }
  .suggest-bar button:disabled { opacity: 0.5; cursor: progress; }

  .vide-total { padding: 34px 22px; text-align: center; color: var(--gris); font-size: 0.87rem; }

  .toast {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: var(--encre); color: var(--papier); padding: 10px 20px;
    border-radius: 8px; font-size: 0.85rem; z-index: 9999;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3); opacity: 0;
    transition: opacity 0.3s; pointer-events: none;
  }
  .toast.show { opacity: 0.95; }

  .dialogue-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10001;
    display: flex; align-items: center; justify-content: center;
  }
  .dialogue {
    background: var(--encre); color: var(--papier); border-radius: 12px;
    padding: 24px; max-width: 340px; width: calc(100% - 32px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 10002;
    font-size: 0.88rem; line-height: 1.5;
  }
  .dialogue-msg { margin: 0 0 18px; }
  .dialogue-boutons { display: flex; gap: 10px; justify-content: flex-end; }
  .dialogue-boutons button {
    min-height: 44px; padding: 0 18px;
    border: 1px solid var(--filet); border-radius: 8px;
    background: none; color: var(--papier);
    font: inherit; font-size: 0.85rem; cursor: pointer;
  }
  .dialogue-boutons button:hover { border-color: var(--gris); }
  .dialogue-boutons button.danger { border-color: #a33; color: #e88; }
  .dialogue-boutons button.danger:hover { background: #a33; color: var(--papier); }

  @media (max-width: 420px) {
    .detail { padding-left: 16px; padding-right: 16px; }
    .titre { font-size: 1.4rem; }
    .sans-photo .titre { font-size: 1.7rem; }
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

class DessertCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._signature = null;
    this._occupe = false;
    this._imagesKO = new Set();
    this._dernierRemplacement = 0;
  }

  static getConfigElement() { return document.createElement("dessert-card-editor"); }

  setConfig(config) {
    this._config = { ...DEFAUTS, ...config };
    this._signature = null;
    this._occupe = false;
  }

  get hass() { return this._hass; }
  set hass(hass) {
    this._hass = hass;
    const ent = this._config.entity;
    const s = hass.states[ent];
    const sig = s ? `${s.state}:${s.last_updated}` : "absent";
    if (sig === this._signature && !this._forceRender) return;
    this._signature = sig;
    this._forceRender = false;
    this._render();
  }

  getCardSize() {
    if (!this._hass) return 6;
    const s = this._hass.states[this._config.entity];
    return s && s.state !== "Rien de prévu" ? 6 : 3;
  }

  static getStubConfig() { return { type: "custom:dessert-card", entity: "sensor.dessert_du_jour" }; }

  _esc(t) {
    const d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML;
  }

  _url(brut, imageAutorisee = false) {
    if (!brut) return null;
    const t = String(brut).trim();
    if (/^https?:\/\//i.test(t)) return this._esc(t);
    if (imageAutorisee && /^data:image\//i.test(t)) return this._esc(t);
    return null;
  }

  _aujourdhui() { return (new Date().getDay() + 6) % 7; }

  _dessert() {
    const s = this._hass?.states[this._config.entity];
    if (!s) return null;
    const a = s.attributes || {};
    const nom = s.state;
    const planned = !!nom && !ETATS_VIDES.includes(String(nom).trim().toLowerCase());
    if (!planned) return { planned: false, nom: "" };
    return {
      planned: true,
      nom: nom,
      image: a.image || a.entity_picture || null,
      url: a.url || null,
      calories: a.calories ?? null,
      covers: a.covers || 4,
      ingredients: a.ingredients || [],
      description: a.description || null,
      preparation_time: a.preparation_time || null,
      cooking_time: a.cooking_time || null,
      source: a.source || null,
    };
  }

  _render() {
    if (!this._hass || !this._config) return;
    const d = this._dessert();
    const occupe = this._occupe;

    if (!d || !d.planned) {
      this.shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        <div class="carte">
          <p class="surtitre mono" style="padding:20px 22px 0">Dessert du jour</p>
          <p class="vide-total">Aucun dessert prévu aujourd'hui.</p>
          <div style="padding:0 22px 20px">
            <div class="suggest-bar">
              <input type="text" data-suggest-input="0" placeholder="Proposer un dessert… (ex: gâteau au chocolat)"${occupe ? " disabled" : ""}>
              <button data-suggest-go="0"${occupe ? " disabled" : ""}>${occupe ? "…" : "Go"}</button>
            </div>
          </div>
        </div>`;
      this._brancher();
      return;
    }

    const photo = this._imagesKO.has(0) ? null : this._url(d.image, true);
    const lien = this._url(d.url);
    const sansPhoto = !photo;

    const chips = [];
    if (this._config.show_calories && d.calories != null) {
      chips.push(`<div class="chip"><span class="v">${d.calories} kcal</span><span class="l">par part</span></div>`);
    }
    chips.push(`<div class="chip"><span class="v">${d.covers}</span><span class="l">parts</span></div>`);
    if (d.preparation_time) {
      chips.push(`<div class="chip"><span class="v">${d.preparation_time} min</span><span class="l">préparation</span></div>`);
    }
    if (d.cooking_time) {
      chips.push(`<div class="chip"><span class="v">${d.cooking_time} min</span><span class="l">cuisson</span></div>`);
    }

    const items = (d.ingredients || []).map((i) => {
      const q = i.quantity
        ? `<span class="q">${this._esc(i.quantity)}${i.unit ? " " + this._esc(i.unit) : ""}</span>`
        : `<span class="q"></span>`;
      return `<li>${q}<span class="n">${this._esc(i.name)}</span></li>`;
    });
    const compo = items.length
      ? `<div class="compo"><p class="compo-titre">Ingrédients · ${items.length}</p><ul>${items.join("")}</ul></div>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="carte">
        ${photo ? `<img class="photo" src="${photo}" alt="" data-photo="0">` : ""}
        <div class="detail${sansPhoto ? " sans-photo" : ""}">
          <p class="surtitre mono"><span>Dessert du jour</span></p>
          <h1 class="titre" tabindex="-1">${this._esc(d.nom)}</h1>
          ${chips.length ? `<div class="meta">${chips.join("")}</div>` : ""}
          ${compo}
          <div class="suggest-bar">
            <input type="text" data-suggest-input="0" placeholder="Changer de dessert… (ex: tarte aux fruits)"${occupe ? " disabled" : ""}>
            <button data-suggest-go="0"${occupe ? " disabled" : ""}>${occupe ? "…" : "Go"}</button>
          </div>
          <div class="actions">
            ${lien ? `<button class="bouton" data-recette="0">Voir la recette ↗</button>` : ""}
            <button class="bouton" data-changer="0"${occupe ? " disabled" : ""}>${occupe ? "Recherche…" : "Surprends-moi"}</button>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="bouton" data-covers-minus="0"${occupe ? " disabled" : ""}>−</button>
              <span class="mono" style="font-size:0.85rem;color:var(--gris)">${d.covers} parts</span>
              <button class="bouton" data-covers-plus="0"${occupe ? " disabled" : ""}>+</button>
            </div>
            <button class="bouton" data-clear="0"${occupe ? " disabled" : ""}>✕ Effacer</button>
          </div>
        </div>
      </div>`;

    this._brancher();
  }

  _brancher() {
    const R = this.shadowRoot;

    R.querySelectorAll("[data-recette]").forEach((el) => {
      el.addEventListener("click", () => {
        const d = this._dessert();
        const url = this._url(d?.url);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      });
    });

    R.querySelectorAll("[data-changer]").forEach((el) => {
      el.addEventListener("click", () => {
        const maintenant = Date.now();
        if (maintenant - this._dernierRemplacement < 3000) return;
        this._dernierRemplacement = maintenant;
        this._suggest(0, "");
      });
    });

    R.querySelectorAll("[data-clear]").forEach((el) => {
      el.addEventListener("click", async () => {
        const ok = await this._dialogue("Effacer le dessert d'aujourd'hui ?", { danger: true, ouiLabel: "Effacer" });
        if (!ok) return;
        const [domaine, service] = (this._config.clear_service || "").split(".", 2);
        if (!domaine || !service) return;
        this._occupe = true;
        this._forceRender = true;
        this._render();
        try {
          await this._hass.callService(domaine, service, {});
          this._toast("✓ Dessert effacé");
        } catch (err) {
          this._toast("✕ Erreur", true);
        } finally {
          this._occupe = false;
          this._forceRender = true;
          this._render();
        }
      });
    });

    R.querySelectorAll("[data-suggest-input]").forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this._suggest(0, input.value);
        }
      });
    });
    R.querySelectorAll("[data-suggest-go]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = R.querySelector(`[data-suggest-input="${btn.dataset.suggestGo}"]`);
        if (input) this._suggest(0, input.value);
      });
    });

    // Boutons +/− parts
    R.querySelectorAll("[data-covers-minus]").forEach((el) => {
      el.addEventListener("click", () => this._changerCovers(-1));
    });
    R.querySelectorAll("[data-covers-plus]").forEach((el) => {
      el.addEventListener("click", () => this._changerCovers(1));
    });

    const img = R.querySelector("img[data-photo]");
    if (img) {
      img.addEventListener("error", () => {
        this._imagesKO.add(0);
        this._forceRender = true;
        this._render();
      }, { once: true });
    }
  }

  async _changerCovers(delta) {
    const d = this._dessert();
    if (!d?.planned) return;
    const nouveau = Math.max(1, Math.min(20, (d.covers || 4) + delta));
    if (nouveau === d.covers) return;
    const [domaine, service] = (this._config.set_covers_service || "").split(".", 2);
    if (!domaine || !service) return;
    this._occupe = true;
    this._forceRender = true;
    this._render();
    try {
      await this._hass.callService(domaine, service, { covers: nouveau });
      this._toast(`✓ ${nouveau} parts`);
    } catch (err) {
      this._toast("✕ Erreur", true);
    } finally {
      this._occupe = false;
      this._forceRender = true;
      this._render();
      // Re-render différé car le state HA peut mettre du temps à se propager
      setTimeout(() => { this._forceRender = true; this._render(); }, 1000);
      setTimeout(() => { this._forceRender = true; this._render(); }, 3000);
    }
  }

  async _suggest(idx, texte) {
    const [domaine, service] = (this._config.suggest_service || "").split(".", 2);
    if (!domaine || !service || this._occupe || !this._hass) return;
    const maintenant = Date.now();
    if (texte && maintenant - this._dernierRemplacement < 3000) return;
    this._dernierRemplacement = maintenant;
    this._occupe = true;
    this._forceRender = true;
    this._render();
    try {
      const data = {
        criteria: texte || "",
        weekday: JOURS[this._aujourdhui()],
        limit: 5,
      };
      await this._hass.callService(domaine, service, data);
      this._toast(texte ? `✓ Recherche: ${texte}` : "✓ Surprise !");
    } catch (err) {
      console.error("dessert-card : échec suggestion", err);
      this._toast("✕ Erreur suggestion", true);
    } finally {
      this._occupe = false;
      this._forceRender = true;
      this._render();
      setTimeout(() => { this._forceRender = true; this._render(); }, 3000);
      setTimeout(() => { this._forceRender = true; this._render(); }, 8000);
    }
  }

  _dialogue(message, opts = {}) {
    return new Promise((resolve) => {
      const R = this.shadowRoot;
      if (!R) { resolve(false); return; }
      const overlay = document.createElement("div");
      overlay.className = "dialogue-overlay";
      overlay.innerHTML = `<div class="dialogue" role="alertdialog" aria-modal="true">
        <p class="dialogue-msg">${this._esc(message)}</p>
        <div class="dialogue-boutons">
          <button data-rep="non">Annuler</button>
          <button class="${opts.danger ? "danger" : ""}" data-rep="oui">${this._esc(opts.ouiLabel || "OK")}</button>
        </div>
      </div>`;
      R.appendChild(overlay);
      const fermer = (val) => { overlay.remove(); resolve(val); };
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) fermer(false);
        const btn = e.target.closest("[data-rep]");
        if (btn) fermer(btn.dataset.rep === "oui");
      });
      overlay.querySelector('[data-rep="oui"]')?.focus();
    });
  }

  _toast(msg, isError = false) {
    const R = this.shadowRoot;
    if (!R) return;
    let el = R.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      R.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = isError ? "#a33" : "";
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  }
}

// ----------------------------------------------------------------
// Éditeur graphique
// ----------------------------------------------------------------

class DessertCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }

  setConfig(config) { this._config = config; this._render(); }

  _render() {
    const c = this._config || {};
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 8px; font-family: system-ui; }
        .row { margin-bottom: 12px; }
        label { display: block; font-size: 0.8rem; margin-bottom: 4px; font-weight: 500; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 0.85rem; }
      </style>
      <div class="row">
        <label>Entité du dessert du jour</label>
        <input type="text" value="${this._esc(c.entity || "")}" data-key="entity">
      </div>
      <div class="row">
        <label>Service de suggestion IA</label>
        <input type="text" value="${this._esc(c.suggest_service || "")}" data-key="suggest_service">
      </div>
      <div class="row">
        <label>Service d'effacement</label>
        <input type="text" value="${this._esc(c.clear_service || "")}" data-key="clear_service">
      </div>
      <div class="row">
        <label>Service changement parts</label>
        <input type="text" value="${this._esc(c.set_covers_service || "")}" data-key="set_covers_service">
      </div>
      <div class="row">
        <label>Afficher les calories</label>
        <select data-key="show_calories">
          <option value="true" ${c.show_calories !== false ? "selected" : ""}>Oui</option>
          <option value="false" ${c.show_calories === false ? "selected" : ""}>Non</option>
        </select>
      </div>`;

    this.shadowRoot.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("change", () => {
        const key = el.dataset.key;
        let val = el.value;
        if (key === "show_calories") {
          val = val === "true";
        }
        this._config = { ...this._config, [key]: val };
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
        }));
      });
    });
  }

  _esc(t) {
    const d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML;
  }
}

customElements.define("dessert-card", DessertCard);
customElements.define("dessert-card-editor", DessertCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "dessert-card",
  name: "Dessert du jour",
  description: "Affiche le dessert du jour avec suggestion IA et sélecteur de parts",
  preview: true,
});