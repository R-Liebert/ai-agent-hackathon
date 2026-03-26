import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { Node, Parent } from "unist";
import { Text } from "mdast";

const remarkRemoveSpecialElements: Plugin = () => (tree: Node) => {
  visit(tree, "text", (node, index, parent) => {
    // Check if index and parent are defined
    if (typeof index !== "number" || !parent) {
      return;
    }

    // Ensure node is of type Text
    const textNode = node as Text;
    const parentNode = parent as Parent;

    // Define the regex pattern to match the elements
    const regex = /【\d+:\d+†source】/g;

    // Find matches in the text node's value
    const matches = textNode.value.match(regex);

    if (matches) {
      // Replace the matched patterns with an empty string
      const newValue = textNode.value.replace(regex, "");

      if (newValue.trim() === "") {
        // If the new value is empty, remove the text node from the parent
        parentNode.children.splice(index, 1);
        // No need to adjust traversal index
      } else {
        // Otherwise, update the text node's value
        textNode.value = newValue;
      }
    }
  });
};

export default remarkRemoveSpecialElements;
