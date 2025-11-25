import { Outlet } from "react-router-dom";
import { useAuth } from "@/layouts/Root";
import { useSelector } from "react-redux";
import React from "react";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

function Layout() {
  const { logout } = useAuth();
  const { user, isAuthenticated } = useSelector(state => state.user);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with logout button */}
      {isAuthenticated && (
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <ApperIcon name="CheckSquare" className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-700">FlowTrack</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-slate-600">
                  Welcome, {user.firstName || user.emailAddress}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <ApperIcon name="LogOut" className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <Outlet />
    </div>
  )
}

export default Layout