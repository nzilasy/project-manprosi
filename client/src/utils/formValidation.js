export function getEmptyFieldIssues(fields) {
  const issues = [];

  for (const field of fields) {
    const isMissing = field.test
      ? field.test(field.value)
      : !String(field.value ?? '').trim();

    if (isMissing) {
      issues.push({ key: field.key, label: field.label });
    }
  }

  return issues;
}

export function formatFormValidationMessage(issues) {
  if (!issues.length) return '';

  const labels = issues.map((issue) => issue.label);

  if (labels.length === 1) {
    return `"${labels[0]}" belum diisi. Lengkapi field tersebut, lalu simpan kembali.`;
  }

  return `Beberapa data wajib belum diisi: ${labels.join(', ')}. Lengkapi semua field tersebut, lalu simpan kembali.`;
}

export function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
