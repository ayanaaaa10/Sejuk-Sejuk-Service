// src/pages/TechnicianPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import emailjs from "@emailjs/browser";

const TechnicianPage = () => {
  const [technicianName, setTechnicianName] = useState("");
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [workDone, setWorkDone] = useState("");
  const [extraCharges, setExtraCharges] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let nameToUse = user.email.split("@")[0].toLowerCase();
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().username) {
            nameToUse = userDocSnap.data().username.toLowerCase();
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        setTechnicianName(nameToUse);
      } else {
        setTechnicianName("");
        setAssignedOrders([]);
        setSelectedOrder(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!technicianName) return;

    const fetchOrders = async () => {
      try {
        const ordersCollectionRef = collection(db, "orders");
        const q = query(ordersCollectionRef, where("technician", "==", technicianName));
        const querySnapshot = await getDocs(q);

        const rawFetchedOrders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const activeOrders = rawFetchedOrders.filter((order) => order.status !== "Job Done");
        setAssignedOrders(activeOrders);

        if (activeOrders.length === 0) {
          setMessage({ type: "info", text: "No pending jobs assigned to you." });
        } else {
          setMessage({ type: "", text: "" });
        }
      } catch (err) {
        setMessage({ type: "error", text: "Failed to fetch orders." });
      }
    };

    fetchOrders();
  }, [technicianName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!selectedOrder) {
      setMessage({ type: "error", text: "Please select an order first." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const extra = Number(extraCharges) || 0;
      const basePrice = Number(selectedOrder.price) || 0;
      const finalAmount = basePrice + extra;

      const orderRef = doc(db, "orders", selectedOrder.id);

      await updateDoc(orderRef, {
        workDone,
        extraCharges: extra,
        finalAmount,
        remarks,
        status: "Job Done",
        jobCompletedAt: serverTimestamp(),
        completedByTechnician: technicianName,
      });

      const technician = technicianName;
      const orderId = selectedOrder.id;
      const now = new Date().toLocaleString();

      // Handle multiple phone numbers (string or array)
      let customerNumbers = [];
      if (Array.isArray(selectedOrder.phone)) {
        customerNumbers = selectedOrder.phone;
      } else if (typeof selectedOrder.phone === "string" && selectedOrder.phone.trim() !== "") {
        customerNumbers = [selectedOrder.phone];
      }

      customerNumbers.forEach((num) => {
        let cleanNum = num.replace(/[^\d]/g, ""); // Remove non-digit chars

        // If number does not start with known country code, prepend default (e.g. Malaysia '60')
        // Adjust the list as needed for your countries
        const knownCountryCodes = ["60", "1", "44", "91", "81", "61"]; // add more if needed
        const startsWithKnownCode = knownCountryCodes.some((code) => cleanNum.startsWith(code));

        if (!startsWithKnownCode) {
          cleanNum = "60" + cleanNum.replace(/^0+/, "");
        }

        const waMessage = `Hi ${selectedOrder.customer}, job ${orderId} has been completed by Technician ${technician} at ${now}. Please check and leave feedback. Thank you!`;
        const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, "_blank");
      });

      try {
        await emailjs.send(
          "sejuk_services",
          "template_f113p7e",
          {
            technician_name: technician,
            order_id: orderId,
            time: now,
            to_email: "arieanainsyirah109@gmail.com",
            from_name: technician,
            reply_email: "noreply@sejuk.my",
          },
          "fDhyXVxD7eCY4DLhI"
        );
      } catch (emailError) {
        console.error("EmailJS send error:", emailError);
      }

      setMessage({ type: "success", text: "Job marked as done, WhatsApp opened, and email sent!" });
      setSelectedOrder(null);
      setWorkDone("");
      setExtraCharges("");
      setRemarks("");
      setAssignedOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
    } catch (error) {
      const errorText = error.message.includes("max")
        ? error.message
        : "Failed to complete job. Please try again.";
      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 to-white flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Technician Dashboard</h2>
        <p className="text-center text-gray-600 mb-6">
          Welcome, <span className="capitalize font-semibold">{technicianName}</span>
        </p>

        <div className="mb-6">
          <label htmlFor="order-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Assigned Order
          </label>
          <select
            id="order-select"
            value={selectedOrder?.id || ""}
            onChange={(e) => {
              const selected = assignedOrders.find((o) => o.id === e.target.value);
              setSelectedOrder(selected);
              setWorkDone("");
              setExtraCharges("");
              setRemarks("");
              setMessage({ type: "", text: "" });
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="">
              {assignedOrders.length === 0 ? "-- No pending orders --" : "-- Select an order --"}
            </option>
            {assignedOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.customer} | {order.address} | RM{order.price}
              </option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Order Details</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Customer:</strong> {selectedOrder.customer}</li>
                <li><strong>Service:</strong> {selectedOrder.service}</li>
                <li><strong>Problem:</strong> {selectedOrder.problem}</li>
                <li><strong>Quoted Price:</strong> RM{Number(selectedOrder.price || 0).toFixed(2)}</li>
                <li><strong>Status:</strong> {selectedOrder.status}</li>
              </ul>
            </div>

            <div>
              <label htmlFor="work-done" className="block text-sm font-medium text-gray-700">
                Work Done <span className="text-red-500">*</span>
              </label>
              <textarea
                id="work-done"
                required
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Describe the work performed..."
              />
            </div>

            <div>
              <label htmlFor="extra-charges" className="block text-sm font-medium text-gray-700">
                Extra Charges (RM)
              </label>
              <input
                id="extra-charges"
                type="number"
                value={extraCharges}
                onChange={(e) => setExtraCharges(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Final Amount</label>
              <p className="font-bold text-xl text-green-600">
                RM {(Number(selectedOrder.price || 0) + Number(extraCharges || 0)).toFixed(2)}
              </p>
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks</label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Any additional remarks..."
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors duration-300 ${
                  loading ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Submitting..." : "Complete Job"}
              </button>
            </div>
          </form>
        )}

        {message.text && (
          <p
            className={`mt-6 p-4 rounded-lg text-center font-medium ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : message.type === "error"
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default TechnicianPage;
