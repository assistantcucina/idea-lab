(function () {
  const D = window.EOS_DATA;
  const screenEl = document.getElementById("screen");
  const tabbarEl = document.getElementById("tabbar");

  const TABS = [
    { id: "today", label: "Today" },
    { id: "map", label: "Thought Map" },
    { id: "ideas", label: "Ideas" },
    { id: "editorials", label: "Editorials" },
    { id: "signals", label: "Signals" },
    { id: "archive", label: "Archive" },
  ];

  // ---- small data lookups ------------------------------------------------
  function themeById(id) { return D.themes.find((t) => t.id === id); }
  function obsById(id) { return D.observations.find((o) => o.id === id); }
  function ideaById(id) { return D.ideas.find((i) => i.id === id); }
  function editorialById(id) { return D.editorials.find((e) => e.id === id); }
  function subNodesOf(themeId) { return D.subNodes.filter((n) => n.parent === themeId); }
  function themeCounts(themeId) {
    const obs = D.observations.filter((o) => o.theme === themeId);
    const challenges = themeById(themeId).evidenceAgainst.length;
    const projects = new Set(obs.map((o) => o.source.split(" ·")[0].split(",")[0])).size;
    const editorialsCount = D.editorials.filter((e) => e.related.some((r) => ideaById(r) && ideaById(r).theme === themeId)).length;
    return { observations: obs.length, challenges, projects, editorials: editorialsCount };
  }
  function categoryOf(themeId) {
    return { "product-judgment": "Product", "agentic-workflows": "Agents", "ai-interfaces": "Interfaces", "building-with-ai": "AI" }[themeId] || "";
  }

  // ---- router --------------------------------------------------------
  const local = { mapView: "list", signalFilter: "All", sheetSignal: null };

  function currentRoute() {
    const hash = location.hash.slice(1) || "today";
    const [name, arg] = hash.split("/");
    return { name, arg };
  }

  window.addEventListener("hashchange", render);
  function render() {
    const { name, arg } = currentRoute();
    renderTabbar(name);
    screenEl.className = "screen" + (name === "map" ? " wide" : "");
    if (name === "today") renderToday();
    else if (name === "map") renderMap();
    else if (name === "thesis") renderThesisDetail(arg);
    else if (name === "ideas") renderIdeas();
    else if (name === "editorials") renderEditorials();
    else if (name === "editorial") renderEditorialDetail(arg);
    else if (name === "signals") renderSignals();
    else if (name === "archive") renderArchive();
    else if (name === "weekly") renderWeekly();
    else renderToday();
    window.scrollTo(0, 0);
  }

  function renderTabbar(active) {
    const primary = new Set(["today", "map", "ideas", "editorials", "signals", "archive"]);
    const activeTab = primary.has(active) ? active : (active === "thesis" ? "map" : active === "editorial" ? "editorials" : "today");
    tabbarEl.innerHTML = TABS.map(
      (t) => `<a class="tab ${t.id === activeTab ? "active" : ""}" href="#${t.id}"><span class="dot"></span>${t.label}</a>`
    ).join("");
  }

  function backLink(href, label) {
    return `<a class="back-btn" href="${href}">← ${label}</a>`;
  }

  // ---- TODAY -----------------------------------------------------------
  function renderToday() {
    const pj = themeById("product-judgment");
    const topObs = D.observations.filter((o) => o.theme === "product-judgment").slice(0, 2);
    const reacting = D.signals.filter((s) => s.status === "open").slice(0, 3);

    screenEl.innerHTML = `
      <div class="day-header">
        <div class="greeting">Good morning, Adrian</div>
        <div class="date">Friday, September 18</div>
        <a class="pulse" href="#weekly">Your thinking moved in 2 places overnight →</a>
      </div>

      <div class="eyebrow">What Changed</div>
      <div class="panel">
        <div class="wc-head">
          <span class="pill">Deepen</span>
        </div>
        <div class="wc-title">${pj.name}</div>
        <div class="wc-quote">"${pj.belief}"</div>
        <div class="wc-meta">Evidence <span class="wc-evidence-shift">6 → 7</span></div>
        <div class="wc-why"><strong>Why:</strong> You changed Farkle analytics from tracking screens to tracking decisions and outcomes.</div>
        <a class="wc-cta" href="#thesis/product-judgment">Explore this thought →</a>
      </div>

      <div class="eyebrow" style="margin-top:28px">Observations</div>
      <div class="panel">
        ${topObs
          .map(
            (o, i) => `
          <div class="obs-row">
            <div class="obs-num">0${i + 1}</div>
            <div>
              <div class="obs-text">${o.text}</div>
              <div class="obs-source">${o.source} · ${o.when}</div>
              <div class="obs-support">Supports: ${themeById(o.theme).name}</div>
            </div>
          </div>`
          )
          .join("")}
      </div>

      <div class="eyebrow" style="margin-top:28px">Worth Reacting To</div>
      <div class="panel">
        ${reacting
          .map(
            (s, i) => `
          <div class="signal-row">
            <div class="obs-num">0${i + 1}</div>
            <div class="signal-title">${s.title}</div>
            <div class="signal-source">${s.source} · ${s.when}</div>
            <div class="signal-why"><strong>Why you should care:</strong> ${s.whyCare}</div>
            <div class="signal-angle-label">Your angle · ${s.angle}</div>
            <div class="signal-angle">${s.angleText}</div>
            <div class="signal-actions">
              <a class="btn-link muted" href="#signals">Read</a>
              <button class="btn-link draft-btn" data-signal="${s.id}">Draft Response</button>
            </div>
          </div>`
          )
          .join("")}
      </div>

      ${footer()}
    `;
    wireDraftButtons();
  }

  // ---- THOUGHT MAP -------------------------------------------------------
  function renderMap() {
    screenEl.innerHTML = `
      <h2 style="font-size:22px;margin-bottom:14px;">Thought Map</h2>
      <div class="map-toggle">
        <button data-view="list" class="${local.mapView === "list" ? "active" : ""}">List</button>
        <button data-view="graph" class="${local.mapView === "graph" ? "active" : ""}">Graph</button>
      </div>
      <div id="mapBody"></div>
      ${footer()}
    `;
    screenEl.querySelectorAll(".map-toggle button").forEach((b) =>
      b.addEventListener("click", () => {
        local.mapView = b.dataset.view;
        renderMap();
      })
    );
    document.getElementById("mapBody").innerHTML = local.mapView === "graph" ? graphMarkup() : listMarkup();
    if (local.mapView === "graph") wireGraphClicks();
  }

  function listMarkup() {
    return D.themes
      .map((t) => {
        const c = themeCounts(t.id);
        return `
        <div class="thesis-row" data-thesis="${t.id}">
          <div class="thesis-row-head">
            <span class="thesis-row-title">${t.name}</span>
            <span class="thesis-row-count">${c.observations}</span>
          </div>
          <div class="thesis-row-belief">${t.belief}</div>
          <div class="thesis-row-maturity">${D.MATURITY[t.maturity]} ${cap(t.maturity)}</div>
          <div class="thesis-row-stats">
            ${c.observations} supporting observations<br>
            ${c.challenges} challenge${c.challenges === 1 ? "" : "s"}<br>
            ${c.projects} projects
          </div>
          <div class="thesis-row-last">Last changed ${t.lastChanged}</div>
        </div>`;
      })
      .join("");
    // thesis-row clicks are handled by the delegated document listener at the bottom of this file
  }

  function graphMarkup() {
    const W = 640, H = 300;
    const themesX = D.themes.map((t, i) => 55 + (i * (W - 110)) / (D.themes.length - 1));
    const rootX = W / 2, rootY = 26;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;

    // links: root -> theme, theme -> subnodes
    D.themes.forEach((t, i) => {
      svg += `<path class="graph-link" d="M${rootX},${rootY + 10} L${themesX[i]},${118}" />`;
      const subs = subNodesOf(t.id);
      subs.forEach((s, j) => {
        const sx = themesX[i] + (j - (subs.length - 1) / 2) * 42;
        svg += `<path class="graph-link" d="M${themesX[i]},${130} L${sx},${218}" />`;
      });
    });

    // root node
    svg += `<g class="graph-node established"><circle cx="${rootX}" cy="${rootY}" r="9"></circle>
      <text class="glyph" x="${rootX}" y="${rootY + 3}" text-anchor="middle" font-size="8">●</text>
      <text x="${rootX}" y="${rootY - 16}" text-anchor="middle" font-weight="600">AI-NATIVE PRODUCT</text></g>`;

    // theme nodes
    D.themes.forEach((t, i) => {
      const x = themesX[i], y = 128;
      const words = t.name.toUpperCase().split(" ");
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(" ");
      const line2 = words.slice(mid).join(" ");
      svg += `<g class="graph-node ${t.maturity}" data-thesis="${t.id}">
        <circle cx="${x}" cy="${y}" r="8"></circle>
        <text class="glyph" x="${x}" y="${y + 3}" text-anchor="middle" font-size="8">${D.MATURITY[t.maturity]}</text>
        <text x="${x}" y="${y + 22}" text-anchor="middle">${line1}</text>
        ${line2 ? `<text x="${x}" y="${y + 33}" text-anchor="middle">${line2}</text>` : ""}
      </g>`;
      // subnodes
      const subs = subNodesOf(t.id);
      subs.forEach((s, j) => {
        const sx = x + (j - (subs.length - 1) / 2) * 42;
        const sy = 222;
        svg += `<g class="graph-node ${s.maturity}">
          <circle cx="${sx}" cy="${sy}" r="4.5"></circle>
          <text x="${sx}" y="${sy + 16}" text-anchor="middle" font-size="9">${wrapShort(s.name)}</text>
        </g>`;
      });
    });

    svg += "</svg>";
    return `<div class="graph-wrap">${svg}</div><p class="empty" style="padding-top:0">Tap a theme to open its Thesis Detail.</p>`;
  }
  function wrapShort(name) {
    return name.length > 12 ? name.split(" ")[0] : name;
  }

  function wireGraphClicks() {
    screenEl.querySelectorAll("[data-thesis]").forEach((el) =>
      el.addEventListener("click", () => { location.hash = "#thesis/" + el.dataset.thesis; })
    );
  }

  // ---- THESIS DETAIL (hero interaction) ----------------------------------
  function renderThesisDetail(id) {
    const t = themeById(id);
    if (!t) { location.hash = "#map"; return; }
    const evFor = t.evidenceFor.map(obsById).filter(Boolean);
    const evAgainst = t.evidenceAgainst.map(obsById).filter(Boolean);

    screenEl.innerHTML = `
      ${backLink("#map", "Thought Map")}
      <div class="td-title">${t.name}</div>
      <div class="td-maturity">${D.MATURITY[t.maturity]} ${cap(t.maturity)}</div>
      <div class="td-belief">${t.belief}</div>
      <div class="td-dates">
        <div><span>First observed</span>${t.firstObserved}</div>
        <div><span>Last changed</span>${t.lastChanged}</div>
      </div>

      <div class="section-title">How This Idea Evolved</div>
      <div class="evo">
        ${t.evolution
          .map(
            (step) => `
          <div class="evo-step">
            <div class="evo-date">${step.date}</div>
            <div class="evo-label">${step.label}</div>
            <div class="evo-text">${step.text}</div>
          </div>`
          )
          .join("")}
        <div class="evo-step current">
          <div class="evo-date">Current Belief</div>
          <div class="evo-belief">${t.currentBelief}</div>
        </div>
      </div>

      <div class="section-title">Evidence</div>
      <div class="evidence-group">
        <div class="evidence-head"><span>Supporting</span><span class="n">${evFor.length}</span></div>
        ${evFor.map((o) => `<div class="evidence-item"><span class="mark">●</span><span>${o.text}</span></div>`).join("")}
      </div>
      <div class="evidence-group" style="margin-top:20px">
        <div class="evidence-head"><span>Challenging</span><span class="n">${evAgainst.length}</span></div>
        ${evAgainst.map((o) => `<div class="evidence-item challenge"><span class="mark">◌</span><span>${o.text}</span></div>`).join("") || '<p class="empty">No challenges recorded yet.</p>'}
      </div>

      <div class="section-title">Open Questions</div>
      ${t.openQuestions.map((q) => `<div class="oq-item">${q}</div>`).join("")}

      ${footer()}
    `;
  }

  // ---- IDEAS -------------------------------------------------------------
  function renderIdeas() {
    const groups = [
      ["ready-to-write", "Ready to Write"],
      ["strengthening", "Strengthening"],
      ["emerging", "Emerging"],
      ["challenged", "Challenged"],
    ];
    screenEl.innerHTML = `
      <h2 style="font-size:22px;margin-bottom:16px;">Ideas</h2>
      ${groups
        .map(([key, label]) => {
          const items = D.ideas.filter((i) => i.status === key);
          if (!items.length) return "";
          return `
          <div class="eyebrow" style="margin-top:20px">${label}</div>
          ${items
            .map(
              (idea) => `
            <div class="idea-card">
              <span class="pill ${key === "challenged" ? "warn" : ""}">${label}</span>
              <div class="idea-title">${idea.title}</div>
              <div class="idea-stats">
                <span>Evidence ${idea.evidence}</span>
                <span>Challenges ${idea.challenges}</span>
                <span>Projects ${idea.projects}</span>
              </div>
              <div class="bar"><div class="bar-fill" style="width:${Math.round(idea.progress * 100)}%"></div></div>
              <div style="font-size:11px;color:var(--faint);margin-bottom:8px;">Last changed ${idea.lastChanged}</div>
              <a class="idea-explore" href="#thesis/${idea.theme}">Explore →</a>
            </div>`
            )
            .join("")}`;
        })
        .join("")}
      ${footer()}
    `;
  }

  // ---- EDITORIALS ----------------------------------------------------------
  function renderEditorials() {
    const groups = [
      ["ready-for-review", "Ready for Review"],
      ["developing", "Developing"],
      ["published", "Published"],
    ];
    screenEl.innerHTML = `
      <h2 style="font-size:22px;margin-bottom:16px;">Editorials</h2>
      ${groups
        .map(([key, label]) => {
          const items = D.editorials.filter((e) => e.status === key);
          if (!items.length) return "";
          return `
          <div class="eyebrow" style="margin-top:20px">${label}</div>
          ${items
            .map(
              (ed) => `
            <a class="ed-card" style="display:block;text-decoration:none;color:inherit" href="#editorial/${ed.id}">
              <span class="pill">${label}</span>
              <div class="ed-title">${ed.title}</div>
              <div class="ed-thesis-label">Thesis</div>
              <div class="ed-thesis">${ed.thesis}</div>
              <div class="ed-meta">Updated ${ed.updated}</div>
            </a>`
            )
            .join("")}`;
        })
        .join("")}
      ${footer()}
    `;
  }

  function renderEditorialDetail(id) {
    const ed = editorialById(id);
    if (!ed) { location.hash = "#editorials"; return; }
    const evidence = ed.evidenceUsed.map(obsById).filter(Boolean);
    const related = ed.related.map(ideaById).filter(Boolean);
    const checkIcon = { pass: "✓", warn: "⚠", pending: "…" };

    screenEl.innerHTML = `
      ${backLink("#editorials", "Editorials")}
      <div class="pill">${cap(ed.status.replace(/-/g, " "))}</div>
      <div class="ed-title" style="font-size:24px;margin-top:10px;">${ed.title}</div>

      <div class="section-title">Thesis</div>
      <p style="font-family:var(--serif);font-size:16px;line-height:1.5;">${ed.thesis}</p>

      <div class="section-title">Why This Piece Exists</div>
      <p style="font-size:13px;color:var(--muted);line-height:1.6;">${ed.whyExists}</p>

      <div class="section-title">Evidence Used</div>
      ${evidence.map((o) => `<div class="evidence-item"><span class="mark">●</span><span>${o.text}</span></div>`).join("") || '<p class="empty">None linked yet.</p>'}

      <div class="section-title">Related Thoughts</div>
      ${related.map((i) => `<div class="evidence-item"><span class="mark">→</span><span>${i.title}</span></div>`).join("") || '<p class="empty">None linked yet.</p>'}

      <div class="section-title">Article</div>
      <p class="article-preview">${ed.article || "Not drafted yet."}</p>

      <div class="section-title">Editorial Check</div>
      <div class="panel">
        <div class="check-row"><span>Voice</span><span class="check-mark ${ed.voiceCheck}">${checkIcon[ed.voiceCheck]} ${ed.voiceCheck === "pass" ? "Sounds like Adrian" : ed.voiceCheck === "pending" ? "Not checked yet" : "Needs attention"}</span></div>
        <div class="check-row"><span>Thesis</span><span class="check-mark ${ed.thesisCheck}">${checkIcon[ed.thesisCheck]} ${ed.thesisCheck === "pass" ? "Supported" : ed.thesisCheck === "pending" ? "Not checked yet" : "Needs attention"}</span></div>
        <div class="check-row"><span>Skeptic</span><span class="check-mark ${ed.skepticCheck}">${checkIcon[ed.skepticCheck]} ${ed.skepticCheck === "warn" ? ed.skepticNote : ed.skepticCheck === "pass" ? "No unresolved objections" : "Not checked yet"}</span></div>
        <div class="check-row"><span>Overlap</span><span class="check-mark ${ed.overlapCheck}">${checkIcon[ed.overlapCheck]} ${ed.overlapCheck === "pass" ? "Distinct from previous writing" : ed.overlapCheck === "pending" ? "Not checked yet" : "Needs attention"}</span></div>
      </div>

      <div class="actions-row">
        <button class="action-btn">Revise</button>
        <button class="action-btn">Discuss</button>
        <button class="action-btn primary">Ready to Publish</button>
      </div>
      ${footer()}
    `;
  }

  // ---- SIGNALS -----------------------------------------------------------
  function renderSignals() {
    const filters = ["All", "AI", "Product", "Agents", "Interfaces", "Leadership"];
    const visible = D.signals.filter((s) => s.status !== "dismissed" && (local.signalFilter === "All" || categoryOf(s.relatedTheme) === local.signalFilter));

    screenEl.innerHTML = `
      <h2 style="font-size:22px;margin-bottom:4px;">Signals</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px;">Things happening outside your work that intersect with your thinking.</p>
      <div class="filter-row">
        ${filters.map((f) => `<button class="filter-chip ${local.signalFilter === f ? "active" : ""}" data-f="${f}">${f}</button>`).join("")}
      </div>
      <div id="signalsBody"></div>
      ${footer()}
    `;
    screenEl.querySelectorAll(".filter-chip").forEach((b) =>
      b.addEventListener("click", () => { local.signalFilter = b.dataset.f; renderSignals(); })
    );

    const body = document.getElementById("signalsBody");
    if (!visible.length) {
      body.innerHTML = '<p class="empty">Nothing here right now.</p>';
      return;
    }
    body.innerHTML = visible
      .map(
        (s) => `
      <div class="signal-row">
        ${s.status === "saved" ? '<span class="pill">Saved</span>' : ""}
        <div class="signal-title">${s.title}</div>
        <div class="signal-source">${s.source} · ${s.author} · ${s.when}</div>
        <div class="signal-summary-label">Summary</div>
        <div class="signal-summary">${s.summary}</div>
        <div class="signal-why"><strong>Why you should care:</strong> ${s.whyCare}</div>
        <div class="signal-angle-label">Your angle · ${s.angle}</div>
        <div class="signal-angle">${s.angleText}</div>
        <div class="signal-actions">
          <button class="btn-link muted dismiss-btn" data-signal="${s.id}">Dismiss</button>
          <button class="btn-link muted save-btn" data-signal="${s.id}">Save</button>
          <button class="btn-link draft-btn" data-signal="${s.id}">Draft Response</button>
        </div>
      </div>`
      )
      .join("");
    body.querySelectorAll(".dismiss-btn").forEach((b) => b.addEventListener("click", () => { setSignalStatus(b.dataset.signal, "dismissed"); renderSignals(); }));
    body.querySelectorAll(".save-btn").forEach((b) => b.addEventListener("click", () => { setSignalStatus(b.dataset.signal, "saved"); renderSignals(); }));
    wireDraftButtons();
  }
  function setSignalStatus(id, status) {
    const s = D.signals.find((x) => x.id === id);
    if (s) s.status = status;
  }

  function wireDraftButtons() {
    document.querySelectorAll(".draft-btn").forEach((b) =>
      b.addEventListener("click", () => openDraftSheet(b.dataset.signal))
    );
  }

  function openDraftSheet(signalId) {
    const s = D.signals.find((x) => x.id === signalId);
    if (!s) return;
    const backdrop = document.createElement("div");
    backdrop.className = "sheet-backdrop";
    backdrop.innerHTML = `
      <div class="sheet glass">
        <div class="sheet-handle"></div>
        <div class="eyebrow">Your Angle</div>
        <div class="pill" style="margin-bottom:10px;">${s.angle}</div>
        <p style="font-size:13px;line-height:1.5;color:var(--muted);margin-bottom:6px;">${s.summary}</p>
        <p style="font-family:var(--serif);font-size:15px;line-height:1.5;">Your developing view goes further: ${s.angleText}</p>
        <div class="eyebrow" style="margin-top:18px;">Draft Response</div>
        <textarea id="draftText">${s.draftText || ""}</textarea>
        <div class="sheet-actions">
          <button class="action-btn" id="draftCancel">Close</button>
          <button class="action-btn primary" id="draftCopy">Copy</button>
        </div>
      </div>
    `;
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) document.body.removeChild(backdrop); });
    document.body.appendChild(backdrop);
    document.getElementById("draftCancel").addEventListener("click", () => document.body.removeChild(backdrop));
    document.getElementById("draftCopy").addEventListener("click", () => {
      const text = document.getElementById("draftText").value;
      navigator.clipboard?.writeText(text).then(() => {
        const btn = document.getElementById("draftCopy");
        btn.textContent = "Copied ✓";
        setTimeout(() => { if (btn) btn.textContent = "Copy"; }, 1400);
      }).catch(() => {});
    });
  }

  // ---- ARCHIVE -----------------------------------------------------------
  function renderArchive() {
    const byMonth = {};
    D.archive.forEach((a) => {
      const month = a.date.split(" ")[0];
      byMonth[month] = byMonth[month] || [];
      byMonth[month].push(a);
    });
    const kindLabel = { deepen: "Deepen", capture: "Capture", "new-idea": "New Idea", challenge: "Challenge", editorial: "Editorial" };
    screenEl.innerHTML = `
      <h2 style="font-size:22px;margin-bottom:6px;">Archive</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:6px;">A simple chronological history.</p>
      ${Object.entries(byMonth)
        .map(
          ([month, rows]) => `
        <div class="archive-month">${month.toUpperCase()}</div>
        ${rows
          .map(
            (r) => `
          <div class="archive-row">
            <div class="archive-day">${r.date.split(" ")[1]}</div>
            <div>
              <span class="archive-kind">${kindLabel[r.kind] || r.kind}</span>
              <span class="archive-title">${r.title}</span>
            </div>
          </div>`
          )
          .join("")}`
        )
        .join("")}
      ${footer()}
    `;
  }

  // ---- WEEKLY SYNTHESIS ----------------------------------------------------
  function renderWeekly() {
    const w = D.weekly;
    const shift = w.whatChanged[0];
    const opp = w.bestOpportunity;
    screenEl.innerHTML = `
      ${backLink("#today", "Today")}
      <h2 style="font-size:22px;">This Week in Your Thinking</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:6px;">${w.range}</p>
      <div class="weekly-stats">
        <div class="weekly-stat"><span class="n">${w.observations}</span><span class="l">Observations</span></div>
        <div class="weekly-stat"><span class="n">${w.strengthened}</span><span class="l">Strengthened</span></div>
        <div class="weekly-stat"><span class="n">${w.challenged}</span><span class="l">Challenged</span></div>
        <div class="weekly-stat"><span class="n">${w.emerged}</span><span class="l">New Ideas</span></div>
      </div>

      <div class="section-title">What Changed</div>
      <div class="panel">
        <div class="eyebrow">${themeById(shift.theme).name}</div>
        <div class="shift-from">"${shift.from}"</div>
        <div class="shift-arrow">↓</div>
        <div class="shift-to">"${shift.to}"</div>
        <p style="font-size:12px;color:var(--muted);margin-top:12px;"><strong>Why:</strong> ${shift.why}</p>
      </div>

      <div class="section-title">Best Writing Opportunity</div>
      <div class="opportunity-panel">
        <div class="eyebrow">Strongest Editorial Opportunity</div>
        <div style="font-family:var(--serif);font-size:18px;line-height:1.4;margin-bottom:12px;">${opp.title}</div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:14px;">
          ${opp.observations} observations · ${opp.projects} projects · ${opp.interviewFindings} interview findings · ${opp.counterarguments} counterarguments
        </p>
        <a class="action-btn primary" style="display:inline-block;text-decoration:none;" href="#editorial/${opp.editorialId}">Develop Article</a>
      </div>
      ${footer()}
    `;
  }

  // ---- shared bits ---------------------------------------------------
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function footer() {
    return `<div class="site-footer">built by <a href="https://adrianbudny.com" target="_blank" rel="noreferrer">ab</a></div>`;
  }

  // list-view thesis row clicks (delegated, since list markup is injected as a string)
  document.addEventListener("click", (e) => {
    const row = e.target.closest("[data-thesis]");
    if (row && row.classList.contains("thesis-row")) {
      location.hash = "#thesis/" + row.dataset.thesis;
    }
  });

  render();
})();
