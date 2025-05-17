import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SketchfabViewer() {
  const iframeRef = useRef(null);
  const apiRef = useRef(null); // Store the Sketchfab API instance
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingNav, setPendingNav] = useState(null);

  // Map annotation numbers to routes and labels
  const annotationRoutes = {
    0: { route: "/student/dashboard", label: "Dashboard" },
    1: { route: "/student/weeklytest", label: "Weekly Test" },
    2: { route: "/student/reviewers", label: "Reviewers" },
    3: { route: "/student/ranking", label: "Ranking" },
    4: { route: "/student/profile", label: "Profile" },
    5: { route: "/student/crew", label: "Crew" },
    6: { route: "/student/partymmr", label: "Party MMR" },
    7: { route: "/student/versusmodelobby", label: "Versus Mode Lobby" }
  };

  // Reverse mapping: route -> annotation index
  const routeToAnnotation = Object.entries(annotationRoutes).reduce((acc, [idx, val]) => {
    acc[val.route] = Number(idx);
    return acc;
  }, {});

  const uid = "77a42d961c77445495da290843b5a125"; // Project Retro-Scifi Room

  useEffect(() => {
    // Load the Sketchfab Viewer API script
    const script = document.createElement("script");
    script.src = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
    script.async = true;
    script.onload = () => {
      if (window.Sketchfab && iframeRef.current) {
        const client = new window.Sketchfab(iframeRef.current);
        client.init(uid, {
          success: function(api) {
            apiRef.current = api; // Store the API instance
            api.start();
            api.addEventListener("viewerready", function() {
              api.addEventListener("annotationFocus", function(index) {
                if (annotationRoutes[index]) {
                  setPendingNav(index);
                }
              });
            });
          },
          error: function() {
            console.log("Viewer error");
          }
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [uid]);

  // Move the 3D model to the annotation when the route changes
  useEffect(() => {
    const index = routeToAnnotation[location.pathname];
    if (
      typeof index === "number" &&
      apiRef.current &&
      typeof apiRef.current.gotoAnnotation === "function"
    ) {
      apiRef.current.gotoAnnotation(index);
    }
  }, [location.pathname]);

  const handleConfirm = () => {
    if (pendingNav !== null && annotationRoutes[pendingNav]) {
      navigate(annotationRoutes[pendingNav].route);
    }
    setPendingNav(null);
  };

  const handleCancel = () => {
    setPendingNav(null);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <iframe
        ref={iframeRef}
        title="Sketchfab 3D Viewer"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        style={{ width: "100vw", height: "100vh", border: "none" }}
      />
      {pendingNav !== null && annotationRoutes[pendingNav] && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "#222",
              color: "#fff",
              padding: "32px 24px",
              borderRadius: 12,
              boxShadow: "0 4px 32px #000a",
              textAlign: "center"
            }}
          >
            <div style={{ marginBottom: 20, fontSize: 20 }}>
              Go to <b>{annotationRoutes[pendingNav].label}</b>?
            </div>
            <button
              onClick={handleConfirm}
              style={{
                marginRight: 16,
                padding: "10px 24px",
                background: "#1CAAD9",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: "pointer"
              }}
            >
              Yes
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: "10px 24px",
                background: "#444",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: "pointer"
              }}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 