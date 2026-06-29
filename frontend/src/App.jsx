import React, { useState, useEffect } from "react";
import { api } from "./api";

import LoginPage from "./pages/Login";
import EmployeesPage from "./pages/Employees";
import ReimbursementsPage from "./pages/Reimbursements";
import SubmitReimbursement from "./pages/SubmitReimbursement";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");

  useEffect(() => {
    // Try to load a small health endpoint to determine server is up.
    fetch("/rest/health").catch(() => {});
  }, []);

  const handleLogin = async (creds) => {
    const res = await api.login(creds);
    setUser(res.data.user);
    setView("employees");
  };

  const handleRegister = async (creds) => {
    await api.register(creds);
    const res = await api.login(creds);
    setUser(res.data.user);
    setView("employees");
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setUser(null);
    setView("login");
  };

  return (
    <div className="app">
      <div className="nav">
        <button onClick={() => setView("employees")}>Employees</button>
        <button onClick={() => setView("reimbursements")}>Reimbursements</button>
        <button onClick={() => setView("submit")}>Submit Claim</button>
        <div style={{ flex: 1 }} />
        {user ? (
          <div>
            <span style={{ marginRight: 8 }}>{user.email} ({user.role})</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={() => setView("login")}>Login / Register</button>
        )}
      </div>

      {view === "login" && <LoginPage onLogin={handleLogin} onRegister={handleRegister} />}
      {view === "employees" && <EmployeesPage currentUser={user} />}
      {view === "reimbursements" && <ReimbursementsPage currentUser={user} />}
      {view === "submit" && <SubmitReimbursement currentUser={user} />}
    </div>
  );
}
