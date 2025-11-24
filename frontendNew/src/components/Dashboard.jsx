import React, { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const Dashboard = () => {
  const [progress, setProgress] = useState(0);
  const [studyHours, setStudyHours] = useState(0);
  const [quizProgress, setQuizProgress] = useState(0);
  const [notes, setNotes] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [showQuizDetails, setShowQuizDetails] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, examsRes, quizPerformanceRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/dashboard`),
        fetch(`${API_BASE}/api/planner/exams`),
        fetch(`${API_BASE}/api/dashboard/quiz-performance`),
      ]);

      if (!dashboardRes.ok) {
        const text = await dashboardRes.text();
        throw new Error(`Dashboard fetch failed: ${dashboardRes.status} ${text}`);
      }
      if (!examsRes.ok) {
        const text = await examsRes.text();
        throw new Error(`Exams fetch failed: ${examsRes.status} ${text}`);
      }
      if (!quizPerformanceRes.ok) {
        const text = await quizPerformanceRes.text();
        throw new Error(`Quiz performance fetch failed: ${quizPerformanceRes.status} ${text}`);
      }

      const dashboardData = await dashboardRes.json();
      setNotes(dashboardData.notesOverview || []);
      setStudyHours(dashboardData.studiedHours || 0);
      setQuizProgress(dashboardData.quizProgress || 0);
      setProgress(
        typeof dashboardData.progressReport?.taskCompletionPercentage === "number"
          ? dashboardData.progressReport.taskCompletionPercentage
          : parseFloat(dashboardData.progressReport?.taskCompletionPercentage) || 0
      );

      let examsData = await examsRes.json();
      examsData = examsData.sort((a, b) => new Date(a.date) - new Date(b.date));
      setUpcomingExams(examsData || []);

      const quizPerformanceData = await quizPerformanceRes.json();
      setQuizHistory(quizPerformanceData.history || []);

      localStorage.setItem("quizHistory", JSON.stringify(quizPerformanceData.history || []));
      localStorage.setItem(
        "quizProgress",
        quizPerformanceData.stats?.accuracy || dashboardData.quizProgress || 0
      );

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
      const storedProgress = localStorage.getItem("quizProgress");
      if (storedProgress) {
        setQuizProgress(parseInt(storedProgress));
      }
      const storedHistory = JSON.parse(localStorage.getItem("quizHistory") || "[]");
      setQuizHistory(storedHistory);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkForQuizUpdate = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const fromQuiz = urlParams.get("fromQuiz");

      if (fromQuiz === "true") {
        window.history.replaceState({}, document.title, window.location.pathname);
        setShowQuizDetails(true);
      }
    };

    checkForQuizUpdate();
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const MAX_NOTES_TO_SHOW = 3;

  const quizStats = React.useMemo(() => {
    if (quizHistory.length === 0) return null;

    const totalQuizzes = quizHistory.length;
    const totalCorrect = quizHistory.reduce((sum, quiz) => sum + quiz.correctAnswers, 0);
    const totalQuestions = quizHistory.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
    const averageScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / totalQuizzes;

    return {
      totalQuizzes,
      totalCorrect,
      totalQuestions,
      averageScore: Math.round(averageScore),
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    };
  }, [quizHistory]);

  return (
    <div className="bg-gray-100 text-black p-6 flex flex-col items-center w-screen h-[calc(100vh-64px)] mt-[64px] overflow-y-auto">
      <h1 className="text-3xl font-bold animate-fade-in">Welcome to Skill Scheduler</h1>
      <p className="text-lg text-gray-500 mt-2 animate-fade-in delay-200">Focus Forward</p>

      {lastUpdate && (
        <p className="text-sm text-gray-400 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      <button
        onClick={fetchDashboardData}
        className="mt-2 px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
      >
        Refresh Dashboard
      </button>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <ClipLoader color="#000000" size={50} />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mt-6">
          {/* Progress Overview Card */}
          <div className="bg-black p-6 rounded-lg shadow-md text-center transform transition-all hover:scale-105 hover:shadow-lg">
            <h3 className="text-xl font-semibold mb-2 text-white animate-slide-up">Progress Overview</h3>
            <div
              className="relative w-24 h-24 mx-auto rounded-full border-4 border-gray-300 flex items-center justify-center animate-spin-slow cursor-pointer"
              onClick={() => setShowQuizDetails(!showQuizDetails)}
            >
              <span className="text-2xl text-white">{studyHours}Hr</span>
            </div>
            <p className="mt-2 text-gray-300">Your Progress</p>
            <div className="mt-4">
              <p className="text-sm text-gray-300">Quiz Progress</p>
              <div className="w-full bg-gray-700 h-3 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${quizProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-white mt-1">{quizProgress}%</p>
              <button
                onClick={() => setShowQuizDetails(!showQuizDetails)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors w-full"
              >
                {showQuizDetails ? "Hide Quiz Details" : "View Quiz Performance"}
              </button>
            </div>
          </div>

          {/* Quiz Details Card */}
          {showQuizDetails && (
            <div className="md:col-span-2 bg-black p-6 rounded-lg shadow-md transform transition-all hover:scale-105 hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-white animate-slide-up">Quiz Performance</h3>
              {quizHistory.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-800 p-3 rounded-lg text-center">
                      <p className="text-gray-400 text-xs">Quizzes Taken</p>
                      <p className="text-white text-xl font-bold">{quizStats.totalQuizzes}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg text-center">
                      <p className="text-gray-400 text-xs">Average Score</p>
                      <p className="text-white text-xl font-bold">{quizStats.averageScore}%</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg text-center">
                      <p className="text-gray-400 text-xs">Questions Correct</p>
                      <p className="text-white text-xl font-bold">{quizStats.totalCorrect}/{quizStats.totalQuestions}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg text-center">
                      <p className="text-gray-400 text-xs">Accuracy</p>
                      <p className="text-white text-xl font-bold">{quizStats.accuracy}%</p>
                    </div>
                  </div>
                  <h4 className="text-white font-medium mb-2">Recent Quiz Results</h4>
                  <div className="overflow-auto max-h-40">
                    <table className="w-full">
                      <thead className="text-gray-400 text-xs">
                        <tr>
                          <th className="text-left pb-2">Date</th>
                          <th className="text-center pb-2">Score</th>
                          <th className="text-center pb-2">Correct</th>
                          <th className="text-center pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizHistory.slice(-5).reverse().map((quiz, index) => (
                          <tr key={index} className="border-t border-gray-700">
                            <td className="text-gray-300 text-sm py-2">
                              {new Date(quiz.date).toLocaleDateString()}
                            </td>
                            <td className="text-gray-300 text-sm py-2 text-center">{quiz.score}%</td>
                            <td className="text-gray-300 text-sm py-2 text-center">{quiz.correctAnswers}</td>
                            <td className="text-gray-300 text-sm py-2 text-center">{quiz.totalQuestions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No quiz data available yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Complete quizzes to see your performance.</p>
                </div>
              )}
            </div>
          )}

          {/* Notes Card */}
          {!showQuizDetails && (
            <div className="bg-black p-6 rounded-lg shadow-md transform transition-all hover:scale-105 hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-2 text-white animate-slide-up">Points from Notes</h3>
              {notes.length > 0 ? (
                <>
                  {notes.slice(0, showAllNotes ? notes.length : MAX_NOTES_TO_SHOW).map((note, index) => (
                    <p
                      key={index}
                      className="text-gray-300 text-sm border-b border-gray-700 py-2 animate-fade-in delay-100"
                    >
                      {note.content}
                    </p>
                  ))}
                  {notes.length > MAX_NOTES_TO_SHOW && (
                    <button
                      onClick={() => setShowAllNotes(!showAllNotes)}
                      className="text-gray-400 text-sm mt-2 hover:text-white focus:outline-none transition-colors duration-300"
                    >
                      {showAllNotes ? "See Less" : "See More..."}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-gray-400">No notes available.</p>
              )}
            </div>
          )}

          {/* Exams Card */}
          {!showQuizDetails && (
            <div className="bg-black p-6 rounded-lg shadow-md transform transition-all hover:scale-105 hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-2 text-white animate-slide-up">Exam Priority</h3>
              <ul>
                {upcomingExams.length > 0 ? (
                  upcomingExams.map((exam, index) => (
                    <li
                      key={index}
                      className="text-gray-300 py-1 hover:text-white transition-colors duration-300 cursor-pointer animate-fade-in delay-100"
                    >
                      {exam.subject} - {exam.date}
                    </li>
                  ))
                ) : (
                  <p className="text-gray-400">No upcoming exams.</p>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;