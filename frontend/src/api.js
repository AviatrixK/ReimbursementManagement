const base = "/rest";

async function request(path, options = {}) {
  const res = await fetch(base + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

export const api = {
  register: (payload) => request(`/onboardings/register`, { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request(`/onboardings/login`, { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request(`/onboardings/logout`, { method: "POST" }),

  getEmployees: () => request(`/employees`, { method: "GET" }),

  getReimbursements: () => request(`/reimbursements`, { method: "GET" }),
  raiseReimbursement: (payload) => request(`/reimbursements`, { method: "POST", body: JSON.stringify(payload) }),
  patchReimbursement: (payload) => request(`/reimbursements`, { method: "PATCH", body: JSON.stringify(payload) }),
  getSubordinateClaims: (userId) => request(`/reimbursements/${userId}`, { method: "GET" }),

  assignRole: (payload) => request(`/roles/assign`, { method: "POST", body: JSON.stringify(payload) }),
  assignManager: (payload) => request(`/employees/assign`, { method: "POST", body: JSON.stringify(payload) }),
  removeManager: (payload) => request(`/employees/assign`, { method: "DELETE", body: JSON.stringify(payload) }),
};
