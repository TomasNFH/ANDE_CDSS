import React, { useEffect, useState } from "react";

const FullTable = () => {
  const [tableData, setTableData] = useState<string[][] | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("fullTableData");
    if (data) {
      setTableData(JSON.parse(data));
    }
  }, []);

  if (!tableData) return <div>No data found.</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Full Table</h1>
      <div className="overflow-x-auto w-full">
        <table className="min-w-full bg-white border border-gray-200 rounded shadow">
          <thead>
            <tr>
              {tableData[0].map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 border-b bg-gray-100 text-left text-sm font-semibold text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-2 border-b text-sm text-gray-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FullTable;
