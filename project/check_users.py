import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from AILegal.models import User

users = User.objects.all()
print(f"Total users: {users.count()}")
for u in users:
    print(f"  - Email: {u.email} | Name: {u.full_name} | Role: {u.role} | Active: {u.is_active} | Password set: {bool(u.password)}")
