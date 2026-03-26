import { Plugin } from "unified";
import { Root } from "hast";
import { visit } from "unist-util-visit";
import { Element, Text } from "hast";

// Store citation counter and mapping
let citationCounter = 0;
let citationMap = new Map<string, number>();

// Function to reset citations (called at start of processing)
const resetCitations = (): void => {
  citationCounter = 0;
  citationMap.clear();
};

// This is a rehype plugin that both extracts and replaces citations
const rehypeExtractAndNumberCitations: Plugin<[], Root> = () => {
  return (tree) => {
    // Reset at the start of each processing
    resetCitations();

    visit(tree, "text", (node: any, index: number | undefined, parent: any) => {
      // Check if index and parent are defined
      if (typeof index !== "number" || !parent) {
        return;
      }

      const textNode = node as Text;
      const parentNode = parent as any;

      // Define the regex pattern to match citation elements
      const regex = /【([^】]+)】/g;

      // Check if there are any matches
      const matches = textNode.value.match(regex);
      if (!matches || matches.length === 0) {
        return;
      }

      // Find matches and create new nodes
      const newNodes: (Text | Element)[] = [];
      let lastIndex = 0;
      let match;

      regex.lastIndex = 0; // Reset regex state
      while ((match = regex.exec(textNode.value)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          newNodes.push({
            type: "text",
            value: textNode.value.slice(lastIndex, match.index)
          });
        }

        // Get or assign citation number
        const citationText = match[1];
        let citationNumber: number;
        
        if (citationMap.has(citationText)) {
          // Citation already exists, use same number
          citationNumber = citationMap.get(citationText)!;
        } else {
          // New citation, assign new number
          citationCounter++;
          citationNumber = citationCounter;
          citationMap.set(citationText, citationNumber);
        }

        // Pass the citation text as-is to the component
        // The CitationLink component will handle the display text
        // by looking up the workspace file's fileName property

        // Create anchor element with span for citation pill
        // The actual text will be rendered by the CitationLink component
        const anchorElement: Element = {
          type: "element",
          tagName: "a",
          properties: {
            className: ["citation-link"],
            "data-citation-text": citationText,
            "data-citation-number": citationNumber.toString(),
            href: "#" // Will be handled by onClick
          },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: {
                className: ["citation-pill"]
              },
              children: [
                {
                  type: "text",
                  value: `[${citationNumber}]` // Placeholder - will be replaced by CitationLink
                }
              ]
            }
          ]
        };
        newNodes.push(anchorElement);

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text after the last match
      if (lastIndex < textNode.value.length) {
        newNodes.push({
          type: "text",
          value: textNode.value.slice(lastIndex)
        });
      }

      // Replace the original text node with new nodes
      parentNode.children.splice(index, 1, ...newNodes);
    });
  };
};

export default rehypeExtractAndNumberCitations;