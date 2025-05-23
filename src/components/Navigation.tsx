import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Orders by Status", path: "/orders" },
  { label: "Staff Workload", path: "/workload" },
];

const Navigation = () => {
  return (
    <nav className="w-full bg-gray-100 dark:bg-gray-800 px-4 py-2 flex gap-4 border-b">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow"
                : "text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
