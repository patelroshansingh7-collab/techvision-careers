export interface CourseData {
  slug: string;
  title: string;
  category: string;
  durationDays: number;
  mode: "Online" | "Hybrid";
  priceINR: number;
  description: string;
  learn: string[];
  tools: string[];
  thumbnail: string;
  iconName: string;
  gradient: string;
}

export const ENGINEERING_COURSES: CourseData[] = [
  {
    slug: "full-stack-web-development-react-node",
    title: "Full-Stack Web Development with React & Node",
    category: "Web",
    durationDays: 30,
    mode: "Online",
    priceINR: 149,
    description: "Master modern full-stack web engineering by building enterprise SaaS applications. Gain hands-on experience in frontend UI, RESTful microservices, and database modeling.",
    learn: [
      "Responsive React.js architecture with hooks, context, and state management",
      "Robust Node.js & Express REST APIs with JWT authentication",
      "NoSQL database schema design, queries, and indexing with MongoDB",
      "Production deployment with environment configuration and cloud CI/CD"
    ],
    tools: ["React 18", "Node.js", "MongoDB"],
    thumbnail: "/assets/courses/web-dev.jpg",
    iconName: "Globe",
    gradient: "from-blue-600 to-indigo-800"
  },
  {
    slug: "frontend-development-react-typescript",
    title: "Frontend Development with React + TypeScript",
    category: "Web",
    durationDays: 30,
    mode: "Online",
    priceINR: 149,
    description: "Build robust, type-safe user interfaces with industry-standard TypeScript and modern React patterns. Master clean component architecture and performance profiling.",
    learn: [
      "Type-safe component design and strict TypeScript generic props",
      "Modern state management with Zustand and TanStack Query",
      "High-performance styling with Tailwind CSS and Framer Motion",
      "Unit testing, accessibility compliance, and Lighthouse 100 audits"
    ],
    tools: ["TypeScript", "React", "Tailwind CSS"],
    thumbnail: "/assets/courses/frontend.jpg",
    iconName: "Layout",
    gradient: "from-cyan-600 to-blue-700"
  },
  {
    slug: "backend-development-node-express-mongodb",
    title: "Backend Development with Node.js + Express + MongoDB",
    category: "Web",
    durationDays: 30,
    mode: "Online",
    priceINR: 149,
    description: "Design scalable backend systems, secure authentication pipelines, and optimized databases. Learn microservices architecture and caching techniques.",
    learn: [
      "Express middleware design, error handling, and rate limiting",
      "Secure authentication using OAuth 2.0, bcrypt, and JWT tokens",
      "MongoDB aggregation pipelines, transaction locks, and indexing",
      "Redis caching layer for lightning-fast sub-10ms response times"
    ],
    tools: ["Node.js", "Express", "MongoDB"],
    thumbnail: "/assets/courses/backend.jpg",
    iconName: "Server",
    gradient: "from-emerald-600 to-teal-800"
  },
  {
    slug: "nextjs-app-router-production-ready",
    title: "Next.js App Router — Production Ready",
    category: "Web",
    durationDays: 30,
    mode: "Online",
    priceINR: 149,
    description: "Leverage React Server Components, Server Actions, and dynamic routing in Next.js 14+. Build SEO-optimized, ultra-fast web applications deployed on Vercel.",
    learn: [
      "React Server Components (RSC) and streaming with Suspense",
      "Server Actions with Zod validation and mutation handling",
      "Optimized Edge caching, revalidation, and dynamic metadata SEO",
      "Full-stack authentication and database querying with Prisma ORM"
    ],
    tools: ["Next.js 14", "React", "Prisma"],
    thumbnail: "/assets/courses/nextjs.jpg",
    iconName: "Layers",
    gradient: "from-slate-800 to-indigo-950"
  },
  {
    slug: "django-drf-rest-api-development",
    title: "Django + DRF REST API Development",
    category: "Web",
    durationDays: 30,
    mode: "Hybrid",
    priceINR: 149,
    description: "Develop enterprise Python web backends using Django and Django REST Framework. Implement secure API endpoints, relational models, and asynchronous tasks with Celery.",
    learn: [
      "Relational ORM modeling and database migrations with PostgreSQL",
      "DRF Serializers, ViewSets, permissions, and token authentication",
      "Asynchronous background task processing with Celery and Redis",
      "Automated Swagger/OpenAPI documentation generation and testing"
    ],
    tools: ["Python", "Django", "PostgreSQL"],
    thumbnail: "/assets/courses/django.jpg",
    iconName: "Code",
    gradient: "from-green-700 to-emerald-950"
  },
  {
    slug: "python-for-machine-learning",
    title: "Python for Machine Learning",
    category: "AI/ML",
    durationDays: 45,
    mode: "Online",
    priceINR: 149,
    description: "Dive deep into machine learning algorithms, statistical data analysis, and predictive modeling. Train real-world classification, regression, and clustering models.",
    learn: [
      "Data wrangling and matrix computation with NumPy and Pandas",
      "Supervised & unsupervised learning with Scikit-Learn pipelines",
      "Feature engineering, cross-validation, and hyperparameter tuning",
      "Model deployment via FastAPI microservices and Docker containers"
    ],
    tools: ["Python", "Scikit-Learn", "Pandas"],
    thumbnail: "/assets/courses/ml.jpg",
    iconName: "Brain",
    gradient: "from-purple-600 to-indigo-900"
  },
  {
    slug: "deep-learning-with-pytorch",
    title: "Deep Learning with PyTorch",
    category: "AI/ML",
    durationDays: 45,
    mode: "Online",
    priceINR: 149,
    description: "Architect and train deep neural networks from scratch using PyTorch. Master Convolutional Networks (CNNs), Recurrent Networks (LSTMs), and modern Transformers.",
    learn: [
      "Custom PyTorch tensors, autograd engine, and GPU training acceleration",
      "CNN architectures (ResNet, EfficientNet) for image classification",
      "Sequence modeling with RNNs and self-attention Transformer blocks",
      "Transfer learning and fine-tuning state-of-the-art vision models"
    ],
    tools: ["PyTorch", "CUDA", "TensorBoard"],
    thumbnail: "/assets/courses/deep-learning.jpg",
    iconName: "Cpu",
    gradient: "from-rose-600 to-purple-900"
  },
  {
    slug: "generative-ai-llm-apps-openai-langchain",
    title: "Generative AI & LLM Apps (OpenAI / LangChain)",
    category: "AI/ML",
    durationDays: 45,
    mode: "Online",
    priceINR: 149,
    description: "Build cutting-edge GenAI applications utilizing Large Language Models, Retrieval-Augmented Generation (RAG), and autonomous AI agents.",
    learn: [
      "Prompt engineering, structured JSON outputs, and OpenAI API function calling",
      "Vector embeddings, semantic search, and Vector DBs (Chroma, Pinecone)",
      "Building production RAG pipelines with LangChain and LlamaIndex",
      "Autonomous tool-calling agents and multi-modal vision pipelines"
    ],
    tools: ["OpenAI", "LangChain", "Vector DB"],
    thumbnail: "/assets/courses/genai.jpg",
    iconName: "Sparkles",
    gradient: "from-amber-600 to-rose-700"
  },
  {
    slug: "computer-vision-opencv-yolo",
    title: "Computer Vision with OpenCV & YOLO",
    category: "AI/ML",
    durationDays: 45,
    mode: "Hybrid",
    priceINR: 149,
    description: "Process real-time video feeds, detect objects, and track human poses. Build edge AI computer vision solutions using OpenCV and YOLOv8.",
    learn: [
      "Image processing, edge detection, color spaces, and morphological filters",
      "Real-time object detection and custom dataset training with YOLOv8",
      "Facial recognition, landmark detection, and optical character recognition",
      "Edge deployment on embedded hardware and video stream pipelines"
    ],
    tools: ["OpenCV", "YOLOv8", "Python"],
    thumbnail: "/assets/courses/vision.jpg",
    iconName: "Scan",
    gradient: "from-indigo-600 to-cyan-800"
  },
  {
    slug: "data-analytics-python-pandas-powerbi",
    title: "Data Analytics with Python, Pandas & Power BI",
    category: "Data",
    durationDays: 30,
    mode: "Online",
    priceINR: 149,
    description: "Transform raw data into actionable business intelligence insights. Build interactive executive dashboards in Power BI and execute advanced data transforms.",
    learn: [
      "Exploratory Data Analysis (EDA) and data cleansing with Pandas",
      "Statistical visualization with Seaborn, Matplotlib, and Plotly",
      "Interactive multi-page BI dashboards with DAX calculated measures",
      "Business storytelling, KPI tracking, and executive automated reporting"
    ],
    tools: ["Python", "Pandas", "Power BI"],
    thumbnail: "/assets/courses/analytics.jpg",
    iconName: "BarChart3",
    gradient: "from-blue-600 to-cyan-900"
  },
  {
    slug: "sql-data-warehousing",
    title: "SQL & Data Warehousing",
    category: "Data",
    durationDays: 30,
    mode: "Online",
    priceINR: 149,
    description: "Master advanced SQL querying, relational database optimization, and modern cloud data warehouse modeling using Snowflake and PostgreSQL.",
    learn: [
      "Complex SQL joins, subqueries, CTEs, and analytical window functions",
      "Database schema normalization, query execution plans, and indexing",
      "Star and Snowflake schema design for enterprise data warehouses",
      "Building automated ETL / ELT data ingestion pipelines"
    ],
    tools: ["PostgreSQL", "Snowflake", "SQL"],
    thumbnail: "/assets/courses/sql.jpg",
    iconName: "Database",
    gradient: "from-teal-600 to-blue-900"
  },
  {
    slug: "android-development-with-kotlin",
    title: "Android Development with Kotlin",
    category: "Mobile",
    durationDays: 45,
    mode: "Online",
    priceINR: 149,
    description: "Create modern native Android applications using Kotlin and Jetpack Compose. Learn MVVM architecture, asynchronous coroutines, and Room offline database.",
    learn: [
      "Declarative UI development with Jetpack Compose & Material 3",
      "Asynchronous programming with Kotlin Coroutines and StateFlow",
      "Clean Architecture with MVVM, Hilt Dependency Injection, and Room DB",
      "REST API integration with Retrofit and Google Play release packaging"
    ],
    tools: ["Kotlin", "Jetpack Compose", "Android Studio"],
    thumbnail: "/assets/courses/android.jpg",
    iconName: "Smartphone",
    gradient: "from-emerald-600 to-green-800"
  },
  {
    slug: "ios-development-with-swift",
    title: "iOS Development with Swift",
    category: "Mobile",
    durationDays: 45,
    mode: "Online",
    priceINR: 149,
    description: "Build beautiful native Apple iOS apps using Swift 5 and SwiftUI. Master Apple Human Interface Guidelines, CoreData persistence, and App Store guidelines.",
    learn: [
      "Declarative UI design with SwiftUI and custom animation modifiers",
      "Reactive data binding with Combine and `@Observable` macros",
      "Local offline data persistence with SwiftData / CoreData",
      "Networking with async/await URLSession and App Store deployment"
    ],
    tools: ["Swift", "SwiftUI", "Xcode"],
    thumbnail: "/assets/courses/ios.jpg",
    iconName: "Apple",
    gradient: "from-slate-700 to-blue-950"
  },
  {
    slug: "flutter-cross-platform-app-development",
    title: "Flutter Cross-Platform App Development",
    category: "Mobile",
    durationDays: 30,
    mode: "Online",
    priceINR: 149,
    description: "Develop silky-smooth 60fps native apps for both iOS and Android from a single Dart codebase. Master state management and cloud backend integration.",
    learn: [
      "Flutter widget trees, custom layout builders, and explicit animations",
      "Robust state management with Bloc / Riverpod architecture",
      "Firebase Auth, Firestore real-time database, and Push Notifications",
      "Multi-platform compilation for Android, iOS, and Web"
    ],
    tools: ["Flutter", "Dart", "Firebase"],
    thumbnail: "/assets/courses/flutter.jpg",
    iconName: "SmartphoneCharging",
    gradient: "from-sky-500 to-blue-800"
  },
  {
    slug: "react-native-build-production-apps",
    title: "React Native — Build Production Apps",
    category: "Mobile",
    durationDays: 30,
    mode: "Online",
    priceINR: 149,
    description: "Leverage your React knowledge to build true native mobile applications with Expo and React Native. Implement native hardware integrations and offline sync.",
    learn: [
      "React Native core components and cross-platform styling",
      "Expo Router file-based navigation and deep linking",
      "Native device API access (Camera, Geolocation, Biometrics)",
      "Automated OTA updates and multi-platform app store deployment"
    ],
    tools: ["React Native", "Expo", "TypeScript"],
    thumbnail: "/assets/courses/react-native.jpg",
    iconName: "TabletSmartphone",
    gradient: "from-cyan-600 to-indigo-900"
  },
  {
    slug: "aws-cloud-practitioner-track",
    title: "AWS Cloud Practitioner Track",
    category: "Cloud",
    durationDays: 45,
    mode: "Online",
    priceINR: 149,
    description: "Master Amazon Web Services core architecture, compute, storage, security, and networking. Prepare for official AWS certification through practical labs.",
    learn: [
      "EC2 compute scaling, Elastic Load Balancing, and Auto Scaling groups",
      "S3 object storage policies, lifecycle rules, and CloudFront CDN",
      "VPC network architecture, subnets, route tables, and Security Groups",
      "IAM access control, security best practices, and billing optimization"
    ],
    tools: ["AWS EC2", "AWS S3", "AWS IAM"],
    thumbnail: "/assets/courses/aws.jpg",
    iconName: "Cloud",
    gradient: "from-amber-600 to-orange-800"
  },
  {
    slug: "devops-with-docker-kubernetes-cicd",
    title: "DevOps with Docker, Kubernetes & CI/CD",
    category: "Cloud",
    durationDays: 45,
    mode: "Hybrid",
    priceINR: 149,
    description: "Automate containerized software delivery pipelines. Master Docker containerization, Kubernetes pod orchestration, and GitHub Actions CI/CD workflows.",
    learn: [
      "Writing optimized multi-stage Dockerfiles and container registries",
      "Kubernetes deployments, services, ingress controllers, and ConfigMaps",
      "Automated test and build pipelines using GitHub Actions",
      "Infrastructure monitoring with Prometheus and Grafana alerting"
    ],
    tools: ["Docker", "Kubernetes", "GitHub Actions"],
    thumbnail: "/assets/courses/devops.jpg",
    iconName: "GitBranch",
    gradient: "from-indigo-600 to-slate-900"
  },
  {
    slug: "cybersecurity-fundamentals-ethical-hacking",
    title: "Cybersecurity Fundamentals & Ethical Hacking",
    category: "Cyber",
    durationDays: 45,
    mode: "Online",
    priceINR: 149,
    description: "Learn offensive security principles, vulnerability assessments, and penetration testing methodologies in safe legal sandbox environments.",
    learn: [
      "Network scanning and enumeration with Nmap and Wireshark",
      "Web application vulnerabilities: OWASP Top 10 exploits and mitigations",
      "Password cracking, privilege escalation, and reconnaissance techniques",
      "Defensive remediation, patching, and cybersecurity compliance reporting"
    ],
    tools: ["Kali Linux", "Burp Suite", "Wireshark"],
    thumbnail: "/assets/courses/cyber.jpg",
    iconName: "ShieldAlert",
    gradient: "from-red-600 to-slate-950"
  },
  {
    slug: "network-security-penetration-testing",
    title: "Network Security & Penetration Testing",
    category: "Cyber",
    durationDays: 45,
    mode: "Hybrid",
    priceINR: 149,
    description: "Analyze enterprise network packets, configure firewalls, and execute comprehensive penetration tests against vulnerable network architectures.",
    learn: [
      "TCP/IP protocol exploitation and packet crafting with Scapy",
      "Firewall configuration, IDS/IPS tuning, and VPN tunneling",
      "Active Directory exploitation and Kerberos ticket attacks",
      "Incident response protocols and digital forensics analysis"
    ],
    tools: ["Metasploit", "Nmap", "Snort"],
    thumbnail: "/assets/courses/network.jpg",
    iconName: "ShieldCheck",
    gradient: "from-rose-700 to-slate-900"
  },
  {
    slug: "iot-systems-arduino-raspberry-pi",
    title: "IoT Systems with Arduino & Raspberry Pi",
    category: "IoT/Robotics",
    durationDays: 30,
    mode: "Hybrid",
    priceINR: 149,
    description: "Build interconnected smart devices and sensory automation systems using Arduino microcontrollers, Raspberry Pi SBCs, and MQTT communication protocols.",
    learn: [
      "Interfacing analog/digital sensors and actuators with Arduino",
      "Raspberry Pi Linux setup, GPIO control, and Python scripting",
      "Lightweight IoT messaging using MQTT and WebSocket protocols",
      "Cloud IoT dashboard telemetry and remote device automation"
    ],
    tools: ["Arduino", "Raspberry Pi", "MQTT"],
    thumbnail: "/assets/courses/iot.jpg",
    iconName: "Radio",
    gradient: "from-cyan-600 to-emerald-800"
  },
  {
    slug: "blockchain-solidity-smart-contracts",
    title: "Blockchain & Solidity Smart Contracts",
    category: "Blockchain",
    durationDays: 45,
    mode: "Online",
    priceINR: 149,
    description: "Develop decentralized applications (dApps) on Ethereum. Write, test, and deploy secure Solidity smart contracts using Hardhat and Ethers.js.",
    learn: [
      "Ethereum Virtual Machine (EVM) architecture and gas optimization",
      "Writing secure ERC-20 and ERC-721 smart contracts in Solidity",
      "Automated contract testing and local blockchain forks with Hardhat",
      "Frontend Web3 integration using Ethers.js / Wagmi and MetaMask"
    ],
    tools: ["Solidity", "Hardhat", "Ethers.js"],
    thumbnail: "/assets/courses/blockchain.jpg",
    iconName: "Coins",
    gradient: "from-purple-700 to-slate-900"
  },
  {
    slug: "embedded-c-microcontroller-programming-arm-stm32",
    title: "Embedded C & Microcontroller Programming (ARM/STM32)",
    category: "Embedded",
    durationDays: 30,
    mode: "Hybrid",
    priceINR: 149,
    description: "Program bare-metal ARM Cortex-M microcontrollers using Embedded C. Learn register-level peripheral manipulation, UART/SPI/I2C communication, and RTOS.",
    learn: [
      "Register-level Embedded C programming and bitwise manipulation",
      "Configuring hardware timers, interrupts, ADC, and PWM peripherals",
      "Serial communication protocols: UART, SPI, and I2C interfacing",
      "Introduction to Real-Time Operating Systems (FreeRTOS) task scheduling"
    ],
    tools: ["Embedded C", "STM32 Cube", "ARM Cortex"],
    thumbnail: "/assets/courses/embedded.jpg",
    iconName: "Cpu",
    gradient: "from-slate-700 to-blue-900"
  }
];

export const CATEGORIES = [
  "All",
  "Web",
  "AI/ML",
  "Data",
  "Mobile",
  "Cloud",
  "Cyber",
  "IoT/Robotics",
  "Blockchain",
  "Embedded"
];
