import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { Node, Parent } from "unist";
import { Text } from "mdast";

// Store extracted citations globally (you might want to use a different approach in production)
let extractedCitations: string[] = [];

// Function to get and clear citations
export const getCitations = (): string[] => {
  const citations = [...extractedCitations];
  extractedCitations = [];
  return citations;
};

const remarkExtractCitations: Plugin = () => (tree: Node) => {
  // Clear previous citations at the start of processing
  extractedCitations = [];

  visit(tree, "text", (node, index, parent) => {
    // Check if index and parent are defined
    if (typeof index !== "number" || !parent) {
      return;
    }

    // Ensure node is of type Text
    const textNode = node as Text;
    const parentNode = parent as Parent;

    // Define the regex pattern to match citation elements (without †)
    const regex = /【([^】]+)】/g;

    // Find matches in the text node's value
    let match;
    const matches: string[] = [];

    while ((match = regex.exec(textNode.value)) !== null) {
      // Extract the text inside the brackets and add to citations
      const citationText = match[1];
      extractedCitations.push(citationText);
      matches.push(match[0]); // Store the full match for replacement
    }

    if (matches.length > 0) {
      // Replace all matched patterns with empty string
      let newValue = textNode.value;
      matches.forEach((fullMatch) => {
        newValue = newValue.replace(fullMatch, "");
      });

      if (newValue.trim() === "") {
        // If the new value is empty, remove the text node from the parent
        parentNode.children.splice(index, 1);
      } else {
        // Otherwise, update the text node's value
        textNode.value = newValue;
      }
    }
  });
};

export default remarkExtractCitations;
