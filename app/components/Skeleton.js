export function SkeletonBlock({ width, height, radius, style }){
  return <div className="skel" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function HomeSkeleton(){
  return (
    <div className="game-shell">
      <div className="skel skel-hero" />
      <div className="dashboard-quick">
        <div className="skel" style={{ height: 96, borderRadius: 16 }} />
        <div className="skel" style={{ height: 96, borderRadius: 16 }} />
      </div>
      <div className="skel" style={{ height: 22, width: 140, margin: '28px 0 14px', borderRadius: 6 }} />
      <div className="tool-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skel" key={i} style={{ height: 168, borderRadius: 20 }} />
        ))}
      </div>
    </div>
  );
}

export function ToolSkeleton(){
  return (
    <div className="tool-shell">
      <div className="skel" style={{ height: 16, width: 120, marginBottom: 20, borderRadius: 6 }} />
      <div className="skel" style={{ height: 30, width: 260, marginBottom: 10, borderRadius: 6 }} />
      <div className="skel" style={{ height: 16, width: '80%', marginBottom: 24, borderRadius: 6 }} />
      <div className="skel" style={{ height: 320, borderRadius: 20 }} />
    </div>
  );
}
