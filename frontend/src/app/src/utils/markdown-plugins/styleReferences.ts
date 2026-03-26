import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { Text, Element, Root, Parent } from "hast";

const rehypeFilenamePlugin: Plugin<[], Root> = () => (tree: Root) => {
  visit(tree, "text", (node, index, parent) => {
    if (typeof index !== "number" || !parent) {
      return;
    }

    const textNode = node as Text;
    const parentNode = parent as Parent;

    const regex = /\[\[(.*?)\]\]/g;
    let match;
    const newNodes: Array<Text | Element> = [];
    let lastIndex = 0;

    const value = textNode.value;
    while ((match = regex.exec(value)) !== null) {
      if (match.index > lastIndex) {
        newNodes.push({
          type: "text",
          value: value.slice(lastIndex, match.index),
        });
      }

      newNodes.push({
        type: "element",
        tagName: "span",
        properties: { className: ["text-sm font-code bg-gray-500 text-slate-100 px-2.5 py-1 rounded"] },
        children: [{ type: "text", value: match[1] }],
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < value.length) {
      newNodes.push({
        type: "text",
        value: value.slice(lastIndex),
      });
    }

    if (newNodes.length > 0) {
      parentNode.children.splice(index, 1, ...newNodes);
      // No need to adjust traversal index
    }
  });
};

export default rehypeFilenamePlugin;
