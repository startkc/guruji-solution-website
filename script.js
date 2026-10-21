// Beginner-friendly interactions for the static demo website.
const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}));

document.getElementById("year").textContent = new Date().getFullYear();

// Search the sample resource cards.
const searchInput = document.getElementById("resourceSearch");
const resourceCards = [...document.querySelectorAll(".resource")];
const resourceCount = document.getElementById("resourceCount");
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  resourceCards.forEach(card => {
    const matches = (card.dataset.search + " " + card.textContent).toLowerCase().includes(query);
    card.hidden = !matches;
    if (matches) visible++;
  });
  resourceCount.textContent = `${visible} resource${visible === 1 ? "" : "s"}`;
});

// IMPORTANT: Replace the placeholder below with your business WhatsApp number,
// including country code and digits only. Example for India: 919876543210.
const WHATSAPP_NUMBER = "91XXXXXXXXXX";
document.getElementById("contactForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const message = [
    "Hello Guruji Solution, I have an enquiry.",
    `Name: ${data.get("name")}`,
    `Phone: ${data.get("phone")}`,
    `Topic: ${data.get("interest")}`,
    `Message: ${data.get("message") || "Not provided"}`
  ].join("\n");
  const status = document.getElementById("formMessage");
  if (WHATSAPP_NUMBER.includes("X")) {
    status.textContent = "Setup needed: replace the sample WhatsApp number in script.js before using this form.";
    return;
  }
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  status.textContent = "WhatsApp opened in a new tab. Review the message and send it there.";
});