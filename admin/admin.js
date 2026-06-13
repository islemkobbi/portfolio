const SECTIONS = {
  profile: { label: "Profile", file: "profile.json", type: "profile" },
  papers: { label: "Papers", file: "publications.json", collection: "papers", type: "paper" },
  experience: { label: "Experience", file: "experience.json", collection: "entries", type: "experience" },
  education: { label: "Education", file: "education.json", collection: "entries", type: "education" },
  projects: { label: "Projects", file: "projects.json", collection: "projects", type: "project" },
  skills: { label: "Skills", file: "skills.json", type: "skills" }
};

const state = {
  current: "profile",
  selectedIndex: 0,
  dataDir: null,
  handles: {},
  data: {}
};

const ui = {
  openFolder: document.getElementById("open-folder"),
  preview: document.getElementById("preview-site"),
  copyDeploy: document.getElementById("copy-deploy"),
  tabs: document.getElementById("section-tabs"),
  itemList: document.getElementById("item-list"),
  newItem: document.getElementById("new-item"),
  deleteItem: document.getElementById("delete-item"),
  moveUp: document.getElementById("move-up"),
  moveDown: document.getElementById("move-down"),
  save: document.getElementById("save"),
  form: document.getElementById("editor-form"),
  status: document.getElementById("status")
};

init();

function init() {
  renderTabs();
  render();

  ui.openFolder.addEventListener("click", openDataFolder);
  ui.preview.addEventListener("click", () => window.open("../index.html", "_blank", "noopener"));
  ui.copyDeploy.addEventListener("click", copyDeployCommands);
  ui.newItem.addEventListener("click", addItem);
  ui.deleteItem.addEventListener("click", deleteItem);
  ui.moveUp.addEventListener("click", () => moveItem(-1));
  ui.moveDown.addEventListener("click", () => moveItem(1));
  ui.save.addEventListener("click", saveCurrentFile);
}

