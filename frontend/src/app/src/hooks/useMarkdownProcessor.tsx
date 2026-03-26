import { Root } from "hast";
import "highlight.js/styles/vs2015.min.css";

import "katex/dist/katex.min.css";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  createContext,
  useContext,
} from "react";
import flattenChildren from "react-keyed-flatten-children";
import rehypeReact from "rehype-react";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkMath from "remark-math";
import rehypeStringify from "rehype-stringify";
import rehypeKatex from "rehype-katex";
import { Plugin, unified } from "unified";
import { visit } from "unist-util-visit";
import * as prod from "react/jsx-runtime";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { BiCopy } from "react-icons/bi";
import { BiCheck } from "react-icons/bi";
import { useTranslation } from "react-i18next";
import remarkRemoveSpecialElements from "../utils/markdown-plugins/removeSourceElements";
import rehypeExtractAndNumberCitations from "../utils/markdown-plugins/extractAndNumberCitations";
import rehypeConvertStylesToReact from "../utils/markdown-plugins/convertStylesToReact";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import React from "react";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import ImagePreview from "../components/Chat/ImagePreview";
import CodeInterpreterLink from "../components/CodeInterpreterLink";
import DownloadLink from "../components/DownloadLink";
import CitationLink from "../components/Chat/CitationLink";
import { WorkspaceFileDto } from "../models/workspace-model";
import { lucario } from "react-syntax-highlighter/dist/esm/styles/prism";

const ANCHOR_CLASS_NAME =
  "font-medium font-body underline text-blue-400 underline-offset-[2px] decoration-1 hover:text-blue-300 transition-colors";

// Create a context for passing workspace data to citation links
const CitationContext = createContext<{
  workspaceId?: string;
  workspaceFiles?: WorkspaceFileDto[];
}>({});

const rehypeListItemParagraphToDiv: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (element) => {
      if (element.tagName === "li") {
        element.children = element.children.map((child) => {
          if (child.type === "element" && child.tagName === "p") {
            child.tagName = "div";
          }
          return child;
        });
      }
    });
    return tree;
  };
};

// Custom plugin to unwrap paragraphs that contain only an image
const rehypeUnwrapImageParagraphs: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      // Check if this is a paragraph
      if (node.tagName === "p") {
        // Check if it has only one child and that child is an img
        if (
          node.children &&
          node.children.length === 1 &&
          node.children[0].type === "element" &&
          node.children[0].tagName === "img"
        ) {
          // Replace the paragraph with just the img
          if (parent && typeof index === "number") {
            parent.children[index] = node.children[0];
          }
        }
      }
    });
    return tree;
  };
};

//https://github.com/remarkjs/react-markdown/issues/785
const fixContent = (content: string) => {
  // Step 1: Regex to detect LaTeX expressions
  const latexPattern =
    /\\\\\[(.*?)\\\\\]|\(.*?\)|\\\\\((.*?)\\\\\)|\\\\\[.*?\\\\\]/gs;

  // Step 2: Check if the content contains LaTeX
  const containsLatex = latexPattern.test(content);

  if (containsLatex) {
    const markdownWithKatexSyntax = content
      .replace(/\\\\\[/g, "$$$$")
      .replace(/\\\\\]/g, "$$$$")
      .replace(/\\\\\(/g, "$$$$")
      .replace(/\\\\\)/g, "$$$$")
      .replace(/\\\[/g, "$$$$")
      .replace(/\\\]/g, "$$$$")
      .replace(/\\\(/g, "$$$$")
      .replace(/\\\)/g, "$$$$");

    return markdownWithKatexSyntax;
  }

  return content;
};

// --- TypeScript Type Improvements for CodeBlock
interface CodeBlockProps extends React.HTMLProps<HTMLElement> {
  className?: string;
  children?: ReactNode;
}

const CodeBlock = ({ children, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (copied) {
      const interval = setTimeout(() => setCopied(false), 2500);
      return () => clearTimeout(interval);
    }
  }, [copied]);

  const isCodeBlock = className?.includes("language-");

  if (isCodeBlock) {
    const language = className?.replace("language-", "") || "";
    return (
      <div className="flex flex-col rounded-2xl relative flex-grow !gap-0">
        <div className="flex w-full bg-gray-850 py-1">
          <button
            type="button"
            className="font-body ml-auto flex mx-2 p-1 text-white-100 items-center"
            aria-label="copy code to clipboard"
            title="Copy code to clipboard"
            onClick={() => {
              const textToCopy = React.Children.toArray(children)
                .map((child) => (typeof child === "string" ? child : ""))
                .join("");
              navigator.clipboard.writeText(textToCopy);
              setCopied(true);
            }}
          >
            {copied ? (
              <BiCheck className="mr-2 w-4 h-4" />
            ) : (
              <BiCopy className="mr-2 w-4 h-4" />
            )}
            {copied
              ? t("components:codeCopyBtn.message")
              : t("components:codeCopyBtn.icon.label")}
          </button>
        </div>
        <SyntaxHighlighter
          style={lucario}
          language={className?.replace("language-", "")}
          showLineNumbers={false}
          codeTagProps={{
            style: {
              fontSize: "16px",
            },
          }}
          customStyle={{
            backgroundColor: "#181818",
            margin: 0,
            paddingTop: 0,
          }}
        >
          {React.Children.toArray(children).join("")}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className="inline-block text-sm font-code text-slate-100 px-2 mx-0.5 rounded-2xl p-2 bg-gray-850">
      {children}
    </code>
  );
};

