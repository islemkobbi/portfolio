const DATA_FILES = {
  profile: "data/profile.json",
  publications: "data/publications.json",
  experience: "data/experience.json",
  education: "data/education.json",
  projects: "data/projects.json",
  skills: "data/skills.json"
};

export async function loadAllContent() {
  const [profile, publications, experience, education, projects, skills] = await Promise.all([
    fetchJson(DATA_FILES.profile),
    fetchJson(DATA_FILES.publications),
    fetchJson(DATA_FILES.experience),
    fetchJson(DATA_FILES.education),
    fetchJson(DATA_FILES.projects),
    fetchJson(DATA_FILES.skills)
  ]);

  renderHero(profile);
  renderProfile(profile);
  renderPublications(publications);
  renderExperience(experience);
  renderSkills(skills);
  renderProjects(projects);
  renderEducation(education);
  renderContact(profile);
  bindCopyActions();

  document.dispatchEvent(new CustomEvent("portfolio:content-loaded"));
  return { profile, publications, experience, education, projects, skills };
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${path}: ${response.status}`);
  }
  return response.json();
}

function renderHero(profile) {
  setText("hero-institution", profile.institution);
  setText("hero-name", profile.name);
  setText("hero-subtitle", profile.heroSubtitle || profile.title);
  setText("hero-copy", profile.bio);

  const cvLink = document.getElementById("cv-link");
  if (cvLink && profile.cv) {
    cvLink.href = profile.cv;
  }
}

function renderProfile(profile) {
  const container = byId("profile-container");
  if (!container) return;
  container.replaceChildren();

  const grid = element("article", "about-grid reveal");
  const frame = element("div", "profile-frame");
  const image = element("img");
  image.src = profile.photo;
  image.alt = `${profile.name} profile portrait`;
  image.loading = "lazy";
  frame.append(image);

  const body = element("div");
  const name = element("h3", "about-name", profile.name);
  const meta = element("p", "about-meta", profile.institution);
  const bio = element("p", "about-bio", profile.bio);
  const stats = element("div", "stat-grid");

  (profile.stats || []).forEach((item) => {
    const stat = element("div", "stat reveal");
    const value = element("span", "stat-value", "0");
    value.dataset.count = String(item.value == null ? 0 : item.value);
    value.dataset.suffix = item.suffix || "";
    const label = element("span", "stat-label", item.label);
    stat.append(value, label);
    stats.append(stat);
  });

  body.append(name, meta, bio, stats);
  grid.append(frame, body);
  container.append(grid);
}

function renderPublications(data) {
  const container = byId("publications-container");
  if (!container) return;
  container.replaceChildren();

  const papers = data.papers || [];
  if (!papers.length) {
    container.append(empty("No publications yet."));
    return;
  }

  papers.forEach((paper) => {
    const card = element("article", "paper-card reveal");
    const top = element("div", "paper-top");
    top.append(
      element("span", "paper-venue", paper.venue),
      element("span", "result-badge", paper.keyResult)
    );

    const title = element("h3", "paper-title", paper.title);
    const authors = element("p", "paper-authors", (paper.authors || []).join(", "));
    const abstract = element("div", "paper-abstract");
    const details = element("details");
    const summary = element("summary", "", "Abstract");
    const abstractText = element("p", "", paper.abstract);
    details.append(summary, abstractText);
    abstract.append(details);

    const tags = tagList(paper.tags || []);
    const actions = element("div", "paper-actions");
    const paperLinks = paper.links || {};
    addLinkAction(actions, "PDF", paperLinks.pdf);
    addLinkAction(actions, "Preprint", paperLinks.preprint);
    addLinkAction(actions, "HAL", paperLinks.hal);
    addLinkAction(actions, "arXiv", paperLinks.arxiv);

    const cite = element("button", "button button--ghost", "Cite");
    cite.type = "button";
    cite.dataset.copy = paper.bibtex || "";
    cite.dataset.copyLabel = "BibTeX copied";
    actions.append(cite);

    card.append(top, title, authors, abstract, tags, actions);
    container.append(card);
  });
}

function renderExperience(data) {
  renderTimeline("experience-container", data.entries || [], {
    titleKey: "role",
    orgKey: "organization"
  });
}

function renderEducation(data) {
  renderTimeline("education-container", data.entries || [], {
    titleKey: "degree",
    orgKey: "school"
  });
}

function renderTimeline(containerId, entries, keys) {
  const container = byId(containerId);
  if (!container) return;
  container.replaceChildren();

  if (!entries.length) {
    container.append(empty("No entries yet."));
    return;
  }

  const timeline = element("div", "timeline");
  entries.forEach((entry) => {
    const item = element("article", "timeline-item reveal");
    const dot = element("span", "timeline-dot");
    dot.setAttribute("aria-hidden", "true");

    const range = element("div", "timeline-range", entry.range);
    const body = element("div", "timeline-body");
    const title = element("h3", "timeline-title", entry[keys.titleKey]);
    const org = element("p", "timeline-org", entry[keys.orgKey]);
    const description = element("p", "timeline-description", entry.description);
    body.append(title, org, description, tagList(entry.tags || []));
    item.append(dot, range, body);
    timeline.append(item);
  });

  container.append(timeline);
}

function renderSkills(data) {
  const container = byId("skills-container");
  if (!container) return;
  container.replaceChildren();

  const grid = element("div", "two-column");
  const skillPanel = element("section", "skill-panel reveal");
  skillPanel.append(element("h3", "panel-title", "Technical Skills"));
  const skillList = element("div", "skill-list");

  (data.bars || []).forEach((skill) => {
    const row = element("div", "skill-row");
    const meta = element("div", "skill-meta");
    meta.append(element("span", "", skill.name), element("span", "skill-level", `${skill.level}%`));
    const track = element("div", "skill-track");
    const fill = element("span", "skill-fill");
    fill.style.setProperty("--skill-level", `${skill.level}%`);
    track.append(fill);
    row.append(meta, track);
    skillList.append(row);
  });
  skillPanel.append(skillList);

  const toolPanel = element("section", "tool-panel reveal");
  toolPanel.append(element("h3", "panel-title", "Tool Ecosystem"));
  const categoryList = element("div", "category-list");
  (data.categories || []).forEach((category) => {
    const group = element("div", "category");
    group.append(element("p", "category-label", category.label), tagList(category.tags || []));
    categoryList.append(group);
  });
  toolPanel.append(categoryList);
  grid.append(skillPanel, toolPanel);
  container.append(grid);
}

function renderProjects(data) {
  const container = byId("projects-container");
  if (!container) return;
  container.replaceChildren();

  const projects = data.projects || [];
  if (!projects.length) {
    container.append(empty("No projects yet."));
    return;
  }

  const grid = element("div", "card-grid");
  projects.forEach((project) => {
    const card = element("article", "project-card reveal");
    const glyph = element("span", "project-glyph", "*");
    glyph.setAttribute("aria-hidden", "true");
    const title = element("h3", "project-title", project.title);
    const summary = element("p", "project-summary", project.summary);
    const details = element("details", "project-details");
    details.append(element("summary", "", "Details"), element("p", "", project.details));
    const actions = element("div", "project-actions");
    const projectLinks = project.links || {};
    addLinkAction(actions, "Repo", projectLinks.repo);
    addLinkAction(actions, "Paper", projectLinks.paper);
    addLinkAction(actions, "Demo", projectLinks.demo);
    card.append(glyph, title, summary, tagList(project.tags || []), details);
    if (actions.childElementCount) card.append(actions);
    grid.append(card);
  });

  container.append(grid);
}

function renderContact(profile) {
  const container = byId("contact-container");
  if (!container) return;
  container.replaceChildren();

  const panel = element("section", "contact-panel reveal");
  panel.append(
    element("h2", "contact-title", "Let's talk research."),
    element("p", "contact-copy", "For research conversations, industry roles, or collaborations, these are the fastest ways to reach me.")
  );

  const emails = element("div", "contact-grid");
  [profile.email, profile.secondaryEmail].filter(Boolean).forEach((email) => {
    const button = element("button", "contact-chip", email);
    button.type = "button";
    button.dataset.copy = email;
    button.dataset.copyLabel = "Email copied";
    emails.append(button);
  });

  const links = element("div", "contact-grid");
  const profileLinks = profile.links || {};
  addContactLink(links, "GitHub", profileLinks.github);
  addContactLink(links, "LinkedIn", profileLinks.linkedin);
  addContactLink(links, "Google Scholar", profileLinks.scholar);

  const noteParts = [profile.location, profile.phone].filter(Boolean);
  panel.append(emails, links, element("p", "contact-note", noteParts.join(" | ")));
  container.append(panel);
}

function addLinkAction(parent, label, url) {
  if (!url) return;
  const link = element("a", "button button--ghost", `${label} ->`);
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  parent.append(link);
}

function addContactLink(parent, label, url) {
  if (!url) return;
  const link = element("a", "contact-chip", label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  parent.append(link);
}

function tagList(tags) {
  const list = element("div", "tag-list");
  tags.forEach((tag) => list.append(element("span", "tag", tag)));
  return list;
}

function bindCopyActions() {
  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-copy]");
    if (!trigger) return;
    const text = trigger.dataset.copy;
    if (!text) return;
    event.preventDefault();
    await copyText(text);
    showToast(trigger.dataset.copyLabel || "Copied");
  });
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function showToast(message) {
  const toast = byId("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

function empty(message) {
  return element("p", "empty-state", message);
}

function setText(id, value) {
  const node = byId(id);
  if (node && value) node.textContent = value;
}

function byId(id) {
  return document.getElementById(id);
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}
