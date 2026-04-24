const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];
  const response = {
    user_id: "varunk_28082004",
    email_id: "vk8240@srmist.edu.in",
    college_roll_number: "RA2311026020043",
    hierarchies: [],
    invalid_entries: [],
    duplicate_edges: [],
    summary: {},
  };

  const validPattern = /^[A-Z]->[A-Z]$/;

  let validEdges = new Set();
  let duplicates = new Set();

  for (let item of data) {
    let edge = item.trim();
    if (!validPattern.test(edge) || edge[0] === edge[3]) {
      response.invalid_entries.push(item);
    } else {
      if (validEdges.has(edge)) {
        duplicates.add(edge);
      } else {
        validEdges.add(edge);
      }
    }
  }

  response.duplicate_edges = [...duplicates];

  let graph = {};
  let childParent = new Set();

  for (let edge of validEdges) {
    let [parent, child] = edge.split("->");

    if (!graph[parent]) graph[parent] = [];

    if (!childParent.has(child)) {
      graph[parent].push(child);
      childParent.add(child);
    }
  }

  let nodes = new Set();
  validEdges.forEach((e) => {
    let [p, c] = e.split("->");
    nodes.add(p);
    nodes.add(c);
  });

  let undirected = {};
  nodes.forEach((n) => (undirected[n] = []));

  validEdges.forEach((e) => {
    let [p, c] = e.split("->");
    undirected[p].push(c);
    undirected[c].push(p);
  });

  let visited = new Set();
  let components = [];

  function dfsComp(node, comp) {
    visited.add(node);
    comp.push(node);

    for (let nei of undirected[node]) {
      if (!visited.has(nei)) dfsComp(nei, comp);
    }
  }

  for (let node of nodes) {
    if (!visited.has(node)) {
      let comp = [];
      dfsComp(node, comp);
      components.push(comp);
    }
  }

  let totalTrees = 0;
  let totalCycles = 0;
  let maxDepth = 0;
  let largestRoot = null;

  function buildTree(node, graph, visitedSet) {
    if (visitedSet.has(node)) return null;

    visitedSet.add(node);
    let obj = {};

    if (graph[node]) {
      for (let child of graph[node]) {
        let sub = buildTree(child, graph, new Set(visitedSet));
        if (sub === null) return null;
        obj[child] = sub;
      }
    }

    return obj;
  }

  function getDepth(tree) {
    if (!tree || Object.keys(tree).length === 0) return 1;
    return 1 + Math.max(...Object.values(tree).map(getDepth));
  }

  for (let comp of components) {
    let compSet = new Set(comp);

    let childSet = new Set();
    validEdges.forEach((e) => {
      let [p, c] = e.split("->");
      if (compSet.has(p) && compSet.has(c)) {
        childSet.add(c);
      }
    });

    let roots = comp.filter((n) => !childSet.has(n));

    if (roots.length === 0) {
      roots = [comp.sort()[0]];
    }

    roots.sort();
    let root = roots[0];

    let tree = buildTree(root, graph, new Set());

    if (tree === null) {
      response.hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      totalCycles++;
    } else {
      let depth = getDepth(tree);

      response.hierarchies.push({
        root,
        tree: { [root]: tree },
        depth,
      });

      totalTrees++;

      if (
        depth > maxDepth ||
        (depth === maxDepth && (largestRoot === null || root < largestRoot))
      ) {
        maxDepth = depth;
        largestRoot = root;
      }
    }
  }

  response.summary = {
    total_trees: totalTrees,
    total_cycles: totalCycles,
    largest_tree_root: largestRoot,
  };

  res.json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
