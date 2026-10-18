/**
 * Database Seed Script for SkillSwap
 * Populates realistic college peer-learning profiles, skills, sessions, and reviews.
 * Developer: Sanjeeviraj
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Skill = require('./models/Skill');
const SkillExchangeRequest = require('./models/SkillExchangeRequest');
const LearningSession = require('./models/LearningSession');
const Feedback = require('./models/Feedback');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillswap';

const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');

    // Clear existing collections
    await User.deleteMany({});
    await Skill.deleteMany({});
    await SkillExchangeRequest.deleteMany({});
    await LearningSession.deleteMany({});
    await Feedback.deleteMany({});
    await Notification.deleteMany({});

    console.log('Cleared existing collections.');

    // 1. Seed Skills Catalog
    const skillsData = [
      {
        name: 'Python Programming',
        category: 'Programming & Systems',
        description: 'Object-oriented programming, data structures, algorithms, and automated scripting.',
        icon: 'fab fa-python',
        tags: ['Python', 'Backend', 'Scripting', 'Automation'],
        featured: true,
        popularityScore: 98
      },
      {
        name: 'Full-Stack Web Development',
        category: 'Web & App Development',
        description: 'HTML5, modern CSS3, responsive layouts, Node.js REST APIs, and database integration.',
        icon: 'fas fa-laptop-code',
        tags: ['Web', 'JavaScript', 'HTML5', 'CSS3', 'Node.js'],
        featured: true,
        popularityScore: 95
      },
      {
        name: 'UI/UX & Figma Prototyping',
        category: 'UI/UX & Design',
        description: 'User-centered design principles, wireframing, design systems, and interactive prototypes.',
        icon: 'fas fa-palette',
        tags: ['Figma', 'UI Design', 'UX Research', 'Prototyping'],
        featured: true,
        popularityScore: 92
      },
      {
        name: 'Machine Learning & Scikit-Learn',
        category: 'Data Science & AI',
        description: 'Supervised and unsupervised models, TF-IDF vectorization, feature engineering, and evaluation.',
        icon: 'fas fa-brain',
        tags: ['Machine Learning', 'AI', 'Scikit-Learn', 'Pandas'],
        featured: true,
        popularityScore: 94
      },
      {
        name: 'Node.js & Express.js',
        category: 'Web & App Development',
        description: 'Asynchronous event-driven backend architectures, RESTful API routing, and middleware.',
        icon: 'fab fa-node-js',
        tags: ['Node.js', 'Express', 'Backend', 'REST API'],
        featured: true,
        popularityScore: 89
      },
      {
        name: 'Data Structures & Algorithms',
        category: 'Programming & Systems',
        description: 'Arrays, trees, graphs, dynamic programming, sorting algorithms, and complexity analysis.',
        icon: 'fas fa-project-diagram',
        tags: ['DSA', 'Algorithms', 'LeetCode', 'Optimization'],
        featured: true,
        popularityScore: 96
      },
      {
        name: 'Cloud Architecture & Docker',
        category: 'Programming & Systems',
        description: 'Containerization, microservices deployment, Dockerfiles, and cloud infrastructure.',
        icon: 'fab fa-docker',
        tags: ['Docker', 'DevOps', 'Cloud', 'Microservices'],
        featured: false,
        popularityScore: 82
      },
      {
        name: 'Technical Writing & Presentation',
        category: 'Languages & Communication',
        description: 'Engineering documentation, research presentations, and clear collaborative communication.',
        icon: 'fas fa-pen-fancy',
        tags: ['Communication', 'Presentation', 'Writing', 'Soft Skills'],
        featured: false,
        popularityScore: 78
      },
      {
        name: 'Mobile App Development (Flutter)',
        category: 'Web & App Development',
        description: 'Cross-platform native mobile applications using Dart and Flutter widget architecture.',
        icon: 'fas fa-mobile-alt',
        tags: ['Flutter', 'Mobile', 'iOS', 'Android', 'Dart'],
        featured: false,
        popularityScore: 84
      },
      {
        name: 'Database Design & MongoDB',
        category: 'Programming & Systems',
        description: 'NoSQL schema design, Mongoose modeling, indexing, and aggregation pipelines.',
        icon: 'fas fa-database',
        tags: ['MongoDB', 'NoSQL', 'Mongoose', 'Database'],
        featured: false,
        popularityScore: 88
      }
    ];

    const createdSkills = await Skill.insertMany(skillsData);
    console.log(`Seeded ${createdSkills.length} catalog skills.`);

    // 2. Seed Realistic User Personas
    const defaultPassword = 'Password123!';

    // Persona 1: Sanjeeviraj (Lead Developer)
    const sanjeevi = new User({
      name: 'Sanjeeviraj',
      email: 'sanjeeviraj@skillswap.edu',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      headline: 'Full-Stack Developer & AI Recommendation Researcher',
      bio: 'Computer Science undergraduate passionate about building scalable web applications and intelligent recommendation algorithms. Lead developer of SkillSwap.',
      location: 'Engineering Block / Hybrid',
      teachSkills: [
        { name: 'Python Programming', category: 'Programming & Systems', proficiency: 'expert', description: 'Python core, data structures, automation, and FastAPI microservices.' },
        { name: 'Full-Stack Web Development', category: 'Web & App Development', proficiency: 'advanced', description: 'Semantic HTML5, CSS3 dark dashboards, Node.js & Express REST APIs.' }
      ],
      learnSkills: [
        { name: 'UI/UX & Figma Prototyping', category: 'UI/UX & Design', targetProficiency: 'advanced', goals: 'Master micro-interactions, responsive Figma design tokens, and user testing.' },
        { name: 'Cloud Architecture & Docker', category: 'Programming & Systems', targetProficiency: 'intermediate', goals: 'Learn container orchestration and deployment pipelines.' }
      ],
      availability: ['Weekdays (Evenings)', 'Weekends (Flexible)'],
      preferredFormat: 'both',
      skillPoints: 340,
      rating: 4.9,
      reviewCount: 8,
      completedSessionsCount: 7,
      isDemoUser: true
    });
    await sanjeevi.save();

    // Persona 2: Priya Sharma (Data Science / AI Specialist - Reciprocal Partner)
    const priya = new User({
      name: 'Priya Sharma',
      email: 'priya.sharma@skillswap.edu',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      headline: 'Data Science & Machine Learning Enthusiast',
      bio: 'Junior year data science student. I love training Scikit-Learn models, NLP text classifiers, and analyzing real-world datasets. Looking to exchange skills in modern web development!',
      location: 'Science Library / Online',
      teachSkills: [
        { name: 'Machine Learning & Scikit-Learn', category: 'Data Science & AI', proficiency: 'expert', description: 'TF-IDF vectorization, Cosine similarity, regression, classification pipelines.' },
        { name: 'Python Programming', category: 'Programming & Systems', proficiency: 'advanced', description: 'Data wrangling with Pandas and NumPy numerical operations.' }
      ],
      learnSkills: [
        { name: 'Full-Stack Web Development', category: 'Web & App Development', targetProficiency: 'intermediate', goals: 'Build web dashboards to display ML model predictions.' },
        { name: 'Node.js & Express.js', category: 'Web & App Development', targetProficiency: 'intermediate', goals: 'Create backend endpoints to integrate with client apps.' }
      ],
      availability: ['Weekdays (Evenings)', 'Weekends (Flexible)'],
      preferredFormat: 'online',
      skillPoints: 280,
      rating: 4.95,
      reviewCount: 6,
      completedSessionsCount: 5,
      isDemoUser: true
    });
    await priya.save();

    // Persona 3: Marcus Chen (UI/UX Designer - High Match)
    const marcus = new User({
      name: 'Marcus Chen',
      email: 'marcus.chen@skillswap.edu',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      headline: 'Product Designer & Design Systems Advocate',
      bio: 'Design student focused on glassmorphic aesthetics, SaaS UI kits, accessibility WCAG compliance, and prototyping in Figma. Want to learn Python for automation!',
      location: 'Design Studio Lab / Online',
      teachSkills: [
        { name: 'UI/UX & Figma Prototyping', category: 'UI/UX & Design', proficiency: 'expert', description: 'Figma component auto-layout, interactive state variants, and color contrast systems.' }
      ],
      learnSkills: [
        { name: 'Python Programming', category: 'Programming & Systems', targetProficiency: 'intermediate', goals: 'Automate design exports and data scraping.' },
        { name: 'Full-Stack Web Development', category: 'Web & App Development', targetProficiency: 'intermediate', goals: 'Code my own portfolio designs into clean HTML/CSS/JS.' }
      ],
      availability: ['Weekends (Flexible)', 'Weekdays (Evenings)'],
      preferredFormat: 'both',
      skillPoints: 215,
      rating: 4.8,
      reviewCount: 4,
      completedSessionsCount: 4,
      isDemoUser: false
    });
    await marcus.save();

    // Persona 4: Aisha Patel (DevOps & Systems)
    const aisha = new User({
      name: 'Aisha Patel',
      email: 'aisha.patel@skillswap.edu',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      headline: 'Cloud Engineer & Infrastructure Specialist',
      bio: 'Passionate about Dockerizing microservices, CI/CD pipelines, and Linux server management. Excited to learn advanced DSA for upcoming tech interviews.',
      location: 'Tech Hub Room 102 / Remote',
      teachSkills: [
        { name: 'Cloud Architecture & Docker', category: 'Programming & Systems', proficiency: 'advanced', description: 'Containerization, Docker Compose, environment setups, and cloud hosting.' }
      ],
      learnSkills: [
        { name: 'Data Structures & Algorithms', category: 'Programming & Systems', targetProficiency: 'advanced', goals: 'Ace technical coding interviews and dynamic programming.' }
      ],
      availability: ['Weekdays (Evenings)'],
      preferredFormat: 'online',
      skillPoints: 175,
      rating: 4.85,
      reviewCount: 3,
      completedSessionsCount: 3
    });
    await aisha.save();

    // Persona 5: Lucas Silva (Mobile App Developer)
    const lucas = new User({
      name: 'Lucas Silva',
      email: 'lucas.silva@skillswap.edu',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      headline: 'Flutter & Cross-Platform Mobile Engineer',
      bio: 'Building smooth mobile experiences for iOS and Android with Flutter. Keen to learn backend database modeling and scalable APIs.',
      location: 'Campus Library Cafe',
      teachSkills: [
        { name: 'Mobile App Development (Flutter)', category: 'Web & App Development', proficiency: 'advanced', description: 'Cross-platform app dev, state management with Riverpod, and native device APIs.' }
      ],
      learnSkills: [
        { name: 'Database Design & MongoDB', category: 'Programming & Systems', targetProficiency: 'intermediate', goals: 'Design scalable NoSQL collections for mobile apps.' }
      ],
      availability: ['Weekends (Flexible)'],
      preferredFormat: 'both',
      skillPoints: 140,
      rating: 4.75,
      reviewCount: 2,
      completedSessionsCount: 2
    });
    await lucas.save();

    console.log('Seeded 5 user personas.');

    // 3. Seed Exchange Requests
    // Request 1: Marcus -> Sanjeevi (Pending)
    const req1 = await SkillExchangeRequest.create({
      sender: marcus._id,
      recipient: sanjeevi._id,
      offeredSkill: { name: 'UI/UX & Figma Prototyping', category: 'UI/UX & Design', proficiency: 'expert' },
      requestedSkill: { name: 'Python Programming', category: 'Programming & Systems', targetProficiency: 'intermediate' },
      proposedSchedule: 'Saturdays 3:00 PM',
      preferredFormat: 'online',
      message: 'Hey Sanjeevi! I loved your SkillSwap project. I can teach you advanced Figma component systems in exchange for hands-on Python scripting sessions!',
      status: 'pending',
      compatibilityScore: 92
    });

    // Request 2: Sanjeevi -> Priya (Accepted)
    const req2 = await SkillExchangeRequest.create({
      sender: sanjeevi._id,
      recipient: priya._id,
      offeredSkill: { name: 'Full-Stack Web Development', category: 'Web & App Development', proficiency: 'advanced' },
      requestedSkill: { name: 'Machine Learning & Scikit-Learn', category: 'Data Science & AI', targetProficiency: 'advanced' },
      proposedSchedule: 'Tuesdays & Thursdays 6:30 PM',
      preferredFormat: 'online',
      message: 'Hi Priya! I would love to learn more about TF-IDF text similarity algorithms from you in exchange for REST API architecture walkthroughs.',
      status: 'accepted',
      compatibilityScore: 96
    });

    // 4. Seed Learning Sessions
    // Session 1: Upcoming with Priya
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 3);
    upcomingDate.setHours(18, 30, 0, 0);

    await LearningSession.create({
      exchangeRequest: req2._id,
      participants: [sanjeevi._id, priya._id],
      host: sanjeevi._id,
      partner: priya._id,
      topic: 'TF-IDF Text Vectorization & Cosine Similarity in Python',
      skillName: 'Machine Learning & Scikit-Learn',
      scheduledDate: upcomingDate,
      durationMinutes: 60,
      format: 'online',
      meetingLinkOrLocation: 'SkillSwap Interactive Study Room #412',
      notes: 'Please review scikit-learn TfidfVectorizer documentation beforehand.',
      status: 'scheduled'
    });

    // Session 2: Completed session with Priya
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 4);
    pastDate.setHours(17, 0, 0, 0);

    const completedSession = await LearningSession.create({
      exchangeRequest: req2._id,
      participants: [sanjeevi._id, priya._id],
      host: priya._id,
      partner: sanjeevi._id,
      topic: 'Express REST API Design & JWT Middleware Architecture',
      skillName: 'Full-Stack Web Development',
      scheduledDate: pastDate,
      durationMinutes: 60,
      format: 'online',
      meetingLinkOrLocation: 'SkillSwap Interactive Study Room #305',
      status: 'completed',
      summary: 'Deep dive into Express router chaining, authentication bearer tokens, and centralized error handling.',
      feedbackSubmittedBy: [priya._id],
      completedAt: pastDate
    });

    // 5. Seed Feedback
    await Feedback.create({
      session: completedSession._id,
      exchangeRequest: req2._id,
      fromUser: priya._id,
      toUser: sanjeevi._id,
      rating: 5,
      skillTaughtOrLearned: 'Full-Stack Web Development',
      comment: 'Sanjeevi is an outstanding mentor! He explained Express middleware concepts and JWT security with crystal clear live code examples. Very patient and knowledgeable.',
      criteriaRatings: { clarity: 5, punctuality: 5, helpfulness: 5 },
      skillPointsAwarded: 50,
      pointsRuleBreakdown: 'Base Completion (+30 pts) + 5-Star Review Bonus (+20 pts)'
    });

    // 6. Seed Notifications for Sanjeevi
    await Notification.create([
      {
        recipient: sanjeevi._id,
        sender: marcus._id,
        type: 'request_received',
        title: 'New Skill Exchange Request! ✨',
        message: 'Marcus Chen wants to exchange "UI/UX & Figma Prototyping" for "Python Programming".',
        link: '/requests.html',
        read: false
      },
      {
        recipient: sanjeevi._id,
        sender: priya._id,
        type: 'points_awarded',
        title: '+50 Skill Points Earned! 🏆',
        message: 'Priya Sharma gave you a 5-star review: "Sanjeevi is an outstanding mentor!"',
        link: '/feedback.html',
        read: false
      },
      {
        recipient: sanjeevi._id,
        sender: priya._id,
        type: 'session_scheduled',
        title: 'Upcoming Learning Session 📅',
        message: 'Session on "TF-IDF Text Vectorization" is scheduled in 3 days.',
        link: '/sessions.html',
        read: true
      }
    ]);

    console.log('✅ Seed completed successfully with realistic demo data!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
