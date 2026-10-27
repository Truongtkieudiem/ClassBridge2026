import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileSpreadsheet,
  Download,
  Upload,
  X,
  Check,
} from "lucide-react";

import * as XLSX from "xlsx";
import api from "../../../services/api";
import styles from "./class.module.css";

export type ClassItem = {
  id: string;
  name: string;
  courseCode: string;
  classCode: string;
  description?: string;
  studentCount?: number;
  hours?: number;
  hoursLearned?: number;
  classTime?: string;
  startTime?: string;
  endTime?: string;
  weekday?: string;
};

export type ClassSessionItem = {
  id: string;
  title: string;
  room: string;
  weekday: string;
  weekdayCode: string;
  recurring: boolean;
  startTimeLabel: string;
  endTimeLabel: string;
  hasSlides: boolean;
};

const WEEKDAY_OPTIONS = [
  { code: "", label: "— Chọn thứ —" },
  { code: "MO", label: "Thứ 2" },
  { code: "TU", label: "Thứ 3" },
  { code: "WE", label: "Thứ 4" },
  { code: "TH", label: "Thứ 5" },
  { code: "FR", label: "Thứ 6" },
  { code: "SA", label: "Thứ 7" },
  { code: "SU", label: "Chủ nhật" },
];

const EMPTY_FORM = {
  courseCode: "",
  name: "",
  hours: "",
  weekday: "",
  startTime: "",
  endTime: "",
  description: "",
};

