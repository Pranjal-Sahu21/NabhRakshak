import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const MotionDiv = motion.div as React.FC<any>;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 30 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
    },
  },
};

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const Navbar = ({ sidebarOpen, setSidebarOpen }: NavbarProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLinkClick = (sectionId: string) => {
    setSidebarOpen(false);

    // If not on CombinedDashboard, navigate first passing target section in router state
    if (window.location.pathname !== "/dashboard") {
      navigate("/dashboard", { state: { scrollToSection: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      const mainContainer = document.querySelector("main");
      if (element && mainContainer) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = mainContainer.getBoundingClientRect();
        const targetScrollTop =
          mainContainer.scrollTop + elementRect.top - containerRect.top - 100;

        mainContainer.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      }
    }
  };

  // Mock system status and notifications for now
  const systemStatus = { status: "operational", lastUpdate: new Date() };
  const notifications = [];

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !(notificationRef.current as any).contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !(userMenuRef.current as any).contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] px-6 py-3.5 text-white z-[90]">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo + Text */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <img
              src="/assets/nabhrakshak-logo.svg"
              alt="NabhRakshak Logo"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-lg font-normal tracking-widest text-[#e8e8e8]">
              NabhRakshak
            </span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-all bg-white/5 flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Sliding Right Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <MotionDiv
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100]"
          />
        )}
        {sidebarOpen && (
          <MotionDiv
            key="sidebar-container"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-[500px] max-w-full bg-black border-l border-white/10 p-6 flex flex-col z-[101] shadow-2xl text-white font-sans"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <img
                  src="/assets/nabhrakshak-logo.svg"
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-sm tracking-widest font-normal text-gray-300">
                  NabhRakshak
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-all bg-white/5"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Links - Staggered */}
            <MotionDiv
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex-1 flex flex-col justify-start space-y-7 py-10"
            >
              {[
                { name: "Mission Control Dashboard", id: "section-dashboard" },
                { name: "3D Space Visualization", id: "section-globe" },
                {
                  name: "Indian Satellites Database",
                  id: "section-satellites",
                },
                { name: "Active Collision Warnings", id: "section-alerts" },
                {
                  name: "Space Weather Intelligence",
                  id: "section-space-weather",
                },
                { name: "How it works", href: "/architecture" },
              ].map((link) => (
                <MotionDiv key={link.name} variants={itemVariants}>
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      if (link.href) {
                        navigate(link.href);
                      } else if (link.id) {
                        handleLinkClick(link.id);
                      }
                    }}
                    className="block text-left text-2xl lg:text-3xl font-light tracking-wide text-gray-400 hover:text-white transition-all py-1.5 pl-4 border-l-2 border-transparent hover:border-[#4DA3FF] hover:translate-x-2 w-full"
                  >
                    {link.name}
                  </button>
                </MotionDiv>
              ))}
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
