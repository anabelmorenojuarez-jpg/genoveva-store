import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import productosData from './productos.json';

const ProductImage = ({ src, alt }) => {
  const [error, setError] = useState(false);
  
  if (error || !src || src.includes('undefined')) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <ShoppingBag size={48} color="var(--accent-color)" style={{ opacity: 0.3, marginBottom: '10px' }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600 }}>FOTO PRÓXIMAMENTE</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '5px' }}>{alt}</p>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className="product-image" 
      onError={() => setError(true)} 
    />
  );
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState(productosData);

  useEffect(() => {
    const results = productosData.filter(p =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(p => p.id !== id));
  };

  const sendWhatsApp = () => {
    const phone = "529990000000"; // Aqui pondremos tu numero despues
    const items = cart.map(p => `- ${p.nombre} ($${p.precio})`).join('\n');
    const total = cart.reduce((acc, p) => acc + parseFloat(p.precio), 0);
    const message = `¡Hola Genoveva Store! 🌟 Me interesan estos productos:\n\n${items}\n\nTotal estimado: $${total}\n\n¿Están disponibles?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="app-container">
      <header>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="logo"
        >
          Genoveva Store
        </motion.h1>
        <p className="subtitle">Luxury Accessories & Footwear</p>
      </header>

      <div className="search-container">
        <input 
          type="text" 
          placeholder="¿Qué estás buscando hoy?" 
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <motion.div layout className="products-grid">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={product.id} 
              className="product-card"
            >
              <div className="image-container">
                <ProductImage src={`/productos/${product.imagen}`} alt={product.nombre} />
              </div>
              <div className="product-info">
                <p className="brand">{product.marca}</p>
                <h3 className="product-name">{product.nombre}</h3>
                <p className="product-details">
                  {product.talla && `Talla: ${product.talla} MX | `}
                  {product.color}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <p className="price">${product.precio}</p>
                  <p style={{ 
                    fontSize: '0.7rem', 
                    color: product.stock > 0 ? 'var(--accent-color)' : '#ff4444',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {product.stock > 0 ? `${product.stock} disponibles` : 'AGOTADO'}
                  </p>
                </div>
                <button 
                  className="add-btn" 
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  style={{ 
                    opacity: product.stock > 0 ? 1 : 0.5,
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  {product.stock > 0 ? 'Agregar al Pedido' : 'Sin Stock'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Carrito Flotante */}
      {cart.length > 0 && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="cart-badge" 
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingBag color="black" />
          <span className="badge-count">{cart.length}</span>
        </motion.div>
      )}

      {/* Modal del Carrito */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div 
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="modal-content"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'var(--font-title)' }}>Tu Pedido</h2>
                <X style={{ cursor: 'pointer' }} onClick={() => setIsCartOpen(false)} />
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{item.nombre}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>${item.precio}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>Quitar</button>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '2px solid var(--accent-color)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 600, marginBottom: '15px' }}>
                  <span>Total:</span>
                  <span>${cart.reduce((acc, p) => acc + parseFloat(p.precio), 0)}</span>
                </div>
                
                <div style={{ 
                  background: 'rgba(212, 175, 55, 0.1)', 
                  padding: '15px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--accent-color)',
                  marginBottom: '20px'
                }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: '5px' }}>DATOS DE DEPÓSITO:</p>
                  <p style={{ fontSize: '0.9rem' }}>BANCO: [Nombre del Banco]</p>
                  <p style={{ fontSize: '0.9rem' }}>CUENTA: [Tu Numero de Cuenta]</p>
                  <p style={{ fontSize: '0.9rem' }}>CLABE: [Tu Numero Clabe]</p>
                  <p style={{ fontSize: '0.7rem', marginTop: '10px', fontStyle: 'italic' }}>* Envía tu comprobante por WhatsApp al finalizar.</p>
                </div>
                <button className="whatsapp-btn" onClick={sendWhatsApp}>
                   <MessageCircle size={20} /> Enviar Pedido por WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