export default function ClassManagement() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Tải danh sách lớp học từ backend (database)
  useEffect(() => {
    let active = true;
    api
      .get("/auth/lecturer/classes")
      .then(({ data }) => {
        if (active) setClasses(data.classes ?? []);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredClasses = classes.filter((cls) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [cls.name, cls.classCode, cls.courseCode, cls.description].some((value) =>
        value?.toLowerCase().includes(query),
      );
    return (
      matchesSearch && (classFilter === "all" || cls.classCode === classFilter)
    );
  });
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // State cho Modal CRUD (Thêm / Chỉnh sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // State cho modal buổi học & upload bài giảng
  const [sessionsModal, setSessionsModal] = useState<{
    open: boolean;
    classId: string;
    className: string;
  }>({ open: false, classId: "", className: "" });
  const [classSessions, setClassSessions] = useState<ClassSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [uploadingScheduleId, setUploadingScheduleId] = useState<string | null>(
    null,
  );

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds((selected) =>
      selected.includes(classId)
        ? selected.filter((id) => id !== classId)
        : [...selected, classId],
    );
  };

  const toggleAllClasses = () => {
    const visibleIds = filteredClasses.map((cls) => cls.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedClassIds.includes(id));
    setSelectedClassIds((selected) =>
      allVisibleSelected
        ? selected.filter((id) => !visibleIds.includes(id))
        : [...new Set([...selected, ...visibleIds])],
    );
  };

  const handleDownloadTemplate = () => {
    // Tải file mẫu Excel do backend sinh ra (đúng định dạng import)
    api
      .get("/auth/lecturer/classes/template", { responseType: "blob" })
      .then(({ data }) => {
        const url = URL.createObjectURL(data as Blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "mau_import_lop.xlsx";
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert("Không thể tải file mẫu. Vui lòng thử lại."));
    setIsAddMenuOpen(false);
  };

  const handleExportClasses = () => {
    const rowsToExport = selectedClassIds.length
      ? classes.filter((cls) => selectedClassIds.includes(cls.id))
      : filteredClasses;
    if (!rowsToExport.length) {
      alert("Khong co lop nao de xuat.");
      return;
    }
    const rows = rowsToExport.map((cls) => ({
      "Ma lop": cls.classCode,
      "Ten mon hoc": cls.name,
      "Si so": cls.studentCount ?? 0,
      "So gio da hoc": cls.hoursLearned ?? "",
      "Tong so gio": cls.hours ?? "",
      "Ma mon hoc": cls.courseCode,
      "Thoi gian bat dau": cls.startTime ?? "",
      "Thoi gian ket thuc": cls.endTime ?? "",
      "Thu trong tuan": cls.weekday ?? "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Danh sach lop");
    XLSX.writeFile(workbook, "danh_sach_lop.xlsx");
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post(
        "/auth/lecturer/classes/import-excel",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      const parts = [data.message ?? ""];
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        parts.push(
          "Dòng lỗi: " +
            data.errors
              .map(
                (item: { row: number; errors: string[] }) =>
                  `Dòng ${item.row}: ${item.errors.join(", ")}`,
              )
              .join("; "),
        );
      }
      alert(parts.join("\n"));
      // Tải lại danh sách lớp mới nhất từ DB
      const refreshed = await api.get("/auth/lecturer/classes");
      setClasses(refreshed.data.classes ?? []);
      setLoadError(false);
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
          ? String((error.response.data as { message?: unknown }).message)
          : "Không thể nhập file Excel. Hãy dùng file mẫu của hệ thống.";
      alert(message);
    } finally {
      event.target.value = "";
    }
  };

  // Xử lý mở Modal thêm mới
  const handleOpenCreateModal = () => {
    setEditingClass(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  // Xử lý mở Modal chỉnh sửa
  const handleOpenEditModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormData({
      courseCode: cls.courseCode || "",
      name: cls.name || "",
      hours: cls.hours ? String(cls.hours) : "",
      weekday: cls.weekday || "",
      startTime: cls.startTime || "",
      endTime: cls.endTime || "",
      description: cls.description || "",
    });
    setIsModalOpen(true);
  };

  // Xử lý Xóa lớp học (gọi API)
  const handleDeleteClass = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lớp học này không?")) return;
    try {
      await api.delete(`/auth/lecturer/classes/${id}`);
      setClasses((current) => current.filter((c) => c.id !== id));
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
          ? String((error.response.data as { message?: unknown }).message)
          : "Không thể xóa lớp học. Vui lòng thử lại.";
      alert(message);
    }
  };

  // Xử lý Lưu (Tạo mới hoặc Cập nhật) - gọi API
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.courseCode || !formData.hours) {
      alert(
        "Vui lòng điền đầy đủ thông tin bắt buộc (Mã môn học, Tên môn học, Số giờ học)!",
      );
      return;
    }

    const payload = {
      name: formData.name,
      courseCode: formData.courseCode,
      hours: formData.hours,
      weekday: formData.weekday,
      startTime: formData.startTime,
      endTime: formData.endTime,
      description: formData.description,
    };
    try {
      if (editingClass) {
        await api.put(`/auth/lecturer/classes/${editingClass.id}`, {
          name: payload.name,
          description: payload.description,
        });
        setClasses((current) =>
          current.map((c) =>
            c.id === editingClass.id
              ? { ...c, name: payload.name, description: payload.description }
              : c,
          ),
        );
        alert("Đã cập nhật lớp học.");
      } else {
        const { data } = await api.post("/auth/lecturer/classes", payload);
        // Tải lại danh sách lớp mới nhất từ DB (có lịch học mới)
        const refreshed = await api.get("/auth/lecturer/classes");
        setClasses(refreshed.data.classes ?? []);
        alert(data.message || "Đã thêm lớp học.");
      }
      setIsModalOpen(false);
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
          ? String((error.response.data as { message?: unknown }).message)
          : "Không thể lưu lớp học. Vui lòng thử lại.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // Xử lý xem chi tiết lớp học
  const handleViewDetail = (classCode: string) => {
    navigate(`/giangvien/classes/${classCode}`);
  };

  // ===== Lịch học & bài giảng theo buổi =====
  const openSessionsModal = async (cls: ClassItem) => {
    setSessionsModal({ open: true, classId: cls.id, className: cls.name });
    setClassSessions([]);
    setSessionsLoading(true);
    try {
      const { data } = await api.get(
        `/auth/lecturer/classes/${cls.id}/sessions`,
      );
      setClassSessions(data.sessions ?? []);
    } catch {
      alert("Không thể tải danh sách buổi học.");
    } finally {
      setSessionsLoading(false);
    }
  };

  const closeSessionsModal = () => {
    setSessionsModal({ open: false, classId: "", className: "" });
    setClassSessions([]);
  };

  const handleUploadSlides = async (
    scheduleId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setUploadingScheduleId(scheduleId);
    try {
      const { data } = await api.post(
        `/auth/lecturer/classes/${sessionsModal.classId}/sessions/${scheduleId}/upload-slides`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      alert(
        `${data.message || "Đã tải bài giảng lên."} (${data.slides ?? 0} trang)`,
      );
      setClassSessions((current) =>
        current.map((session) =>
          session.id === scheduleId ? { ...session, hasSlides: true } : session,
        ),
      );
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
          ? String((error.response.data as { message?: unknown }).message)
          : "Không thể tải bài giảng lên.";
      alert(message);
    } finally {
      setUploadingScheduleId(null);
      event.target.value = "";
    }
  };

  return (
    <div className={styles.container}>
      {/* Tiêu đề trang & Nút thêm lớp học (+) */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Lớp học</h1>
          <p className={styles.subTitle}>Quản lý các lớp học của bạn</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExportClasses}
          >
            <Download size={17} /> Xuất danh sách
          </button>
          <div className={styles.addMenuWrap}>
            <button
              type="button"
              className={styles.addIconButton}
              aria-label="Th?m l?p"
              aria-haspopup="menu"
              aria-expanded={isAddMenuOpen}
              onClick={() => setIsAddMenuOpen((open) => !open)}
            >
              <Plus size={20} />
            </button>
            {isAddMenuOpen && (
              <div className={styles.addMenu} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    handleOpenCreateModal();
                  }}
                >
                  <Plus size={16} /> Th&#234;m l&#7899;p th&#7911; c&#244;ng
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    importInputRef.current?.click();
                  }}
                >
                  <FileSpreadsheet size={16} /> Th&#234;m l&#7899;p b&#7857;ng
                  Excel
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDownloadTemplate}
                >
                  <Download size={16} /> T&#7843;i file Excel m&#7851;u
                </button>
              </div>
            )}
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className={styles.hiddenFileInput}
              onChange={handleImportExcel}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableToolbar}>
        <label className={styles.tableSearch}>
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="T&#236;m ki&#7871;m t&#234;n l&#7899;p, m&#227; l&#7899;p, m&#227; m&#244;n..."
            aria-label="T&#236;m ki&#7871;m l&#7899;p"
          />
        </label>
        <label className={styles.classFilter}>
          <span>L&#7899;p</span>
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="all">T&#7845;t c&#7843; l&#7899;p</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.classCode}>
                {cls.name} ({cls.classCode})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.classTable}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả lớp"
                  checked={
                    filteredClasses.length > 0 &&
                    filteredClasses.every((cls) =>
                      selectedClassIds.includes(cls.id),
                    )
                  }
                  onChange={toggleAllClasses}
                />
              </th>
              <th>Mã lớp</th>
              <th>Tên lớp</th>
              <th>Sĩ số</th>
              <th>Số giờ học (đã học / tổng số)</th>
              <th className={styles.actionsCell}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={styles.tableEmpty} colSpan={7}>
                  <span>Đang tải danh sách lớp...</span>
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td className={styles.tableEmpty} colSpan={7}>
                  <span>Không thể tải danh sách lớp. Vui lòng thử lại.</span>
                </td>
              </tr>
            ) : filteredClasses.length === 0 ? (
              <tr>
                <td className={styles.tableEmpty} colSpan={7}>
                  <BookOpen size={24} aria-hidden="true" />
                  <span>Chưa có lớp học nào.</span>
                </td>
              </tr>
            ) : (
              filteredClasses.map((cls) => (
                <tr
                  key={cls.id}
                  className={
                    selectedClassIds.includes(cls.id) ? styles.selectedRow : ""
                  }
                >
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      aria-label={`Chọn lớp ${cls.classCode}`}
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => toggleClassSelection(cls.id)}
                    />
                  </td>
                  <td>
                    <span className={styles.classCodeBadge}>
                      {cls.classCode}
                    </span>
                  </td>
                  <td>
                    <div className={styles.scheduleCell}>
                      <span>{cls.weekday || "?"}</span>
                      <span>
                        {cls.startTime && cls.endTime
                          ? `${cls.startTime} - ${cls.endTime}`
                          : cls.classTime || "?"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.classNameCell}>{cls.name}</div>
                    {cls.description && (
                      <div className={styles.classDescriptionCell}>
                        {cls.description}
                      </div>
                    )}
                  </td>
                  <td>{cls.studentCount ?? 0}</td>
                  <td>
                    <span className={styles.hoursValue}>
                      {cls.hoursLearned ?? "?"}
                    </span>
                    <span className={styles.hoursDivider}> / </span>
                    <span>{cls.hours ?? "?"} giờ</span>
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleViewDetail(cls.classCode)}
                        title="Xem chi tiết"
                        aria-label={`Xem lớp ${cls.classCode}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleOpenEditModal(cls)}
                        title="Chỉnh sửa"
                        aria-label={`Sửa lớp ${cls.classCode}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteClass(cls.id)}
                        title="Xóa lớp"
                        aria-label={`Xóa lớp ${cls.classCode}`}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openSessionsModal(cls)}
                        title="Lịch học & bài giảng"
                        aria-label={`Lịch học và bài giảng lớp ${cls.classCode}`}
                      >
                        <Upload size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD: Tạo / Chỉnh sửa lớp học */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingClass ? "Chỉnh sửa lớp học" : "Thêm lớp học mới"}</h2>
              <button
                className={styles.closeModalBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Mã môn học *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 3650"
                  value={formData.courseCode}
                  onChange={(e) =>
                    setFormData({ ...formData, courseCode: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tên môn học *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lập trình Web nâng cao"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Số giờ học *</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max="24"
                  placeholder="Ví dụ: 3"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Thứ trong tuần *</label>
                  <select
                    value={formData.weekday}
                    onChange={(e) =>
                      setFormData({ ...formData, weekday: e.target.value })
                    }
                    required
                  >
                    {WEEKDAY_OPTIONS.map((option) => (
                      <option
                        key={option.code}
                        value={option.code}
                        disabled={!option.code}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Giờ bắt đầu *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Giờ kết thúc *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Mô tả / Ghi chú (không bắt buộc)</label>
                <textarea
                  placeholder="Nhập mô tả môn học hoặc thông tin giảng dạy..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              {!editingClass && (
                <p className={styles.formHint}>
                  Sau khi tạo lớp, bạn có thể tải bài giảng lên cho từng buổi
                  học trong mục "Lịch & bài giảng".
                </p>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  <Check size={16} />{" "}
                  {editingClass ? "Lưu thay đổi" : "Tạo lớp học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal lịch học & bài giảng theo buổi */}
      {sessionsModal.open && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.sessionsModal}`}>
            <div className={styles.modalHeader}>
              <h2>Lịch học & bài giảng — {sessionsModal.className}</h2>
              <button
                className={styles.closeModalBtn}
                onClick={closeSessionsModal}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.sessionsBody}>
              {sessionsLoading ? (
                <p className={styles.sessionsMessage}>Đang tải buổi học...</p>
              ) : classSessions.length === 0 ? (
                <p className={styles.sessionsMessage}>
                  Lớp này chưa có buổi học nào trong thời khoá biểu.
                </p>
              ) : (
                classSessions.map((session) => (
                  <div key={session.id} className={styles.sessionRow}>
                    <div className={styles.sessionInfo}>
                      <strong>{session.title}</strong>
                      <span>
                        {session.weekday || "Lịch đơn"} ·{" "}
                        {session.startTimeLabel} - {session.endTimeLabel}
                        {session.recurring ? " · Lặp hằng tuần" : ""}
                      </span>
                      {session.room && <span>Phòng: {session.room}</span>}
                    </div>
                    <div className={styles.sessionUpload}>
                      {session.hasSlides && (
                        <span className={styles.slidesBadge}>
                          Đã có bài giảng
                        </span>
                      )}
                      <label
                        className={styles.uploadLabel}
                        aria-label="Tải bài giảng lên cho buổi này"
                      >
                        <Upload size={14} />
                        {uploadingScheduleId === session.id
                          ? "Đang tải..."
                          : "Tải bài giảng"}
                        <input
                          type="file"
                          accept=".pdf,.ppt,.pptx,.doc,.docx"
                          disabled={uploadingScheduleId === session.id}
                          onChange={(e) => handleUploadSlides(session.id, e)}
                        />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
