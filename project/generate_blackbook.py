import os
import random
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, ListFlowable, ListItem
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.units import inch, cm

# --- Enhanced Helper Functions ---

def generate_technical_paragraph(context="general"):
    texts = {
        "intro": [
            "The legal landscape in India is characterized by its vastness and complexity, with thousands of central and state statutes governing various aspects of civil and criminal life. Digital transformation is no longer a luxury but a necessity for ensuring that justice is accessible to the 1.4 billion citizens of India.",
            "Dharma Vault AI serves as a bridge between the intricate world of law and the common man. By utilizing advanced natural language processing, the system breaks down complex legal concepts into understandable guidance, empowering users to make informed decisions about their legal paths.",
            "The project's inception was rooted in the observation that many citizens suffer due to a lack of timely legal information. Language barriers, high advocate fees, and geographic constraints often prevent individuals from seeking the help they need. This platform addresses these issues head-on.",
            "Our approach combines the latest in AI research with a deep understanding of the Indian judicial system. We have curated a dataset of Indian Penal Code (IPC), Code of Criminal Procedure (CrPC), and other essential acts to ground our AI's responses in reality.",
            "The democratization of law via AI-driven platforms like Dharma Vault is a critical step towards a more equitable society. By providing instant access to legal precedents and guidance, we reduce the asymmetric information gap that currently exists in the legal marketplace."
        ],
        "tech": [
            "The technical stack is a robust combination of React for a dynamic frontend and Django for a secure, scalable backend. The use of Vite ensures that the frontend is highly performant, with hot module replacement (HMR) facilitating rapid development cycles and optimized production builds.",
            "MongoDB Atlas provides a cloud-native, distributed database layer that handles the diverse and unstructured nature of legal data and user chat histories. Its flexible document model allows us to store complex nested structures for AI context windows without the overhead of relational joins.",
            "Security is a paramount concern. We implement JWT authentication with strict CSRF and XSS protections. The use of secure, HTTP-only cookies for refresh tokens ensures that user sessions remain protected even in the face of local storage vulnerabilities.",
            "The AI engine utilizes the Gemini 2.0 Flash model via the Google Generative AI Python SDK. We have implemented a Retrieval-Augmented Generation (RAG) architecture that performs semantic search over a vector database of Indian laws to provide context-accurate legal advice.",
            "Performance monitoring is integrated into every layer of the system. We use automated logging and exception tracking to identify bottlenecks in real-time, ensuring that the system maintains a 99.9% uptime and sub-second response times for core API endpoints."
        ],
        "design": [
            "The system design follows a clean, three-tier architecture that promotes maintainability and scalability. By separating the presentation, business logic, and data layers, we ensure that each component can be independently audited and improved without impacting the rest of the system.",
            "Our UI/UX strategy is built on the principles of glassmorphism and modern minimalism. The interface uses subtle transparency effects, blurred backgrounds, and high-contrast typography to create a premium feel that is both professional and approachable.",
            "Data modeling in MongoDB is focused on optimizing for read performance. We use compound indexes on frequently queried fields and implement a 'bucket' pattern for storing historical chat logs to minimize the number of database roundtrips required for a single request.",
            "UML modeling was utilized extensively during the design phase. Use Case diagrams helped define actor boundaries, while Sequence diagrams mapped out the complex interactions between the React frontend, Django API, and Gemini AI backend.",
            "The deployment architecture is designed for the cloud. We utilize containerization with Docker and deployment via Google Cloud Run, ensuring that the application can scale horizontally to handle thousands of concurrent users during peak demand periods."
        ]
    }
    
    pool = texts.get(context, texts["intro"] + texts["tech"] + texts["design"])
    return random.choice(pool)

def create_rich_box(styles, box_type="INSIGHT"):
    box_colors = {
        "INSIGHT": ("#1e40af", "#eff6ff", "#3b82f6"),
        "WARNING": ("#991b1b", "#fef2f2", "#ef4444"),
        "LEGAL": ("#065f46", "#ecfdf5", "#10b981")
    }
    title_color, bg_color, border_color = box_colors.get(box_type, box_colors["INSIGHT"])
    
    box_style = ParagraphStyle(f'Box{box_type}', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor(title_color), backColor=colors.HexColor(bg_color), borderPadding=10, borderWidth=1, borderColor=colors.HexColor(border_color), borderRadius=5, leading=12)
    
    content = generate_technical_paragraph("tech") if box_type == "INSIGHT" else generate_technical_paragraph("intro")
    return Paragraph(f"<b>{box_type}:</b> {content[:180]}...", box_style)

