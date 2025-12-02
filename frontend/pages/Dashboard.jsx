import React from 'react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Total Projects</h2>
            <p className="text-3xl font-bold text-primary">24</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Active Assessments</h2>
            <p className="text-3xl font-bold text-primary">12</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">High Risk Projects</h2>
            <p className="text-3xl font-bold text-destructive">5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
