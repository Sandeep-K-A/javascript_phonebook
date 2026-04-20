const API = "https://telephone-api-crud.vercel.app/api/phones";

let allContacts = [];
let editingId = null;
let deleteId = null;

const contactList = document.getElementById("contactList");
const emptyState = document.getElementById("emptyState");
const emptyMsg = document.getElementById("emptyMsg");
const loadingState = document.getElementById("loadingState");
const countLabel = document.getElementById("countLabel");
const searchInput = document.getElementById("searchInput");
const inputName = document.getElementById("inputName");
const inputPhone = document.getElementById("inputPhone");
const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");
const saveBtn = document.getElementById("saveBtn");
const formModalEl = document.getElementById("formModal");
const deleteModalEl = document.getElementById("deleteModal");
const formModalLabel = document.getElementById("formModalLabel");
const deleteContactName = document.getElementById("deleteContactName");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const toastEl = document.getElementById("toast");

const formModal = new bootstrap.Modal(formModalEl);
const deleteModal = new bootstrap.Modal(deleteModalEl);

//Render Contact items
function renderList(contacts) {
  contactList.innerHTML = "";
  const count = contacts.length;

  if (count === 0) {
    emptyState.style.display = "block";
    emptyMsg.textContent = searchInput.value.trim()
      ? "No contacts match your search."
      : "No contacts yet. Add your first one!";
    countLabel.textContent = "";
    return;
  }

  emptyState.style.display = "none";
  countLabel.textContent = `${count} contact${count !== 1 ? "s" : ""}`;

  contacts.forEach((contact) => {
    const li = document.createElement("li");
    li.className = "contact-item";
    li.innerHTML = `
          <div class="avatar" aria-hidden="true">${initials(contact.name)}</div>
          <div class="contact-info">
            <div class="contact-name">${escapeHtml(contact.name)}</div>
            <div class="contact-phone">${escapeHtml(contact.phoneNumber)}</div>
          </div>
          <div class="contact-actions">
            <button class="btn-icon edit" data-id="${contact._id}" aria-label="Edit ${escapeHtml(contact.name)}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-icon delete" data-id="${contact._id}" data-name="${escapeHtml(contact.name)}" aria-label="Delete ${escapeHtml(contact.name)}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        `;
    contactList.appendChild(li);
  });
}

//Escape Html
function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

//Search Contacts
function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    renderList(allContacts);
    return;
  }
  const filtered = allContacts.filter(
    (contactItem) =>
      contactItem.name.toLowerCase().includes(query) ||
      contactItem.phoneNumber.toLowerCase().includes(query),
  );
  renderList(filtered);
}

//Fetch Contacts
async function loadContacts() {
  loadingState.style.display = "block";
  contactList.innerHTML = "";
  emptyState.style.display = "none";
  countLabel.textContent = "";
  try {
    const res = await fetch(API);
    const data = await res.json();
    allContacts = Array.isArray(data) ? data : data.data || [];
    applySearch();
  } catch {
    showToast("Could not load contacts.", "error");
    emptyState.style.display = "block";
    emptyMsg.textContent = "Failed to load contacts. Check your connection.";
  } finally {
    loadingState.style.display = "none";
  }
}

//Form Validation
function validateForm() {
  let valid = true;
  const name = inputName.value.trim();
  const phone = inputPhone.value.trim();

  if (!name || name.length < 2 || !/^[a-zA-Z\s'\-]+$/.test(name)) {
    nameError.style.display = "block";
    inputName.style.borderColor = "var(--danger)";
    valid = false;
  } else {
    nameError.style.display = "none";
    inputName.style.borderColor = "";
  }

  // Basic phone check: must have digits
  if (!phone || !/[\d]{4,}/.test(phone)) {
    phoneError.style.display = "block";
    inputPhone.style.borderColor = "var(--danger)";
    valid = false;
  } else {
    phoneError.style.display = "none";
    inputPhone.style.borderColor = "";
  }

  return valid;
}

//Add Modal
document.getElementById("openAddModal").addEventListener("click", () => {
  editingId = null;
  formModalLabel.textContent = "Add Contact";
  inputName.value = "";
  inputPhone.value = "";
  nameError.style.display = "none";
  phoneError.style.display = "none";
  inputName.style.borderColor = "";
  inputPhone.style.borderColor = "";
  saveBtn.textContent = "Save Contact";
  formModal.show();
  setTimeout(() => inputName.focus(), 400);
});

//save Edit or Save Add
saveBtn.addEventListener("click", async () => {
  if (!validateForm()) return;

  const body = {
    name: inputName.value.trim(),
    phoneNumber: inputPhone.value.trim(),
  };

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    const url = editingId ? `${API}/${editingId}` : API;
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Server error");

    formModal.hide();
    await loadContacts();
    showToast(editingId ? "Contact updated!" : "Contact added!", "success");
  } catch {
    showToast("Something went wrong. Try again.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Contact";
  }
});

//Edit or Delete Contact Button
contactList.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".btn-icon.edit");
  const deleteBtn = e.target.closest(".btn-icon.delete");

  if (editBtn) {
    const id = editBtn.dataset.id;
    const contact = allContacts.find((c) => c._id === id);
    if (!contact) return;

    editingId = id;
    formModalLabel.textContent = "Edit Contact";
    inputName.value = contact.name;
    inputPhone.value = contact.phoneNumber;
    nameError.style.display = "none";
    phoneError.style.display = "none";
    inputName.style.borderColor = "";
    inputPhone.style.borderColor = "";
    saveBtn.textContent = "Update Contact";
    formModal.show();
    setTimeout(() => inputName.focus(), 400);
  }

  if (deleteBtn) {
    deleteId = deleteBtn.dataset.id;
    deleteContactName.textContent = deleteBtn.dataset.name;
    deleteModal.show();
  }
});

//Delete COntact Operation
confirmDeleteBtn.addEventListener("click", async () => {
  if (!deleteId) return;
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = "Deleting…";
  try {
    const res = await fetch(`${API}/${deleteId}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    deleteModal.hide();
    await loadContacts();
    showToast("Contact deleted.", "success");
  } catch {
    showToast("Delete failed. Try again.", "error");
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Delete";
    deleteId = null;
  }
});

//Search Functionality
searchInput.addEventListener("input", applySearch);

//Press Enter key to save
formModalEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
});

//Toast message
let toastTimer;
function showToast(msg, type = "success") {
  toastEl.textContent = msg;
  toastEl.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.className = "";
  }, 2800);
}

// Avatar Name
function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

loadContacts();
