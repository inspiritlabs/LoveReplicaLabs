import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DemoWorkspace from "@/components/demo-workspace";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
      return;
    }
    setUser(JSON.parse(userData));
  }, [setLocation]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  if (!user) {
    return null; // Loading or redirecting
  }

  return (
    <div className="min-h-screen">
      <DemoWorkspace user={user} onSignOut={handleSignOut} />
    </div>
  );
}