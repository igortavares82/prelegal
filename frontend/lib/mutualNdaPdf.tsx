import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
  Heading,
  List,
  ListItem,
  PhrasingContent,
  Root,
  RootContent,
  Table,
} from "mdast";
import type { ReactNode } from "react";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 48,
    paddingHorizontal: 56,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
    color: "#111827",
  },
  h1: { fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 10 },
  h2: { fontSize: 14, fontWeight: "bold", marginTop: 14, marginBottom: 8 },
  h3: { fontSize: 11, fontWeight: "bold", marginTop: 10, marginBottom: 6 },
  paragraph: { marginBottom: 8 },
  listItemText: { marginBottom: 0 },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  link: { color: "#1d4ed8", textDecoration: "underline" },
  listItemRow: { flexDirection: "row", marginBottom: 4 },
  listItemMarker: { width: 28 },
  listItemContent: { flex: 1 },
  hr: { borderBottomWidth: 1, borderBottomColor: "#d1d5db", marginVertical: 18 },
  table: { marginVertical: 8 },
  tableRow: { flexDirection: "row" },
  tableHeaderCell: {
    flex: 1,
    padding: 4,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
  },
  tableCell: {
    flex: 1,
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
});

interface MutualNdaPdfDocumentProps {
  markdown: string;
}

/**
 * Renders the assembled Mutual NDA markdown (see lib/buildDocument.ts) as a
 * real PDF — parses it into an mdast tree (the same remark/remark-gfm stack
 * used for the on-screen preview) and walks that tree into
 * `@react-pdf/renderer` primitives, so the downloaded file has selectable,
 * searchable text rather than a rasterized snapshot.
 */
export function MutualNdaPdfDocument({ markdown }: MutualNdaPdfDocumentProps) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;

  return (
    <Document title="Mutual Non-Disclosure Agreement">
      <Page size="LETTER" style={styles.page} wrap>
        {tree.children.map((node, index) => renderBlock(node, index))}
      </Page>
    </Document>
  );
}

function renderBlock(node: RootContent, key: number): ReactNode {
  switch (node.type) {
    case "heading":
      return renderHeading(node, key);
    case "paragraph":
      return (
        <Text key={key} style={styles.paragraph}>
          {renderInline(node.children)}
        </Text>
      );
    case "list":
      return renderList(node, key);
    case "table":
      return renderTable(node, key);
    case "thematicBreak":
      return <View key={key} style={styles.hr} />;
    default:
      return null;
  }
}

function renderHeading(node: Heading, key: number): ReactNode {
  const style = node.depth === 1 ? styles.h1 : node.depth === 2 ? styles.h2 : styles.h3;
  return (
    <Text key={key} style={style}>
      {renderInline(node.children)}
    </Text>
  );
}

function renderList(node: List, key: number): ReactNode {
  return (
    <View key={key}>
      {node.children.map((item, index) => renderListItem(item, index, node))}
    </View>
  );
}

function renderListItem(item: ListItem, index: number, parent: List): ReactNode {
  const marker =
    item.checked != null
      ? item.checked
        ? "[x]"
        : "[ ]"
      : parent.ordered
        ? `${(parent.start ?? 1) + index}.`
        : "•";

  return (
    <View key={index} style={styles.listItemRow}>
      <Text style={styles.listItemMarker}>{marker}</Text>
      <View style={styles.listItemContent}>
        {item.children.map((child, childIndex) => {
          if (child.type === "paragraph") {
            return (
              <Text key={childIndex} style={styles.listItemText}>
                {renderInline(child.children)}
              </Text>
            );
          }
          if (child.type === "list") {
            return renderList(child, childIndex);
          }
          return renderBlock(child, childIndex);
        })}
      </View>
    </View>
  );
}

function renderTable(node: Table, key: number): ReactNode {
  const [headerRow, ...bodyRows] = node.children;
  return (
    <View key={key} style={styles.table}>
      <View style={styles.tableRow}>
        {headerRow.children.map((cell, cellIndex) => (
          <Text key={cellIndex} style={styles.tableHeaderCell}>
            {renderInline(cell.children)}
          </Text>
        ))}
      </View>
      {bodyRows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {row.children.map((cell, cellIndex) => (
            <Text key={cellIndex} style={styles.tableCell}>
              {renderInline(cell.children)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function renderInline(nodes: PhrasingContent[]): ReactNode[] {
  return nodes.map((node, index) => renderInlineNode(node, index));
}

function renderInlineNode(node: PhrasingContent, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return node.value;
    case "strong":
      return (
        <Text key={key} style={styles.bold}>
          {renderInline(node.children)}
        </Text>
      );
    case "emphasis":
      return (
        <Text key={key} style={styles.italic}>
          {renderInline(node.children)}
        </Text>
      );
    case "inlineCode":
      return node.value;
    case "link":
      return (
        <Link key={key} src={node.url} style={styles.link}>
          {renderInline(node.children)}
        </Link>
      );
    case "break":
      return "\n";
    default:
      return null;
  }
}
