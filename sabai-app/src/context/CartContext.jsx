// ===== src/context/CartContext.jsx ===== (VERSION OPTIMISÉE)
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé dans CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // ✅ OPTIMISATION : Mémoriser addItem avec useCallback
  const addItem = useCallback((product, quantity = 1) => {
    if (!product || !product.id) {
      console.error('Produit invalide:', product);
      return false;
    }

    const stock = parseInt(product.stock_quantity || product.stock || 0);
    const qtyToAdd = parseInt(quantity);

    // Vérifier le stock disponible
    if (stock === 0) {
      toast.error('Produit en rupture de stock', {
        duration: 3000,
        icon: '❌'
      });
      return false;
    }

    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.product?.id === product.id);
      
      if (existingIndex > -1) {
        const currentQty = parseInt(prev[existingIndex].quantity);
        const newQty = currentQty + qtyToAdd;
        
        // Vérifier si on dépasse le stock
        if (newQty > stock) {
          toast.error(`Stock insuffisant. Maximum disponible : ${stock}`, {
            duration: 4000,
            icon: '📦'
          });
          return prev; // Ne pas modifier le panier
        }
        
        const newItems = [...prev];
        newItems[existingIndex].quantity = newQty;
        return newItems;
      }
      
      // Nouveau produit dans le panier
      if (qtyToAdd > stock) {
        toast.error(`Stock insuffisant. Maximum disponible : ${stock}`, {
          duration: 4000,
          icon: '📦'
        });
        return prev; // Ne pas ajouter
      }
      
      return [...prev, { product, quantity: qtyToAdd }];
    });

    return true;
  }, []);

  // ✅ OPTIMISATION : Mémoriser removeItem
  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(item => item.product?.id !== productId));
  }, []);

  // ✅ OPTIMISATION : Mémoriser updateQuantity
  const updateQuantity = useCallback((productId, quantity) => {
    const qty = parseInt(quantity);
    
    if (qty <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prev => {
      const item = prev.find(i => i.product?.id === productId);
      if (!item) return prev;

      const stock = parseInt(item.product.stock_quantity || item.product.stock || 0);
      
      // Vérifier si la nouvelle quantité dépasse le stock
      if (qty > stock) {
        toast.error(`Stock insuffisant. Maximum disponible : ${stock}`, {
          duration: 4000,
          icon: '📦'
        });
        return prev; // Ne pas modifier
      }

      return prev.map(item => 
        item.product?.id === productId 
          ? { ...item, quantity: qty } 
          : item
      );
    });
  }, [removeItem]);

  // ✅ OPTIMISATION : Mémoriser clearCart
  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
  }, []);

  // ✅ OPTIMISATION : Calculer le total avec useMemo
  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.product || !item.product.price) return sum;
      const price = parseFloat(item.product.price);
      const quantity = parseInt(item.quantity);
      return sum + (price * quantity);
    }, 0);
  }, [items]);

  // ✅ OPTIMISATION : Calculer le nombre d'items avec useMemo
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
  }, [items]);

  // ✅ OPTIMISATION : Mémoriser getProductQuantity
  const getProductQuantity = useCallback((productId) => {
    const item = items.find(item => item.product?.id === productId);
    return item ? parseInt(item.quantity) : 0;
  }, [items]);

  // ✅ OPTIMISATION : Mémoriser la valeur du contexte
  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal: () => total,
    getItemCount: () => itemCount,
    getProductQuantity
  }), [items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, getProductQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};