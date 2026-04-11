from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, AdviceHistory, Document, Case, EmailLog


# ─── Auth Serializers ─────────────────────────────────────────────────────────

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'password', 'confirm_password', 'role')

    def validate_role(self, value):
        if value not in ('user', 'advocate'):
            raise serializers.ValidationError("Role must be 'user' or 'advocate'.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        if validated_data.get('role') == 'user':
            user.is_verified = True
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'role', 'is_verified', 'created_at')
        read_only_fields = ('id', 'full_name', 'email', 'role', 'is_verified', 'created_at')


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_new_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})
        return attrs


# ─── Advice Serializers ───────────────────────────────────────────────────────

class AdviceAskSerializer(serializers.Serializer):
    query = serializers.CharField(min_length=5, max_length=2000)


class AdviceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdviceHistory
        fields = ('id', 'query', 'constitution_reference', 'ai_response', 'created_at')


# ─── Document Serializers ─────────────────────────────────────────────────────

class DocumentGenerateSerializer(serializers.Serializer):
    DOCUMENT_TYPE_CHOICES = (
        ('legal_notice', 'Legal Notice'),
        ('affidavit', 'Affidavit'),
        ('complaint_letter', 'Complaint Letter'),
        ('rent_agreement', 'Rent Agreement'),
    )
    document_type = serializers.ChoiceField(choices=DOCUMENT_TYPE_CHOICES)
    details = serializers.DictField()


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'document_type', 'input_data', 'generated_text', 'pdf_path', 'created_at')


# ─── Case Serializers ─────────────────────────────────────────────────────────

class CaseSerializer(serializers.ModelSerializer):
    STATUS_CHOICES = ('active', 'closed', 'pending', 'adjourned')

    class Meta:
        model = Case
        fields = ('id', 'client_name', 'case_type', 'description', 'status',
                  'hearing_date', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_status(self, value):
        valid = ('active', 'closed', 'pending', 'adjourned')
        if value not in valid:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid)}")
        return value


# ─── Email Serializers ────────────────────────────────────────────────────────

class EmailSendSerializer(serializers.Serializer):
    EMAIL_TYPE_CHOICES = (
        ('advice', 'Advice'),
        ('document', 'Document'),
        ('case_summary', 'Case Summary'),
    )
    to_email = serializers.EmailField(required=True)
    email_type = serializers.ChoiceField(choices=EMAIL_TYPE_CHOICES, required=True)
    content = serializers.DictField(required=True)
    attach_pdf = serializers.BooleanField(default=False)
    document_id = serializers.IntegerField(required=False, allow_null=True)


# ─── Admin Serializers ────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'role', 'is_verified', 'is_active', 'created_at')
