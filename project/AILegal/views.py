import pymongo
import os
import json
import smtplib
import time

# Create your views here.
server = pymongo.MongoClient("mongodb://localhost:27017/")
db = server["school"]
collection = db["user"]
productscollection = db["products"]
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, date
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from django.utils import timezone
from django.conf import settings
from django.shortcuts import render, redirect
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from .models import User, AdviceHistory, Document, Case, EmailLog
from .serializers import (
    SignupSerializer, LoginSerializer, UserSerializer,
    ChangePasswordSerializer, AdviceAskSerializer, AdviceHistorySerializer,
    DocumentGenerateSerializer, DocumentSerializer,
    CaseSerializer, EmailSendSerializer, AdminUserSerializer,
)
from .services import get_gemini_advice, generate_legal_document_text, create_pdf_buffer


# ─── Helpers ──────────────────────────────────────────────────────────────────

def success(data=None, message='', status_code=status.HTTP_200_OK):
    return Response({'success': True, 'data': data, 'message': message}, status=status_code)


def error(message='', status_code=status.HTTP_400_BAD_REQUEST, errors=None):
    return Response({'success': False, 'data': None, 'message': message, 'errors': errors or {}},
                    status=status_code)


def is_advocate(user):
    return user.role == 'advocate'


def is_admin(user):
    return user.role == 'admin'