function renderList(children: ReactNode) {
  return Children.map(
    flattenChildren(children).filter(isValidElement),
    (child, index) => (
      <li key={index} className="my-2">
        <div className="inline-flex gap-2 items-start">{child}</div>
      </li>
    )
  );
}

// Wrapper component for citation links that uses context
const CitationLinkWrapper: React.FC<{
  citationText: string;
  citationNumber: string;
  children: React.ReactNode;
}> = ({ citationText, citationNumber, children }) => {
  const { workspaceId, workspaceFiles } = useContext(CitationContext);

  return (
    <CitationLink
      citationText={citationText}
      citationNumber={citationNumber}
      workspaceId={workspaceId}
      workspaceFiles={workspaceFiles}
    >
      {children}
    </CitationLink>
  );
};

// --- Sanitization Schema Adjustments
const customSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "span",
    "sup",
    "math",
    "semantics",
    "mrow",
    "mi",
    "mn",
    "mo",
    "mfrac",
    "msup",
    "msub",
    "munder",
    "mover",
    "munderover",
    "annotation",
  ],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className"],
    span: ["className", "aria-hidden"],
    math: ["xmlns", "display"],
    semantics: [],
    annotation: ["encoding"],
    img: [
      ...(defaultSchema.attributes?.img || []),
      "src",
      "alt",
      "width",
      "height",
    ],
    a: [
      ...(defaultSchema.attributes?.a || []),
      "href",
      "className",
      "data-citation-text",
      "data-citation-number",
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href || []), "sandbox"],
  },
};

