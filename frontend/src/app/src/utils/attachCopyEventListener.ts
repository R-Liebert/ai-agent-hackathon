const attachCopyEventListener = (
  containerRef: React.RefObject<HTMLElement>,
  defaultFont = {
    fontFamily: "Calibri, Arial, sans-serif",
    fontSize: "15px",
    color: "#000",
  }
) => {
  const applyStylesRecursively = (node: Node) => {
    if (node instanceof HTMLElement) {
      // Apply font styles to the current element
      const computedStyle = window.getComputedStyle(node);
      node.style.fontFamily =
        defaultFont.fontFamily || computedStyle.fontFamily;
      node.style.fontSize = defaultFont.fontSize || computedStyle.fontSize;
      node.style.color = defaultFont.color || computedStyle.color;

      // Recursively apply styles to child nodes
      Array.from(node.childNodes).forEach((child) =>
        applyStylesRecursively(child)
      );
    }
  };

  const handleCopyEvent = (event: ClipboardEvent) => {
    // Get the current selection
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;

    // Check if the copy event is triggered within the container
    if (
      containerRef.current &&
      anchorNode instanceof Node &&
      containerRef.current.contains(anchorNode)
    ) {
      event.preventDefault();

      // Extract the selected HTML content
      const range = selection?.getRangeAt(0); // Get the range of the selection
      const selectedHtml = range ? range.cloneContents() : null;

      if (selectedHtml) {
        // Create a temporary wrapper element to apply styles
        const wrapper = document.createElement("div");
        wrapper.appendChild(selectedHtml);

        // Apply font styles recursively to all child nodes
        applyStylesRecursively(wrapper);

        // Serialize the styled HTML content
        const styledHtml = wrapper.innerHTML;

        // Write the styled HTML and plain text to the clipboard
        event.clipboardData?.setData("text/html", styledHtml);
        event.clipboardData?.setData("text/plain", selection?.toString() || "");
      }
    }
  };

  // Attach the event listener
  const attachListener = () => {
    document.addEventListener("copy", handleCopyEvent);
  };

  // Detach the event listener
  const detachListener = () => {
    document.removeEventListener("copy", handleCopyEvent);
  };

  return { attachListener, detachListener };
};

export default attachCopyEventListener;
