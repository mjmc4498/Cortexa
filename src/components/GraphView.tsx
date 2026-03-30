import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useNoteStore } from '../store/useNoteStore';
import { Note } from '../types';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  group: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

export const GraphView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { notes, setSelectedNoteId } = useNoteStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!svgRef.current || notes.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const nodes: Node[] = notes.map(note => ({
      id: note.id,
      title: note.title,
      group: note.tags.length > 0 ? 1 : 0
    }));

    const links: Link[] = [];
    notes.forEach(note => {
      if (note.forwardLinks) {
        note.forwardLinks.forEach(targetId => {
          if (notes.find(n => n.id === targetId)) {
            links.push({ source: note.id, target: targetId });
          }
        });
      }
      
      // Also link by shared tags for more interesting graph
      notes.forEach(otherNote => {
        if (note.id !== otherNote.id) {
          const sharedTags = note.tags.filter(tag => otherNote.tags.includes(tag));
          if (sharedTags.length > 0) {
            links.push({ source: note.id, target: otherNote.id });
          }
        }
      });
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const g = svg.append("g");

    // Zoom behavior
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      }));

    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll<SVGGElement, Node>("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 8)
      .attr("fill", d => d.group === 1 ? "#3b82f6" : "#94a3b8")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNoteId(d.id);
        onClose();
      });

    node.append("text")
      .text(d => d.title)
      .attr("x", 12)
      .attr("y", 4)
      .style("font-size", "12px")
      .style("fill", "#475569")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [notes, isFullscreen]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col ${isFullscreen ? 'p-0' : 'p-8'}`}
    >
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-2xl font-serif italic text-slate-800">Mapa del Conocimiento (Cerebro Digital)</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative">
        <svg 
          ref={svgRef} 
          className="w-full h-full"
          style={{ cursor: 'grab' }}
        />
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Notas con etiquetas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span>Notas sin etiquetas</span>
          </div>
          <p className="mt-2 italic">Las líneas representan conexiones automáticas por etiquetas compartidas o enlaces directos.</p>
        </div>
      </div>
    </motion.div>
  );
};
