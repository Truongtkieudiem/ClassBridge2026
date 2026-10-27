
from fastapi import APIRouter, Depends, HTTPException, Query
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import UUID, text
from werkzeug.security import check_password_hash

from email_utils import is_valid_email_format
from extensions import db
from request_limits import request_limit_exceeded


giangvien_dashboard_bp = Blueprint("giangvien_dashboard", __name__, url_prefix="/giang-vien/dashboard")

# 1. Thống kê tổng quan của giảng viên
OVERVIEW_SQL = text("""
    WITH lecturer_classes AS (
        SELECT c.class_id
        FROM classes c
        WHERE c.lecturer_id = :lecturer_id
          AND c.is_active = TRUE
    ),
    class_students AS (
        SELECT DISTINCT cm.student_id
        FROM class_members cm
        JOIN lecturer_classes lc ON lc.class_id = cm.class_id
        WHERE cm.status = 'ACTIVE'
    ),
    class_sessions AS (
        SELECT s.session_id
        FROM sessions s
        JOIN lecturer_classes lc ON lc.class_id = s.class_id
    ),
    question_stats AS (
        SELECT COUNT(*) AS total_questions
        FROM questions q
        JOIN class_sessions cs ON cs.session_id = q.session_id
    ),
    group_stats AS (
        SELECT COUNT(*) AS total_groups
        FROM question_groups qg
        JOIN class_sessions cs ON cs.session_id = qg.session_id
    )
    SELECT
        (SELECT COUNT(*) FROM lecturer_classes) AS total_classes,
        (SELECT COUNT(*) FROM class_students) AS total_students,
        (SELECT total_questions FROM question_stats) AS total_questions,
        (SELECT total_groups FROM group_stats) AS total_groups
""")


# 2. Danh sách nhóm câu hỏi của giảng viên
QUESTION_GROUPS_SQL = text("""
    SELECT
        qg.group_id AS id,
        COALESCE(
            qg.group_title,
            q.original_text,
            'Chưa có tiêu đề'
        ) AS title,
        COUNT(DISTINCT qgm.question_id) AS question_count,
        COUNT(DISTINCT ss.student_id) AS students,
        CASE
            WHEN BOOL_AND(q.language = 'VI') THEN 'Vietnamese'
            WHEN BOOL_AND(q.language = 'EN') THEN 'English'
            ELSE 'Mixed'
        END AS lang,
        CASE
            WHEN qg.status = 'ANSWERED'
                 OR EXISTS (
                     SELECT 1
                     FROM answers a
                     WHERE a.group_id = qg.group_id
                 )
            THEN 'answered'
            ELSE 'pending'
        END AS status
    FROM question_groups qg
    JOIN sessions s
        ON s.session_id = qg.session_id
    JOIN classes c
        ON c.class_id = s.class_id
    LEFT JOIN question_group_members qgm
        ON qgm.group_id = qg.group_id
    LEFT JOIN questions q
        ON q.question_id = qgm.question_id
    LEFT JOIN student_sessions ss
        ON ss.student_session_id = q.student_session_id
    WHERE c.lecturer_id = :lecturer_id
      AND c.is_active = TRUE
    GROUP BY
        qg.group_id,
        qg.group_title,
        qg.status,
        qg.created_at,
        q.question_id,
        q.original_text
    ORDER BY qg.created_at DESC
    LIMIT :limit
""")

@giangvien_dashboard_bp.route("", methods=["GET"])
def get_lecturer_dashboard(
    lecturer_id: UUID = Query(db),
):
    # Kiểm tra giảng viên tồn tại và đang hoạt động
    lecturer = db.execute(
        text("""
            SELECT lecturer_id
            FROM lecturers
            WHERE lecturer_id = :lecturer_id
              AND is_active = TRUE
        """),
        {"lecturer_id": lecturer_id},
    ).scalar_one_or_none()

    if lecturer is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy giảng viên đang hoạt động.",
        )

    overview = db.execute(
        OVERVIEW_SQL,
        {"lecturer_id": lecturer_id},
    ).mappings().one()

    total_questions = int(overview["total_questions"] or 0)
    total_groups = int(overview["total_groups"] or 0)

    # Đây là tỷ lệ giảm theo số câu hỏi và số nhóm.
    # Có ý nghĩa nhất khi mỗi câu hỏi được gán vào một nhóm.
    reduction_rate = (
        round((total_questions - total_groups) / total_questions * 100, 1)
        if total_questions > 0
        else 0.0
    )

    
    QUESTION_GROUPS_SQL = text("""
        SELECT
            qg.group_id AS id,
            COALESCE(
                qg.group_title,
                rq.original_text,
                'Chưa có tiêu đề'
            ) AS title,
            COUNT(DISTINCT qgm.question_id) AS question_count,
            COUNT(DISTINCT ss.student_id) AS students,
            CASE
                WHEN COUNT(q.question_id) = 0 THEN 'Mixed'
                WHEN BOOL_AND(q.language = 'VI') THEN 'Vietnamese'
                WHEN BOOL_AND(q.language = 'EN') THEN 'English'
                ELSE 'Mixed'
            END AS lang,
            CASE
                WHEN qg.status = 'ANSWERED'
                OR EXISTS (
                    SELECT 1
                    FROM answers a
                    WHERE a.group_id = qg.group_id
                )
                THEN 'answered'
                ELSE 'pending'
            END AS status
        FROM question_groups qg
        JOIN sessions s
            ON s.session_id = qg.session_id
        JOIN classes c
            ON c.class_id = s.class_id
        LEFT JOIN questions rq
            ON rq.question_id = qg.representative_question_id
        LEFT JOIN question_group_members qgm
            ON qgm.group_id = qg.group_id
        LEFT JOIN questions q
            ON q.question_id = qgm.question_id
        LEFT JOIN student_sessions ss
            ON ss.student_session_id = q.student_session_id
        WHERE c.lecturer_id = :lecturer_id
        AND c.is_active = TRUE
        GROUP BY
            qg.group_id,
            qg.group_title,
            rq.original_text,
            qg.status,
            qg.created_at
        ORDER BY qg.created_at DESC
        LIMIT :limit
    """)

    return {
        "success": True,
        "data": {
            "overview": {
                "totalClasses": int(overview["total_classes"] or 0),
                "totalStudents": int(overview["total_students"] or 0),
                "totalQuestions": total_questions,
                "beforeGrouping": total_questions,
                "afterGrouping": total_groups,
                "reductionRate": reduction_rate,
            },
            "questionGroups": [
                {
                    "id": str(group["id"]),
                    "title": group["title"],
                    "students": int(group["students"] or 0),
                    "questionCount": int(group["question_count"] or 0),
                    "lang": group["lang"],
                    "status": group["status"],
                }
                for group in groups
            ],
            "sttLatencyLogs": [],
            "feedbackList": [],
        },
    }
