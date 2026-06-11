from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    SignupView, LoginView, ProfileView, ChangePasswordView, LogoutView, GoogleAuthView,
    AdviceAskView, AdviceHistoryView, AdviceDetailView, AdvicePDFView,
    DocumentGenerateView, DocumentListView, DocumentDetailView, DocumentPDFView,
    CaseListCreateView, CaseDetailView,
    EmailSendView,
    AdminUsersView, AdminUserVerifyView, AdminUserDeleteView, AdminStatsView,
    IKSearchView, IKDocView, IKCitationsView, IKCitedByView,
    ConstitutionSearchView,
)

urlpatterns = [
    # Auth
    path('auth/signup/', SignupView.as_view(), name='auth_signup'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', ProfileView.as_view(), name='auth_me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),

    # Advice
    path('advice/ask/', AdviceAskView.as_view(), name='advice_ask'),
    path('advice/history/', AdviceHistoryView.as_view(), name='advice_history'),
    path('advice/<int:pk>/', AdviceDetailView.as_view(), name='advice_detail'),
    path('advice/<int:pk>/pdf/', AdvicePDFView.as_view(), name='advice_pdf'),

    # Documents
    path('documents/generate/', DocumentGenerateView.as_view(), name='documents_generate'),
    path('documents/', DocumentListView.as_view(), name='documents_list'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='documents_detail'),
    path('documents/<int:pk>/pdf/', DocumentPDFView.as_view(), name='documents_pdf'),

    # Cases
    path('cases/', CaseListCreateView.as_view(), name='cases_list_create'),
    path('cases/<int:pk>/', CaseDetailView.as_view(), name='cases_detail'),

    # Email
    path('email/send/', EmailSendView.as_view(), name='email_send'),

    # Admin
    path('admin/users/', AdminUsersView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/verify/', AdminUserVerifyView.as_view(), name='admin_user_verify'),
    path('admin/users/<int:pk>/', AdminUserDeleteView.as_view(), name='admin_user_delete'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),

    # Indian Kanoon (Case Law Search)
    path('ik/search/', IKSearchView.as_view(), name='ik_search'),
    path('ik/doc/<int:docid>/', IKDocView.as_view(), name='ik_doc'),
    path('ik/doc/<int:docid>/citations/', IKCitationsView.as_view(), name='ik_citations'),
    path('ik/doc/<int:docid>/citedby/', IKCitedByView.as_view(), name='ik_citedby'),

    # Constitution Search (DB-backed)
    path('constitution/search/', ConstitutionSearchView.as_view(), name='constitution_search'),
]
