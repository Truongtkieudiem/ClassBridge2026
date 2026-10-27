from routes.check_registration_email import check_registration_email_bp
from routes.activity import activity_bp
from routes.admin.admin_accounts import admin_accounts_bp
from routes.admin.admin_dashboard import admin_dashboard_bp
from routes.admin.ghilog import admin_logs_bp
from routes.admin.lop import admin_classes_bp
from routes.admin.tuongtac import admin_engagement_bp
from routes.giangvien.dashboard import giangvien_dashboard_bp

import importlib
from routes.login import login_bp
from routes.register_account import register_account_bp
from routes.send_verification import send_verification_bp
from routes.verify_verification import verify_verification_bp

route_blueprints = (
    activity_bp,
    check_registration_email_bp,
    admin_accounts_bp,
    admin_dashboard_bp,
    admin_classes_bp,
    admin_engagement_bp,
    admin_logs_bp,
    giangvien_dashboard_bp,
    login_bp,
    send_verification_bp,
    verify_verification_bp,
    register_account_bp,
)
