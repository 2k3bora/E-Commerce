const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const DistributorProductConfig = require('../models/DistributorProductConfig');
const CommissionConfig = require('../models/CommissionConfig');
const auth = require('../middleware/auth');

// Basic CRUD for products
// GET /api/products/ -> list (filtered by creator for distributors) with search and filters
router.get('/', async (req, res) => {
  try {
    let query = { active: true };

    // Search query
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.basePrice = {};
      if (req.query.minPrice) query.basePrice.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.basePrice.$lte = parseFloat(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.minRating) {
      query.averageRating = { $gte: parseFloat(req.query.minRating) };
    }

    // If there's an authenticated user and they're a distributor, only show their products
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (user && user.role === 'distributor') {
          // Distributor can only see their own products
          query.createdBy = user._id;
        }
        // Admin sees all products (no filter)
      } catch (err) {
        // If token verification fails, show all products (unauthenticated access)
      }
    }

    // Sorting
    let sort = { createdAt: -1 }; // Default: newest first
    if (req.query.sort === 'price_asc') sort = { basePrice: 1 };
    else if (req.query.sort === 'price_desc') sort = { basePrice: -1 };
    else if (req.query.sort === 'rating') sort = { averageRating: -1 };
    else if (req.query.sort === 'popular') sort = { reviewCount: -1 };

    const products = await Product.find(query)
      .populate('createdBy', 'name username email')
      .sort(sort)
      .lean();

    return res.json(products);
  } catch (err) {
    console.error('List products error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/products - create (admin/distributor)
router.post('/', auth, async (req, res) => {
  try {
    const user = req.user;
    const role = (user.role || '').toString().toLowerCase();
    if (!['admin', 'distributor'].includes(role)) return res.status(403).json({ message: 'Forbidden' });
    const { name, description, images, sku, active, basePrice, stock, lowStockThreshold, category, tags, attributes } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const p = new Product({
      name, description, images, sku, basePrice, stock, lowStockThreshold,
      active: active !== false, createdBy: user._id,
      category, tags, attributes
    });
    await p.save();
    return res.status(201).json(p);
  } catch (err) {
    console.error('Create product error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// PUT /api/products/:id - update (only creator can edit)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = req.user;
    const productId = req.params.id;

    // Find the existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the creator
    if (existingProduct.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the product creator can edit this product' });
    }

    // Update fields
    const { name, description, images, sku, basePrice, stock, lowStockThreshold, active, category, tags, attributes } = req.body;

    if (name !== undefined) existingProduct.name = name;
    if (description !== undefined) existingProduct.description = description;
    if (images !== undefined) existingProduct.images = images;
    if (sku !== undefined) existingProduct.sku = sku;
    if (basePrice !== undefined) existingProduct.basePrice = basePrice;
    if (stock !== undefined) existingProduct.stock = stock;
    if (lowStockThreshold !== undefined) existingProduct.lowStockThreshold = lowStockThreshold;
    if (active !== undefined) existingProduct.active = active;
    if (category !== undefined) existingProduct.category = category;
    if (tags !== undefined) existingProduct.tags = tags;
    if (attributes !== undefined) existingProduct.attributes = attributes;

    await existingProduct.save();
    res.json(existingProduct);
  } catch (err) {
    console.error('Update product error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/:id - delete (only creator can delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = req.user;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the creator
    if (product.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the product creator can delete this product' });
    }

    await Product.findByIdAndDelete(productId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete product error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/search - Search products with advanced filters
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, minRating, sort, page = 1, limit = 20 } = req.query;

    let query = { active: true };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }
    if (minRating) query.averageRating = { $gte: parseFloat(minRating) };

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { basePrice: 1 };
    else if (sort === 'price_desc') sortOption = { basePrice: -1 };
    else if (sort === 'rating') sortOption = { averageRating: -1 };
    else if (sort === 'popular') sortOption = { reviewCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('createdBy', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Search products error', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

// GET /api/products/price?productId=&branchId=
router.get('/price', async (req, res) => {
  try {
    const { productId, branchId } = req.query;
    if (!productId) return res.status(400).json({ message: 'productId required' });

    const product = await Product.findById(productId).populate('createdBy', 'role').lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const commission = await CommissionConfig.findOne({ active: true }).sort({ effectiveFrom: -1 }).lean();
    if (!commission) return res.status(500).json({ message: 'Commission config missing' });

    // Determine base rate based on who created the product
    let baseRate;
    let distributorId = null;
    const creatorRole = product.createdBy?.role?.toString().toLowerCase();

    // Check if this is a direct admin/company sale (customer has no parent branch)
    if (!branchId || branchId === 'admin' || branchId === 'company') {
      // Direct company sale
      if (creatorRole === 'admin') {
        // Admin created product - use product's basePrice
        if (!product.basePrice) {
          return res.status(404).json({ message: 'Product base price not set' });
        }
        baseRate = product.basePrice;
      } else if (creatorRole === 'distributor') {
        // Distributor created product - use product's basePrice for direct sales
        if (!product.basePrice) {
          return res.status(404).json({ message: 'Product base price not set' });
        }
        baseRate = product.basePrice;
        distributorId = product.createdBy._id;
      } else {
        return res.status(400).json({ message: 'Invalid product creator' });
      }

      // Calculate retail price for direct sales (base + all commissions)
      const companyCommission = +(baseRate * (commission.companyShare || 0));
      const distributorCommission = +(baseRate * (commission.distributorShare || 0));
      const branchCommission = +(baseRate * (commission.branchShare || 0));
      const finalPrice = +(baseRate + companyCommission + distributorCommission + branchCommission);

      return res.json({
        productId,
        branchId: 'company',
        baseRate,
        companyCommission,
        distributorCommission,
        branchCommission,
        finalPrice,
        commissionConfigId: commission._id,
        directSale: true
      });
    }

    // Regular distributor/branch sale
    const branch = await User.findById(branchId).lean();
    if (!branch || (branch.role && branch.role.toString().toLowerCase() !== 'branch' && branch.role !== 'Staff')) {
      return res.status(404).json({ message: 'Branch not found or invalid' });
    }

    distributorId = branch.parent;
    if (!distributorId) return res.status(400).json({ message: 'Branch has no distributor parent' });

    // Use product basePrice for pricing
    if (!product.basePrice) {
      return res.status(404).json({ message: 'Product base price not set' });
    }
    baseRate = product.basePrice;

    const companyCommission = +(baseRate * (commission.companyShare || 0));
    const distributorCommission = +(baseRate * (commission.distributorShare || 0));
    const branchCommission = +(baseRate * (commission.branchShare || 0));
    const finalPrice = +(baseRate + companyCommission + distributorCommission + branchCommission);

    return res.json({
      productId,
      branchId,
      baseRate,
      companyCommission,
      distributorCommission,
      branchCommission,
      finalPrice,
      commissionConfigId: commission._id,
      directSale: false
    });
  } catch (err) {
    console.error('Price calculation error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// GET /api/products/:id - Get single product detail
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email username')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error('Get product detail error', err);
    res.status(500).json({ message: 'Internal error' });
  }
});

// GET /api/products/:id/related - Get related products
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const query = {
      _id: { $ne: product._id },
      active: true,
      $or: [
        { category: product.category },
        { tags: { $in: product.tags || [] } }
      ]
    };

    const relatedProducts = await Product.find(query)
      .limit(6)
      .select('name description images basePrice averageRating reviewCount category')
      .lean();

    res.json(relatedProducts);
  } catch (err) {
    console.error('Get related products error', err);
    res.status(500).json({ message: 'Internal error' });
  }
});



module.exports = router;
