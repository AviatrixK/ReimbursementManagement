import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function EmployeesPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Local state for dropdown selections
  const [selectedRoles, setSelectedRoles] = useState({});
  const [selectedManagers, setSelectedManagers] = useState({});

  const loadEmployees = () => {
    api.getEmployees()
      .then((res) => {
        const list = res.data.users || [];
        setUsers(list);
        
        // Initialize default selections
        const roles = {};
        const managers = {};
        list.forEach(u => {
          roles[u.userId] = u.role;
          managers[u.userId] = u.reportingManagerId || "";
        });
        setSelectedRoles(roles);
        setSelectedManagers(managers);
      })
      .catch((e) => {
        setError(e.message);
      });
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleRoleChange = async (userId, role) => {
    setError(null);
    setSuccess(null);
    try {
      await api.assignRole({ userId, role });
      setSuccess("Role updated successfully!");
      loadEmployees();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleManagerChange = async (userId, managerId) => {
    setError(null);
    setSuccess(null);
    try {
      if (!managerId) {
        // If managerId is empty, find the current assigned manager to remove it
        const user = users.find(u => u.userId === userId);
        if (user && user.reportingManagerId) {
          await api.removeManager({ userId, managerId: user.reportingManagerId });
          setSuccess("Manager removed successfully!");
        }
      } else {
        await api.assignManager({ userId, managerId });
        setSuccess("Manager assigned successfully!");
      }
      loadEmployees();
    } catch (e) {
      setError(e.message);
    }
  };

  const isCFO = currentUser?.role === "CFO";
  const managersList = users.filter(u => u.role === "RM");

  return (
    <div>
      <h3>Employees Directory</h3>
      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 12 }}>{success}</div>}
      {users.length === 0 && <div>No users found.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {users.map((u) => {
          const managerEmail = u.reportingManagerEmail || "None";
          return (
            <div key={u.userId} className="card" style={{ padding: "16px" }}>
              <div style={{ fontSize: "1.1em", marginBottom: "8px" }}>
                <strong>{u.email}</strong> {u.userId === currentUser?.id && <span style={{ color: "#666", fontSize: "0.9em" }}>(You)</span>}
              </div>
              <div style={{ color: "#555", fontSize: "0.95em", marginBottom: "8px" }}>
                <div>Role: <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>{u.role}</span></div>
                <div>Reporting Manager: <strong>{managerEmail}</strong></div>
                <div style={{ fontSize: "0.85em", color: "#888" }}>ID: {u.userId}</div>
              </div>

              {isCFO && u.userId !== currentUser?.id && (
                <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "16px" }}>
                  {/* Role Assignment */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "0.85em", fontWeight: "bold" }}>Role:</label>
                    <select
                      value={selectedRoles[u.userId] || u.role}
                      onChange={(e) => setSelectedRoles({ ...selectedRoles, [u.userId]: e.target.value })}
                      style={{ padding: "4px" }}
                    >
                      <option value="EMP">Employee (EMP)</option>
                      <option value="RM">Reporting Manager (RM)</option>
                      <option value="APE">APE</option>
                      <option value="CFO">CFO</option>
                    </select>
                    <button 
                      onClick={() => handleRoleChange(u.userId, selectedRoles[u.userId])}
                      disabled={selectedRoles[u.userId] === u.role}
                      style={{ padding: "4px 8px" }}
                    >
                      Update
                    </button>
                  </div>

                  {/* Manager Assignment (Only for EMPs) */}
                  {u.role === "EMP" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{ fontSize: "0.85em", fontWeight: "bold" }}>Manager:</label>
                      <select
                        value={selectedManagers[u.userId] || ""}
                        onChange={(e) => setSelectedManagers({ ...selectedManagers, [u.userId]: e.target.value })}
                        style={{ padding: "4px" }}
                      >
                        <option value="">-- None --</option>
                        {managersList.map(m => (
                          <option key={m.userId} value={m.userId}>{m.email}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleManagerChange(u.userId, selectedManagers[u.userId])}
                        disabled={selectedManagers[u.userId] === (u.reportingManagerId || "")}
                        style={{ padding: "4px 8px" }}
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
