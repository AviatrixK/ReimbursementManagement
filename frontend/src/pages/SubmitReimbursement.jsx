import React, { useState } from "react";
import { api } from "../api";

export default function SubmitReimbursement() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.raiseReimbursement({ title, description, amount });
      setMessage({ type: "success", text: res.message || "Submitted" });
      setTitle(""); setDescription(""); setAmount("");
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  return (
    <div className="card">
      <h3>Submit Reimbursement</h3>
      <form onSubmit={submit}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <label>Amount (in ₹)</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 150" />
        <div>
          <button type="submit">Submit</button>
        </div>
      </form>
      {message && <div style={{ color: message.type === "error" ? "red" : "green", marginTop:8 }}>{message.text}</div>}
    </div>
  );
}
