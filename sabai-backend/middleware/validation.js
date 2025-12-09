// ===== middleware/validation.js =====

const { AppError } = require('./errorHandler');

/**
 * Sanitize les données d'entrée
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 500);
}

/**
 * Validation email
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 100;
}

/**
 * Validation téléphone
 */
function isValidPhone(phone) {
  const phoneRegex = /^(\+33|0033|0)[1-9](\d{2}){4}$|^\+[1-9]\d{1,14}$/;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleaned) && cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Validation date
 */
function isValidDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validation heure
 */
function isValidTime(timeString) {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return timeRegex.test(timeString);
}

/**
 * Validation commande
 */
function validateOrder(req, res, next) {
  const errors = [];
  const { 
    customer_name, 
    customer_email, 
    customer_phone, 
    delivery_address, 
    items,
    order_type = 'delivery',
    delivery_date,
    delivery_time,
    notes
  } = req.body;

  // Sanitize
  if (customer_name) req.body.customer_name = sanitizeString(customer_name);
  if (delivery_address) req.body.delivery_address = sanitizeString(delivery_address);
  if (notes) req.body.notes = sanitizeString(notes);

  // Validation nom
  if (!customer_name || customer_name.trim().length < 2) {
    errors.push({ 
      field: 'customer_name',
      message: 'Le nom doit contenir au moins 2 caractères' 
    });
  }
  if (customer_name && customer_name.length > 100) {
    errors.push({ 
      field: 'customer_name',
      message: 'Le nom est trop long (max 100 caractères)' 
    });
  }

  // Validation email
  if (!customer_email || !isValidEmail(customer_email)) {
    errors.push({ 
      field: 'customer_email',
      message: 'Email invalide' 
    });
  }

  // Validation téléphone
  if (!customer_phone || !isValidPhone(customer_phone)) {
    errors.push({ 
      field: 'customer_phone',
      message: 'Numéro de téléphone invalide' 
    });
  }

  // Validation type
  if (!['delivery', 'takeaway'].includes(order_type)) {
    errors.push({ 
      field: 'order_type',
      message: 'Type de commande invalide (delivery ou takeaway)' 
    });
  }

  // Validation adresse (uniquement pour delivery)
  if (order_type === 'delivery') {
    if (!delivery_address || delivery_address.trim().length < 10) {
      errors.push({ 
        field: 'delivery_address',
        message: 'Adresse de livraison trop courte (minimum 10 caractères)' 
      });
    }
    if (delivery_address && delivery_address.length > 250) {
      errors.push({ 
        field: 'delivery_address',
        message: 'Adresse trop longue (max 250 caractères)' 
      });
    }
  }

  // Validation date
  if (!delivery_date || !isValidDate(delivery_date)) {
    errors.push({ 
      field: 'delivery_date',
      message: 'Date invalide (format: YYYY-MM-DD)' 
    });
  } else {
    const deliveryDate = new Date(delivery_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deliveryDate < today) {
      errors.push({ 
        field: 'delivery_date',
        message: 'La date doit être aujourd\'hui ou dans le futur' 
      });
    }
  }

  // Validation heure
  if (!delivery_time || !isValidTime(delivery_time)) {
    errors.push({ 
      field: 'delivery_time',
      message: 'Heure invalide (format: HH:MM)' 
    });
  } else if (delivery_date) {
    const deliveryDateTime = new Date(`${delivery_date}T${delivery_time}`);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    if (deliveryDateTime <= fiveMinutesAgo) {
      errors.push({ 
        field: 'delivery_time',
        message: 'L\'heure doit être dans le futur' 
      });
    }
  }

  // Validation items
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push({ 
      field: 'items',
      message: 'La commande doit contenir au moins un article' 
    });
  } else if (items.length > 50) {
    errors.push({ 
      field: 'items',
      message: 'Maximum 50 articles par commande' 
    });
  } else {
    items.forEach((item, index) => {
      if (!item.product_id || !Number.isInteger(item.product_id) || item.product_id < 1) {
        errors.push({ 
          field: `items[${index}].product_id`,
          message: `Article ${index + 1}: ID produit invalide` 
        });
      }
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        errors.push({ 
          field: `items[${index}].quantity`,
          message: `Article ${index + 1}: Quantité invalide (entre 1 et 99)` 
        });
      }
    });
  }

  // Validation notes
  if (notes && notes.length > 500) {
    errors.push({ 
      field: 'notes',
      message: 'Les notes sont trop longues (max 500 caractères)' 
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation échouée', 
      details: errors 
    });
  }

  next();
}

/**
 * Validation stock produit
 */
function validateProductStock(req, res, next) {
  const { stock } = req.body;
  const errors = [];

  if (stock === undefined || stock === null) {
    errors.push({ 
      field: 'stock',
      message: 'Le stock est requis' 
    });
  } else if (!Number.isInteger(stock) || stock < 0 || stock > 9999) {
    errors.push({ 
      field: 'stock',
      message: 'Stock invalide (entre 0 et 9999)' 
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation échouée', 
      details: errors 
    });
  }

  next();
}

/**
 * Validation statut commande
 */
function validateOrderStatus(req, res, next) {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'];

  if (!status) {
    return res.status(400).json({ 
      success: false,
      error: 'Le statut est requis',
      details: [{ field: 'status', message: 'Statut manquant' }]
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false,
      error: 'Statut invalide', 
      details: [{ 
        field: 'status', 
        message: `Statuts valides: ${validStatuses.join(', ')}` 
      }]
    });
  }

  next();
}

module.exports = { 
  validateOrder, 
  validateProductStock, 
  validateOrderStatus,
  sanitizeString,
  isValidEmail,
  isValidPhone,
  isValidDate,
  isValidTime
};