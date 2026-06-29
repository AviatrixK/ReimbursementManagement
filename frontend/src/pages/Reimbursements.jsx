import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function ReimbursementsPage({ currentUser }) {
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [comments, setComments] = useState({});

  const loadQueue = () => {
    api.getReimbursements()
      .then((res) => {
        setClaims(res.data.reimbursements || []);
      })
      .catch((e) => {
        setError(e.message);
      });
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleAction = async (employeeId, status, reimbursementId) => {
    setError(null);
    setSuccess(null);
    try {
      const commentText = comments[reimbursementId] || "";
      await api.patchReimbursement({
        userId: employeeId,
        status,
        comments: commentText,
      });
      const role = currentUser?.role || "Approver";
      const action = status === "APPROVED" ? "approved" : "rejected";
      setSuccess(`Claim successfully ${action} by ${role}.`);
      // Clear comment for this claim
      setComments({ ...comments, [reimbursementId]: "" });
      loadQueue();
    } catch (e) {
      setError(e.message);
    }
  };

  const isEmployee = currentUser?.role === "EMP";

  return (
    <div>
      <h3>Reimbursements Queue</h3>
      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 12 }}>{success}</div>}
      {claims.length === 0 && <div>No claims found in your queue.</div>}
      
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {claims.map((c) => (
          <div key={c.id} className="card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span style={{ fontSize: "1.1em" }}>
                <strong>{c.title}</strong>
              </span>
              <span style={{
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "0.85em",
                fontWeight: "bold",
                backgroundColor: c.status === "APPROVED" ? "#d4edda" : c.status === "REJECTED" ? "#f8d7da" : "#fff3cd",
                color: c.status === "APPROVED" ? "#155724" : c.status === "REJECTED" ? "#721c24" : "#856404"
              }}>
                {c.status}
              </span>
            </div>
            
            <div style={{ color: "#555", fontSize: "0.95em", marginBottom: "12px" }}>
              <div>Amount: <strong>₹{c.amount}</strong></div>
              <div>Submitted By (User ID): <code style={{ fontSize: "0.9em" }}>{c.employeeId}</code></div>
              <div style={{ marginTop: "6px", fontStyle: "italic", whiteSpace: "pre-wrap" }}>"{c.description}"</div>
            </div>

            {/* Action buttons (Only for non-employees if status is PENDING) */}
            {!isEmployee && c.status === "PENDING" && (
              <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", marginTop: "12px" }}>
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ display: "block", fontSize: "0.85em", fontWeight: "bold", marginBottom: "4px" }}>
                    Approval Comments:
                  </label>
                  <textarea
                    value={comments[c.id] || ""}
                    onChange={(e) => setComments({ ...comments, [c.id]: e.target.value })}
                    placeholder="Enter approval/rejection reasons..."
                    style={{ width: "100%", minHeight: "60px", padding: "6px", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleAction(c.employeeId, "APPROVED", c.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(c.employeeId, "REJECTED", c.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
