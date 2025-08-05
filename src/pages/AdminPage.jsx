import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";
import emailjs from "@emailjs/browser";

function AdminPage() {
  const [form, setForm] = useState({
    customer: "",
    phone: "",
    address: "",
    problem: "",
    service: "",
    price: "",
    technician: "",
    notes: ""
  });

  const [technicians, setTechnicians] = useState([]);
  const [techEmails, setTechEmails] = useState({});

  useEffect(() => {
    const fetchTechnicians = async () => {
      const q = query(collection(db, "users"), where("role", "==", "technician"));
      const snapshot = await getDocs(q);
      const names = [], emails = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.username && data.email) {
          names.push(data.username);
          emails[data.username] = data.email;
        }
      });
      setTechnicians(names);
      setTechEmails(emails);
    };
    fetchTechnicians();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...form,
        status: "Pending",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null
      });

      const technicianEmail = techEmails[form.technician];

      if (technicianEmail) {
        const templateParams = {
          technician_name: form.technician,
          order_id: docRef.id,
          customer: form.customer,
          phone: form.phone,
          address: form.address,
          service: form.service,
          problem: form.problem,
          price: form.price,
          notes: form.notes,
          time: new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }),
          to_email: technicianEmail,
          from_name: "Sejuk Admin",
          reply_email: technicianEmail
        };

        await emailjs.send(
          "sejuk_services",
          "template_nba0ftj",
          templateParams,
          "fDhyXVxD7eCY4DLhI"
        );
      }

      alert("Order submitted!");
      setForm({
        customer: "",
        phone: "",
        address: "",
        problem: "",
        service: "",
        price: "",
        technician: "",
        notes: ""
      });
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit order");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-3xl p-10">
        <h1 className="text-4xl font-bold text-blue-700 text-center mb-10">Admin Order Form</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <Input label="Customer Name" name="customer" value={form.customer} onChange={handleChange} />
            <Input label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />
            <Input label="Address" name="address" value={form.address} onChange={handleChange} />
            <TextArea label="Problem Description" name="problem" value={form.problem} onChange={handleChange} />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <Select
              label="Service Type"
              name="service"
              value={form.service}
              onChange={handleChange}
              options={["Repair", "Maintenance", "Installation"]}
            />
            <Input type="number" label="Price (RM)" name="price" value={form.price} onChange={handleChange} />
            <Select
              label="Assigned Technician"
              name="technician"
              value={form.technician}
              onChange={handleChange}
              options={technicians}
            />
            <TextArea label="Additional Notes" name="notes" value={form.notes} onChange={handleChange} optional />
          </div>

          {/* Submit button full width */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
            >
              Submit Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPage;

// Reusable Input Component
const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-gray-700 font-medium mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// Reusable TextArea
const TextArea = ({ label, name, value, onChange, optional = false }) => (
  <div>
    <label className="block text-gray-700 font-medium mb-1">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={3}
      required={!optional}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// Reusable Select Component
const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-gray-700 font-medium mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">-- Select --</option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);
