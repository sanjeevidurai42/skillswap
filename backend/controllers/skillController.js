const Skill = require('../models/Skill');
const User = require('../models/User');

/**
 * @route   GET /api/skills
 * @desc    Explore and search skills with category filters
 * @access  Public
 */
exports.getAllSkills = async (req, res, next) => {
  try {
    const { q, category, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(q.trim(), 'i')] } }
      ];
    }

    const total = await Skill.countDocuments(filter);
    const skills = await Skill.find(filter)
      .sort({ popularityScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Also look up how many teachers exist for these skills
    const skillNames = skills.map(s => s.name);
    const teachers = await User.aggregate([
      { $unwind: '$teachSkills' },
      { $match: { 'teachSkills.name': { $in: skillNames } } },
      { $group: { _id: '$teachSkills.name', count: { $sum: 1 } } }
    ]);

    const teacherCountMap = {};
    teachers.forEach(t => {
      teacherCountMap[t._id] = t.count;
    });

    const enrichedSkills = skills.map(skill => {
      const obj = skill.toObject();
      obj.availableMentors = teacherCountMap[skill.name] || 1;
      return obj;
    });

    res.status(200).json({
      success: true,
      count: enrichedSkills.length,
      total,
      page: Number(page),
      skills: enrichedSkills
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/skills/categories
 * @desc    Get all skill categories and item counts
 * @access  Public
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Skill.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      categories: categories.map(c => ({ name: c._id, count: c.count }))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/skills/featured
 * @desc    Get top featured skills for landing page
 * @access  Public
 */
exports.getFeaturedSkills = async (req, res, next) => {
  try {
    const featured = await Skill.find({ featured: true }).limit(8);
    res.status(200).json({
      success: true,
      skills: featured
    });
  } catch (err) {
    next(err);
  }
};
