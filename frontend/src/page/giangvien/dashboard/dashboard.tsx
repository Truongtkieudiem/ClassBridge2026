"use client";

import React, { useState } from "react";
import {
  Users,
  MessageSquare,
  Layers,
  Filter,
  Clock,
  ThumbsUp,
  Activity,
  BarChart2,
  TrendingUp,
  RefreshCw,
  Sparkles,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

import styles from "./dashboard.module.css";

// Mẫu dữ liệu mô phỏng cho Dashboard
const OVERVIEW_DATA = {
  totalStudents: 128,
  totalQuestions: 45,
  beforeGrouping: 45,
  afterGrouping: 12, // Tỉ lệ giảm đáng kể nhờ AI Clustering
  reductionRate: "73.3%",
};

const QUESTION_GROUPS = [
  {
    id: "g1",
    title: "Khái niệm Boundary Value Analysis & Edge cases",
    students: 18,
    lang: "Vietnamese",
    status: "answered",
  },
  {
    id: "g2",
    title: "Difference between Black-box & White-box Testing",
    students: 12,
    lang: "English",
    status: "pending",
  },
  {
    id: "g3",
    title: "Cách lập Bảng quyết định (Decision Table)",
    students: 9,
    lang: "Mixed",
    status: "answered",
  },
  {
    id: "g4",
    title: "Equivalence Partitioning in test suite design",
    students: 6,
    lang: "English",
    status: "pending",
  },
];

const STT_LATENCY_LOGS = [
  { time: "09:05 AM", latencyMs: 1200, status: "optimal" },
  { time: "09:15 AM", latencyMs: 1800, status: "optimal" },
  { time: "09:25 AM", latencyMs: 2400, status: "normal" },
  { time: "09:35 AM", latencyMs: 1500, status: "optimal" },
  { time: "09:45 AM", latencyMs: 3100, status: "warning" },
  { time: "09:55 AM", latencyMs: 1400, status: "optimal" },
];

const FEEDBACK_LIST = [
  {
    id: "f1",
    role: "Giảng viên",
    author: "TS. Nguyễn Văn A",
    comment:
      "Nhóm câu hỏi tự động của ClassBridge giúp tôi tiết kiệm 70% thời gian giải đáp thắc mắc trùng lặp trên lớp.",
    rating: 5,
    time: "10:15 AM",
  },
  {
    id: "f2",
    role: "Sinh viên",
    author: "Sinh viên ẩn danh #402",
    comment:
      "Phụ đề song ngữ Anh-Việt chạy rất mượt, câu hỏi đặt bằng tiếng Việt vẫn được gộp chung nhóm với câu hỏi tiếng Anh.",
    rating: 5,
    time: "10:02 AM",
  },
  {
    id: "f3",
    role: "Sinh viên",
    author: "Sinh viên ẩn danh #118",
    comment:
      "Đôi lúc độ trễ STT hơi cao khoảng 3 giây khi thầy nói nhanh, nhưng tổng thể dịch rất dễ hiểu.",
    rating: 4,
    time: "09:48 AM",
  },
];

const ENGAGEMENT_BREAKDOWN = [
  { category: "Đặt câu hỏi trực tiếp", percentage: 42, color: "#2563eb" },
  { category: "Vote / Quan tâm câu hỏi", percentage: 38, color: "#16a34a" },
  { category: "Xem phụ đề song ngữ", percentage: 85, color: "#9333ea" },
  { category: "Chỉ theo dõi bài giảng", percentage: 15, color: "#64748b" },
];

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* HEADER PAGE */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Tổng quan hoạt động lớp học & Phân tích hiệu năng hệ thống
            ClassBridge
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.btnSecondary} ${isRefreshing ? styles.spinning : ""}`}
            onClick={handleRefresh}
          >
            <RefreshCw size={16} /> Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* 1. CÁC CHỈ SỐ TỔNG QUAN (STAT CARDS) */}
      <div className={styles.statsGrid}>
        {/* Card 1: Số sinh viên */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Số sinh viên</span>
            <div
              className={styles.statIcon}
              style={{ background: "#eff6ff", color: "#2563eb" }}
            >
              <Users size={20} />
            </div>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statNumber}>
              {OVERVIEW_DATA.totalStudents}
            </span>
            <span className={styles.statSubtext}>
              <Activity size={12} color="#16a34a" /> Đang tham gia lớp
            </span>
          </div>
        </div>

        {/* Card 2: Số câu hỏi */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Số câu hỏi</span>
            <div
              className={styles.statIcon}
              style={{ background: "#f3e8ff", color: "#9333ea" }}
            >
              <MessageSquare size={20} />
            </div>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statNumber}>
              {OVERVIEW_DATA.totalQuestions}
            </span>
            <span className={styles.statSubtext}>
              <TrendingUp size={12} color="#2563eb" /> Tổng lượt gửi
            </span>
          </div>
        </div>

        {/* Card 3: Trước khi gom nhóm */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Trước khi gom nhóm</span>
            <div
              className={styles.statIcon}
              style={{ background: "#fef3c7", color: "#d97706" }}
            >
              <Filter size={20} />
            </div>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statNumber}>
              {OVERVIEW_DATA.beforeGrouping}
            </span>
            <span className={styles.statSubtext}>
              Gốc (Tiếng Anh + Tiếng Việt)
            </span>
          </div>
        </div>

        {/* Card 4: Sau khi gom nhóm */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Sau khi gom nhóm</span>
            <div
              className={styles.statIcon}
              style={{ background: "#dcfce7", color: "#16a34a" }}
            >
              <Layers size={20} />
            </div>
          </div>
          <div className={styles.statBody}>
            <div className={styles.flexAlign}>
              <span className={styles.statNumber}>
                {OVERVIEW_DATA.afterGrouping}
              </span>
              <span className={styles.badgeHighlight}>
                -{OVERVIEW_DATA.reductionRate}
              </span>
            </div>
            <span className={styles.statSubtext}>Nhóm câu hỏi AI tổng hợp</span>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC BẢNG BIỂU VÀ PHÂN TÍCH */}
      <div className={styles.mainGrid}>
        {/* CỘT TRÁI: Nhóm câu hỏi & STT Latency */}
        <div className={styles.leftColumn}>
          {/* Biểu đồ / Danh sách số lượng sinh viên theo nhóm câu hỏi */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <BarChart2 size={18} className={styles.iconPrimary} /> Số
                  lượng sinh viên có câu hỏi trong mỗi nhóm
                </h3>
                <p className={styles.cardSub}>
                  Thống kê số sinh viên quan tâm theo từng nhóm câu hỏi đồng
                  dạng
                </p>
              </div>
            </div>

            <div className={styles.groupsList}>
              {QUESTION_GROUPS.map((group) => {
                const maxStudents = 20;
                const percent = Math.min(
                  100,
                  Math.round((group.students / maxStudents) * 100),
                );

                return (
                  <div key={group.id} className={styles.groupItem}>
                    <div className={styles.groupMeta}>
                      <span className={styles.groupTitle}>"{group.title}"</span>
                      <div className={styles.groupTags}>
                        <span className={styles.langTag}>{group.lang}</span>
                        {group.status === "answered" ? (
                          <span className={styles.badgeAnswered}>
                            <CheckCircle2 size={12} /> Đã trả lời
                          </span>
                        ) : (
                          <span className={styles.badgePending}>
                            Chờ phản hồi
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.progressRow}>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={styles.progressBarFill}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className={styles.studentCountText}>
                        <Users size={13} /> <strong>{group.students}</strong>{" "}
                        sinh viên
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Biểu đồ độ trễ chuyển đổi âm thành thành văn bản (STT Latency) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <Clock size={18} className={styles.iconWarning} /> Độ trễ
                  chuyển đổi âm thanh thành văn bản (STT Latency)
                </h3>
                <p className={styles.cardSub}>
                  Đo lường thời gian xử lý Speech-to-Text & Translation (Mục
                  tiêu: 1-3 giây)
                </p>
              </div>
              <span className={styles.latencyStatusBadge}>
                Trung bình: 1.8s
              </span>
            </div>

            <div className={styles.latencyVisual}>
              <div className={styles.latencyGridBars}>
                {STT_LATENCY_LOGS.map((log, index) => {
                  const barHeight = Math.min(100, (log.latencyMs / 4000) * 100);
                  let barColor = "#2563eb";
                  if (log.latencyMs > 3000) barColor = "#dc2626";
                  else if (log.latencyMs > 2000) barColor = "#d97706";

                  return (
                    <div key={index} className={styles.latencyBarItem}>
                      <span className={styles.barValue}>
                        {(log.latencyMs / 1000).toFixed(1)}s
                      </span>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.barFill}
                          style={{
                            height: `${barHeight}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                      <span className={styles.barTime}>{log.time}</span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.targetLineGroup}>
                <span className={styles.targetLabel}>Ngưỡng tối ưu (3.0s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Mức độ tương tác & Phản hồi */}
        <div className={styles.rightColumn}>
          {/* Sơ đồ mức độ tương tác của sinh viên */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <Activity size={18} className={styles.iconSuccess} /> Sơ đồ
                  mức độ tương tác
                </h3>
                <p className={styles.cardSub}>
                  Tỷ lệ tham gia của sinh viên trong buổi học
                </p>
              </div>
            </div>

            <div className={styles.engagementGauge}>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreNumber}>88%</span>
                <span className={styles.scoreLabel}>Tương tác cao</span>
              </div>
            </div>

            <div className={styles.engagementList}>
              {ENGAGEMENT_BREAKDOWN.map((item, idx) => (
                <div key={idx} className={styles.engagementRow}>
                  <div className={styles.flexBetween}>
                    <span className={styles.catName}>{item.category}</span>
                    <span className={styles.catPercent}>
                      {item.percentage}%
                    </span>
                  </div>
                  <div className={styles.miniBarTrack}>
                    <div
                      className={styles.miniBarFill}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phản hồi đơn giản của sinh viên và giảng viên */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <ThumbsUp size={18} className={styles.iconPurple} /> Phản hồi
                  bài giảng & hệ thống
                </h3>
                <p className={styles.cardSub}>
                  Đánh giá thực tế từ người dùng trực tiếp
                </p>
              </div>
            </div>

            <div className={styles.feedbackList}>
              {FEEDBACK_LIST.map((fb) => (
                <div key={fb.id} className={styles.feedbackCard}>
                  <div className={styles.feedbackHeader}>
                    <div>
                      <span className={styles.authorName}>{fb.author}</span>
                      <span
                        className={
                          fb.role === "Giảng viên"
                            ? styles.roleLecturer
                            : styles.roleStudent
                        }
                      >
                        {fb.role}
                      </span>
                    </div>
                    <span className={styles.feedbackTime}>{fb.time}</span>
                  </div>
                  <p className={styles.commentText}>"{fb.comment}"</p>
                  <div className={styles.ratingStars}>
                    {"★".repeat(fb.rating)}
                    {"☆".repeat(5 - fb.rating)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
