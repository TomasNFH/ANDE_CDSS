import React, { useMemo } from "react";
import Tree from "react-d3-tree";

interface DecisionTreeTextProps {
  tree: string;
}

// Parse the tree string into a nested object for react-d3-tree
function parseTree(treeStr: string) {
  if (!treeStr) return { name: "No tree data" };
  const lines = treeStr.split("\n").filter((l) => l.trim() !== "");
  const root = { name: "Root", children: [] };
  const stack: any[] = [{ node: root, indent: -1 }];

  for (let line of lines) {
    const indent = (line.match(/\|   /g) || []).length;
    const content = line.replace(/\|   /g, "").replace(/\|--- /, "");
    // If it's a leaf node (class: ...)
    const classMatch = content.match(/class:\s*(.*)/);
    const node: any = classMatch
      ? { name: `class: ${classMatch[1]}` }
      : { name: content, children: [] };

    while (stack.length && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    stack[stack.length - 1].node.children =
      stack[stack.length - 1].node.children || [];
    stack[stack.length - 1].node.children.push(node);
    if (!classMatch) stack.push({ node, indent });
  }

  // Use the first child as the root if available
  return root.children.length === 1 ? root.children[0] : root;
}

const DecisionTreeText: React.FC<DecisionTreeTextProps> = ({ tree }) => {
  const data = useMemo(() => parseTree(tree), [tree]);

  return (
    <div id="treeWrapper" style={{ width: "100%", height: "400px" }}>
      <Tree
        data={data}
        orientation="vertical"
        translate={{ x: 250, y: 50 }}
        zoomable={true}
        collapsible={true}
      />
    </div>
  );
};

export default DecisionTreeText;
