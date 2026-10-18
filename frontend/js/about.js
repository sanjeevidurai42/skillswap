/**
 * SkillSwap - About Page & Contact Form Controller
 * Developer: Sanjeeviraj
 */

document.addEventListener('DOMContentLoaded', () => {
  setupContactForm();
});

function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const category = document.getElementById('contact-category').value;
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    const btn = document.getElementById('contact-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
      const res = await api.post('/contact', {
        name,
        email,
        category,
        subject,
        message
      });

      if (res.success) {
        showToast(res.message || 'Message sent and stored in MongoDB!', 'success');
        form.reset();
      }
    } catch (err) {
      showToast(err.message || 'Error sending contact message', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Message to MongoDB';
    }
  });
}
