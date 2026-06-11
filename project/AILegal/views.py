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
import requests as http_requests

from django.utils import timezone
from django.conf import settings
from django.shortcuts import render, redirect
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from .models import User, AdviceHistory, Document, Case, EmailLog, ConstitutionArticle
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


class GitHubAuthView(APIView):
    """
    POST /api/v1/auth/github/
    Body: { "code": "<GitHub OAuth authorization code>" }

    Flow:
      1. Exchange the GitHub authorization code for an access token
      2. Fetch the authenticated user's profile from GitHub API
      3. Get the user's primary email (if not public)
      4. Find or create user in the database
      5. Return Django JWT access + refresh tokens
    """
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get("code")
        if not code:
            return error("GitHub authorization code is required", 400)

        github_client_id     = settings.GITHUB_CLIENT_ID
        github_client_secret = settings.GITHUB_CLIENT_SECRET

        if not github_client_id or not github_client_secret:
            return error("GitHub OAuth is not configured on the server", 500)

        # Step 1: Exchange code for access token
        token_response = http_requests.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id":     github_client_id,
                "client_secret": github_client_secret,
                "code":          code,
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return error(
                f"GitHub token exchange failed: {token_data.get('error_description', 'Unknown error')}",
                401,
            )

        gh_headers = {"Authorization": f"token {access_token}", "Accept": "application/json"}

        # Step 2: Fetch GitHub user profile
        profile_resp = http_requests.get("https://api.github.com/user", headers=gh_headers, timeout=10)
        if profile_resp.status_code != 200:
            return error("Failed to fetch GitHub profile", 401)

        profile = profile_resp.json()

        # Step 3: Fetch primary verified email (email may be null in public profile)
        gh_email = profile.get("email")
        if not gh_email:
            emails_resp = http_requests.get(
                "https://api.github.com/user/emails", headers=gh_headers, timeout=10
            )
            if emails_resp.status_code == 200:
                for entry in emails_resp.json():
                    if entry.get("primary") and entry.get("verified"):
                        gh_email = entry["email"]
                        break

        if not gh_email:
            return error(
                "Your GitHub account does not have a verified email address. "
                "Please add a public verified email on GitHub and try again.",
                400,
            )

        gh_email    = gh_email.lower().strip()
        gh_name     = profile.get("name") or profile.get("login") or "GitHub User"
        gh_username = profile.get("login", "")

        # Step 4: Find or create user
        user, created = User.objects.get_or_create(
            email=gh_email,
            defaults={
                "full_name":   gh_name,
                "role":        "user",
                "is_verified": True,
            },
        )

        if not created:
            if not user.full_name:
                user.full_name   = gh_name
                user.is_verified = True
                user.save()

        if not user.is_active:
            return error("Your account has been deactivated. Contact support.", 403)

        # Step 5: Generate Django JWT tokens
        refresh = RefreshToken.for_user(user)

        return success(
            {
                "access":  str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id":          user.id,
                    "full_name":   user.full_name,
                    "email":       user.email,
                    "role":        user.role,
                    "is_verified": user.is_verified,
                },
                "github_username": gh_username,
                "is_new_user": created,
            },
            f"{'Welcome to AI Legal Assistant!' if created else 'Welcome back!'} Signed in with GitHub.",
        )


# ─── Advice Views ─────────────────────────────────────────────────────────────

class AdviceAskView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, JSONParser]

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
        file = serializer.validated_data.get('file')

        if file:
            try:
                import PyPDF2
                pdf_reader = PyPDF2.PdfReader(file)
                pdf_text = ""
                for page in pdf_reader.pages:
                    pdf_text += page.extract_text() + "\n"
                query = f"{query}\n\n[Attached Document Content:]\n{pdf_text}"
            except Exception as e:
                return error(f'Error reading PDF file: {str(e)}', status.HTTP_400_BAD_REQUEST)

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


class AdvicePDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from django.http import HttpResponse
        try:
            advice = AdviceHistory.objects.get(id=pk)
        except AdviceHistory.DoesNotExist:
            return error('Advice not found.', status.HTTP_404_NOT_FOUND)

        if advice.user != request.user and not is_admin(request.user):
            return error('Unauthorized.', status.HTTP_403_FORBIDDEN)

        content = advice.ai_response
        lines = [
            "AI LEGAL ADVICE REPORT",
            "=" * 50,
            f"Query: {advice.query}",
            "",
        ]
        
        if content.get('constitution_reference'):
            lines.append(f"Constitution Reference: {content['constitution_reference']}")
        if content.get('applicable_law'):
            lines.append(f"Applicable Law: {content['applicable_law']}")
            
        steps = content.get('steps_to_take', [])
        if steps:
            lines += ["", "STEPS TO TAKE:", "-" * 30]
            for i, s in enumerate(steps, 1):
                lines.append(f"  {i}. {s}")
                
        docs = content.get('documents_required', [])
        if docs:
            lines += ["", "DOCUMENTS REQUIRED:", "-" * 30]
            for d in docs:
                lines.append(f"  • {d}")
                
        if content.get('where_to_file'):
            lines += ["", f"Where to File: {content['where_to_file']}"]
            
        if content.get('possible_outcomes'):
            lines += ["", "Possible Outcomes:", "-" * 30]
            for o in content['possible_outcomes']:
                lines.append(f"  • {o}")
                
        lines += ["", "-" * 50, content.get('disclaimer', 'This is for informational purposes only. Consult a licensed advocate.')]
        
        pdf_text = "\n".join(lines)
        buffer = create_pdf_buffer(pdf_text)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Legal_Advice_{advice.id}.pdf"'
        return response




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
            steps = content.get('steps_to_take', [])
            docs  = content.get('documents_required', [])
            steps_html = ''.join(f'<li style="margin-bottom:6px">{s}</li>' for s in steps) if steps else '<li>See attached PDF for details.</li>'
            docs_html  = ''.join(f'<li>{d}</li>' for d in docs) if docs else ''
            return f"""
            <html><body style="font-family:Arial,sans-serif;padding:24px;color:#1a1a2e;max-width:620px">
            <div style="background:linear-gradient(135deg,#1e3a5f,#4f6ef7);padding:20px 24px;border-radius:10px 10px 0 0">
              <h2 style="color:#fff;margin:0">⚖️ AI Legal Advice</h2>
              <p style="color:#c7d2fe;margin:4px 0 0;font-size:13px">AI Legal Assistant — Powered by Gemini AI</p>
            </div>
            <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:24px">
              <p><strong>Your Query:</strong><br>{content.get('query', '—')}</p>
              {'<p><strong>Constitution Reference:</strong> ' + content.get('constitution_reference','') + '</p>' if content.get('constitution_reference') else ''}
              {'<p><strong>Applicable Law:</strong> ' + content.get('applicable_law','') + '</p>' if content.get('applicable_law') else ''}
              <h3 style="color:#1e3a5f">Steps to Take</h3>
              <ol style="padding-left:20px">{steps_html}</ol>
              {'<h3 style="color:#1e3a5f">Documents Required</h3><ul style="padding-left:20px">' + docs_html + '</ul>' if docs_html else ''}
              {'<p><strong>Where to File:</strong> ' + content.get('where_to_file','') + '</p>' if content.get('where_to_file') else ''}
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
              <p style="font-size:12px;color:#64748b;font-style:italic">{content.get('disclaimer','This is for informational purposes only. Consult a licensed advocate.')}</p>
            </div>
            </body></html>"""

        elif email_type == 'document':
            return f"""
            <html><body style="font-family:Arial,sans-serif;padding:24px;color:#1a1a2e">
            <div style="background:linear-gradient(135deg,#1e3a5f,#4f6ef7);padding:20px 24px;border-radius:10px 10px 0 0">
              <h2 style="color:#fff;margin:0">📄 Generated Legal Document</h2>
            </div>
            <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 10px 10px">
              <pre style="background:#f8f9fa;padding:16px;border-radius:8px;white-space:pre-wrap;font-size:13px">{content.get('document_text', '')}</pre>
            </div>
            </body></html>"""

        else:
            return f"""
            <html><body style="font-family:Arial,sans-serif;padding:24px">
            <h2 style="color:#1e3a5f">📋 Case Summary</h2>
            <pre style="background:#f5f5f5;padding:15px;border-radius:8px">{json.dumps(content.get('case_details', content), indent=2)}</pre>
            </body></html>"""

    def _build_pdf_text(self, email_type, content):
        """Generate plain-text representation for PDF attachment."""
        if email_type == 'advice':
            lines = [
                "AI LEGAL ADVICE REPORT",
                "=" * 50,
                f"Query: {content.get('query', '')}",
                "",
            ]
            if content.get('constitution_reference'):
                lines.append(f"Constitution Reference: {content['constitution_reference']}")
            if content.get('applicable_law'):
                lines.append(f"Applicable Law: {content['applicable_law']}")
            steps = content.get('steps_to_take', [])
            if steps:
                lines += ["", "STEPS TO TAKE:", "-" * 30]
                for i, s in enumerate(steps, 1):
                    lines.append(f"  {i}. {s}")
            docs = content.get('documents_required', [])
            if docs:
                lines += ["", "DOCUMENTS REQUIRED:", "-" * 30]
                for d in docs:
                    lines.append(f"  • {d}")
            if content.get('where_to_file'):
                lines += ["", f"Where to File: {content['where_to_file']}"]
            if content.get('possible_outcomes'):
                lines += ["", "Possible Outcomes:", "-" * 30]
                for o in content['possible_outcomes']:
                    lines.append(f"  • {o}")
            lines += ["", "-" * 50, content.get('disclaimer', 'This is for informational purposes only. Consult a licensed advocate.')]
            return "\n".join(lines)
        else:
            return content.get('document_text', json.dumps(content, indent=2))

    def post(self, request):
        # Handle multipart form-data where 'content' might be a JSON string
        data = request.data.copy()
        if isinstance(data.get('content'), str):
            try:
                import json
                data['content'] = json.loads(data['content'])
            except (ValueError, TypeError):
                pass

        serializer = EmailSendSerializer(data=data)
        if not serializer.is_valid():
            return error('Validation failed.', status.HTTP_400_BAD_REQUEST, serializer.errors)

        data        = serializer.validated_data
        to_email    = data['to_email']
        email_type  = data['email_type']
        content     = data['content']
        attach_pdf  = data.get('attach_pdf', False)
        document_id = data.get('document_id')
        attachment  = data.get('attachment')

        subject_map = {
            'advice':       'Your AI Legal Advice — AI Legal Assistant',
            'document':     'Your Generated Legal Document — AI Legal Assistant',
            'case_summary': 'Case Summary Report — AI Legal Assistant',
        }
        subject   = subject_map.get(email_type, 'AI Legal Assistant')
        html_body = self._build_html(email_type, content)

        # ── Build PDF attachment if requested ─────────────────────────────────
        pdf_buffer = None
        pdf_filename = 'legal_advice.pdf'

        if attach_pdf:
            try:
                if document_id:
                    # Attach existing document PDF
                    doc = Document.objects.filter(id=document_id, user=request.user).first()
                    if doc:
                        pdf_buffer   = create_pdf_buffer(doc.generated_text)
                        pdf_filename = f"{doc.document_type}.pdf"
                else:
                    # Generate a fresh PDF from the advice content
                    pdf_text     = self._build_pdf_text(email_type, content)
                    pdf_buffer   = create_pdf_buffer(pdf_text)
                    pdf_filename = f"legal_{email_type}.pdf"
            except Exception:
                pass  # If PDF generation fails, still send the HTML email

        # ── Log ───────────────────────────────────────────────────────────────
        email_log = EmailLog.objects.create(
            user=request.user,
            to_email=to_email,
            subject=subject,
            email_type=email_type,
            status='pending',
        )

        # ── Send ──────────────────────────────────────────────────────────────
        from email.mime.base import MIMEBase
        from email import encoders

        sent = False
        for attempt in range(3):
            try:
                # Use 'mixed' so we can attach binary files
                msg = MIMEMultipart('mixed')
                msg['Subject'] = subject
                msg['From']    = f"{request.user.full_name} <{settings.EMAIL_HOST_USER}>"
                msg['To']      = to_email
                msg['Reply-To'] = request.user.email

                # HTML body wrapped in a 'related' part
                alt = MIMEMultipart('alternative')
                alt.attach(MIMEText(html_body, 'html'))
                msg.attach(alt)

                # PDF attachment
                if pdf_buffer:
                    pdf_buffer.seek(0)
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(pdf_buffer.read())
                    encoders.encode_base64(part)
                    part.add_header('Content-Disposition', f'attachment; filename="{pdf_filename}"')
                    msg.attach(part)

                # Custom user attachment
                if attachment:
                    attachment.seek(0)
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header('Content-Disposition', f'attachment; filename="{attachment.name}"')
                    msg.attach(part)

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
            msg_text = 'Email sent with PDF attachment.' if pdf_buffer else 'Email sent successfully.'
            return success(message=msg_text)
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