function renderTabs() {
  ui.tabs.replaceChildren();
  Object.entries(SECTIONS).forEach(([key, config]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab${state.current === key ? " is-active" : ""}`;
    button.textContent = config.label;
    button.addEventListener("click", () => {
      state.current = key;
      state.selectedIndex = 0;
      renderTabs();
      render();
    });
    ui.tabs.append(button);
  });
}

async function openDataFolder() {
  if (!("showDirectoryPicker" in window)) {
    setStatus("This admin tool needs Chrome or Edge on localhost because it uses the File System Access API.", true);
    return;
  }

  try {
    const picked = await window.showDirectoryPicker({ mode: "readwrite" });
    state.dataDir = await resolveDataDirectory(picked);
    await loadAllFiles();
    setStatus("Data loaded. Edit a section and save changes when ready.");
    render();
  } catch (error) {
    setStatus(error.message || "Could not open the data folder.", true);
  }
}

async function resolveDataDirectory(handle) {
  try {
    await handle.getFileHandle("profile.json");
    return handle;
  } catch {
    return handle.getDirectoryHandle("data");
  }
}

async function loadAllFiles() {
  state.handles = {};
  state.data = {};

  for (const config of Object.values(SECTIONS)) {
    const fileHandle = await state.dataDir.getFileHandle(config.file);
    const file = await fileHandle.getFile();
    state.handles[config.file] = fileHandle;
    state.data[config.file] = JSON.parse(await file.text());
  }
}

function render() {
  const config = SECTIONS[state.current];
  const data = state.data[config.file];
  syncActionState(config, data);
  renderItemList(config, data);
  ui.form.replaceChildren();

  if (!data) {
    ui.form.append(emptyMessage("Open the data folder to edit this section."));
    return;
  }

  if (config.type === "profile") renderProfileForm(data);
  if (config.type === "paper") renderPaperForm(getSelectedItem(config, data));
  if (config.type === "experience") renderExperienceForm(getSelectedItem(config, data));
  if (config.type === "education") renderEducationForm(getSelectedItem(config, data));
  if (config.type === "project") renderProjectForm(getSelectedItem(config, data));
  if (config.type === "skills") renderSkillsForm(data);
}

function syncActionState(config, data) {
  const isCollection = Boolean(config.collection);
  ui.newItem.disabled = !data || !isCollection;
  ui.deleteItem.disabled = !data || !isCollection;
  ui.moveUp.disabled = !data || !isCollection || state.selectedIndex <= 0;
  ui.moveDown.disabled = !data || !isCollection || state.selectedIndex >= ((data?.[config.collection]?.length || 1) - 1);
  ui.save.disabled = !data;
}

function renderItemList(config, data) {
  ui.itemList.replaceChildren();
  if (!data || !config.collection) {
    ui.itemList.append(emptyMessage(config.type === "profile" ? "Single profile record" : "Single skills record"));
    return;
  }

  const items = data[config.collection] || [];
  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `item-button${index === state.selectedIndex ? " is-active" : ""}`;
    button.draggable = true;
    button.innerHTML = `<span>${escapeHtml(itemTitle(item, config.type))}</span><small>${escapeHtml(item.range || item.venue || item.id || `Item ${index + 1}`)}</small>`;
    button.addEventListener("click", () => {
      state.selectedIndex = index;
      render();
    });
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", String(index));
    });
    button.addEventListener("dragover", (event) => event.preventDefault());
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      const from = Number(event.dataTransfer.getData("text/plain"));
      reorder(items, from, index);
      state.selectedIndex = index;
      render();
    });
    ui.itemList.append(button);
  });
}

function renderProfileForm(profile) {
  profile.links = profile.links || {};
  profile.stats = profile.stats || [];
  const grid = formGrid();
  grid.append(
    field("Name", profile, "name"),
    field("Title", profile, "title"),
    field("Institution", profile, "institution"),
    field("Hero subtitle", profile, "heroSubtitle"),
    field("Photo path", profile, "photo"),
    field("CV path", profile, "cv"),
    field("Primary email", profile, "email"),
    field("Secondary email", profile, "secondaryEmail"),
    field("Phone", profile, "phone"),
    field("Location", profile, "location"),
    field("Bio", profile, "bio", "textarea", "field-full")
  );

  const links = fieldset("Links");
  links.append(
    field("GitHub", profile.links, "github"),
    field("LinkedIn", profile.links, "linkedin"),
    field("Google Scholar", profile.links, "scholar")
  );

  const stats = fieldset("Stats");
  const repeater = div("repeater");
  (profile.stats || []).forEach((stat, index) => {
    const row = div("repeater-row");
    row.append(
      field("Label", stat, "label"),
      field("Value", stat, "value", "number"),
      removeButton(() => {
        profile.stats.splice(index, 1);
        render();
      })
    );
    repeater.append(row);
  });
  stats.append(repeater, smallAction("Add stat", () => {
    profile.stats = profile.stats || [];
    profile.stats.push({ value: 0, label: "New stat" });
    render();
  }));

  ui.form.append(grid, links, stats);
}

function renderPaperForm(paper) {
  if (!paper) return ui.form.append(emptyMessage("Add a paper to begin."));
  paper.links = paper.links || { pdf: "", hal: "", arxiv: "" };
  paper.authors = paper.authors || [];
  paper.tags = paper.tags || [];
  const grid = formGrid();
  grid.append(
    field("ID", paper, "id"),
    field("Title", paper, "title", "textarea", "field-full"),
    csvField("Authors", paper, "authors", "field-full"),
    field("Venue", paper, "venue"),
    field("Key result", paper, "keyResult"),
    csvField("Tags", paper, "tags", "field-full"),
    field("Abstract", paper, "abstract", "textarea", "field-full"),
    field("PDF link", paper.links, "pdf"),
    field("HAL link", paper.links, "hal"),
    field("arXiv link", paper.links, "arxiv"),
    field("BibTeX", paper, "bibtex", "textarea", "field-full")
  );
  ui.form.append(grid);
}

function renderExperienceForm(entry) {
  if (!entry) return ui.form.append(emptyMessage("Add an experience entry to begin."));
  entry.tags = entry.tags || [];
  const grid = formGrid();
  grid.append(
    field("Date range", entry, "range"),
    field("Role", entry, "role"),
    field("Organization", entry, "organization"),
    csvField("Tags", entry, "tags"),
    field("Description", entry, "description", "textarea", "field-full")
  );
  ui.form.append(grid);
}

function renderEducationForm(entry) {
  if (!entry) return ui.form.append(emptyMessage("Add an education entry to begin."));
  entry.tags = entry.tags || [];
  const grid = formGrid();
  grid.append(
    field("Date range", entry, "range"),
    field("Degree", entry, "degree"),
    field("School", entry, "school"),
    csvField("Tags", entry, "tags"),
    field("Description", entry, "description", "textarea", "field-full")
  );
  ui.form.append(grid);
}

function renderProjectForm(project) {
  if (!project) return ui.form.append(emptyMessage("Add a project to begin."));
  project.links = project.links || { repo: "", paper: "", demo: "" };
  project.tags = project.tags || [];
  const grid = formGrid();
  grid.append(
    field("ID", project, "id"),
    field("Title", project, "title"),
    field("Summary", project, "summary", "textarea", "field-full"),
    field("Details", project, "details", "textarea", "field-full"),
    csvField("Tags", project, "tags", "field-full"),
    field("Repository link", project.links, "repo"),
    field("Paper link", project.links, "paper"),
    field("Demo link", project.links, "demo")
  );
  ui.form.append(grid);
}

function renderSkillsForm(skills) {
  skills.bars = skills.bars || [];
  skills.categories = skills.categories || [];
  const bars = fieldset("Technical skill bars");
  const barRows = div("repeater");
  (skills.bars || []).forEach((skill, index) => {
    const row = div("repeater-row");
    row.append(
      field("Skill", skill, "name"),
      field("Level", skill, "level", "number"),
      removeButton(() => {
        skills.bars.splice(index, 1);
        render();
      })
    );
    barRows.append(row);
  });
  bars.append(barRows, smallAction("Add skill", () => {
    skills.bars = skills.bars || [];
    skills.bars.push({ name: "New skill", level: 50 });
    render();
  }));

  const categories = fieldset("Tool categories");
  const categoryRows = div("repeater");
  (skills.categories || []).forEach((category, index) => {
    const row = div("repeater-row category-row");
    row.append(
      field("Category", category, "label"),
      csvField("Tags", category, "tags"),
      removeButton(() => {
        skills.categories.splice(index, 1);
        render();
      })
    );
    categoryRows.append(row);
  });
  categories.append(categoryRows, smallAction("Add category", () => {
    skills.categories = skills.categories || [];
    skills.categories.push({ label: "New category", tags: [] });
    render();
  }));

  ui.form.append(bars, categories);
}

function getSelectedItem(config, data) {
  const items = data?.[config.collection] || [];
  return items[Math.min(state.selectedIndex, Math.max(items.length - 1, 0))];
}

function addItem() {
  const config = SECTIONS[state.current];
  if (!config.collection) return;
  const data = state.data[config.file];
  data[config.collection] = data[config.collection] || [];
  data[config.collection].push(createItem(config.type));
  state.selectedIndex = data[config.collection].length - 1;
  render();
}

function deleteItem() {
  const config = SECTIONS[state.current];
  if (!config.collection) return;
  const data = state.data[config.file];
  const items = data[config.collection] || [];
  if (!items.length) return;
  items.splice(state.selectedIndex, 1);
  state.selectedIndex = Math.max(0, state.selectedIndex - 1);
  render();
}

function moveItem(direction) {
  const config = SECTIONS[state.current];
  if (!config.collection) return;
  const items = state.data[config.file][config.collection] || [];
  const target = state.selectedIndex + direction;
  if (target < 0 || target >= items.length) return;
  reorder(items, state.selectedIndex, target);
  state.selectedIndex = target;
  render();
}

async function saveCurrentFile() {
  const config = SECTIONS[state.current];
  const handle = state.handles[config.file];
  if (!handle) return;

  try {
    const writable = await handle.createWritable();
    await writable.write(`${JSON.stringify(state.data[config.file], null, 2)}\n`);
    await writable.close();
    setStatus(`${config.file} saved.`);
  } catch (error) {
    setStatus(error.message || `Could not save ${config.file}.`, true);
  }
}

async function copyDeployCommands() {
  const commands = [
    "git add data/ assets/ index.html css/ js/ 404.html",
    "git commit -m \"Update portfolio content\"",
    "git push origin main"
  ].join("\n");

  try {
    await navigator.clipboard.writeText(commands);
    setStatus("Deploy commands copied.");
  } catch {
    setStatus(commands);
  }
}

function createItem(type) {
  const factories = {
    paper: {
      id: "new-paper",
      title: "New publication",
      authors: ["Islem Kobbi"],
      venue: "Venue | Year",
      tags: [],
      abstract: "",
      links: { pdf: "", hal: "", arxiv: "" },
      keyResult: "",
      bibtex: ""
    },
    experience: {
      range: "Year - Year",
      role: "Role",
      organization: "Organization",
      description: "",
      tags: []
    },
    education: {
      range: "Year - Year",
      degree: "Degree",
      school: "School",
      description: "",
      tags: []
    },
    project: {
      id: "new-project",
      title: "New project",
      summary: "",
      details: "",
      tags: [],
      links: { repo: "", paper: "", demo: "" }
    }
  };

  return structuredClone(factories[type]);
}

function formGrid() {
  return div("form-grid");
}

function field(label, object, key, type = "text", className = "") {
  const wrapper = div(`field ${className}`.trim());
  const labelNode = document.createElement("label");
  const id = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2)}`;
  labelNode.htmlFor = id;
  labelNode.textContent = label;

  const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
  input.id = id;
  if (type !== "textarea") input.type = type;
  input.value = object?.[key] ?? "";
  input.addEventListener("input", () => {
    object[key] = type === "number" ? Number(input.value) : input.value;
  });

  wrapper.append(labelNode, input);
  return wrapper;
}

function csvField(label, object, key, className = "") {
  const wrapper = field(label, object, key, "text", className);
  const input = wrapper.querySelector("input");
  input.value = (object[key] || []).join(", ");
  input.addEventListener("input", () => {
    object[key] = input.value.split(",").map((item) => item.trim()).filter(Boolean);
  });
  return wrapper;
}

function fieldset(label) {
  const box = div("fieldset");
  box.append(div("legend", label));
  return box;
}

function smallAction(label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-secondary";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function removeButton(handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-danger";
  button.textContent = "Remove";
  button.addEventListener("click", handler);
  return button;
}

function itemTitle(item, type) {
  if (type === "paper") return item.title;
  if (type === "experience") return item.role;
  if (type === "education") return item.degree;
  if (type === "project") return item.title;
  return "Item";
}

function reorder(items, from, to) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
}

function emptyMessage(message) {
  return div("status", message);
}

function setStatus(message, isError = false) {
  ui.status.textContent = message;
  ui.status.classList.toggle("is-error", isError);
}

function div(className, text = "") {
  const node = document.createElement("div");
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
