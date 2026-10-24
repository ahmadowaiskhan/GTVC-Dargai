/* ============================================================
   GTVC Dargai — View Results JS (Admin)
   ============================================================ */

let allResults = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth(['admin'])) return;
  renderLayout('admin', 'View Results', 'view-results.html');
  loadResults();
});

async function loadResults() {
  try {
    const data = await apiCall('/api/admin/results');
    allResults = data || [];
    renderResults(allResults);
  } catch (e) {
    const tbody = document.getElementById('resultsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:32px;">Could not load results.</td></tr>';
    }
  }
}

function renderResults(results) {
  const tbody = document.getElementById('resultsTableBody');
  if (!tbody) return;

  if (!results.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:32px;">No results found.</td></tr>';
    return;
  }

  const gradeBadge = g => {
    const map = { A: 'badge-green', B: 'badge-blue', C: 'badge-yellow', D: 'badge-yellow', F: 'badge-red' };
    return `<span class="badge ${map[g] || 'badge-blue'}">${g}</span>`;
  };

  tbody.innerHTML = results.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.student_name || '—'}</td>
      <td>${r.class_name || '—'}</td>
      <td>${r.subject_name || '—'}</td>
      <td><span class="badge badge-blue">${r.exam_type || '—'}</span></td>
      <td>${r.marks_obtained ?? '—'}</td>
      <td>${r.total_marks ?? '—'}</td>
      <td>${gradeBadge(r.grade || '—')}</td>
    </tr>
  `).join('');
}

function filterResults() {
  const searchInput = document.getElementById('searchResults');
  const examInput = document.getElementById('filterExamType');
  const q = searchInput ? searchInput.value.toLowerCase() : '';
  const exam = examInput ? examInput.value : '';

  const filtered = allResults.filter(r => {
    const matchName = (r.student_name || '').toLowerCase().includes(q) ||
                      (r.subject_name || '').toLowerCase().includes(q);
    const matchExam = !exam || r.exam_type === exam;
    return matchName && matchExam;
  });

  renderResults(filtered);
}
