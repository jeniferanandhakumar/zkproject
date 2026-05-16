document.getElementById("fill").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  chrome.runtime.sendMessage({
    type: "FILL_CREDENTIALS",
    payload: { username, password },
  });
});
