const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

let db;
let dashboardCollection;
let plannerCollection;
let notesCollection;

// Initialize collections
const initializeCollections = (database) => {
  db = database;
  dashboardCollection = db.collection('dashboard');
  plannerCollection = db.collection('planner');
  notesCollection = db.collection('notes');
  console.log("✅ Dashboard collections initialized.");
};

// Helper to calculate averages
const calculateAverages = (history) => {
  if (!history || history.length === 0) {
    return { averageScore: 0, accuracy: 0, totalQuizzes: 0, totalCorrect: 0, totalQuestions: 0 };
  }

  const totalQuizzes = history.length;
  const totalCorrect = history.reduce((sum, quiz) => sum + (quiz.correctAnswers || 0), 0);
  const totalQuestions = history.reduce((sum, quiz) => sum + (quiz.totalQuestions || 0), 0);
  const totalScore = history.reduce((sum, quiz) => sum + (quiz.score || 0), 0);

  return {
    averageScore: totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0,
    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    totalQuizzes,
    totalCorrect,
    totalQuestions,
  };
};

// Dashboard data endpoint
router.get('/dashboard', async (req, res) => {
  try {
    if (!plannerCollection || !notesCollection || !dashboardCollection) {
      return res.status(500).json({ error: "Database collections not initialized" });
    }

    const userId = req.user?.id || "anonymous"; // Support authenticated and anonymous users

    const [totalTasks, completedTasks, notesOverview, progressDataRaw] = await Promise.all([
      plannerCollection.countDocuments({ userId }),
      plannerCollection.countDocuments({ userId, status: "Completed" }),
      notesCollection
        .find({ userId }, { projection: { id: 1, title: 1, content: 1, createdAt: 1 } })
        .toArray(),
      dashboardCollection
        .findOne({ type: "progress", userId })
        .then((doc) => doc || {}),
    ]);

    const progressData = progressDataRaw || {};

    const taskCompletionPercentage = totalTasks > 0
      ? ((completedTasks / totalTasks) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      progressReport: { totalTasks, completedTasks, taskCompletionPercentage },
      studiedHours: progressData.studiedHours || 0,
      quizProgress: progressData.quizProgress || 0,
      notesOverview,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ error: "Error fetching dashboard data", details: err.message });
  }
});

// Quiz performance endpoints
router.get('/quiz-performance', async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || "anonymous";
    const performanceData = await dashboardCollection.findOne({
      type: "quiz-performance",
      userId,
    }) || { history: [] };

    // Calculate stats
    const stats = calculateAverages(performanceData.history);

    res.status(200).json({
      history: performanceData.history,
      stats,
    });
  } catch (err) {
    console.error("Error fetching quiz performance:", err);
    res.status(500).json({ error: "Error fetching quiz performance", details: err.message });
  }
});

router.post("/quiz-performance", async (req, res) => {
  try {
    const { score, correctAnswers, totalQuestions, userId = req.user?.id || "anonymous" } = req.body;

    // Validate input
    if (!Number.isInteger(score) || !Number.isInteger(correctAnswers) || !Number.isInteger(totalQuestions)) {
      return res.status(400).json({ error: "Invalid quiz performance data" });
    }

    const quizResult = {
      date: new Date(),
      score,
      correctAnswers,
      totalQuestions,
    };

    // Get current data to calculate new averages
    const currentData = await dashboardCollection.findOne({
      type: "quiz-performance",
      userId,
    }) || { history: [] };

    const updatedHistory = [...(currentData.history || []), quizResult];
    const stats = calculateAverages(updatedHistory);

    const result = await dashboardCollection.updateOne(
      { type: "quiz-performance", userId },
      {
        $set: {
          history: updatedHistory,
          stats,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );

    // Update quizProgress in progress document
    await dashboardCollection.updateOne(
      { type: "progress", userId },
      {
        $set: {
          quizProgress: stats.accuracy || score,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );

    res.status(201).json({
      message: "Quiz performance updated",
      stats,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating quiz performance:", error);
    res.status(500).json({ error: "Error updating quiz performance", details: error.message });
  }
});

module.exports = { router, initializeCollections };