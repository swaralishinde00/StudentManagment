// ---------- Entity configuration (mirrors the PostgreSQL tables) ----------
const ENTITIES = {
  student: {
    title: 'Student', plural: 'Students', pk: 'id',
    fields: [
      { k: 'id', l: 'ID', t: 'number' },
      { k: 'name', l: 'Name', t: 'text' },
      { k: 'department', l: 'Department', t: 'text' }
    ],
    seed: [
      { id: 1, name: 'Aarav Sharma', department: 'CSE' },
      { id: 2, name: 'Priya Patil', department: 'ECE' },
      { id: 3, name: 'Rohan Deshmukh', department: 'Mechanical' }
    ]
  },
  course: {
    title: 'Course', plural: 'Courses', pk: 'course_id',
    fields: [
      { k: 'course_id', l: 'Course ID', t: 'number' },
      { k: 'course_name', l: 'Course Name', t: 'text' },
      { k: 'credits', l: 'Credits', t: 'number' },
      { k: 'department', l: 'Department', t: 'text' }
    ],
    seed: [
      { course_id: 101, course_name: 'Data Structures', credits: 4, department: 'CSE' },
      { course_id: 102, course_name: 'Database Systems', credits: 4, department: 'CSE' },
      { course_id: 201, course_name: 'Digital Circuits', credits: 3, department: 'ECE' },
      { course_id: 301, course_name: 'Thermodynamics', credits: 3, department: 'Mechanical' }
    ]
  }
};

// ---------- Data layer ----------
// Uses localStorage so the UI works standalone. To use your real database,
// replace load()/save() with fetch() calls to a backend (see README.txt).
const memory = {};
function load(name) {
  try {
    const raw = localStorage.getItem('sms_' + name);
    if (raw) return JSON.parse(raw);
  } catch (e) { if (memory[name]) return memory[name]; }
  const seed = structuredClone(ENTITIES[name].seed);
  save(name, seed);
  return seed;
}
function save(name, rows) {
  memory[name] = rows;
  try { localStorage.setItem('sms_' + name, JSON.stringify(rows)); } catch (e) {}
}

// ---------- State ----------
let current = 'student';
let editingPk = null;

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, isErr) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show' + (isErr ? ' err' : '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.className = ''), 2200);
}

// ---------- Rendering ----------
function renderForm() {
  const cfg = ENTITIES[current];
  $('formTitle').textContent = (editingPk === null ? 'Add ' : 'Edit ') + cfg.title;
  $('form').innerHTML =
    cfg.fields.map(f =>
      `<label>${f.l}<input name="${f.k}" type="${f.t}" required ${f.t === 'number' ? 'min="0"' : ''}
        ${f.k === cfg.pk && editingPk !== null ? 'readonly' : ''}></label>`).join('') +
    `<div class="actions">
       <button class="btn" type="submit">${editingPk === null ? 'Add' : 'Update'}</button>
       <button class="btn ghost" type="button" id="clearBtn">Clear</button>
     </div>`;
  $('clearBtn').onclick = () => { editingPk = null; renderForm(); };
}

function renderTable() {
  const cfg = ENTITIES[current];
  const q = $('search').value.trim().toLowerCase();
  const all = load(current);
  const rows = all.filter(r => !q || Object.values(r).some(v => String(v).toLowerCase().includes(q)));

  $('listTitle').firstChild.textContent = cfg.plural + ' ';
  $('count').textContent = all.length;
  $('thead').innerHTML = '<tr>' + cfg.fields.map(f => `<th>${f.l}</th>`).join('') + '<th>Actions</th></tr>';
  $('tbody').innerHTML = rows.length
    ? rows.map(r => `<tr>${cfg.fields.map(f => `<td>${esc(r[f.k])}</td>`).join('')}
        <td class="row-actions">
          <button class="btn sm" data-edit="${esc(r[cfg.pk])}">Edit</button>
          <button class="btn sm danger" data-del="${esc(r[cfg.pk])}">Delete</button>
        </td></tr>`).join('')
    : `<tr><td class="empty" colspan="${cfg.fields.length + 1}">No records found</td></tr>`;
}

// ---------- Actions ----------
$('form').addEventListener('submit', e => {
  e.preventDefault();
  const cfg = ENTITIES[current];
  const data = {};
  cfg.fields.forEach(f => {
    const v = e.target.elements[f.k].value.trim();
    data[f.k] = f.t === 'number' ? Number(v) : v;
  });

  const rows = load(current);
  if (editingPk === null) {
    if (rows.some(r => r[cfg.pk] === data[cfg.pk])) return toast(`${cfg.l || cfg.title} ID already exists`, true);
    rows.push(data);
    toast(cfg.title + ' added');
  } else {
    const i = rows.findIndex(r => r[cfg.pk] === editingPk);
    rows[i] = data;
    toast(cfg.title + ' updated');
  }
  rows.sort((a, b) => a[cfg.pk] - b[cfg.pk]);
  save(current, rows);
  editingPk = null;
  renderForm();
  renderTable();
});

$('tbody').addEventListener('click', e => {
  const cfg = ENTITIES[current];
  const edit = e.target.dataset.edit, del = e.target.dataset.del;
  if (edit !== undefined) {
    const row = load(current).find(r => String(r[cfg.pk]) === edit);
    editingPk = row[cfg.pk];
    renderForm();
    cfg.fields.forEach(f => ($('form').elements[f.k].value = row[f.k]));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (del !== undefined && confirm('Delete this record?')) {
    save(current, load(current).filter(r => String(r[cfg.pk]) !== del));
    toast(cfg.title + ' deleted');
    renderTable();
  }
});

document.querySelectorAll('.tab').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    current = btn.dataset.entity;
    editingPk = null;
    $('search').value = '';
    renderForm();
    renderTable();
  }));

$('search').addEventListener('input', renderTable);
$('reset').addEventListener('click', () => {
  if (!confirm('Reset ' + ENTITIES[current].plural + ' to sample data?')) return;
  save(current, structuredClone(ENTITIES[current].seed));
  renderTable();
  toast('Sample data restored');
});

renderForm();
renderTable();
