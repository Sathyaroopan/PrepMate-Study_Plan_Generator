import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  startTime: { type: String, required: true }, // e.g., "09:00"
  endTime: { type: String, required: true },   // e.g., "10:00"
  isBreak: { type: Boolean, default: false },
}, { _id: false });

const TimetableSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  slots: {
    type: [SlotSchema],
    default: [
      { id: 1, startTime: "09:00", endTime: "10:00", isBreak: false },
      { id: 2, startTime: "10:00", endTime: "11:00", isBreak: false },
      { id: 3, startTime: "11:00", endTime: "11:15", isBreak: true },
      { id: 4, startTime: "11:15", endTime: "12:15", isBreak: false },
      { id: 5, startTime: "12:15", endTime: "13:00", isBreak: true },
      { id: 6, startTime: "13:00", endTime: "14:00", isBreak: false },
      { id: 7, startTime: "14:00", endTime: "15:00", isBreak: false },
    ],
  },
  timetable: {
    type: Object,
    default: {},
  },
}, { timestamps: true });

const Timetable = mongoose.models.Timetable || mongoose.model("Timetable", TimetableSchema);
export default Timetable;