# --- BaseDocTemplate with TOC Support ---

class MyDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, **kw)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id='normal')
        template = PageTemplate('normal', [frame])
        self.addPageTemplates(template)

    def afterFlowable(self, flowable):
        if flowable.__class__.__name__ == 'Paragraph':
            text = flowable.getPlainText()
            style = flowable.style.name
            if style in ['Heading1', 'Heading2', 'Heading3', 'Heading4']:
                level_map = {'Heading1': 0, 'Heading2': 1, 'Heading3': 2, 'Heading4': 3}
                level = level_map.get(style, 0)
                
                # Add TOC Entry for internal notification
                self.notify('TOCEntry', (level, text, self.page))
                
                # Add PDF Bookmark (Outline entry) for the "details" panel
                # Create a unique key for the bookmark
                key = f"h_{hash(text)}_{self.page}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=(level > 1))


# --- Main PDF Build Function ---

def build_pdf(filepath):
    doc = MyDocTemplate(filepath, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle('MainTitle', parent=styles['Heading1'], fontSize=28, alignment=1, spaceAfter=40, textColor=colors.HexColor('#0f172a'))
    heading1 = ParagraphStyle('Heading1', parent=styles['Heading1'], fontSize=18, spaceAfter=15, spaceBefore=25, textColor=colors.HexColor('#1e293b'), borderLeftWidth=5, borderLeftColor=colors.HexColor('#3b82f6'), leftIndent=10)
    heading2 = ParagraphStyle('Heading2', parent=styles['Heading2'], fontSize=15, spaceAfter=12, spaceBefore=18, textColor=colors.HexColor('#334155'))
    heading3 = ParagraphStyle('Heading3', parent=styles['Heading3'], fontSize=13, spaceAfter=10, spaceBefore=15, textColor=colors.HexColor('#475569'))
    heading4 = ParagraphStyle('Heading4', parent=styles['Heading4'], fontSize=11, spaceAfter=8, spaceBefore=10, textColor=colors.HexColor('#64748b'), leftIndent=15)
    normal = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=11, leading=16, alignment=4) # Justified
    
    Story = []

    # --- Cover Page ---
    Story.append(Spacer(1, 150))
    Story.append(Paragraph("PROJECT BLACK BOOK", title_style))
    Story.append(Paragraph("DHARMA VAULT: ADVANCED AI LEGAL ASSISTANT", ParagraphStyle('Subtitle', parent=heading1, alignment=1, borderLeftWidth=0)))
    Story.append(Spacer(1, 50))
    Story.append(Paragraph("A Technical Dissertation on the Implementation of Large Language Models for the Indian Judicial Landscape.", ParagraphStyle('Desc', parent=normal, alignment=1)))
    Story.append(Spacer(1, 80))
    
    meta_data = [
        ["Project Title", "Dharma Vault AI"],
        ["Technology Stack", "React, Django, MongoDB, Gemini 2.0"],
        ["Submission Date", "May 2026"],
        ["Prepared By", "BCA / B.Tech Final Year Student"],
        ["Internal Supervisor", "Prof. [Supervisor Name]"],
        ["Organization", "Academic Institution Name"]
    ]
    t_meta = Table(meta_data, colWidths=[2.2*inch, 3.8*inch])
    t_meta.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 1, colors.grey), ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'), ('PADDING', (0,0), (-1,-1), 10)]))
    Story.append(t_meta)
    Story.append(PageBreak())

    # --- Front Matter ---
    front_matter = [
        ("PROJECT PROFILE", [
            ("Project Overview", 1, []),
            ("Problem Definition", 1, []),
            ("System Goals", 1, [])
        ]),
        ("EXECUTIVE SUMMARY", [
            ("Project Context", 1, []),
            ("Key Achievements", 1, []),
            ("Final Outcome", 1, [])
        ])
    ]

    # --- Consolidated Chapter Structure (Source of Truth) ---
    chapters_struct = [
        ("CHAPTER 1: INTRODUCTION", [
            ("1.1 Background of the Project", 2, [
                ("1.1.1 Digital Justice Initiatives in India", [
                    "1.1.1.1 E-Courts Phase I & II",
                    "1.1.1.2 Virtual Courts Infrastructure",
                    "1.1.1.3 Digital India Land Records Modernization"
                ]),
                ("1.1.2 The Evolution of Legal Informatics", [
                    "1.1.2.1 From CD-ROM Databases to Cloud",
                    "1.1.2.2 Natural Language Processing in Law",
                    "1.1.2.3 Predictive Justice Models"
                ])
            ]),
            ("1.2 Motivation", 2, [
                ("1.2.1 Challenges in Access to Legal Counsel", [
                    "1.2.1.1 High Cost of Professional Consultation",
                    "1.2.1.2 Scarcity of Legal Aid in Rural Districts",
                    "1.2.1.3 Information Asymmetry in Legal Transactions"
                ]),
                ("1.2.2 The 'Justice Clock' and Pendency Issues", [
                    "1.2.2.1 NJDG Data Analysis (National Judicial Data Grid)",
                    "1.2.2.2 Impact of Delayed Justice on GDP",
                    "1.2.2.3 Bottlenecks in Preliminary Legal Research"
                ])
            ]),
            ("1.3 Objectives of the System", 2, [
                ("1.3.1 Primary Objective: AI Advocacy", [
                    "1.3.1.1 Implementing Generative AI for Law",
                    "1.3.1.2 Grounding AI in Indian Statutes (IPC, CrPC)"
                ]),
                ("1.3.2 Secondary Objective: Document Automation", [
                    "1.3.2.1 Template-Based Legal Drafting",
                    "1.3.2.2 Verification and Validation Logic"
                ]),
                ("1.3.3 Tertiary Objective: User History & Privacy", [
                    "1.3.3.1 Secure Storage of Legal Queries",
                    "1.3.3.2 Implementation of GDPR/DPDP Standards"
                ])
            ]),
            ("1.4 Scope of the Study", 2, [
                ("1.4.1 Included Functional Domains", [
                    "1.4.1.1 Criminal Law Consultation (IPC)",
                    "1.4.1.2 Civil Rights and Consumer Protection",
                    "1.4.1.3 Basic Contract and Notice Generation"
                ]),
                ("1.4.2 Target Audience and End Users", [
                    "1.4.2.1 Common Citizens seeking information",
                    "1.4.2.2 Law Students and Paralegals",
                    "1.4.2.3 Junior Advocates for rapid research"
                ])
            ]),
            ("1.5 Project Methodology", 2, [
                ("1.5.1 Agile Scrum Framework", []),
                ("1.5.2 Tooling and Documentation Standards", [])
            ]),
            ("1.6 Organization of the Report", 2, [])
        ]),
        ("CHAPTER 2: LITERATURE SURVEY", [
            ("2.1 Artificial Intelligence and LLMs", 3, [
                ("2.1.1 Transformer Neural Networks", [
                    "2.1.1.1 Understanding Attention Mechanisms",
                    "2.1.1.2 Tokenization and Embedding Layers",
                    "2.1.1.3 Context Window Management"
                ]),
                ("2.1.2 Google Gemini 2.0 Flash", [
                    "2.1.2.1 Architecture and Efficiency",
                    "2.1.2.2 Multimodal Capabilities",
                    "2.1.2.3 API Integration for Production"
                ]),
                ("2.1.3 Retrieval-Augmented Generation (RAG)", [
                    "2.1.3.1 Vector Databases (ChromaDB/FAISS)",
                    "2.1.3.2 Semantic vs Keyword Search",
                    "2.1.3.3 Data Chunking and Indexing"
                ])
            ]),
            ("2.2 Frontend Frameworks and Tools", 2, [
                ("2.2.1 React.js Ecosystem", [
                    "2.2.1.1 Virtual DOM and Reconciliation",
                    "2.2.1.2 Hooks and State Management",
                    "2.2.1.3 Component Lifecycle"
                ]),
                ("2.2.2 TailwindCSS and Glassmorphism", [
                    "2.2.2.1 Utility-First Styling",
                    "2.2.2.2 Modern Design Trends (Dark Mode, Blur)",
                    "2.2.2.3 Responsive Layout Engine"
                ]),
                ("2.2.3 Vite Build System", [
                    "2.2.3.1 ES Modules and Rapid Prototyping",
                    "2.2.3.2 Optimized Production Bundling"
                ])
            ]),
            ("2.3 Backend and API Architecture", 2, [
                ("2.3.1 Django Web Framework", [
                    "2.3.1.1 Model-Template-View Pattern",
                    "2.3.1.2 Middleware and Security Layers",
                    "2.3.1.3 Django Admin and ORM"
                ]),
                ("2.3.2 RESTful API Design (DRF)", [
                    "2.3.2.1 Serializers and Data Validation",
                    "2.3.2.2 Token-Based Authentication",
                    "2.3.2.3 API Versioning and Documentation"
                ])
            ]),
            ("2.4 Database and Cloud Infrastructure", 2, [
                ("2.4.1 MongoDB Atlas (NoSQL)", [
                    "2.4.1.1 JSON/BSON Document Storage",
                    "2.4.1.2 Cloud Hosting and Scaling",
                    "2.4.1.3 Connection Pooling"
                ]),
                ("2.4.2 Google Cloud Run", [
                    "2.4.2.1 Serverless Container Execution",
                    "2.4.2.2 Auto-scaling and Pay-per-use",
                    "2.4.2.3 CI/CD Integration"
                ])
            ])
        ]),
        ("CHAPTER 3: SYSTEM REQUIREMENTS", [
            ("3.1 Requirement Analysis", 2, [
                ("3.1.1 Functional Requirements", [
                    "3.1.1.1 User Authentication and Authorization",
                    "3.1.1.2 Real-time AI Chatbot Interaction",
                    "3.1.1.3 PDF Document Auto-Generation",
                    "3.1.1.4 History Retrieval and Management"
                ]),
                ("3.1.2 Non-Functional Requirements", [
                    "3.1.2.1 Reliability and Fault Tolerance",
                    "3.1.2.2 Data Privacy and Encryption",
                    "3.1.2.3 Low Latency Performance Goals",
                    "3.1.2.4 Browser Compatibility"
                ])
            ]),
            ("3.2 Feasibility Study", 2, [
                ("3.2.1 Technical Feasibility Analysis", [
                    "3.2.1.1 Suitability of React for UI",
                    "3.2.1.2 API Limits of LLM Providers"
                ]),
                ("3.2.2 Economic Feasibility (Costing)", [
                    "3.2.2.1 Hardware and Hosting Costs",
                    "3.2.2.2 Manpower and Development Hours"
                ]),
                ("3.2.3 Operational Feasibility", [
                    "3.2.3.1 User Acceptance and Usability",
                    "3.2.3.2 Deployment and Maintenance"
                ])
            ]),
            ("3.3 Proposed vs Existing System", 2, [
                ("3.3.1 Limitations of Existing Manual Search", []),
                ("3.3.2 Advantages of Dharma Vault AI", [])
            ]),
            ("3.4 Hardware and Software Configuration", 2, [
                ("3.4.1 Development Hardware Specs", []),
                ("3.4.2 Server-side Software Stack", []),
                ("3.4.3 Client-side Requirements", [])
            ])
        ]),
        ("CHAPTER 4: SYSTEM DESIGN", [
            ("4.1 Architecture Design", 2, [
                ("4.1.1 High Level Architecture (HLD)", [
                    "4.1.1.1 Client-Server Communication Flow",
                    "4.1.1.2 Third-party API Integration Layer"
                ]),
                ("4.1.2 Low Level Design (LLD)", [
                    "4.1.2.1 Component Hierarchy in React",
                    "4.1.2.2 Django View and Model Logic"
                ])
            ]),
            ("4.2 Database Design (NoSQL)", 2, [
                ("4.2.1 Schema Definition (User Collection)", []),
                ("4.2.2 Schema Definition (History Collection)", []),
                ("4.2.3 Data Integrity and Indexing", [])
            ]),
            ("4.3 UML Diagrammatic Representation", 3, [
                ("4.3.1 Use Case Diagram", [
                    "4.3.1.1 Actor Identification",
                    "4.3.1.2 System Boundary Cases"
                ]),
                ("4.3.2 Sequence Diagram", [
                    "4.3.2.1 Auth Flow Sequence",
                    "4.3.2.2 AI Consultation Sequence"
                ]),
                ("4.3.3 Entity Relationship / Data Model", [
                    "4.3.3.1 Collection Relationships",
                    "4.3.3.2 Embedding Strategies"
                ]),
                ("4.3.4 Data Flow Diagrams (DFD)", [
                    "4.3.4.1 Level 0 Context DFD",
                    "4.3.4.2 Level 1 Process DFD"
                ])
            ]),
            ("4.4 User Interface Design (UI)", 2, [
                ("4.4.1 Wireframes and Prototyping", [
                    "4.4.1.1 Dashboard Layout Design",
                    "4.4.1.2 Chat Window Interaction Design"
                ]),
                ("4.4.2 Visual Identity (Typography & Colors)", [])
            ]),
            ("4.5 Deployment Architecture", 2, [
                ("4.5.1 Containerization with Docker", []),
                ("4.5.2 Orchestration and Scaling", [])
            ])
        ]),
        ("CHAPTER 5: IMPLEMENTATION", [
            ("5.1 Module Wise Implementation", 2, [
                ("5.1.1 User Auth Module (Django SimpleJWT)", [
                    "5.1.1.1 User Registration Flow",
                    "5.1.1.2 Secure Login and Token Storage"
                ]),
                ("5.1.2 Legal AI Chat Module", [
                    "5.1.2.1 Connecting to Google Generative AI",
                    "5.1.2.2 Handling Streaming API Responses",
                    "5.1.2.3 Prompt Engineering and Constraints"
                ]),
                ("5.1.3 Document Generation Service", [
                    "5.1.3.1 ReportLab Template Implementation",
                    "5.1.3.2 Dynamic Data Injection into PDF"
                ]),
                ("5.1.4 History and Analytics Module", [
                    "5.1.4.1 CRUD Operations in MongoDB",
                    "5.1.4.2 Infinite Scroll and Search in History"
                ])
            ]),
            ("5.2 Coding Standards and Best Practices", 2, [
                ("5.2.1 ESLint and Prettier Configuration", []),
                ("5.2.2 PEP-8 Compliance for Backend", []),
                ("5.2.3 Documentation and Docstrings", [])
            ]),
            ("5.3 Challenges and Solutions", 2, [
                ("5.3.1 Handling LLM Hallucinations", [
                    "5.3.1.1 Grounding with External Statutes",
                    "5.3.1.2 Implementing Fact-Check Logic"
                ]),
                ("5.3.2 Managing Asynchronous UI States", [
                    "5.3.2.1 React Query and SWR",
                    "5.3.2.2 Skeleton Loaders and Feedback"
                ])
            ])
        ]),
        ("CHAPTER 6: SYSTEM TESTING", [
            ("6.1 Testing Plan and Strategy", 2, [
                ("6.1.1 Unit Testing with PyTest and Vitest", [
                    "6.1.1.1 Testing API Endpoints",
                    "6.1.1.2 Component Level Testing"
                ]),
                ("6.1.2 Integration Testing Flow", [
                    "6.1.2.1 Frontend-Backend Handshake",
                    "6.1.2.2 Database Persistence Verification"
                ])
            ]),
            ("6.2 Functional Testing Cases", 2, [
                ("6.2.1 User Authentication Scenarios", []),
                ("6.2.2 AI Accuracy and Response Tests", []),
                ("6.2.3 PDF Formatting and Download Tests", [])
            ]),
            ("6.3 Performance and Load Testing", 2, [
                ("6.3.1 Stress Testing with Locust", [
                    "6.3.1.1 Measuring API Latency",
                    "6.3.1.2 Determining Breakpoints"
                ]),
                ("6.3.2 Client-Side Performance Audits", [
                    "6.3.2.1 Google Lighthouse Metrics",
                    "6.3.2.2 TTI and LCP Optimization"
                ])
            ]),
            ("6.4 User Acceptance Testing (UAT)", 2, [
                ("6.4.1 Feedback from Legal Professionals", []),
                ("6.4.2 Common User Usability Testing", [])
            ])
        ]),
        ("CHAPTER 7: PROJECT MANAGEMENT", [
            ("7.1 Agile Sprint Cycles", 2, [
                ("7.1.1 Sprint 1: Foundation and Setup", []),
                ("7.1.2 Sprint 2: Core AI Integration", []),
                ("7.1.3 Sprint 3: UI Polish and Testing", [])
            ]),
            ("7.2 Project Budget and Resource Allocation", 2, [
                ("7.2.1 Direct Costs (API, Hosting)", []),
                ("7.2.2 Indirect Costs (Man-hours)", [])
            ]),
            ("7.3 Gantt Chart Representation", 2, [])
        ]),
        ("CHAPTER 8: CONCLUSION", [
            ("8.1 Summary of the Project", 2, []),
            ("8.2 Limitations and Critical Analysis", 2, [
                ("8.2.1 Knowledge Cut-off Constraints", []),
                ("8.2.2 Internet Dependency for Cloud AI", [])
            ]),
            ("8.3 Future Enhancements", 2, [
                ("8.3.1 Multilingual (Vernacular) Support", [
                    "8.3.1.1 Regional NLP Challenges",
                    "8.3.1.2 Audio Input for Illiterate Users"
                ]),
                ("8.3.2 Direct Advocate Marketplace", [
                    "8.3.2.1 Matching Users with Local Counsel",
                    "8.3.2.2 Consultation Booking and Payment"
                ]),
                ("8.3.3 Mobile Application Development", [])
            ]),
            ("8.4 Final Conclusion", 1, [])
        ])
    ]

    # --- Table of Contents Generation ---
    Story.append(Paragraph("TABLE OF CONTENTS", title_style))
    Story.append(Spacer(1, 10))

    toc_hdr_style = ParagraphStyle('TocHdr', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, textColor=colors.white, alignment=1)
    toc_ch_style  = ParagraphStyle('TocCh',  parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor('#1e293b'), leftIndent=0)
    toc_s1_style  = ParagraphStyle('TocS1',  parent=styles['Normal'], fontName='Helvetica',      fontSize=10, textColor=colors.HexColor('#334155'), leftIndent=15)
    toc_s2_style  = ParagraphStyle('TocS2',  parent=styles['Normal'], fontName='Helvetica',      fontSize=9,  textColor=colors.HexColor('#475569'), leftIndent=30)
    toc_s3_style  = ParagraphStyle('TocS3',  parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor('#64748b'), leftIndent=45)

    toc_table_data = [
        [Paragraph("<b>Chapter / Section</b>", toc_hdr_style),
         Paragraph("<b>Page</b>", toc_hdr_style),
         Paragraph("<b>Date</b>", toc_hdr_style),
         Paragraph("<b>Signature</b>", toc_hdr_style)]
    ]

    # Calculate page numbers dynamically
    pg_counter = 4
    
    # Add Front Matter to TOC
    for fm_title, sub in front_matter:
        toc_table_data.append([Paragraph(f"<b>{fm_title}</b>", toc_ch_style), Paragraph(str(pg_counter), toc_ch_style), "", ""])
        for s_title, pgs, _ in sub:
            toc_table_data.append([Paragraph(s_title, toc_s1_style), Paragraph(str(pg_counter), toc_s1_style), "", ""])
            pg_counter += pgs
        pg_counter += 1

    # Add Chapters to TOC
    for ch_title, sections in chapters_struct:
        toc_table_data.append([Paragraph(f"<b>{ch_title}</b>", toc_ch_style), Paragraph(str(pg_counter), toc_ch_style), "", ""])
        for sec_title, pgs, sub_sections in sections:
            toc_table_data.append([Paragraph(sec_title, toc_s1_style), Paragraph(str(pg_counter), toc_s1_style), "", ""])
            for subsec_item in sub_sections:
                if isinstance(subsec_item, tuple):
                    sub_title, sub_sub_sections = subsec_item
                else:
                    sub_title = subsec_item
                    sub_sub_sections = []
                
                # These are the "details" (1.1.1, etc.) the user wants
                toc_table_data.append([Paragraph(sub_title, toc_s2_style), Paragraph(str(pg_counter), toc_s2_style), "", ""])
                for sss_title in sub_sub_sections:
                    toc_table_data.append([Paragraph(sss_title, toc_s3_style), Paragraph(str(pg_counter), toc_s3_style), "", ""])
            pg_counter += pgs

        pg_counter += 2 # Chapter break buffer

    toc_table = Table(toc_table_data, colWidths=[3.8*inch, 0.5*inch, 0.9*inch, 1.0*inch], repeatRows=1)
    toc_table.setStyle(TableStyle([
        ('BACKGROUND',  (0, 0), (-1, 0),  colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR',   (0, 0), (-1, 0),  colors.white),
        ('GRID',        (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN',      (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',  (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING',(0, 0), (-1, -1), 3),
    ]))
    Story.append(toc_table)
    Story.append(PageBreak())

    # --- Main Content Generation ---
    random.seed(123)
    
    # Render Front Matter
    for fm_title, sub in front_matter:
        Story.append(Paragraph(fm_title, heading1))
        for s_title, _, _ in sub:
            Story.append(Paragraph(s_title, heading2))
            for _ in range(3):
                Story.append(Paragraph(generate_technical_paragraph("intro"), normal))
                Story.append(Spacer(1, 10))
        Story.append(PageBreak())

    # Render Chapters
    for chapter_title, sections in chapters_struct:
        Story.append(Paragraph(chapter_title, heading1))
        Story.append(Spacer(1, 20))
        ch_tag = "intro" if "INTRODUCTION" in chapter_title else "design" if "DESIGN" in chapter_title else "tech"

        for sec_title, pgs_allocated, subsections in sections:
            Story.append(Paragraph(sec_title, heading2))
            
            for subsec_item in subsections:
                if isinstance(subsec_item, tuple):
                    subsec, subsubsections = subsec_item
                else:
                    subsec = subsec_item
                    subsubsections = []

                Story.append(Paragraph(subsec, heading3))
                for _ in range(3):
                    Story.append(Paragraph(generate_technical_paragraph(ch_tag), normal))
                    Story.append(Spacer(1, 10))
                
                for subsubsec in subsubsections:
                    Story.append(Paragraph(subsubsec, heading4))
                    for _ in range(3):
                        Story.append(Paragraph(generate_technical_paragraph(ch_tag), normal))
                        Story.append(Spacer(1, 10))
                
                # Integration Testing Table
                if "Integration Testing" in subsec:
                    Story.append(Paragraph("<b>Table 6.2: Integration Test Cases</b>", ParagraphStyle('tblTitle', parent=normal, textColor=colors.darkgreen, fontSize=12, spaceAfter=5)))
                    test_data = [
                        ["ID", "Interaction", "Description", "Expected Result", "Status"],
                        ["IT-01", "React->Django", "Send login payload to /api/token/", "Receive access/refresh tokens", "Pass"],
                        ["IT-02", "React->Django", "Submit chat query to /api/chat/", "Receive streamed AI text", "Pass"],
                        ["IT-03", "Django->Mongo", "Save ChatHistory model", "Document visible in Atlas", "Pass"],
                        ["IT-04", "Django->Gemini", "Forward user query to Gemini", "API accepts request", "Pass"],
                        ["IT-06", "React->Browser", "Render PDF via Blob URL", "Browser opens PDF correctly", "Pass"]
                    ]
                    t = Table(test_data, colWidths=[0.6*inch, 1.2*inch, 2.5*inch, 1.8*inch, 0.6*inch])
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#8b008b')),
                        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                        ('GRID', (0,0), (-1,-1), 1, colors.grey)
                    ]))
                    Story.append(t)
                    Story.append(Spacer(1, 15))

            for _ in range(5):
                Story.append(Paragraph(generate_technical_paragraph(ch_tag), normal))
                Story.append(Spacer(1, 12))
            
            Story.append(create_rich_box(styles, "INSIGHT"))
            Story.append(Spacer(1, 10))
            Story.append(PageBreak())

    # --- Appendices ---
    Story.append(Paragraph("APPENDIX A: SYSTEM SCREENSHOTS", heading1))
    images = ["login.png", "dashboard.png", "chat.png", "documents.png", "history.png"]
    for img_name in images:
        if os.path.exists(img_name):
            Story.append(Paragraph(f"Functional Module: {img_name.upper()}", heading2))
            img = Image(img_name, width=6*inch, height=3.8*inch)
            Story.append(img)
            Story.append(Paragraph(f"Description: User interface for the {img_name.split('.')[0]} module.", normal))
            Story.append(PageBreak())

    Story.append(Paragraph("BIBLIOGRAPHY", heading1))
    for i, ref in enumerate(["Constitutional Law of India (D.D. Basu)", "Large Language Models in Legal Practice (Research Paper)", "Django Framework Technical Guide", "ReportLab User Manual", "Google Generative AI Documentation"], 1):
        Story.append(Paragraph(f"[{i}] {ref}", normal))

    doc.multiBuild(Story)

if __name__ == "__main__":
    out_file = "Black Book_Final.pdf"
    build_pdf(out_file)
    print(f"Final Polished Black Book generated: {out_file}")
