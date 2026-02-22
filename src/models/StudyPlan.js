import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  },
  title: String,
  startTime: Date,
  endTime: Date,
  duration: Number, // minutes
}, { _id: false });

const StudyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    taskIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    preferences: {
      morningStudy: { type: Boolean, default: true },
      morningEndTime: { type: String, default: "09:00" },
      useFreeSlots: { type: Boolean, default: true },
    },
    sessions: [SessionSchema],
    totalSessions: {
      type: Number,
      default: 0,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.StudyPlan ||
  mongoose.model("StudyPlan", StudyPlanSchema);
