// MixerShare UK Website Script

document.addEventListener("DOMContentLoaded", () => {
  initCalculator();
  initFormHandler();
  initSmoothScroll();
});

// Radial Mile & Turned Down Work Calculator
function initCalculator() {
  const m3Input = document.getElementById("calc-m3");
  const priceInput = document.getElementById("calc-price");
  const marginInput = document.getElementById("calc-margin");

  if (!m3Input) return;

  const updateCalc = () => {
    const m3 = parseFloat(m3Input.value) || 0;
    const price = parseFloat(priceInput.value) || 125;
    const margin = (parseFloat(marginInput.value) || 25) / 100;

    const lostGross = m3 * price;
    const lostNet = lostGross * margin;

    // Relief load cost (e.g. 2 loads @ £95 = £190)
    const appReliefCost = 190;
    const netSaved = lostNet - appReliefCost;

    document.getElementById("res-gross").innerText = `£${lostGross.toLocaleString('en-GB', {maximumFractionDigits: 0})}`;
    document.getElementById("res-net").innerText = `£${lostNet.toLocaleString('en-GB', {maximumFractionDigits: 0})}`;
    document.getElementById("res-saved").innerText = `£${Math.max(0, netSaved).toLocaleString('en-GB', {maximumFractionDigits: 0})}`;
  };

  m3Input.addEventListener("input", updateCalc);
  priceInput.addEventListener("input", updateCalc);
  marginInput.addEventListener("input", updateCalc);
}

// Netlify Form Submission Feedback
function initFormHandler() {
  const forms = document.querySelectorAll("form[data-netlify='true']");
  forms.forEach(form => {
    form.addEventListener("submit", (e) => {
      // Netlify handles static form POST automatically, this provides immediate UI feedback
      const btn = form.querySelector("button[type='submit']");
      if (btn) {
        btn.innerHTML = "✓ Inquiry Submitted Successfully!";
        btn.style.backgroundColor = "#16a34a";
        btn.style.color = "#fff";
      }
    });
  });
}

// Smooth Scroll for Nav Links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}