# ─── Indian Kanoon (IKAPI) Views ──────────────────────────────────────────────
from .ikapi_service import get_ik_service


class IKSearchView(APIView):
    """
    GET /api/v1/ik/search/

    Query params:
      q        – search query (required)
      page     – page number (0-indexed, default 0)
      fromdate – DD-MM-YYYY
      todate   – DD-MM-YYYY
      sortby   – mostrecent | leastrecent
      doctype  – filter by document type

    Returns list of matching cases from Indian Kanoon.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return error('Query parameter "q" is required.', status.HTTP_400_BAD_REQUEST)

        try:
            page     = int(request.query_params.get('page', 0))
            maxpages = int(request.query_params.get('maxpages', 1))
        except ValueError:
            page, maxpages = 0, 1

        svc = get_ik_service(
            maxpages = min(maxpages, 5),
            sortby   = request.query_params.get('sortby', ''),
            fromdate = request.query_params.get('fromdate', ''),
            todate   = request.query_params.get('todate', ''),
        )
        if svc is None:
            return error(
                'Indian Kanoon API token is not configured. Add INDIANKANOON_API_TOKEN to your .env file.',
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        result = svc.search_query(q, pagenum=page, maxpages=min(maxpages, 5))

        if 'error' in result:
            return error(result['error'], status.HTTP_502_BAD_GATEWAY)

        return success(data=result, message=f'Found {result.get("found", 0)} results.')


class IKDocView(APIView):
    """
    GET /api/v1/ik/doc/<docid>/

    Fetch full judgment text and metadata for an Indian Kanoon document.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, docid):
        svc = get_ik_service()
        if svc is None:
            return error(
                'Indian Kanoon API token is not configured.',
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        maxcites   = int(request.query_params.get('maxcites', 5))
        maxcitedby = int(request.query_params.get('maxcitedby', 5))

        result = svc.get_document(docid, maxcites=maxcites, maxcitedby=maxcitedby)

        if 'error' in result:
            return error(result['error'], status.HTTP_502_BAD_GATEWAY)

        return success(data=result, message='Document retrieved from Indian Kanoon.')


class IKCitationsView(APIView):
    """
    GET /api/v1/ik/doc/<docid>/citations/

    Cases that this document cites (outgoing references).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, docid):
        svc = get_ik_service()
        if svc is None:
            return error(
                'Indian Kanoon API token is not configured.',
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        result = svc.get_citations(docid)

        if 'error' in result:
            return error(result['error'], status.HTTP_502_BAD_GATEWAY)

        return success(
            data=result,
            message=f'Found {result.get("found", 0)} cases cited by document {docid}.',
        )


class IKCitedByView(APIView):
    """
    GET /api/v1/ik/doc/<docid>/citedby/

    Cases that cite this document (incoming references / later judgments).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, docid):
        svc = get_ik_service()
        if svc is None:
            return error(
                'Indian Kanoon API token is not configured.',
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        result = svc.get_cited_by(docid)

        if 'error' in result:
            return error(result['error'], status.HTTP_502_BAD_GATEWAY)

        return success(
            data=result,
            message=f'Found {result.get("found", 0)} cases citing document {docid}.',
        )


# ─── Constitution Search View ─────────────────────────────────────────────────

class ConstitutionSearchView(APIView):
    """
    GET /api/v1/constitution/search/

    Query params:
      q      – search keyword(s), article number, or topic (optional)
      filter – Part/tag filter, e.g. 'Fundamental Rights', 'DPSP', 'Emergency Provisions'
      page   – page number (default 1)
      limit  – results per page (default 20, max 50)

    Returns matching ConstitutionArticle records from the database.
    Also used by Gemini AI as context for legal advice queries.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q

        q           = request.query_params.get('q', '').strip()
        tag_filter  = request.query_params.get('filter', '').strip()
        page        = max(1, int(request.query_params.get('page', 1)))
        limit       = min(50, max(1, int(request.query_params.get('limit', 20))))

        qs = ConstitutionArticle.objects.all()

        # Apply tag/part filter
        if tag_filter and tag_filter.lower() != 'all':
            qs = qs.filter(tags__icontains=tag_filter)

        # Apply keyword search
        if q:
            qs = qs.filter(
                Q(article_number__icontains=q) |
                Q(title__icontains=q) |
                Q(short_description__icontains=q) |
                Q(full_text__icontains=q) |
                Q(part__icontains=q)
            )

        total  = qs.count()
        start  = (page - 1) * limit
        items  = qs[start:start + limit]

        results = [
            {
                'id':                a.id,
                'article_number':    a.article_number,
                'title':             a.title,
                'part':              a.part,
                'part_number':       a.part_number,
                'tags':              a.tags,
                'short_description': a.short_description,
                'full_text':         a.full_text,
            }
            for a in items
        ]

        return success(
            data={
                'results': results,
                'total':   total,
                'page':    page,
                'pages':   (total + limit - 1) // limit if total else 1,
                'has_next': start + limit < total,
            },
            message=f'Found {total} article(s) matching your query.'
        )