# ─── Auth Views ───────────────────────────────────────────────────────────────

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            return error('Validation failed.', status.HTTP_400_BAD_REQUEST, serializer.errors)

        email = serializer.validated_data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            return error('An account with this email already exists.', status.HTTP_400_BAD_REQUEST)

        # Force lowercase email before saving
        serializer.validated_data['email'] = email
        user = serializer.save()
        return success(
            data={'user': UserSerializer(user).data},
            message='Account created successfully.',
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response({
                "success": False,
                "data": {},
                "message": "Email and password are required."
            }, status=400)

        # Find user in DB by email (case-insensitive)
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "data": {},
                "message": "No account found with this email address. Please sign up first."
            }, status=401)

        # Check password hash
        if not user.check_password(password):
            return Response({
                "success": False,
                "data": {},
                "message": "Incorrect password. Please try again."
            }, status=401)

        # Check account is active
        if not user.is_active:
            return Response({
                "success": False,
                "data": {},
                "message": "Your account has been deactivated."
            }, status=403)

        # Generate JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        return Response({
            "success": True,
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "full_name": user.full_name,
                    "email": user.email,
                    "role": user.role,
                    "is_verified": user.is_verified,
                }
            },
            "message": "Login successful"
        }, status=200)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success(data=UserSerializer(request.user).data, message='Profile retrieved.')

    def patch(self, request):
        allowed_fields = {'full_name'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        user = request.user
        for field, value in data.items():
            setattr(user, field, value)
        user.save()
        return success(data=UserSerializer(user).data, message='Profile updated.')


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return error('Validation failed.', status.HTTP_400_BAD_REQUEST, serializer.errors)

        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return error('Current password is incorrect.', status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return success(message='Password updated successfully.')


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token') or request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return success(message='Logged out successfully.')
        except TokenError:
            return success(message='Logged out.')


class GoogleAuthView(APIView):
    """
    POST /api/v1/auth/google/
    Body: { "token": "<Google ID token from frontend>" }

    Flow:
      1. Verify Google JWT token using google-auth library
      2. Extract email, name, picture from payload
      3. Find or create user in MongoDB (users collection)
      4. Return Django JWT access + refresh tokens
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return error("Google token is required", 400)

        try:
            # Verify the Google ID token
            payload = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as e:
            return error(f"Invalid Google token: {str(e)}", 401)

        # Extract user info from Google payload
        google_email = payload.get("email", "").lower().strip()
        google_name  = payload.get("name", "Google User")
        is_verified  = payload.get("email_verified", False)

        if not google_email:
            return error("Google account has no email address", 400)

        if not is_verified:
            return error("Google email address is not verified", 400)

        # Find or create user in MongoDB
        user, created = User.objects.get_or_create(
            email=google_email,
            defaults={
                "full_name": google_name,
                "role": "user",          # default role for Google sign-ups
                "is_verified": True,     # Google accounts are pre-verified
            },
        )

        # If existing user, keep their role — just update name if blank
        if not created and not user.full_name:
            user.full_name = google_name
            user.is_verified = True
            user.save()

        # Check account is active
        if not user.is_active:
            return error("Your account has been deactivated. Contact support.", 403)

        # Generate Django JWT tokens
        refresh = RefreshToken.for_user(user)

        return success(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "role": user.role,
                    "is_verified": user.is_verified,
                },
                "is_new_user": created,
            },
            f"{'Welcome to AI Legal Assistant!' if created else 'Welcome back!'} Signed in with Google.",
        )


# ─── Advice Views ─────────────────────────────────────────────────────────────

class AdviceAskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AdviceAskSerializer(data=request.data)
        if not serializer.is_valid():
            return error('Validation failed.', status.HTTP_400_BAD_REQUEST, serializer.errors)

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        queries_today = AdviceHistory.objects.filter(
            user=request.user,
            created_at__gte=today_start,
        ).count()

        if queries_today >= 20:
            return error(
                'Daily limit of 20 queries reached. Try again tomorrow.',
                status.HTTP_429_TOO_MANY_REQUESTS,
            )

        query = serializer.validated_data['query']
        ai_response = get_gemini_advice(query)

        if 'error' in ai_response:
            return error('AI engine error.', status.HTTP_500_INTERNAL_SERVER_ERROR, ai_response)

        advice = AdviceHistory.objects.create(
            user=request.user,
            query=query,
            constitution_reference=ai_response.get('constitution_reference'),
            ai_response=ai_response,
        )

        return success(
            data={
                'advice': AdviceHistorySerializer(advice).data,
                'queries_remaining': 20 - queries_today - 1,
            },
            message='Advice generated and saved.',
        )


class AdviceHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = 10
        qs = AdviceHistory.objects.filter(user=request.user)
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = qs[start:end]
        return success(
            data={
                'results': AdviceHistorySerializer(items, many=True).data,
                'total': total,
                'page': page,
                'pages': (total + page_size - 1) // page_size,
            },
            message='Advice history retrieved.',
        )


class AdviceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_advice(self, pk, user):
        try:
            return AdviceHistory.objects.get(id=pk, user=user)
        except AdviceHistory.DoesNotExist:
            return None

    def get(self, request, pk):
        advice = self._get_advice(pk, request.user)
        if not advice:
            return error('Advice not found.', status.HTTP_404_NOT_FOUND)
        return success(data=AdviceHistorySerializer(advice).data, message='Advice retrieved.')

    def delete(self, request, pk):
        advice = self._get_advice(pk, request.user)
        if not advice:
            return error('Advice not found.', status.HTTP_404_NOT_FOUND)
        advice.delete()
        return success(message='Advice deleted.')


# ─── Document Views ───────────────────────────────────────────────────────────

class DocumentGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DocumentGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return error('Validation failed.', status.HTTP_400_BAD_REQUEST, serializer.errors)

        doc_type = serializer.validated_data['document_type']
        details = serializer.validated_data['details']
        generated_text = generate_legal_document_text(doc_type, details)

        doc = Document.objects.create(
            user=request.user,
            document_type=doc_type,
            input_data=details,
            generated_text=generated_text,
        )

        return success(
            data=DocumentSerializer(doc).data,
            message='Document generated and saved to MongoDB.',
            status_code=status.HTTP_201_CREATED,
        )


class DocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        docs = Document.objects.filter(user=request.user)
        return success(data=DocumentSerializer(docs, many=True).data, message='Documents retrieved.')


class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_doc(self, pk, user):
        try:
            return Document.objects.get(id=pk, user=user)
        except Document.DoesNotExist:
            return None

    def get(self, request, pk):
        doc = self._get_doc(pk, request.user)
        if not doc:
            return error('Document not found.', status.HTTP_404_NOT_FOUND)
        return success(data=DocumentSerializer(doc).data, message='Document retrieved.')

    def delete(self, request, pk):
        doc = self._get_doc(pk, request.user)
        if not doc:
            return error('Document not found.', status.HTTP_404_NOT_FOUND)
        doc.delete()
        return success(message='Document deleted.')


class DocumentPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from django.http import HttpResponse
        try:
            doc = Document.objects.get(id=pk)
        except Document.DoesNotExist:
            return error('Document not found.', status.HTTP_404_NOT_FOUND)

        if doc.user != request.user and not is_admin(request.user):
            return error('Unauthorized.', status.HTTP_403_FORBIDDEN)

        buffer = create_pdf_buffer(doc.generated_text)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{doc.document_type}.pdf"'
        return response


# ─── Case Views ───────────────────────────────────────────────────────────────

class CaseListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_advocate(request.user) and not is_admin(request.user):
            return error('Only advocates can view cases.', status.HTTP_403_FORBIDDEN)
        cases = Case.objects.filter(advocate=request.user)
        return success(data=CaseSerializer(cases, many=True).data, message='Cases retrieved.')

    def post(self, request):
        if not is_advocate(request.user):
            return error('Only advocates can create cases.', status.HTTP_403_FORBIDDEN)
        serializer = CaseSerializer(data=request.data)
        if not serializer.is_valid():
            return error('Validation failed.', status.HTTP_400_BAD_REQUEST, serializer.errors)
        case = serializer.save(advocate=request.user)
        return success(
            data=CaseSerializer(case).data,
            message='Case saved to MongoDB.',
            status_code=status.HTTP_201_CREATED,
        )


class CaseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_case(self, pk, user):
        try:
            return Case.objects.get(id=pk, advocate=user)
        except Case.DoesNotExist:
            return None

    def get(self, request, pk):
        case = self._get_case(pk, request.user)
        if not case:
            return error('Case not found.', status.HTTP_404_NOT_FOUND)
        return success(data=CaseSerializer(case).data, message='Case retrieved.')

    def put(self, request, pk):
        if not is_advocate(request.user):
            return error('Only advocates can update cases.', status.HTTP_403_FORBIDDEN)
        case = self._get_case(pk, request.user)
        if not case:
            return error('Case not found.', status.HTTP_404_NOT_FOUND)
        serializer = CaseSerializer(case, data=request.data, partial=True)
        if not serializer.is_valid():
            return error('Validation failed.', status.HTTP_400_BAD_REQUEST, serializer.errors)
        case = serializer.save()
        return success(data=CaseSerializer(case).data, message='Case updated in MongoDB.')

    def delete(self, request, pk):
        if not is_advocate(request.user):
            return error('Only advocates can delete cases.', status.HTTP_403_FORBIDDEN)
        case = self._get_case(pk, request.user)
        if not case:
            return error('Case not found.', status.HTTP_404_NOT_FOUND)
        case.delete()
        return success(message='Case deleted from MongoDB.')


# ─── Email View ───────────────────────────────────────────────────────────────

class EmailSendView(APIView):
    permission_classes = [IsAuthenticated]

    def _build_html(self, email_type, content):
        if email_type == 'advice':
            return f"""
            <html><body style="font-family:sans-serif;padding:20px;">
            <h2 style="color:#1e3a5f;">AI Legal Advice</h2>
            <p><strong>Query:</strong> {content.get('query', '')}</p>
            <p><strong>Applicable Law:</strong> {content.get('applicable_law', '')}</p>
            <p><strong>Constitution Reference:</strong> {content.get('constitution_reference', '')}</p>
            <p><em>This is for informational purposes only. Consult a licensed advocate.</em></p>
            </body></html>"""
        elif email_type == 'document':
            return f"""
            <html><body style="font-family:sans-serif;padding:20px;">
            <h2 style="color:#1e3a5f;">Generated Legal Document</h2>
            <pre style="background:#f5f5f5;padding:15px;">{content.get('document_text', '')}</pre>
            </body></html>"""
        else:
            return f"""
            <html><body style="font-family:sans-serif;padding:20px;">
            <h2 style="color:#1e3a5f;">Case Summary</h2>
            <p>{json.dumps(content.get('case_details', content), indent=2)}</p>
            </body></html>"""

    def post(self, request):
        serializer = EmailSendSerializer(data=request.data)
        if not serializer.is_valid():
            return error('Validation failed.', status.HTTP_400_BAD_REQUEST, serializer.errors)

        data = serializer.validated_data
        to_email = data['to_email']
        email_type = data['email_type']
        content = data['content']
        subject_map = {
            'advice': 'Your AI Legal Advice',
            'document': 'Your Generated Legal Document',
            'case_summary': 'Case Summary Report',
        }
        subject = subject_map.get(email_type, 'AI Legal Assistant')
        html_body = self._build_html(email_type, content)

        email_log = EmailLog.objects.create(
            user=request.user,
            to_email=to_email,
            subject=subject,
            email_type=email_type,
            status='pending',
        )

        sent = False
        for attempt in range(3):
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = settings.EMAIL_HOST_USER
                msg['To'] = to_email
                msg.attach(MIMEText(html_body, 'html'))

                with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                    server.starttls()
                    server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
                    server.sendmail(settings.EMAIL_HOST_USER, to_email, msg.as_string())
                sent = True
                break
            except Exception:
                if attempt < 2:
                    time.sleep(1)

        email_log.status = 'sent' if sent else 'failed'
        email_log.save()

        if sent:
            return success(message='Email sent successfully.')
        return error('Failed to send email after 3 attempts.', status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Admin Views ──────────────────────────────────────────────────────────────

class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return error('Admin access required.', status.HTTP_403_FORBIDDEN)

        role_filter = request.query_params.get('role')
        page = int(request.query_params.get('page', 1))
        page_size = 20

        qs = User.objects.all()
        if role_filter:
            qs = qs.filter(role=role_filter)

        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        users = qs[start:end]

        return success(
            data={
                'results': AdminUserSerializer(users, many=True).data,
                'total': total,
                'page': page,
                'pages': (total + page_size - 1) // page_size,
            },
            message='Users retrieved.',
        )


class AdminUserVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not is_admin(request.user):
            return error('Admin access required.', status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return error('User not found.', status.HTTP_404_NOT_FOUND)
        user.is_verified = True
        user.save()
        return success(data=AdminUserSerializer(user).data, message='User verified in MongoDB.')


class AdminUserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not is_admin(request.user):
            return error('Admin access required.', status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return error('User not found.', status.HTTP_404_NOT_FOUND)
        user.delete()
        return success(message='User deleted from MongoDB.')


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return error('Admin access required.', status.HTTP_403_FORBIDDEN)

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        stats = {
            'total_users': User.objects.filter(role='user').count(),
            'total_advocates': User.objects.filter(role='advocate').count(),
            'pending_verifications': User.objects.filter(role='advocate', is_verified=False).count(),
            'ai_queries_today': AdviceHistory.objects.filter(created_at__gte=today_start).count(),
            'total_cases': Case.objects.count(),
            'documents_generated': Document.objects.count(),
        }
        return success(data=stats, message='Stats retrieved.')


def registerPage(req):
    # Signup 
    if req.method == 'POST':
        name = req.POST.get("username")
        pwd = req.POST.get("password")
        email = req.POST.get("email")
        if name and pwd and email:
            user_data = {
                "username": name,
                "password": pwd,
                "email": email
            }
            collection.create_index("username", unique=True)
            collection.insert_one(user_data)


def loginPage(req):
    message = ""
    if req.method == "POST":
        name = req.POST.get("username")
        pwd = req.POST.get("password")

        if not name:
            message = "Please provide a username."
        else:
            user = collection.find_one({"username": name})
            print(user)
            if user:
                if pwd != '':
                    if user.get("password") == pwd:
                        message = "User successfully signed in / logged in."
                        return redirect('/')
                    else:
                        message = "Password incorrect for this user."
                else:
                    message = "Please Enter Password."
            else:
                message = "This username does not exist."

    context = {"message": message}
    return render(req, 'login.html', context=context)
