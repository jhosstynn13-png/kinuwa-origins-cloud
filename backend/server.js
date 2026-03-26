const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN REAL DE TU PROYECTO (Sacado de tu captura)
const supabaseUrl = 'https://yimuttzzvijmvlxqleor.supabase.co';
// Usa la llave "anon" que aparece en tu sección de Settings > API
const supabaseKey = 'sb_publishable_N1S8_Clx9ZB0HemBFG35-A_qkTtYOEv'; 
const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta para obtener productos
app.get('/api/productos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*');

    if (error) throw error;
    
    console.log('✅ Datos enviados al frontend:', data.length, 'productos encontrados.');
    res.json(data);
  } catch (error) {
    console.error('❌ Error de Supabase:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Kinuwa Origins conectado a la nube en puerto ${PORT}`);
});