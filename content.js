// Try to detect login forms and fill when instructed
function autofill({ username, password }) {
  const inputs = Array.from(document.querySelectorAll("input"));
  const userField = inputs.find(
    (i) =>
      /email|user|login/i.test(i.name) ||
      /email|user|login/i.test(i.id) ||
      i.type === "email"
  );
  const passField = inputs.find((i) => i.type === "password");
  if (userField) userField.value = username || "";
  if (passField) passField.value = password || "";
  if (userField) userField.dispatchEvent(new Event("input", { bubbles: true }));
  if (passField) passField.dispatchEvent(new Event("input", { bubbles: true }));
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "FILL_CREDENTIALS") {
    autofill(msg.payload || {});
  }
});
