import { Plugin } from "unified";
import { Root } from "hast";
import { visit } from "unist-util-visit";

// Convert CSS style strings to React style objects
function parseStyleString(styleStr: string): Record<string, any> {
  const styles: Record<string, any> = {};
  
  if (!styleStr) return styles;
  
  // Split by semicolon and process each style rule
  styleStr.split(';').forEach(rule => {
    const trimmedRule = rule.trim();
    if (!trimmedRule) return;
    
    const colonIndex = trimmedRule.indexOf(':');
    if (colonIndex === -1) return;
    
    const property = trimmedRule.substring(0, colonIndex).trim();
    const value = trimmedRule.substring(colonIndex + 1).trim();
    
    // Convert CSS property to camelCase for React
    const camelCaseProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    
    // Handle numeric values that should remain as strings (like line-height)
    styles[camelCaseProperty] = value;
  });
  
  return styles;
}

// This plugin converts style attribute strings to React-compatible objects
const rehypeConvertStylesToReact: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node: any) => {
      if (node.properties && typeof node.properties.style === 'string') {
        // Convert the style string to an object
        node.properties.style = parseStyleString(node.properties.style);
      }
    });
  };
};

export default rehypeConvertStylesToReact;