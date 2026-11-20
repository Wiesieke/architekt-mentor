// Pure quick-choice evaluation. This does not score a reader's reasoning.
export function evaluateChoice(copy, selectedId, correctId) {
  const option = copy.options.find(item => item.id === selectedId);
  if (!option) return { status: 'missing', message: copy.missing };
  return {
    status: selectedId === correctId ? 'best' : 'conditional',
    message: `${selectedId === correctId ? copy.best : copy.other} ${option.explanation}`,
  };
}

export function mountDecision(root, copy, correctId) {
  const quick = root.querySelector('[data-quick]');
  const mentor = root.querySelector('[data-mentor]');
  const feedback = root.querySelector('[data-feedback]');
  const hint = root.querySelector('[data-hint]');
  const followup = root.querySelector('[data-followup]');
  for (const button of root.querySelectorAll('[data-mode]')) {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode;
      quick.hidden = mode !== 'quick';
      mentor.hidden = mode !== 'mentor';
      for (const item of root.querySelectorAll('[data-mode]')) {
        item.setAttribute('aria-pressed', String(item === button));
      }
      // Panels are hidden, not rebuilt: selection and both drafts survive.
    });
  }
  root.querySelector('[data-check]').addEventListener('click', () => {
    const id = root.querySelector('input[name="weekly-choice"]:checked')?.value;
    const result = evaluateChoice(copy, id, correctId);
    feedback.textContent = result.message;
    feedback.dataset.status = result.status;
    feedback.hidden = false;
    feedback.focus();
  });
  root.querySelector('[data-hint-button]').addEventListener('click', event => {
    hint.hidden = !hint.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!hint.hidden));
  });
  root.querySelector('[data-question-button]').addEventListener('click', event => {
    followup.hidden = false;
    event.currentTarget.setAttribute('aria-expanded', 'true');
    root.querySelector('[data-followup-answer]').focus();
  });
}
