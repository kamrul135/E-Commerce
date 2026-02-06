const Product = require('../models/Product');
const Category = require('../models/Category');

const productController = {
  async getAll(req, res) {
    try {
      const { page, limit, category, search, sort, featured } = req.query;
      const result = await Product.findAll({
        page: page || 1, limit: limit || 12, category, search, sort,
        featured: featured === 'true' ? true : undefined,
      });
      res.json(result);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to fetch products.' });
    }
  },

  async getById(req, res) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found.' });
      res.json({ product });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to fetch product.' });
    }
  },

  async create(req, res) {
    try {
      const product = await Product.create(req.body);
      res.status(201).json({ message: 'Product created', product });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product.' });
    }
  },

  async update(req, res) {
    try {
      const product = await Product.update(req.params.id, req.body);
      if (!product) return res.status(404).json({ error: 'Product not found.' });
      res.json({ message: 'Product updated', product });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product.' });
    }
  },

  async delete(req, res) {
    try {
      const product = await Product.delete(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found.' });
      res.json({ message: 'Product deleted' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product.' });
    }
  },

  async getCategories(req, res) {
    try {
      const categories = await Category.findAll();
      res.json({ categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories.' });
    }
  },
};

module.exports = productController;
