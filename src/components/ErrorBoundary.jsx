import React from "react";
import { PAPER, BRICK, INK } from "../lib/constants";

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("BusinessOS crashed:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: PAPER, padding: 32, fontFamily: "'IBM Plex Mono', monospace" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", background: "white", border: `1px solid ${BRICK}`, borderRadius: 8, padding: 24 }}>
            <div style={{ color: BRICK, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#333" }}>{String(this.state.error?.message || this.state.error)}</div>
            <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: "6px 12px", borderRadius: 6, background: INK, color: "white", fontSize: 13 }}>Try again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
