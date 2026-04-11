# AI Legal Assistant Setup Guide

This guide details exactly how to set up the Django Backend and React Frontend.

## Step 1: Django Environment Setup (Windows)
Open a terminal in the root folder (`c:\Users\Dell\OneDrive\Desktop\AI-legal assist project`) and run these commands **in order**:

### 1. Create the virtual environment
```powershell
py -m venv myworld
```

### 2. Activate the virtual environment
**CMD:**
```cmd
myworld\scripts\activate.bat
```
**PowerShell:**
```powershell
myworld\Scripts\Activate.ps1
```
*(You must see `(myworld)` at the beginning of your prompt)*

### 3. Install Django
```powershell
pip install Django
```

### 4. Install all project dependencies
```powershell
pip install djangorestframework djangorestframework-simplejwt djongo pymongo python-dotenv google-generativeai reportlab psycopg2-binary
```

### 5. Create the Django Project
```powershell
django-admin startproject project
```

### 6. Enter the project folder
```powershell
cd project
```

### 7. Create the AILegal app
```powershell
py manage.py startapp AILegal
```

### 8. Apply initial database migrations
```powershell
python manage.py migrate
```

### 9. Create a superuser (Admin)
```powershell
python manage.py createsuperuser
```

### 10. Start the server
```powershell
python manage.py runserver
```

*(App runs at http://127.0.0.1:8000/)*
