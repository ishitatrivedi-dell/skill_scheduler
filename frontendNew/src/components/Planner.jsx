import React, { useState, useEffect } from "react";
import ToDo from "../pages/To-do.jsx";
import Exam from "../pages/Exam.jsx";
import Study from "../pages/Study.jsx";
import ClipLoader from "react-spinners/ClipLoader";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, BookOpen } from "lucide-react";

const Planner = () => {
  const [tabState, setTabState] = useState("todo");
  const [loading, setLoading] = useState(false);

  // Simulating a loading delay when switching tabs
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Smooth transition delay
    return () => clearTimeout(timer);
  }, [tabState]);

  // Animation variants for sidebar buttons
  const buttonVariants = {
    inactive: { scale: 1, backgroundColor: "#ffffff" },
    active: { scale: 1.05, backgroundColor: "#e5e7eb" },
    hover: { scale: 1.03, backgroundColor: "#f3f4f6" },
  };

  // Animation variants for content
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex text-black w-screen h-[calc(100vh-64px)] pt-[64px] overflow-y-auto bg-gray-100">
      {/* Sidebar */}
      <motion.div
        className="w-[224px] bg-white text-black p-[16px] flex flex-col space-y-4 sticky top-[64px] shadow-lg"
        initial={{ x: -224 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.h2
          className="text-2xl font-bold mb-6 text-gray-800 flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <BookOpen className="text-blue-500" />
          <span>Skill Scheduler</span>
              {/* {["To-do list", "", "revision", "improvements"].map((tab) => (
            <button
              key={tab}
              className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-300 ${
                tabState === tab
                  ? "bg-black text-white shadow-lg"
                  : "hover:bg-gray-200 text-gray-700 hover:scale-105"
              }`}
              onClick={() => setTabState(tab)}
            >
              {tab === "notes" && "📝 Notes"}
              {tab === "yesterday" && "🔄 Yesterday"}
              {tab === "revision" && "📖 Revision"}
              {tab === "improvements" && "🚀 Improvements"}
            </button>
          ))} */}
        </motion.h2>
        <div className="space-y-3">
          <motion.button
            variants={buttonVariants}
            initial="inactive"
            animate={tabState === "todo" ? "active" : "inactive"}
            whileHover="hover"
            className={`w-full p-3 rounded-lg text-left transition duration-300 flex items-center space-x-2 text-gray-700`}
            onClick={() => setTabState("todo")}
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>To-Do List</span>
          </motion.button>
          <motion.button
            variants={buttonVariants}
            initial="inactive"
            animate={tabState === "exam" ? "active" : "inactive"}
            whileHover="hover"
            className={`w-full p-3 rounded-lg text-left transition duration-300 flex items-center space-x-2 text-gray-700`}
            onClick={() => setTabState("exam")}
          >
            <Calendar className="w-5 h-5 text-red-500" />
            <span>Exam Dates</span>
          </motion.button>
          <motion.button
            variants={buttonVariants}
            initial="inactive"
            animate={tabState === "plan" ? "active" : "inactive"}
            whileHover="hover"
            className={`w-full p-3 rounded-lg text-left transition duration-300 flex items-center space-x-2 text-gray-700`}
            onClick={() => setTabState("plan")}
          >
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span>Study Plan</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <motion.div
            className="flex justify-center items-center h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ClipLoader color="#4A90E2" size={50} />
          </motion.div>
        ) : (
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6"
          >
            {tabState === "todo" && <ToDo />}
            {tabState === "exam" && <Exam />}
            {tabState === "plan" && <Study />}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Planner;