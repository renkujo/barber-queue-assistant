document.querySelectorAll("pre").forEach((pre) => {
  const wrap = pre.parentElement;
  if (!wrap || !wrap.classList.contains("code-wrap")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-button";
  button.textContent = "Copy";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pre.innerText);
      button.textContent = "Copied";
      window.setTimeout(() => { button.textContent = "Copy"; }, 1400);
    } catch {
      button.textContent = "Select text";
    }
  });
  wrap.append(button);
});