// Create processor outside component with static components
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath, { singleDollarTextMath: false })
  .use(remarkRehype)
  .use(remarkRemoveSpecialElements)
  .use(rehypeSanitize, customSchema)
  .use(rehypeKatex, { output: "html" })
  .use(rehypeConvertStylesToReact) // Convert style strings to React objects
  .use(rehypeExtractAndNumberCitations)
  .use(rehypeUnwrapImageParagraphs)
  .use(rehypeListItemParagraphToDiv)
  .use(rehypeStringify)
  .use(rehypeReact, {
    Fragment: prod.Fragment,
    jsx: prod.jsx,
    jsxs: prod.jsxs,
    components: {
      img: ({ src, alt }: JSX.IntrinsicElements["img"]) => (
        <ImagePreview imageUrl={src} alt={alt} />
      ),
      a: ({
        href,
        children,
        className,
        ...props
      }: JSX.IntrinsicElements["a"] & {
        "data-citation-text"?: string;
        "data-citation-number"?: string;
      }) => {
        // Normalize URL: fix double slashes except in protocol (https://)
        const normalizedHref = href?.replace(/([^:])\/\//g, "$1/");

        // Check if this is a citation link
        if (className === "citation-link" && props["data-citation-text"]) {
          return (
            <CitationLinkWrapper
              citationText={props["data-citation-text"]}
              citationNumber={props["data-citation-number"] || ""}
            >
              {children}
            </CitationLinkWrapper>
          );
        }

        // Check if link contains code-agent-files or chat-doc-converter
        // Both use the same authenticated download component
        const isCodeAgentFile = normalizedHref?.includes("code-agent-files");
        const isChatDocConverter =
          normalizedHref?.includes("chat-doc-converter");

        if (isCodeAgentFile || isChatDocConverter) {
          return <DownloadLink href={normalizedHref}>{children}</DownloadLink>;
        }

        // Regular link rendering
        return (
          <a
            href={normalizedHref}
            target="_blank"
            rel="noreferrer"
            className={ANCHOR_CLASS_NAME}
          >
            {children}
          </a>
        );
      },
      h1: ({ children, id }: JSX.IntrinsicElements["h1"]) => (
        <h1 className="font-sans font-semibold text-2xl mb-3" id={id}>
          {children}
        </h1>
      ),
      h2: ({ children, id }: JSX.IntrinsicElements["h2"]) => (
        <h2 className="font-sans font-medium text-2xl mb-3" id={id}>
          {children}
        </h2>
      ),
      h3: ({ children, id }: JSX.IntrinsicElements["h3"]) => (
        <h3 className="font-sans font-semibold text-xl mb-3" id={id}>
          {children}
        </h3>
      ),
      h4: ({ children, id }: JSX.IntrinsicElements["h4"]) => (
        <h4 className="font-sans font-medium text-xl mb-3" id={id}>
          {children}
        </h4>
      ),
      h5: ({ children, id }: JSX.IntrinsicElements["h5"]) => (
        <h5 className="font-sans font-semibold text-lg mb-3" id={id}>
          {children}
        </h5>
      ),
      h6: ({ children, id }: JSX.IntrinsicElements["h6"]) => (
        <h6 className="font-sans font-medium text-md mb-3" id={id}>
          {children}
        </h6>
      ),
      p: (props: JSX.IntrinsicElements["p"]) => {
        return <p className="mb-6">{props.children}</p>;
      },
      strong: ({ children }: JSX.IntrinsicElements["strong"]) => (
        <strong className="font-semibold">{children}</strong>
      ),
      em: ({ children }: JSX.IntrinsicElements["em"]) => <em>{children}</em>,
      code: CodeBlock,
      pre: ({ children }: JSX.IntrinsicElements["pre"]) => {
        return (
          <div className="relative mb-6 flex-grow">
            <pre className="p-0 [&>code.hljs]:p-0 [&>code.hljs]:bg-transparent font-code rounded-2xl text-sm overflow-x-auto flex items-start">
              {children}
            </pre>
          </div>
        );
      },
      ul: ({ children }: JSX.IntrinsicElements["ul"]) => (
        <div className="pl-6 mb-3 list-container">
          <ul className="list-disc list-outside">
            {Children.map(
              flattenChildren(children).filter(isValidElement),
              (child, index) => (
                <li key={index}>
                  <div className="inline-flex items-center">{child}</div>
                </li>
              )
            )}
          </ul>
        </div>
      ),
      ol: ({ children }: JSX.IntrinsicElements["ol"]) => (
        <div className="pl-6 mb-3 list-container">
          <ol className="list-decimal list-outside">{renderList(children)}</ol>
        </div>
      ),
      li: ({ children }: JSX.IntrinsicElements["li"]) => <div>{children}</div>,
      table: ({ children }: JSX.IntrinsicElements["table"]) => (
        <div className="mb-6 rounded-lg overflow-x-scroll">
          <table className="table-auto border border-neutral-500">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }: JSX.IntrinsicElements["thead"]) => (
        <thead className="bg-neutral-700">{children}</thead>
      ),
      th: ({ children }: JSX.IntrinsicElements["th"]) => (
        <th className="border border-neutral-500 p-2 text-sm font-medium text-white">
          {children}
        </th>
      ),
      td: ({ children }: JSX.IntrinsicElements["td"]) => (
        <td className="border border-neutral-500 p-2 rounded-md text-sm text-white">
          {children}
        </td>
      ),
      blockquote: ({ children }: JSX.IntrinsicElements["blockquote"]) => (
        <blockquote className="border-l-4 my-[1.5em] mx-[10px] py-[10px] px-[20px] border-solid border-[#db1f3d]  text-white-100 bg-[#1e1e1e]">
          {children}
        </blockquote>
      ),
      span: ({
        children,
        className,
        ...props
      }: JSX.IntrinsicElements["span"]) => {
        // Handle citation pills specifically
        if (className === "citation-pill") {
          return <span>{children}</span>;
        }
        // Default span rendering - preserve all props including className
        return (
          <span className={className} {...props}>
            {children}
          </span>
        );
      },
      sup: ({ children }: JSX.IntrinsicElements["sup"]) => {
        return <sup>{children}</sup>;
      },
    },
  } as any);

// --- Updated useMarkdownProcessor Hook
export function useMarkdownProcessor(
  content: string | undefined | null,
  workspaceId?: string,
  workspaceFiles?: WorkspaceFileDto[]
): {
  processedContent: ReactNode;
  extractedCitations: string[];
} {
  return useMemo(() => {
    if (!content) return { processedContent: null, extractedCitations: [] };

    const processedResult = processor.processSync(fixContent(content))
      .result as ReactNode;

    // Wrap the processed content with CitationContext
    const processedContent = (
      <CitationContext.Provider value={{ workspaceId, workspaceFiles }}>
        {processedResult}
      </CitationContext.Provider>
    );

    // Return empty array for extractedCitations to maintain backward compatibility
    return { processedContent, extractedCitations: [] };
  }, [content, workspaceId, workspaceFiles]);
}
