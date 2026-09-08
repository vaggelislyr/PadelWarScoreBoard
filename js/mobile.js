// Hide the dock during editing; keep the user's zoom and scroll under their control.
let keyboardBaseline = window.visualViewport?.height || window.innerHeight;
let fieldFocusTimer;
function activeTextField() {
  const el = document.activeElement;
  return el?.matches('input, textarea') ? el : null;
}
function keepFieldVisible() {
  const el = activeTextField();
  if (!el) return;
  const vv = window.visualViewport;
  const top = vv?.offsetTop || 0, bottom = top + (vv?.height || window.innerHeight);
  const rect = el.getBoundingClientRect();
  if (rect.bottom > bottom - 20) window.scrollBy({top: rect.bottom - bottom + 20, behavior: 'smooth'});
  else if (rect.top < top + 12) window.scrollBy({top: rect.top - top - 12, behavior: 'smooth'});
}
function updateKeyboardPreview() {
  const height = window.visualViewport?.height || window.innerHeight;
  const keyboard = keyboardBaseline - height > 120;
  document.body.classList.toggle('textEditing', !!activeTextField() || keyboard);
  if (!keyboard && !activeTextField()) keyboardBaseline = height;
  clearTimeout(fieldFocusTimer);
  fieldFocusTimer = setTimeout(keepFieldVisible, 120);
  updateFloatingPreviewLayout();
}
document.addEventListener('focusin', updateKeyboardPreview);
document.addEventListener('focusout', () => setTimeout(updateKeyboardPreview, 0));
document.addEventListener('input', event => {
  if (event.target.matches('#nameAInput, #nameBInput')) event.target.dataset.dirty = 'true';
});
window.visualViewport?.addEventListener('resize', updateKeyboardPreview);
window.addEventListener('orientationchange', () => {
  keyboardBaseline = window.visualViewport?.height || window.innerHeight;
  updateKeyboardPreview();
});
