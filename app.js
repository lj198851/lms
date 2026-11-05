const STORAGE_KEY = "lms-experiments-v1";

const initialExperiments = [
  { id: "exp-1", name: "基础电路搭建与测量", course: "电路与电子技术", teacher: "林老师", dueDate: "2026-11-18", submissions: 32, status: "进行中" },
  { id: "exp-2", name: "显微镜观察与细胞结构", course: "普通生物学实验", teacher: "陈老师", dueDate: "2026-11-22", submissions: 18, status: "进行中" },
  { id: "exp-3", name: "数据结构与算法分析", course: "程序设计基础", teacher: "王老师", dueDate: "2026-11-28", submissions: 0, status: "待开始" },
  { id: "exp-4", name: "酸碱滴定与溶液配制", course: "基础化学实验", teacher: "周老师", dueDate: "2026-10-25", submissions: 46, status: "已结束" },
  { id: "exp-5", name: "牛顿第二定律验证", course: "大学物理实验", teacher: "林老师", dueDate: "2026-11-30", submissions: 0, status: "待开始" }
];

const list = document.querySelector("#experiment-list");
const dialog = document.querySelector("#experiment-dialog");
const form = document.querySelector("#experiment-form");
const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const toast = document.querySelector("#toast");
let experiments = loadExperiments();
let toastTimer;

function loadExperiments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [...initialExperiments];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isExperiment) : [...initialExperiments];
  } catch {
    return [...initialExperiments];
  }
}

function isExperiment(item) {
  return item && typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.course === "string" && typeof item.teacher === "string" &&
    typeof item.dueDate === "string" && Number.isFinite(Number(item.submissions)) &&
    ["待开始", "进行中", "已结束"].includes(item.status);
}

function saveExperiments() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(experiments));
    return true;
  } catch {
    showToast("无法保存数据，请检查浏览器存储设置。");
    return false;
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function createCell(content, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = content;
  return cell;
}

function render() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const selectedStatus = statusFilter.value;
  const filtered = experiments.filter((item) => {
    const matchesQuery = [item.name, item.course, item.teacher].some((value) => value.toLocaleLowerCase().includes(query));
    return matchesQuery && (selectedStatus === "all" || item.status === selectedStatus);
  });

  list.replaceChildren();
  for (const item of filtered) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const name = document.createElement("strong");
    name.className = "experiment-name";
    name.textContent = item.name;
    const id = document.createElement("small");
    id.className = "experiment-id";
    id.textContent = `实验编号 ${item.id.slice(-4).toUpperCase()}`;
    nameCell.append(name, id);
    row.append(nameCell, createCell(item.course), createCell(item.teacher), createCell(formatDate(item.dueDate)));

    const submissionCell = document.createElement("td");
    const submission = document.createElement("span");
    submission.className = "submission-count";
    submission.textContent = `${item.submissions} 人已提交`;
    submissionCell.append(submission);
    row.append(submissionCell);

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = `status-pill ${item.status === "进行中" ? "status-active" : item.status === "待开始" ? "status-upcoming" : "status-done"}`;
    status.textContent = item.status;
    statusCell.append(status);
    row.append(statusCell);

    const actionCell = document.createElement("td");
    actionCell.className = "row-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "text-button";
    edit.dataset.action = "edit";
    edit.dataset.id = item.id;
    edit.textContent = "编辑";
    edit.setAttribute("aria-label", `编辑${item.name}`);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button delete-button";
    remove.dataset.action = "delete";
    remove.dataset.id = item.id;
    remove.textContent = "删除";
    remove.setAttribute("aria-label", `删除${item.name}`);
    actionCell.append(edit, remove);
    row.append(actionCell);
    list.append(row);
  }

  document.querySelector("#total-count").textContent = experiments.length;
  document.querySelector("#active-count").textContent = experiments.filter((item) => item.status === "进行中").length;
  document.querySelector("#upcoming-count").textContent = experiments.filter((item) => item.status === "待开始").length;
  document.querySelector("#results-count").textContent = `显示 ${filtered.length} 项，共 ${experiments.length} 项实验`;
  document.querySelector("#empty-state").hidden = filtered.length !== 0;
  list.parentElement.hidden = filtered.length === 0;
}

function openDialog(item) {
  form.reset();
  document.querySelector("#experiment-id").value = item?.id ?? "";
  document.querySelector("#dialog-title").textContent = item ? "编辑实验" : "新建实验";
  document.querySelector("#experiment-name").value = item?.name ?? "";
  document.querySelector("#experiment-course").value = item?.course ?? "";
  document.querySelector("#experiment-teacher").value = item?.teacher ?? "";
  document.querySelector("#experiment-due").value = item?.dueDate ?? "";
  document.querySelector("#experiment-status").value = item?.status ?? "待开始";
  document.querySelector("#experiment-submissions").value = item?.submissions ?? 0;
  dialog.showModal();
  document.querySelector("#experiment-name").focus();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

document.querySelector("#add-experiment").addEventListener("click", () => openDialog());
document.querySelector("#empty-add").addEventListener("click", () => openDialog());
document.querySelectorAll(".close-dialog").forEach((button) => button.addEventListener("click", () => dialog.close()));
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = experiments.find((experiment) => experiment.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === "edit") {
    openDialog(item);
  } else if (button.dataset.action === "delete" && window.confirm(`确定删除“${item.name}”吗？`)) {
    experiments = experiments.filter((experiment) => experiment.id !== item.id);
    if (saveExperiments()) {
      render();
      showToast("实验已删除。");
    }
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const id = document.querySelector("#experiment-id").value;
  const existingIndex = experiments.findIndex((item) => item.id === id);
  const experiment = {
    id: id || `exp-${crypto.randomUUID()}`,
    name: String(formData.get("name")).trim(),
    course: String(formData.get("course")).trim(),
    teacher: String(formData.get("teacher")).trim(),
    dueDate: String(formData.get("dueDate")),
    submissions: Number(formData.get("submissions")),
    status: String(formData.get("status"))
  };
  if (existingIndex >= 0) experiments[existingIndex] = experiment;
  else experiments.unshift(experiment);
  if (saveExperiments()) {
    render();
    dialog.close();
    showToast(existingIndex >= 0 ? "实验已更新。" : "实验已创建。");
  }
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

render();
