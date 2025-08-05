// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminPage from "./pages/AdminPage";
import TechnicianPage from "./pages/TechnicianPage";

// --- ProtectedRoute Component (Handles Auth and Role Check) ---
const ProtectedRoute = ({ children, requiredRole }) => {
  // Removed the unused 'user' state from here as 'isAuthenticated' is sufficient.
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsAuthenticated(!!currentUser); // Set authentication status

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role);
            console.log("ProtectedRoute: User role fetched:", userDocSnap.data().role);
          } else {
            console.warn("ProtectedRoute: User document not found in Firestore for UID:", currentUser.uid, " - User might not have a role defined.");
            setUserRole(null); // No role found
          }
        } catch (error) {
          console.error("ProtectedRoute: Error fetching user role:", error);
          setUserRole(null); // Handle error case
        }
      } else {
        setUserRole(null); // Clear role if no user
      }
      setLoading(false); // Authentication and role check complete
    });
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-lg font-semibold">
        Checking authentication and role...
      </div>
    );
  }

  // If not authenticated at all, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but role doesn't match, redirect or show unauthorized message
  if (requiredRole && userRole !== requiredRole) {
    console.warn(`Access denied: User role "${userRole}" does not match required role "${requiredRole}".`);
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and role matches (or no required role specified), render content
  return children;
};
// --- End ProtectedRoute Component ---


function App() {
  const [user, setUser] = useState(null); // State to track user for Navbar display
  const [userRole, setUserRole] = useState(null); // State to track user role for Navbar display
  const [loadingNavUser, setLoadingNavUser] = useState(true); // Loading state for Navbar
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser); // Set user for conditional rendering of logout/login links
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role for Navbar:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoadingNavUser(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 p-4 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            Sejuk Sejuk Service
          </Link>
          <div className="space-x-4">
            {loadingNavUser ? (
              <span>Loading...</span> // Show loading state for nav links
            ) : user ? (
              <>
                {userRole === "admin" && (
                  <Link to="/admin" className="hover:text-blue-200">
                    Admin Dashboard
                  </Link>
                )}
                {userRole === "technician" && (
                  <Link to="/technician" className="hover:text-blue-200">
                    Technician Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="px-3 py-1 bg-red-500 rounded hover:bg-red-600">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">
                  Login
                </Link>
                <Link to="/signup" className="hover:text-blue-200">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <Routes>
          {/* Default route: redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes - Require Login AND Role Check */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician"
            element={
              <ProtectedRoute requiredRole="technician">
                <TechnicianPage />
              </ProtectedRoute>
            }
          />

          {/* Optional: Unauthorized Page */}
          <Route path="/unauthorized" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 text-red-700 text-2xl font-bold p-4">
              <p className="mb-4 text-center">Unauthorized Access! You do not have permission to view this page.</p>
              <button
                onClick={() => auth.signOut().then(() => navigate('/login'))} // Redirect to login after logout
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Log Out
              </button>
            </div>
          } />

          {/* Fallback for any unknown routes */}
          <Route path="*" element={<p className="text-center mt-8 text-gray-600">Page Not Found</p>} />
        </Routes>
      </main>
    </div>
  );
}

// Wrapping App with Router for the entire application
const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;