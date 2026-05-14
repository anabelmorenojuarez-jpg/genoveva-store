import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';

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
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL de exportacion de tu Google Sheet
  // URL de exportacion de tu Google Sheet (con cache buster para asegurar datos frescos)
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/1sjbz-05RYBWb-eN0a5NKckaMihjfWQRnfB9fIlAHex4/export?format=csv&t=${new Date().getTime()}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        
        // Parser mejorado para manejar espacios y comas dentro de comillas
        const rows = csvText.split('\n').map(row => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let char of row) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        }).filter(row => row.length >= 10);

        // Encontrar los indices de las columnas dinamicamente
        const header = rows.find(r => r.includes('PRODUCTO'));
        const stockIdx = header.findIndex(h => h.includes('STOCK'));
        const nameIdx = header.findIndex(h => h.includes('PRODUCTO'));
        const brandIdx = header.findIndex(h => h.includes('MARCA'));
        const colorIdx = header.findIndex(h => h.includes('COLOR'));
        const descIdx = header.findIndex(h => h.includes('DESCRIPCION'));
        const priceIdx = header.findIndex(h => h.includes('PRECIO'));
        const sizeIdx = header.findIndex(h => h.includes('MEDIDA MX'));

        const dataRows = rows.slice(rows.indexOf(header) + 1);

        const parsedProducts = dataRows.map((row, idx) => {
          if (row.length < 5) return null;
          const product = {
            id: idx,
            stock: parseInt(row[stockIdx]) || 0,
            nombre: `${row[nameIdx]} ${row[brandIdx]}`.trim(),
            marca: row[brandIdx] || '',
            color: row[colorIdx] || '',
            descripcion: row[descIdx] || '',
            talla: row[sizeIdx] || '',
            precio: row[priceIdx] ? row[priceIdx].split('.')[0].replace(/[^0-9]/g, '') : '0',
            imagen: 'undefined'
          };

          const fullUpper = (product.nombre + ' ' + product.descripcion).toUpperCase();
          const colorUpper = (product.color || '').toUpperCase();
          const descUpper = (product.descripcion || '').toUpperCase();

          // Lógica de Descuentos (20% a todo menos chanclas, carteras y playeras)
          // Normalizamos el texto para búsqueda (Nombre + Descripción)
          const searchData = `${product.nombre} ${product.descripcion}`.toUpperCase();
          const excludedKeywords = ['SANDALIA', 'CHANCL', 'CARTERA', 'PLAYERA', 'SHIRT', 'TANK TOP'];
          const isExcluded = excludedKeywords.some(k => searchData.includes(k));
          
          if (!isExcluded && parseInt(product.precio) > 0) {
            product.precioOriginal = product.precio;
            // Aplicar 20% de descuento y redondear
            const originalPrice = parseInt(product.precio);
            const discountedPrice = Math.floor(originalPrice * 0.8);
            product.precio = discountedPrice.toString();
            product.hasDiscount = true;
          }

          // BLINDAJE DE FOTOS (Ruta absoluta para Vercel)
          if (fullUpper.includes('SPYDER')) {
            if (fullUpper.includes('A SHIRT') || descUpper.includes('SIN MANGA')) {
              product.imagen = 'PROMO_PLAYERAS_SPYDER_TANK_TOPS_PACK_4.png';
            } else if (colorUpper.includes('GUIDA') || colorUpper.includes('GUINDA')) {
              product.imagen = 'PROMO_PLAYERAS_SPYDER_PACK_3.png';
            } else {
              product.imagen = 'PROMO_PLAYERAS_SPYDER_PACK.png';
            }
          } else if (fullUpper.includes('LEVIS')) {
            if (descUpper.includes('TRIFOLD')) product.imagen = 'PROMO_CARTERA_LEVIS_TRIFOLD_CAFE.png';
            else if (colorUpper.includes('CAF')) product.imagen = 'PROMO_CARTERA_LEVIS_CAFE_8MX.png';
            else product.imagen = 'PROMO_CARTERA_LEVIS_BIFOLD_NEGRA.png';
          } else if (fullUpper.includes('HURLEY')) {
            if (descUpper.includes('TRIFOLD') || colorUpper.includes('CAF')) product.imagen = 'PROMO_CARTERA_HURLEY_TRIFOLD_CAFE.png';
            else product.imagen = 'PROMO_CARTERA_HURLEY_BIFOLD_GRIS.png';
          } else if (fullUpper.includes('TIMBERLAND')) {
            if (colorUpper.includes('CAF')) product.imagen = 'PROMO_CARTERA_TIMBERLAND_CAFE_8MX.png';
            else product.imagen = 'PROMO_CARTERA_TIMBERLAND_NEGRA.png';
          } else if (fullUpper.includes('COLUMBIA')) {
            product.imagen = 'PROMO_CARTERA_COLUMBIA_NEGRO_CAFE_8MX.png';
          } else if (fullUpper.includes('BLUEY')) {
             if (fullUpper.includes('MANTA')) product.imagen = 'PROMO_MANTA_BLUEY.png';
             else if (fullUpper.includes('PANTUNFLAS')) {
                if (colorUpper.includes('MORADO')) product.imagen = 'PROMO_BLUEY_BINGO_PRO.png';
                else product.imagen = 'PROMO_BLUEY_3D_AZUL_PRO.png';
             } else product.imagen = 'PROMO_CALCETINES_BLUEY_PRO.png';
          } else if (fullUpper.includes('TRUE RELIGION')) {
            if (colorUpper.includes('NEGRO')) product.imagen = 'PROMO_NECESER_TRUE_RELIGION_NEGRO.png';
            else product.imagen = 'PROMO_NECESER_TRUE_RELIGION.png';
          } else if (fullUpper.includes('SALT LIFE')) {
            if (colorUpper.includes('AZUL')) product.imagen = 'PROMO_SALT_LIFE_AZUL.png';
            else if (colorUpper.includes('GRIS')) product.imagen = 'PROMO_NECESER_SALT_LIFE_GRIS.png';
            else if (colorUpper.includes('NEGRA') || colorUpper.includes('NEGRO')) product.imagen = 'PROMO_SALT_LIFE_NEGRA.png';
            else product.imagen = 'PROMO_SALT_LIFE_FINAL.png';
          } else if (fullUpper.includes('SKECK') || fullUpper.includes('SKECH')) product.imagen = 'PROMO_SKECHERS_PACK.png';
          else if (fullUpper.includes('WICKED')) product.imagen = 'PROMO_ESTUCHE_WICKED.png';
          else if (fullUpper.includes('QUICK')) product.imagen = 'PROMO_SANDALIAS_QUIKSILVER_AZUL_7MX.png';
          else if (fullUpper.includes('TOMMY')) product.imagen = 'PROMO_SANDALIAS_TOMMY_COGNAC_8MX.png';
          else if (fullUpper.includes('NAUTICA')) product.imagen = 'PROMO_SANDALIAS_NAUTICA_OLIVO_8MX.png';
          else if (fullUpper.includes('DOCKERS')) product.imagen = 'PROMO_SANDALIAS_DOCKERS_OLIVO.png';
          else if (fullUpper.includes('GUESS')) {
            if (descUpper.includes('CROSSBODY')) product.imagen = 'PROMO_GUESS_CROSSBODY_FINAL.png';
            else product.imagen = 'PROMO_SANDALIAS_GUESS_FINAL.png';
          } else if (fullUpper.includes('CLIFFS')) product.imagen = 'PROMO_SANDALIAS_CLIFFS_CAFE_8MX.png';
          else if (fullUpper.includes('JOHN DEERE')) product.imagen = 'PROMO_NECESER_JOHN_DEERE.png';
          else if (fullUpper.includes('REEBOK')) product.imagen = 'PROMO_NECESER_REEBOK.png';
          else if (fullUpper.includes('PENGUIN')) product.imagen = 'PROMO_NECESER_PENGUIN.png';
          else if (fullUpper.includes('CHAMPION')) product.imagen = 'PROMO_NECESER_CHAMPION.png';

          return product;
        }).filter(p => p && p.nombre !== '' && p.nombre !== 'undefined undefined');

        setProducts(parsedProducts);
        setFilteredProducts(parsedProducts);
        setLoading(false);
      } catch (err) {
        console.error("Error cargando inventario:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const results = products.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const marca = (p.marca || '').toLowerCase();
      const descripcion = (p.descripcion || '').toLowerCase();
      
      return nombre.includes(term) || 
             marca.includes(term) || 
             descripcion.includes(term);
    });
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(p => p.id !== id));
  };

  const sendWhatsApp = () => {
    const phone = "526121022459"; // Numero de Genoveva Store
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
        <p className="subtitle">Accesorios & Calzado Original</p>
        <div style={{ 
          marginTop: '15px', 
          background: 'var(--accent-color)', 
          color: 'black', 
          display: 'inline-block', 
          padding: '5px 15px', 
          borderRadius: '20px', 
          fontWeight: 'bold',
          fontSize: '0.8rem',
          letterSpacing: '1px'
        }}>
          🔥 ¡OFERTAS DE MAYO: 20% OFF EN SELECCIONADOS! 🔥
        </div>
      </header>

      <div className="search-container">
        <input 
          type="text" 
          placeholder="¿Qué estás buscando hoy?" 
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div className="quick-filters">
          {[
            { label: 'Todo', term: '' },
            { label: 'Carteras', term: 'Cartera' },
            { label: 'Sandalias', term: 'Sandalia' },
            { label: 'Bolsos', term: 'Crossbody' },
            { label: 'Playeras', term: 'Playera' },
            { label: 'Pantunflas', term: 'Pantunfla' },
            { label: 'Set de Baño', term: 'Wicked' }
          ].map((filter) => (
            <button 
              key={filter.term}
              className={`filter-chip ${searchTerm.toLowerCase() === filter.term.toLowerCase() ? 'active' : ''}`}
              onClick={() => setSearchTerm(filter.term)}
            >
              {filter.label}
            </button>
          ))}
        </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                  <div className="price-container">
                    {product.hasDiscount && (
                      <>
                        <span className="discount-tag">20% OFF</span>
                        <span className="price-original">${product.precioOriginal}</span>
                      </>
                    )}
                    <p className="price">${product.precio}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ 
                      fontSize: '0.7rem', 
                      color: product.stock > 0 ? 'var(--accent-color)' : '#ff4444',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {product.stock > 0 ? `${product.stock} disponible${product.stock > 1 ? 's' : ''}` : 'AGOTADO'}
                    </p>
                    {product.stock > 0 && (
                      <span className="immediate-delivery">ENTREGA INMEDIATA</span>
                    )}
                  </div>
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
                  <p style={{ fontSize: '0.9rem' }}>BANCO: BBVA</p>
                  <p style={{ fontSize: '0.9rem' }}>TARJETA: 4152 3144 9674 0245</p>
                  <p style={{ fontSize: '0.9rem' }}>NOMBRE: MARIA ANABEL MORENO</p>
                  <p style={{ fontSize: '0.7rem', marginTop: '10px', fontStyle: 'italic' }}>* Envía tu comprobante por WhatsApp al finalizar.</p>
                </div>
                <div style={{ color: '#ff4444', fontSize: '0.65rem', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  ⚠️ EL STOCK NO SE RESERVA HASTA CONFIRMAR EL PAGO
                </div>
                <button className="whatsapp-btn" onClick={sendWhatsApp}>
                   <MessageCircle size={20} /> Enviar Pedido por WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Analytics />
    </div>
  );
}

export default App;
