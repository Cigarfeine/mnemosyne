"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState
} from "reactflow";
import "reactflow/dist/style.css";
import { documentsAPI, conceptsAPI } from "@/lib/api";
import Link from "next/link";

const ConceptNode = ({ data }: { data: any }) => {
  const difficultyColor = ["", "bg-green-100", "bg-blue-100", "bg-yellow-100", "bg-orange-100", "bg-red-100"][data.difficulty] || "bg-gray-100";
  return (
    <div className={`px-3 py-2 rounded-lg border border-gray-200 shadow-sm min-w-[120px] max-w-[180px] ${difficultyColor}`}>
      <p className="font-medium text-xs text-gray-800 leading-tight">{data.label}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{data.category}</p>
    </div>
  );
};

const nodeTypes = { conceptNode: ConceptNode };

export default function DocumentPage() {
  const params = useParams();
  const docId = params.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<"graph" | "list">("graph");

  useEffect(() => {
    loadDocument();
    loadGraph();
  }, [docId]);

  const loadDocument = async () => {
    const res = await documentsAPI.get(docId);
    setDoc(res.data);
  };

  const loadGraph = async () => {
    try {
      const res = await conceptsAPI.getGraph(docId);
      setNodes(res.data.nodes || []);
      setEdges(res.data.edges || []);

      const conceptRes = await conceptsAPI.list(docId);
      setConcepts(conceptRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerExtraction = async () => {
    setExtracting(true);
    try {
      await conceptsAPI.extract(docId);
      const poll = setInterval(async () => {
        const res = await conceptsAPI.list(docId);
        if (res.data.length > 0) {
          clearInterval(poll);
          setExtracting(false);
          await loadGraph();
        }
      }, 3000);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Extraction failed");
      setExtracting(false);
    }
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    const concept = concepts.find((c) => c.id === node.id);
    setSelectedConcept(concept || null);
  }, [concepts]);

  if (!doc) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground text-sm hover:text-foreground">← Back</Link>
          <div>
            <h1 className="font-medium">{doc.title}</h1>
            <p className="text-xs text-muted-foreground">{doc.subject} · {doc.total_pages} pages · {doc.total_chunks} chunks</p>
          </div>
        </div>
        <div className="flex gap-2">
          {concepts.length === 0 && (
            <button
              onClick={triggerExtraction}
              disabled={extracting}
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {extracting ? "Extracting concepts..." : "Extract Concepts"}
            </button>
          )}
          <Link href={`/study/${docId}`}>
            <button className="text-sm border border-border px-4 py-2 rounded-lg hover:bg-secondary">
              Study →
            </button>
          </Link>
          <Link href={`/tutor/${docId}`}>
            <button className="text-sm border border-border px-4 py-2 rounded-lg hover:bg-secondary">
              Tutor →
            </button>
          </Link>
        </div>
      </div>

      <div className="border-b border-border px-6 flex gap-4">
        {(["graph", "list"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm py-3 border-b-2 transition-colors capitalize
              ${activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            {tab === "graph" ? `Knowledge Graph (${concepts.length})` : "Concept List"}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === "graph" ? (
          <>
            <div className="flex-1">
              {nodes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg mb-2">No concepts extracted yet</p>
                    <p className="text-sm">Click &quot;Extract Concepts&quot; to analyze this document</p>
                  </div>
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              )}
            </div>
            {selectedConcept && (
              <div className="w-72 border-l border-border p-5 overflow-y-auto">
                <h3 className="font-medium mb-1">{selectedConcept.name}</h3>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded">{selectedConcept.category}</span>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{selectedConcept.definition}</p>
                {selectedConcept.prerequisites?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Prerequisites</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedConcept.prerequisites.map((p: string) => (
                        <span key={p} className="text-xs border border-border px-2 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4">Difficulty: {"★".repeat(selectedConcept.difficulty)}{"☆".repeat(5 - selectedConcept.difficulty)}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-3 max-w-4xl">
              {concepts.map((c) => (
                <div key={c.id} className="border border-border rounded-xl p-4 hover:bg-secondary/20 cursor-pointer"
                  onClick={() => { setSelectedConcept(c); setActiveTab("graph"); }}>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.definition}</p>
                  <p className="text-xs text-primary mt-2">{c.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
