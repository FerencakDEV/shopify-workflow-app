import React from "react";

const assignees = ["Q1", "Q2", "Design", "Online", "Posters", "Thesis"];

const StaffWorkload = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Staff Workload</h1>

      <p className="text-gray-600 dark:text-gray-300">
        Tu nájdeš rozdelenie objednávok medzi jednotlivých zamestnancov alebo oddelenia.
        Graf znázorňuje počet aktívnych úloh na základe aktuálneho statusu.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {assignees.map((name) => (
          <div
            key={name}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex flex-col justify-between"
          >
            <h2 className="text-lg font-semibold mb-2">{name}</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>In Progress</span>
                <span>{Math.floor(Math.random() * 15)}</span>
              </div>
              <div className="h-2 bg-orange-400 rounded" style={{ width: "80%" }}></div>

              <div className="flex justify-between text-sm">
                <span>Assigned</span>
                <span>{Math.floor(Math.random() * 10)}</span>
              </div>
              <div className="h-2 bg-gray-400 rounded" style={{ width: "50%" }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffWorkload;
