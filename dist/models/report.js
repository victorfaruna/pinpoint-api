"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportType = void 0;
const mongoose_1 = require("mongoose");
// Enum to represent the type of entity being reported
var ReportType;
(function (ReportType) {
    ReportType["USER"] = "user";
    ReportType["POST"] = "post";
    ReportType["COMMENT"] = "comment";
    ReportType["OTHER"] = "other";
})(ReportType || (exports.ReportType = ReportType = {}));
// Generalized Report Schema
const ReportSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true }, // Reporter
    reportType: {
        type: String,
        enum: Object.values(ReportType),
        required: true,
    }, // Type of report
    reportId: { type: mongoose_1.Schema.Types.ObjectId, required: true }, // Entity being reported (User, Post, Comment, etc.)
    reason: { type: String, required: true }, // Reason for reporting
    description: { type: String }, // Additional optional description
}, { timestamps: true });
// Create and export the Report model
const Report = (0, mongoose_1.model)("Report", ReportSchema);
exports.default = Report;
